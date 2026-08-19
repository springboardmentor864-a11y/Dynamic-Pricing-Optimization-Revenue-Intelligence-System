import logging
import pandas as pd
import numpy as np
from tqdm import tqdm
from src.config import TARGET_COLUMN

logger = logging.getLogger(__name__)

def engineer_features(master_df):
    """
    Engineers useful date features, target variables, and client/seller metrics.
    """
    try:
        logger.info("Starting feature engineering pipeline...")
        df = master_df.copy()
        
        # 1. Total Order Value (Revenue)
        df[TARGET_COLUMN] = df["total_price"] + df["total_freight_cost"]
        logger.info(f"Target variable '{TARGET_COLUMN}' created.")
        
        # 2. Date features from order_purchase_timestamp
        logger.info("Extracting date features...")
        dt_col = df["order_purchase_timestamp"]
        df["order_purchase_year"] = dt_col.dt.year
        df["order_purchase_month"] = dt_col.dt.month
        # Use ISO week since dt.week is deprecated in pandas
        df["order_purchase_week"] = dt_col.dt.isocalendar().week.astype(int)
        df["order_purchase_day"] = dt_col.dt.day
        df["order_purchase_quarter"] = dt_col.dt.quarter
        df["order_purchase_weekday"] = dt_col.dt.weekday
        df["order_purchase_hour"] = dt_col.dt.hour
        
        # 3. Physical Features (Volume, Density, Weight/Volume per Quantity)
        logger.info("Calculating physical features...")
        df["product_volume_cm3"] = df["product_length_cm"] * df["product_height_cm"] * df["product_width_cm"]
        df["product_volume_cm3"] = df["product_volume_cm3"].fillna(df["product_volume_cm3"].median())
        df["product_density_g_cm3"] = df["product_weight_g"] / (df["product_volume_cm3"] + 1)
        df["product_density_g_cm3"] = df["product_density_g_cm3"].fillna(df["product_density_g_cm3"].median())
        
        df["total_weight_g"] = df["product_weight_g"] * df["num_items_ordered"]
        df["total_volume_cm3"] = df["product_volume_cm3"] * df["num_items_ordered"]
        
        # 4. Spatial Distance
        logger.info("Calculating seller-customer spatial distance...")
        df["spatial_dist"] = np.sqrt(
            (df["customer_lat"] - df["seller_lat"])**2 + 
            (df["customer_lng"] - df["seller_lng"])**2
        )
        df["spatial_dist"] = df["spatial_dist"].fillna(df["spatial_dist"].mean())
        
        # 4b. Delivery Features (needed for EDA and plotting, but excluded from modeling)
        logger.info("Calculating delivery features...")
        df["delivery_time"] = (df["order_delivered_customer_date"] - df["order_purchase_timestamp"]).dt.total_seconds() / (24 * 3600)
        df["delivery_delay"] = (df["order_delivered_customer_date"] - df["order_estimated_delivery_date"]).dt.total_seconds() / (24 * 3600)
        df["delivery_time"] = df["delivery_time"].clip(lower=0)
        # Fill NaNs with median/mean of the available data
        df["delivery_time"] = df["delivery_time"].fillna(df["delivery_time"].median())
        df["delivery_delay"] = df["delivery_delay"].fillna(df["delivery_delay"].median())
        
        # 5. Customer-level features (historical statistics only)
        logger.info("Calculating customer-level features...")
        cust_stats = df.groupby("customer_unique_id").agg(
            customer_lifetime_value=(TARGET_COLUMN, "sum"),
            number_of_orders=("order_id", "nunique")
        ).reset_index()
        cust_stats["revenue_per_customer"] = cust_stats["customer_lifetime_value"] / cust_stats["number_of_orders"]
        df = pd.merge(df, cust_stats, on="customer_unique_id", how="left")
        
        # 6. Seller-level features
        logger.info("Calculating seller-level features...")
        seller_stats = df.groupby("seller_id").agg(
            revenue_per_seller=("total_price", "sum")
        ).reset_index()
        df = pd.merge(df, seller_stats, on="seller_id", how="left")
        
        # 7. Product popularity
        logger.info("Calculating product popularity...")
        prod_stats = df.groupby("product_id").agg(
            product_popularity=("order_id", "count")
        ).reset_index()
        df = pd.merge(df, prod_stats, on="product_id", how="left")
        
        # 8. Monthly and Weekly Revenue (aggregations)
        logger.info("Calculating monthly and weekly revenue aggregations...")
        df["year_month"] = df["order_purchase_timestamp"].dt.to_period("M")
        monthly_rev = df.groupby("year_month")[TARGET_COLUMN].sum().reset_index()
        monthly_rev.rename(columns={TARGET_COLUMN: "monthly_revenue"}, inplace=True)
        df = pd.merge(df, monthly_rev, on="year_month", how="left")
        df.drop(columns=["year_month"], inplace=True)
        
        df["year_week"] = df["order_purchase_timestamp"].dt.to_period("W")
        weekly_rev = df.groupby("year_week")[TARGET_COLUMN].sum().reset_index()
        weekly_rev.rename(columns={TARGET_COLUMN: "weekly_revenue"}, inplace=True)
        df = pd.merge(df, weekly_rev, on="year_week", how="left")
        df.drop(columns=["year_week"], inplace=True)
        
        # 9. Clean up missing values / drop non-delivered for safety if desired,
        # but here we keep all orders and fill any NaNs.
        df["product_weight_g"] = df["product_weight_g"].fillna(df["product_weight_g"].median())
        df["product_length_cm"] = df["product_length_cm"].fillna(df["product_length_cm"].median())
        df["product_height_cm"] = df["product_height_cm"].fillna(df["product_height_cm"].median())
        df["product_width_cm"] = df["product_width_cm"].fillna(df["product_width_cm"].median())
        
        logger.info(f"Feature engineering completed! DataFrame shape: {df.shape}")
        return df
    except Exception as e:
        logger.error(f"Error during feature engineering: {str(e)}")
        raise e

if __name__ == "__main__":
    from src.data_loader import load_datasets
    from src.preprocessor import preprocess_timestamps, clean_datasets, merge_datasets
    logging.basicConfig(level=logging.INFO)
    dfs = load_datasets()
    dfs = preprocess_timestamps(dfs)
    dfs = clean_datasets(dfs)
    m_df = merge_datasets(dfs)
    f_df = engineer_features(m_df)
    print("Engineered features preview:")
    print(f_df[["total_order_value", "delivery_time", "delivery_delay", "customer_lifetime_value", "revenue_per_seller"]].head())
