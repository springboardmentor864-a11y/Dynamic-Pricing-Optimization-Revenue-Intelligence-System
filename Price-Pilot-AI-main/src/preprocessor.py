import logging
import pandas as pd
import numpy as np
from tqdm import tqdm
from pathlib import Path
from src.config import DATA_DIR, RANDOM_STATE

logger = logging.getLogger(__name__)

def preprocess_timestamps(datasets):
    """
    Converts timestamp columns in the datasets to datetime objects.
    """
    logger.info("Converting timestamp columns to datetime objects...")
    
    # Copy datasets dictionary to avoid modifying the input inplace
    processed_dfs = {k: v.copy() for k, v in datasets.items()}
    
    timestamp_mappings = {
        "olist_orders_dataset": [
            "order_purchase_timestamp",
            "order_approved_at",
            "order_delivered_carrier_date",
            "order_delivered_customer_date",
            "order_estimated_delivery_date"
        ],
        "olist_order_items_dataset": ["shipping_limit_date"],
        "olist_order_reviews_dataset": ["review_creation_date", "review_answer_timestamp"]
    }
    
    for df_name, cols in tqdm(timestamp_mappings.items(), desc="Converting timestamps"):
        if df_name in processed_dfs:
            df = processed_dfs[df_name]
            for col in cols:
                if col in df.columns:
                    df[col] = pd.to_datetime(df[col], errors='coerce')
            processed_dfs[df_name] = df
            logger.info(f"Converted timestamp columns for {df_name}")
            
    return processed_dfs

def clean_datasets(datasets):
    """
    Handles missing values and duplicate rows in the datasets.
    """
    logger.info("Handling duplicate rows and missing values for all Olist datasets...")
    cleaned_dfs = {k: v.copy() for k, v in datasets.items()}
    
    # 1. Handle duplicate rows in each dataset
    for name, df in cleaned_dfs.items():
        initial_len = len(df)
        df.drop_duplicates(inplace=True)
        final_len = len(df)
        diff = initial_len - final_len
        if diff > 0:
            logger.info(f"Removed {diff} duplicate rows from {name}")
            
    # 2. Impute missing values
    # Products dataset
    if "olist_products_dataset" in cleaned_dfs:
        prod_df = cleaned_dfs["olist_products_dataset"]
        # Categorical imputation
        if "product_category_name" in prod_df.columns:
            prod_df["product_category_name"] = prod_df["product_category_name"].fillna("unknown")
            
        # Numerical imputation with median
        num_cols = [
            "product_name_lenght", "product_description_lenght", 
            "product_photos_qty", "product_weight_g", 
            "product_length_cm", "product_height_cm", "product_width_cm"
        ]
        for col in num_cols:
            if col in prod_df.columns:
                prod_df[col] = prod_df[col].fillna(prod_df[col].median())
        cleaned_dfs["olist_products_dataset"] = prod_df
        logger.info("Imputed missing values in olist_products_dataset")
        
    # Reviews dataset
    if "olist_order_reviews_dataset" in cleaned_dfs:
        rev_df = cleaned_dfs["olist_order_reviews_dataset"]
        if "review_score" in rev_df.columns:
            rev_df["review_score"] = rev_df["review_score"].fillna(5.0) # Assume default high score
        if "review_comment_title" in rev_df.columns:
            rev_df["review_comment_title"] = rev_df["review_comment_title"].fillna("No Title")
        if "review_comment_message" in rev_df.columns:
            rev_df["review_comment_message"] = rev_df["review_comment_message"].fillna("No Message")
        cleaned_dfs["olist_order_reviews_dataset"] = rev_df
        logger.info("Imputed missing values in olist_order_reviews_dataset")

    # Order payments dataset
    if "olist_order_payments_dataset" in cleaned_dfs:
        pay_df = cleaned_dfs["olist_order_payments_dataset"]
        if "payment_value" in pay_df.columns:
            pay_df["payment_value"] = pay_df["payment_value"].fillna(0.0)
        cleaned_dfs["olist_order_payments_dataset"] = pay_df
        logger.info("Imputed missing values in olist_order_payments_dataset")

    return cleaned_dfs

