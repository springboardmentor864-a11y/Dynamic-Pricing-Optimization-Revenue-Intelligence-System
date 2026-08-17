import os
import pandas as pd
from typing import Tuple, Dict, Any
from backend.services.ml_service import preprocess_and_cache, preprocess_single_inference, INPUT_FEATURES, MODEL_FEATURES, TARGET

MODELS_DIR = os.path.dirname(os.path.abspath(__file__))

def merge_and_save_data():
    """Wrapper for merge and save data using the new pipeline logic."""
    from models.preprocessing import merge_and_save_data as legacy_merge
    # Return legacy merge function if needed, or implement it simply.
    # To be extremely clean, we let ml_service do data handling.
    project_root = os.path.dirname(MODELS_DIR)
    orders_path = os.path.join(project_root, "dataset", "olist_orders_dataset.csv")
    items_path = os.path.join(project_root, "dataset", "olist_order_items_dataset.csv")
    products_path = os.path.join(project_root, "dataset", "olist_products_dataset.csv")
    output_path = os.path.join(project_root, "dataset", "final_pricing_dataset.csv")

    if not (os.path.exists(orders_path) and os.path.exists(items_path) and os.path.exists(products_path)):
        raise FileNotFoundError("One or more raw CSV files are missing in dataset/")

    orders = pd.read_csv(orders_path).drop_duplicates()
    items = pd.read_csv(items_path).drop_duplicates()
    products = pd.read_csv(products_path).drop_duplicates()

    merged = pd.merge(orders, items, on="order_id")
    final_df = pd.merge(merged, products, on="product_id")

    columns_to_keep = [
        "order_id", "product_id", "product_category_name", "price", "freight_value",
        "order_purchase_timestamp", "order_estimated_delivery_date", "product_weight_g", 
        "product_length_cm", "product_height_cm", "product_width_cm", 
        "product_photos_qty", "product_name_lenght", "product_description_lenght"
    ]
    columns_to_keep = [c for c in columns_to_keep if c in final_df.columns]
    final_df = final_df[columns_to_keep].copy()

    rename_dict = {}
    if "product_name_lenght" in final_df.columns:
        rename_dict["product_name_lenght"] = "product_name_length"
    if "product_description_lenght" in final_df.columns:
        rename_dict["product_description_lenght"] = "product_description_length"
    if rename_dict:
        final_df = final_df.rename(columns=rename_dict)

    final_df = final_df.drop_duplicates()

    final_df["product_volume"] = (
        final_df["product_length_cm"] * 
        final_df["product_height_cm"] * 
        final_df["product_width_cm"]
    )
    final_df["order_purchase_timestamp"] = pd.to_datetime(final_df["order_purchase_timestamp"])
    final_df["order_estimated_delivery_date"] = pd.to_datetime(final_df["order_estimated_delivery_date"])
    final_df["estimated_delivery_days"] = (final_df["order_estimated_delivery_date"] - final_df["order_purchase_timestamp"]).dt.days
    final_df["estimated_delivery_days"] = final_df["estimated_delivery_days"].clip(lower=0)
    final_df["revenue"] = final_df["price"] + final_df["freight_value"]

    final_df.to_csv(output_path, index=False)
    return final_df

def load_and_preprocess_price_data(df=None, is_training=True, saved_state=None):
    """Thin wrapper around refactored ml_service preprocessing functions."""
    if is_training:
        return preprocess_and_cache()
    else:
        return preprocess_single_inference(df, saved_state)
