import os
import shutil
import hashlib
import json
import traceback
import pandas as pd
import numpy as np
from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks, Depends, Query
from pydantic import BaseModel

from database import UPLOAD_FOLDER, DATASET_FOLDER
import database_mongo
import database_workspace
from routes.auth import get_current_user
from utils.column_mapper import normalize_dataframe
from utils.cleaner import clean_dataset
from utils.feature_engineering import engineer_features
from ai.price_prediction import train_price_model
from ai.demand_forecasting import train_demand_model
from ai.recommendation import generate_recommendations as generate_recommendations_vectorized
from ai.anomaly_detection import detect_anomalies

class ProductRequest(BaseModel):
    product: str
    category: str
    price: float
    stock: float
    sales: float
    revenue: float | None = None
    profit: float | None = None
    margin: float | None = None
    brand: str | None = "Unknown"
    sku: str | None = ""
    description: str | None = ""
    costPrice: float | None = 0.0
    competitorPrice: float | None = 0.0
    image: str | None = ""
    month: str | None = "Jan"

class BulkDeleteRequest(BaseModel):
    ids: list[float]

router = APIRouter()

def get_file_hash(filepath):
    sha256 = hashlib.sha256()
    with open(filepath, "rb") as f:
        while True:
            chunk = f.read(65536)
            if not chunk:
                break
            sha256.update(chunk)
    return sha256.hexdigest()

def detect_csv_format(filepath):
    encodings = ['utf-8', 'latin1', 'utf-16', 'cp1252']
    delimiters = [',', ';', '\t', '|']
    
    detected_encoding = 'utf-8'
    detected_sep = ','
    
    first_line = None
    for enc in encodings:
        try:
            with open(filepath, 'r', encoding=enc) as f:
                first_line = f.readline()
                detected_encoding = enc
                break
        except Exception:
            continue
            
    if first_line:
        counts = {sep: first_line.count(sep) for sep in delimiters}
        max_sep = max(counts, key=counts.get)
        if counts[max_sep] > 0:
            detected_sep = max_sep
            
    return detected_encoding, detected_sep

