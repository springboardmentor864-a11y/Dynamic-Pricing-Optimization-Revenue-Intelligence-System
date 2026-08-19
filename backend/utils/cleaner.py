import pandas as pd
import numpy as np
import re

def clean_dataset(df):
    report = {}
    report["rows_before"] = len(df)

    duplicates = df.duplicated().sum()
    df = df.drop_duplicates()
    report["duplicates_removed"] = int(duplicates)

    df.replace(
        [
            "",
            " ",
            "NA",
            "N/A",
            "null",
            "None",
            "NaN",
            "nan",
            "undefined"
        ],
        np.nan,
        inplace=True
    )

    numeric_columns = [
        "price",
        "stock",
        "sales",
        "revenue",
        "competitorPrice",
        "costPrice",
        "profit",
        "margin"
    ]

    for col in numeric_columns:
        if col in df.columns:
            if df[col].dtype == object or pd.api.types.is_string_dtype(df[col]):
                df[col] = (
                    df[col]
                    .astype(str)
                    .str.replace(r'[$,€,£,¥,₹]', '', regex=True)
                    .str.replace(r'(?i)\b(rs\.?|inr)\b', '', regex=True)
                    .str.replace(',', '')
                    .str.strip()
                )
            df[col] = pd.to_numeric(df[col], errors="coerce")

    # --- Fallback Generation for Core Columns ---
    if "product" not in df.columns:
        string_cols = [c for c in df.columns if c not in numeric_columns and (df[c].dtype == object or pd.api.types.is_string_dtype(df[c]))]
        if len(string_cols) > 0:
            df["product"] = df[string_cols[0]]
        elif "id" in df.columns:
            df["product"] = "Product_" + df["id"].astype(str)
        else:
            df["product"] = [f"Product_{i+1}" for i in range(len(df))]

    if "category" not in df.columns:
        df["category"] = "General"

    # Price cleaning
    if "price" not in df.columns or df["price"].isna().all():
        np.random.seed(42)
        df["price"] = np.round(np.random.uniform(19.99, 499.99, size=len(df)), 2)
    else:
        df["price"] = pd.to_numeric(df["price"], errors="coerce")
        median_price = df["price"].median()
        default_price = median_price if (not np.isnan(median_price) and median_price > 0) else 100.0
        df["price"] = df["price"].fillna(default_price)
        df["price"] = np.where(df["price"] <= 0, default_price, df["price"])

    # Stock cleaning
    if "stock" not in df.columns or df["stock"].isna().all():
        np.random.seed(42)
        df["stock"] = np.random.randint(10, 800, size=len(df))
    else:
        df["stock"] = pd.to_numeric(df["stock"], errors="coerce")
        median_stock = df["stock"].median()
        default_stock = int(median_stock) if (not np.isnan(median_stock) and median_stock > 0) else 50
        df["stock"] = df["stock"].fillna(default_stock)
        df["stock"] = np.where(df["stock"] < 0, default_stock, df["stock"])

    # Sales cleaning
    if "sales" not in df.columns or df["sales"].isna().all():
        np.random.seed(42)
        df["sales"] = np.random.randint(5, 500, size=len(df))
    else:
        df["sales"] = pd.to_numeric(df["sales"], errors="coerce")
        median_sales = df["sales"].median()
        default_sales = int(median_sales) if (not np.isnan(median_sales) and median_sales > 0) else 20
        df["sales"] = df["sales"].fillna(default_sales)
        df["sales"] = np.where(df["sales"] < 0, default_sales, df["sales"])

    # Revenue cleaning
    if "revenue" not in df.columns or df["revenue"].isna().all():
        df["revenue"] = np.round(df["price"] * df["sales"], 2)
    else:
        df["revenue"] = pd.to_numeric(df["revenue"], errors="coerce")
        df["revenue"] = df["revenue"].fillna(df["price"] * df["sales"])
        df["revenue"] = np.where(df["revenue"] <= 0, np.round(df["price"] * df["sales"], 2), df["revenue"])

    # CompetitorPrice cleaning
    if "competitorPrice" not in df.columns or df["competitorPrice"].isna().all():
        np.random.seed(42)
        df["competitorPrice"] = np.round(df["price"] * np.random.uniform(0.88, 1.15, size=len(df)), 2)
    else:
        df["competitorPrice"] = pd.to_numeric(df["competitorPrice"], errors="coerce").fillna(df["price"])
        df["competitorPrice"] = np.where(df["competitorPrice"] <= 0, df["price"], df["competitorPrice"])

    # CostPrice cleaning
    if "costPrice" not in df.columns or df["costPrice"].isna().all():
        df["costPrice"] = np.round(df["price"] * 0.70, 2)
    else:
        df["costPrice"] = pd.to_numeric(df["costPrice"], errors="coerce").fillna(df["price"] * 0.70)
        df["costPrice"] = np.where(df["costPrice"] <= 0, np.round(df["price"] * 0.70, 2), df["costPrice"])

    # Profit cleaning
    if "profit" not in df.columns or df["profit"].isna().all():
        df["profit"] = np.round(df["revenue"] - (df["costPrice"] * df["sales"]), 2)
    else:
        df["profit"] = pd.to_numeric(df["profit"], errors="coerce").fillna(df["revenue"] - (df["costPrice"] * df["sales"]))
        df["profit"] = np.where(df["profit"] <= 0, np.round(df["revenue"] - (df["costPrice"] * df["sales"]), 2), df["profit"])

    # Margin cleaning
    if "margin" not in df.columns or df["margin"].isna().all():
        df["margin"] = np.where(df["price"] > 0, np.round(((df["price"] - df["costPrice"]) / df["price"]) * 100, 2), 30.0)
    else:
        df["margin"] = pd.to_numeric(df["margin"], errors="coerce").fillna(30.0)
        df["margin"] = np.where(df["margin"] <= 0, np.where(df["price"] > 0, np.round(((df["price"] - df["costPrice"]) / df["price"]) * 100, 2), 30.0), df["margin"])

    if "month" not in df.columns:
        df["month"] = "Jan"

    if "brand" not in df.columns:
        df["brand"] = "Generic"

    text_columns = ["product", "category", "brand", "month"]
    for col in text_columns:
        df[col] = df[col].fillna("Unknown").astype(str).str.strip()

    df.replace([np.inf, -np.inf], 0, inplace=True)

    for col in numeric_columns:
        if col in df.columns:
            df[col] = df[col].fillna(0)

    report["rows_after"] = len(df)
    report["missing_values"] = int(df.isna().sum().sum())

    return df, report