def merge_datasets(datasets):
    """
    Merges the Olist datasets correctly using primary and foreign keys.
    """
    logger.info("Merging datasets...")
    
    # Extract datasets
    orders = datasets["olist_orders_dataset"]
    items = datasets["olist_order_items_dataset"]
    products = datasets["olist_products_dataset"]
    customers = datasets["olist_customers_dataset"]
    sellers = datasets["olist_sellers_dataset"]
    reviews = datasets["olist_order_reviews_dataset"]
    payments = datasets["olist_order_payments_dataset"]
    translation = datasets["product_category_name_translation"]
    
    # 1. Aggregate Order Items to order level
    logger.info("Aggregating order items details to order level...")
    agg_items = items.groupby("order_id").agg({
        "price": ["sum", "mean"],
        "freight_value": "sum",
        "order_item_id": "count", # Quantity of items
        "product_id": "first",    # Represent as main product
        "seller_id": "first"      # Represent as main seller
    })
    # Flatten column names
    agg_items.columns = [
        "total_price",
        "avg_product_price",
        "total_freight_cost",
        "num_items_ordered",
        "product_id",
        "seller_id"
    ]
    agg_items.reset_index(inplace=True)
    
    # 2. Aggregate Payments to order level
    logger.info("Aggregating order payments...")
    agg_payments = payments.groupby("order_id").agg({
        "payment_value": "sum",
        "payment_installments": "max",
        "payment_sequential": "max",
        "payment_type": "first"  # Take the primary payment method
    })
    agg_payments.rename(columns={"payment_value": "total_payment_value"}, inplace=True)
    agg_payments.reset_index(inplace=True)
    
    # 3. Aggregate Reviews to order level
    logger.info("Aggregating order reviews...")
    agg_reviews = reviews.groupby("order_id").agg({
        "review_score": "mean"
    }).reset_index()
    agg_reviews.rename(columns={"review_score": "avg_review_score"}, inplace=True)
    
    # 4. Geolocation mapping
    logger.info("Aggregating geolocation data...")
    geo = datasets["olist_geolocation_dataset"]
    geo_grouped = geo.groupby("geolocation_zip_code_prefix").agg({
        "geolocation_lat": "mean",
        "geolocation_lng": "mean"
    }).reset_index()
    geo_grouped.rename(columns={
        "geolocation_lat": "mean_lat",
        "geolocation_lng": "mean_lng"
    }, inplace=True)
    
    # 5. Start merging
    # Merge orders with customers (order_id -> customer_id -> customer_unique_id, state, city)
    logger.info("Merging orders and customers...")
    master_df = pd.merge(orders, customers, on="customer_id", how="inner")
    
    # Merge with items
    logger.info("Merging with order items...")
    master_df = pd.merge(master_df, agg_items, on="order_id", how="inner")
    
    # Merge with payments
    logger.info("Merging with order payments...")
    master_df = pd.merge(master_df, agg_payments, on="order_id", how="left")
    # If no payment details, fill payment value with total_price + freight_cost
    master_df["total_payment_value"] = master_df["total_payment_value"].fillna(
        master_df["total_price"] + master_df["total_freight_cost"]
    )
    master_df["payment_installments"] = master_df["payment_installments"].fillna(1)
    master_df["payment_type"] = master_df["payment_type"].fillna("unknown")
    
    # Merge with reviews
    logger.info("Merging with order reviews...")
    master_df = pd.merge(master_df, agg_reviews, on="order_id", how="left")
    master_df["avg_review_score"] = master_df["avg_review_score"].fillna(5.0) # Fill missing review scores with 5.0
    
    # Merge with products
    logger.info("Merging with product attributes...")
    master_df = pd.merge(master_df, products, on="product_id", how="left")
    
    # Merge with translation to English
    logger.info("Merging with product category translation...")
    master_df = pd.merge(master_df, translation, on="product_category_name", how="left")
    # If category translation missing, fall back to product_category_name or 'unknown'
    master_df["product_category_name_english"] = master_df["product_category_name_english"].fillna(
        master_df["product_category_name"].fillna("unknown")
    )
    
    # Merge with sellers
    logger.info("Merging with seller attributes...")
    master_df = pd.merge(master_df, sellers, on="seller_id", how="left")
    
    # Merge with customer coordinates
    logger.info("Merging customer geolocation details...")
    master_df = pd.merge(
        master_df, 
        geo_grouped, 
        left_on="customer_zip_code_prefix", 
        right_on="geolocation_zip_code_prefix", 
        how="left"
    )
    master_df.rename(columns={"mean_lat": "customer_lat", "mean_lng": "customer_lng"}, inplace=True)
    master_df.drop(columns=["geolocation_zip_code_prefix"], inplace=True, errors="ignore")
    
    # Merge with seller coordinates
    logger.info("Merging seller geolocation details...")
    master_df = pd.merge(
        master_df, 
        geo_grouped, 
        left_on="seller_zip_code_prefix", 
        right_on="geolocation_zip_code_prefix", 
        how="left"
    )
    master_df.rename(columns={"mean_lat": "seller_lat", "mean_lng": "seller_lng"}, inplace=True)
    master_df.drop(columns=["geolocation_zip_code_prefix"], inplace=True, errors="ignore")
    
    # Fill remaining missing lat/lng values
    for col in ["customer_lat", "customer_lng", "seller_lat", "seller_lng"]:
        if col in master_df.columns:
            master_df[col] = master_df[col].fillna(master_df[col].mean())
            
    logger.info(f"Dataset merging complete! Master DataFrame Shape: {master_df.shape}")
    return master_df

if __name__ == "__main__":
    from src.data_loader import load_datasets
    logging.basicConfig(level=logging.INFO)
    dfs = load_datasets()
    dfs = preprocess_timestamps(dfs)
    dfs = clean_datasets(dfs)
    m_df = merge_datasets(dfs)
    print("Merged data info:")
    print(m_df.info())