def process_dataset_background(user_id: str, file_hash: str, filepath: str, filename: str):
    try:
        database_mongo.update_dataset_status(user_id, file_hash, "Reading & Parsing Dataset...", 25)
        database_workspace.clear_workspace_dataset(user_id, file_hash)
        
        sample_chunks = []
        total_rows = 0
        columns_list = []
        last_report = {}
        chunksize = 25000
        
        is_excel = False
        df_all = None
        try:
            with open(filepath, "rb") as f:
                header = f.read(8)
                if header.startswith(b"PK\x03\x04") or header.startswith(b"\xd0\xcf\x11\xe0"):
                    is_excel = True
        except Exception:
            pass
            
        if is_excel:
            try:
                df_all = pd.read_excel(filepath)
            except Exception as excel_err:
                print(f"[Parser Fallback] Magic bytes suggested Excel but read_excel failed, trying CSV: {excel_err}")
                is_excel = False
        
        if is_excel and df_all is not None:
            database_mongo.update_dataset_status(user_id, file_hash, "Cleaning & Normalizing Data...", 40)
            num_chunks = int(np.ceil(len(df_all) / chunksize))
            if num_chunks == 0:
                df_all = pd.DataFrame(columns=["product", "category", "price", "stock", "sales", "revenue", "competitorPrice", "month"])
                num_chunks = 1
                
            for i in range(num_chunks):
                chunk = df_all.iloc[i * chunksize : (i + 1) * chunksize].copy()
                if chunk.empty and total_rows > 0:
                    break
                    
                chunk = normalize_dataframe(chunk)
                chunk, report = clean_dataset(chunk)
                chunk = engineer_features(chunk)
                last_report = report
                
                if "id" not in chunk.columns:
                    chunk.insert(0, "id", range(total_rows + 1, total_rows + len(chunk) + 1))
                if "month" not in chunk.columns:
                    chunk["month"] = "Jan"
                    
                database_workspace.bulk_insert_products_sqlite(user_id, chunk, file_hash)
                
                if total_rows < 10000:
                    sample_chunks.append(chunk.head(10000 - total_rows))
                    
                total_rows += len(chunk)
                if not columns_list:
                    columns_list = list(chunk.columns)
        else:
            encoding, sep = detect_csv_format(filepath)
            database_mongo.update_dataset_status(user_id, file_hash, "Cleaning & Normalizing Data...", 40)
            for chunk in pd.read_csv(filepath, sep=sep, encoding=encoding, chunksize=chunksize):
                chunk = normalize_dataframe(chunk)
                chunk, report = clean_dataset(chunk)
                chunk = engineer_features(chunk)
                last_report = report
                
                if "id" not in chunk.columns:
                    chunk.insert(0, "id", range(total_rows + 1, total_rows + len(chunk) + 1))
                if "month" not in chunk.columns:
                    chunk["month"] = "Jan"
                    
                database_workspace.bulk_insert_products_sqlite(user_id, chunk, file_hash)
                
                if total_rows < 10000:
                    sample_chunks.append(chunk.head(10000 - total_rows))
                    
                total_rows += len(chunk)
                if not columns_list:
                    columns_list = list(chunk.columns)
                    
        if total_rows == 0:
            raise ValueError("The uploaded dataset is empty or could not be parsed.")
            
        database_mongo.update_dataset_status(user_id, file_hash, "Training AI Models...", 60)
        
        sample_df = pd.concat(sample_chunks, ignore_index=True) if sample_chunks else pd.DataFrame()
        
        try:
            if not sample_df.empty:
                train_price_model(sample_df, user_id)
                train_demand_model(sample_df, user_id)
        except Exception as e:
            print(f"[ML Pipeline Error] {e}")
            
        database_mongo.update_dataset_status(user_id, file_hash, "Generating AI Pricing Recommendations...", 80)
        
        try:
            if not sample_df.empty:
                recs_df = generate_recommendations_vectorized(sample_df)
                recs_list = recs_df.to_dict(orient="records")
                database_workspace.bulk_insert_recommendations_sqlite(user_id, recs_list, file_hash)
        except Exception as e:
            print(f"[Rec Generation Error] {e}")
            
        try:
            if not sample_df.empty:
                anoms_list = detect_anomalies(sample_df)
                database_workspace.bulk_insert_anomalies_sqlite(user_id, anoms_list, file_hash)
        except Exception as e:
            print(f"[Anomaly Generation Error] {e}")
            
        database_mongo.update_dataset_status(user_id, file_hash, "Calculating Financial Metrics...", 90)
        
        stats = database_workspace.calculate_workspace_stats(user_id, file_hash)
        
        last_report["rows_before"] = total_rows
        last_report["rows_after"] = total_rows
        
        database_mongo.update_dataset_status(
            user_id=user_id,
            file_hash=file_hash,
            status="Completed",
            progress=100,
            rows_count=total_rows,
            columns_list=columns_list,
            cleaning_report=last_report,
            stats=stats
        )
        
        database_mongo.set_user_active_dataset(user_id, file_hash)
        
    except Exception as e:
        err_msg = f"Error processing: {str(e)}\n{traceback.format_exc()}"
        print(err_msg)
        database_mongo.update_dataset_status(
            user_id=user_id,
            file_hash=file_hash,
            status="Failed",
            progress=100,
            error_message=err_msg
        )

@router.post("/upload")
async def upload_dataset(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    filename_lower = file.filename.lower()
    if not (filename_lower.endswith(".csv") or filename_lower.endswith(".xlsx") or filename_lower.endswith(".xls")):
        raise HTTPException(
            status_code=400,
            detail="Please upload a CSV or Excel file (.csv, .xlsx, .xls)."
        )

    user_id = str(current_user["_id"])
    user_upload_dir = os.path.join(UPLOAD_FOLDER, user_id)
    os.makedirs(user_upload_dir, exist_ok=True)
    upload_path = os.path.join(user_upload_dir, file.filename)
    
    with open(upload_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        file_hash = get_file_hash(upload_path)
    except Exception:
        raise HTTPException(status_code=500, detail="Could not compute file hash.")

    metadata = database_mongo.get_dataset_metadata(user_id, file_hash)
    
    has_products = False
    if metadata and metadata.get("status") == "Completed":
        stats = database_workspace.calculate_workspace_stats(user_id, file_hash)
        has_products = stats.get("totalProducts", 0) > 0
            
    if metadata and metadata.get("status") == "Completed" and has_products:
        database_mongo.set_user_active_dataset(user_id, file_hash)
        paginated = database_workspace.get_paginated_products(user_id, file_hash, 1, 20)
        
        return {
            "status": "success",
            "filename": file.filename,
            "file_hash": file_hash,
            "rows": metadata.get("rows_count", paginated["totalCount"]),
            "columns": metadata.get("columns_list", []),
            "preview": paginated["preview"],
            "products": paginated["products"],
            "stats": metadata.get("stats", {}),
            "cleaningReport": metadata.get("cleaning_report", {})
        }
    
    database_mongo.update_dataset_status(
        user_id=user_id,
        file_hash=file_hash,
        status="Uploading...",
        progress=10,
        filename=file.filename
    )
    database_mongo.set_user_active_dataset(user_id, file_hash)
    
    background_tasks.add_task(process_dataset_background, user_id, file_hash, upload_path, file.filename)
    
    return {
        "status": "processing",
        "file_hash": file_hash,
        "filename": file.filename
    }

@router.get("/upload-status")
def get_upload_status(file_hash: str, current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    metadata = database_mongo.get_dataset_metadata(user_id, file_hash)
    if not metadata:
        raise HTTPException(status_code=404, detail="Dataset process not found.")
        
    if metadata["status"] == "Completed":
        paginated = database_workspace.get_paginated_products(user_id, file_hash, 1, 20)
        return {
            "status": "Completed",
            "progress": 100,
            "filename": metadata.get("filename", metadata.get("dataset_name", "dataset.csv")),
            "rows": metadata.get("rows_count", paginated["totalCount"]),
            "columns": metadata.get("columns_list", []),
            "preview": paginated["preview"],
            "stats": metadata.get("stats", {}),
            "cleaningReport": metadata.get("cleaning_report", {})
        }
    
    return {
        "status": metadata["status"],
        "progress": metadata["progress"],
        "error_message": metadata.get("error_message")
    }

@router.get("/upload/status/{file_hash}")
def get_upload_status_path(file_hash: str, current_user: dict = Depends(get_current_user)):
    return get_upload_status(file_hash, current_user)

@router.get("/products")
def get_products(
    page: int = Query(1, ge=1),
    limit: int = Query(25, ge=1),
    search: str = Query(""),
    category: str = Query("All"),
    sort: str = Query("default"),
    current_user: dict = Depends(get_current_user)
):
    user_id = str(current_user["_id"])
    active_hash = database_mongo.get_user_active_dataset(user_id)
    if not active_hash:
        from datetime import datetime
        db = database_mongo.get_db()
        user_datasets = list(db.Datasets.find({"user_id": user_id}))
        if not user_datasets:
            user_datasets = list(db.datasets.find({"user_id": user_id}))
        completed = [d for d in user_datasets if d.get("status") == "Completed"]
        if completed:
            completed.sort(key=lambda x: x.get("updated_at", datetime.min) if isinstance(x.get("updated_at"), datetime) else datetime.min, reverse=True)
            active_hash = completed[0]["file_hash"]
            database_mongo.set_user_active_dataset(user_id, active_hash)
        else:
            raise HTTPException(status_code=404, detail="Please upload a dataset first.")
        
    filename = "All Datasets"
    if active_hash != "all":
        metadata = database_mongo.get_dataset_metadata(user_id, active_hash)
        filename = metadata.get("filename") if metadata else "dataset.csv"

    paginated = database_workspace.get_paginated_products(
        user_id=user_id,
        dataset_hash=active_hash,
        page=page,
        limit=limit,
        search=search,
        category=category,
        sort=sort
    )
    
    stats = database_workspace.calculate_workspace_stats(user_id, active_hash)

    return {
        "status": "success",
        "filename": filename,
        "rows": paginated["totalCount"],
        "preview": paginated["preview"],
        "products": paginated["products"],
        "categories": paginated["categories"],
        "stats": stats,
        "totalCount": paginated["totalCount"]
    }

@router.get("/products/names")
def get_product_names(current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    active_hash = database_mongo.get_user_active_dataset(user_id)
    if not active_hash:
        return []
    
    df = database_workspace.get_workspace_dataframe(user_id, active_hash, limit=1000)
    if df.empty or "product" not in df.columns:
        return []
    names = df["product"].dropna().unique().tolist()
    return sorted([str(n) for n in names if n])

@router.get("/products/by-name")
def get_product_by_name(name: str, current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    active_hash = database_mongo.get_user_active_dataset(user_id)
    if not active_hash:
        raise HTTPException(status_code=404, detail="Dataset not loaded.")
        
    df = database_workspace.get_workspace_dataframe(user_id, active_hash, limit=5000)
    if df.empty:
        raise HTTPException(status_code=404, detail="Product not found.")
        
    match = df[df["product"] == name]
    if match.empty:
        raise HTTPException(status_code=404, detail="Product not found.")
        
    row = match.iloc[0].to_dict()
    row.pop("dataset_hash", None)
    return row

@router.get("/products/history")
def get_product_history_api(name: str, current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    active_hash = database_mongo.get_user_active_dataset(user_id)
    if not active_hash:
        return []
        
    df = database_workspace.get_workspace_dataframe(user_id, active_hash, limit=5000)
    if df.empty:
        return []
        
    match = df[df["product"] == name]
    if len(match) < 3 and "category" in match.columns and not match.empty:
        cat = match.iloc[0]["category"]
        match = df[df["category"] == cat].head(12)
        
    rows = match.to_dict(orient="records")
    for r in rows:
        r.pop("dataset_hash", None)
    return rows

@router.post("/products")
def add_product(req: ProductRequest, background_tasks: BackgroundTasks, current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    active_hash = database_mongo.get_user_active_dataset(user_id)
    if not active_hash:
        raise HTTPException(status_code=404, detail="Please upload a dataset first.")
        
    stats = database_workspace.calculate_workspace_stats(user_id, active_hash)
    new_id = float(stats.get("totalProducts", 0) + 1)

    revenue = req.revenue if req.revenue is not None else req.price * req.sales
    profit = req.profit if req.profit is not None else revenue * 0.3
    margin = req.margin if req.margin is not None else 30.0

    new_product_df = pd.DataFrame([{
        "id": new_id,
        "product": req.product,
        "category": req.category,
        "price": req.price,
        "stock": req.stock,
        "sales": req.sales,
        "revenue": revenue,
        "profit": profit,
        "margin": margin,
        "brand": req.brand or "Unknown",
        "sku": req.sku or "",
        "description": req.description or "",
        "costPrice": req.costPrice or 0.0,
        "competitorPrice": req.competitorPrice or 0.0,
        "image": req.image or "",
        "month": req.month or "Jan"
    }])

    database_workspace.bulk_insert_products_sqlite(user_id, new_product_df, active_hash)
    return get_products(page=1, limit=25, current_user=current_user)

@router.put("/products/{product_id}")
def update_product(product_id: float, req: ProductRequest, background_tasks: BackgroundTasks, current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    active_hash = database_mongo.get_user_active_dataset(user_id)
    if not active_hash:
        raise HTTPException(status_code=404, detail="Please upload a dataset first.")
        
    conn = database_workspace.get_workspace_conn(user_id)
    revenue = req.revenue if req.revenue is not None else req.price * req.sales
    profit = req.profit if req.profit is not None else revenue * 0.3
    margin = req.margin if req.margin is not None else 30.0

    conn.execute("""
        UPDATE products 
        SET product = ?, category = ?, price = ?, stock = ?, sales = ?, revenue = ?, profit = ?, margin = ?, brand = ?, sku = ?, description = ?, costPrice = ?, competitorPrice = ?, image = ?, month = ?
        WHERE id = ? AND dataset_hash = ?;
    """, (
        req.product, req.category, req.price, req.stock, req.sales, revenue, profit, margin,
        req.brand or "Unknown", req.sku or "", req.description or "", req.costPrice or 0.0,
        req.competitorPrice or 0.0, req.image or "", req.month or "Jan", product_id, active_hash
    ))
    conn.commit()
    conn.close()

    return get_products(page=1, limit=25, current_user=current_user)

@router.delete("/products/{product_id}")
def delete_product(product_id: float, background_tasks: BackgroundTasks, current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    active_hash = database_mongo.get_user_active_dataset(user_id)
    if not active_hash:
        raise HTTPException(status_code=404, detail="Please upload a dataset first.")
        
    conn = database_workspace.get_workspace_conn(user_id)
    conn.execute("DELETE FROM products WHERE id = ? AND dataset_hash = ?;", (product_id, active_hash))
    conn.commit()
    conn.close()

    return get_products(page=1, limit=25, current_user=current_user)

@router.post("/products/bulk-delete")
def bulk_delete_products(req: BulkDeleteRequest, background_tasks: BackgroundTasks, current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    active_hash = database_mongo.get_user_active_dataset(user_id)
    if not active_hash:
        raise HTTPException(status_code=404, detail="Please upload a dataset first.")
        
    conn = database_workspace.get_workspace_conn(user_id)
    placeholders = ", ".join(["?" for _ in req.ids])
    conn.execute(f"DELETE FROM products WHERE id IN ({placeholders}) AND dataset_hash = ?;", req.ids + [active_hash])
    conn.commit()
    conn.close()

    return get_products(page=1, limit=25, current_user=current_user)

class SelectDatasetRequest(BaseModel):
    file_hash: str | None = None

@router.get("/datasets")
def get_datasets(current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    db = database_mongo.get_db()
    datasets = list(db.Datasets.find({"user_id": user_id}))
    if not datasets:
        datasets = list(db.datasets.find({"user_id": user_id}))
    for d in datasets:
        d["_id"] = str(d["_id"])
    return datasets

@router.post("/datasets/select")
def select_dataset(req: SelectDatasetRequest, current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    db = database_mongo.get_db()
    
    if req.file_hash and req.file_hash != "all":
        ds = db.Datasets.find_one({"user_id": user_id, "file_hash": req.file_hash})
        if not ds:
            ds = db.datasets.find_one({"user_id": user_id, "file_hash": req.file_hash})
        if not ds:
            raise HTTPException(status_code=400, detail="Dataset not found.")
            
    database_mongo.set_user_active_dataset(user_id, req.file_hash)
    
    dataset_name = "All Datasets"
    if req.file_hash and req.file_hash != "all":
        ds = db.Datasets.find_one({"user_id": user_id, "file_hash": req.file_hash})
        if not ds:
            ds = db.datasets.find_one({"user_id": user_id, "file_hash": req.file_hash})
        if ds:
            dataset_name = ds.get("filename", "Unknown Dataset")
            
    database_mongo.log_activity(user_id, "Switch Workspace", f"Switched active workspace to: {dataset_name}")
    return {"status": "success", "message": f"Workspace switched to {dataset_name}", "active_dataset_hash": req.file_hash}