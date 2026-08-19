import logging
import pickle
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, MinMaxScaler, LabelEncoder
from sklearn.feature_selection import mutual_info_regression, RFE
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import Ridge
from src.config import FEATURE_IMPORTANCE_DIR, MODELS_DIR, RANDOM_STATE, TARGET_COLUMN

logger = logging.getLogger(__name__)

def preprocess_and_select_features(train_df, test_df=None):
    """
    Applies encoding, target/mean encodings, scaling, and feature selection.
    Fits all mappings, encoders, and scalers strictly on train_df to prevent leakage.
    
    If test_df is provided:
        Returns: X_train_scaled, X_test_scaled, y_train, y_test, top_features, importance_df
    If test_df is None:
        Returns: X_train_scaled, X_train, y_train, top_features, importance_df
    """
    try:
        logger.info("Starting leak-free feature selection and preprocessing pipeline...")
        
        # 1. Target/Mean Encodings computed strictly on train_df
        logger.info("Computing target/mean encodings on training set...")
        y_col = TARGET_COLUMN
        
        # Compute category stats
        cat_stats = train_df.groupby("product_category_name_english").agg(
            cat_mean_price=("total_price", "mean"),
            cat_mean_freight=("total_freight_cost", "mean")
        ).reset_index()

        # Compute seller stats
        seller_stats = train_df.groupby("seller_id").agg(
            seller_mean_price=("total_price", "mean"),
            seller_mean_freight=("total_freight_cost", "mean"),
            seller_sales_count=("order_id", "count")
        ).reset_index()

        # Compute customer state stats
        state_stats = train_df.groupby("customer_state").agg(
            state_mean_price=("total_price", "mean"),
            state_mean_freight=("total_freight_cost", "mean")
        ).reset_index()

        # Fallback values
        global_mean_price = train_df["total_price"].mean()
        global_mean_freight = train_df["total_freight_cost"].mean()
        
        # Helper to map encodings
        def map_stats(df):
            df_mapped = df.copy()
            df_mapped = pd.merge(df_mapped, cat_stats, on="product_category_name_english", how="left")
            df_mapped = pd.merge(df_mapped, seller_stats, on="seller_id", how="left")
            df_mapped = pd.merge(df_mapped, state_stats, on="customer_state", how="left")
            
            df_mapped["cat_mean_price"] = df_mapped["cat_mean_price"].fillna(global_mean_price)
            df_mapped["cat_mean_freight"] = df_mapped["cat_mean_freight"].fillna(global_mean_freight)
            df_mapped["seller_mean_price"] = df_mapped["seller_mean_price"].fillna(global_mean_price)
            df_mapped["seller_mean_freight"] = df_mapped["seller_mean_freight"].fillna(global_mean_freight)
            df_mapped["seller_sales_count"] = df_mapped["seller_sales_count"].fillna(0)
            df_mapped["state_mean_price"] = df_mapped["state_mean_price"].fillna(global_mean_price)
            df_mapped["state_mean_freight"] = df_mapped["state_mean_freight"].fillna(global_mean_freight)
            
            return df_mapped

        # Map to train and test
        train_mapped = map_stats(train_df)
        test_mapped = map_stats(test_df) if test_df is not None else None
        
        # 2. Categorical Variable Encoding
        logger.info("Encoding categorical variables...")
        
        # Handle payment_type One-Hot Encoding
        # Get all payment types in train
        pay_cols = [c for c in train_mapped.columns if c.startswith("pay_") and c != "payment_type"]
        
        # If payment_type column exists, get_dummies
        if "payment_type" in train_mapped.columns:
            train_mapped = pd.get_dummies(train_mapped, columns=["payment_type"], prefix="pay", drop_first=True)
            if test_mapped is not None:
                test_mapped = pd.get_dummies(test_mapped, columns=["payment_type"], prefix="pay", drop_first=True)
                # Align dummy columns
                test_mapped = test_mapped.reindex(columns=train_mapped.columns, fill_value=0)
                
        # Label encode customer_state
        if "customer_state" in train_mapped.columns:
            le_state = LabelEncoder()
            train_mapped["customer_state_encoded"] = le_state.fit_transform(train_mapped["customer_state"])
            if test_mapped is not None:
                # Map unseen states to -1 or fit/transform handle safely
                test_mapped["customer_state_encoded"] = test_mapped["customer_state"].map(
                    lambda s: le_state.transform([s])[0] if s in le_state.classes_ else -1
                )
                
        # Frequency Encode product_category_name_english
        if "product_category_name_english" in train_mapped.columns:
            freq_map = train_mapped["product_category_name_english"].value_counts(normalize=True).to_dict()
            train_mapped["category_freq_encoded"] = train_mapped["product_category_name_english"].map(freq_map)
            if test_mapped is not None:
                test_mapped["category_freq_encoded"] = test_mapped["product_category_name_english"].map(freq_map).fillna(0)

        # 3. Filter Columns & Exclude Leakages / Future Fields
        exclude_cols = [
            "order_id", "customer_id", "order_status", "order_purchase_timestamp",
            "order_approved_at", "order_delivered_carrier_date", "order_delivered_customer_date",
            "order_estimated_delivery_date", "customer_unique_id", "customer_city",
            "customer_state", "product_id", "seller_id", "product_category_name",
            "product_category_name_english", "seller_city", "seller_state",
            "total_payment_value", "total_price",  # Target components (leakage)
            "customer_lifetime_value", "revenue_per_customer", "avg_product_price",
            "total_freight_cost", "revenue_per_seller",
            "delivery_time", "delivery_delay",      # Future fields
            "monthly_revenue", "weekly_revenue",      # Target aggregations
            TARGET_COLUMN
        ]
        
        feature_cols = [col for col in train_mapped.columns if col not in exclude_cols]
        logger.info(f"Features list ({len(feature_cols)} features): {feature_cols}")
        
        X_train = train_mapped[feature_cols].copy()
        y_train = train_mapped[TARGET_COLUMN].copy()
        X_train = X_train.fillna(X_train.median())
        
        if test_mapped is not None:
            X_test = test_mapped[feature_cols].copy()
            y_test = test_mapped[TARGET_COLUMN].copy()
            X_test = X_test.fillna(X_train.median()) # Fill test NaNs with train median
        
        # Convert boolean columns to integer
        for col in X_train.columns:
            if X_train[col].dtype == bool:
                X_train[col] = X_train[col].astype(int)
                if test_mapped is not None:
                    X_test[col] = X_test[col].astype(int)

        # 4. Feature Scaling
        logger.info("Scaling features...")
        minmax_cols = ["customer_lat", "customer_lng", "seller_lat", "seller_lng", "spatial_dist"]
        minmax_cols = [c for c in minmax_cols if c in X_train.columns]
        std_cols = [c for c in X_train.columns if c not in minmax_cols]
        
        X_train_scaled = X_train.copy()
        X_test_scaled = X_test.copy() if test_mapped is not None else None
        
        # Fit MinMaxScaler
        if minmax_cols:
            scaler_minmax = MinMaxScaler()
            X_train_scaled[minmax_cols] = scaler_minmax.fit_transform(X_train[minmax_cols])
            if X_test_scaled is not None:
                X_test_scaled[minmax_cols] = scaler_minmax.transform(X_test[minmax_cols])
                
        # Fit StandardScaler
        if std_cols:
            scaler_std = StandardScaler()
            X_train_scaled[std_cols] = scaler_std.fit_transform(X_train[std_cols])
            if X_test_scaled is not None:
                X_test_scaled[std_cols] = scaler_std.transform(X_test[std_cols])

        # 5. Feature Selection using a representative sample of training set
        sample_size = min(5000, len(X_train_scaled))
        logger.info(f"Subsampling {sample_size} rows for feature selection selectors...")
        X_sample = X_train_scaled.sample(sample_size, random_state=RANDOM_STATE)
        y_sample = y_train.loc[X_sample.index]
        
        # A. Mutual Information
        logger.info("Performing Mutual Information regression...")
        mi_scores = mutual_info_regression(X_sample, y_sample, random_state=RANDOM_STATE)
        mi_df = pd.DataFrame({"Feature": X_train.columns, "MI_Score": mi_scores})
        
        # B. Random Forest Feature Importance
        logger.info("Performing Random Forest Feature Importance...")
        rf = RandomForestRegressor(n_estimators=50, max_depth=10, random_state=RANDOM_STATE, n_jobs=-1)
        rf.fit(X_sample, y_sample)
        rf_df = pd.DataFrame({"Feature": X_train.columns, "RF_Importance": rf.feature_importances_})
        
        # C. RFE using Ridge
        logger.info("Performing Recursive Feature Elimination...")
        ridge = Ridge(alpha=1.0)
        rfe = RFE(estimator=ridge, n_features_to_select=min(15, len(X_train.columns)))
        rfe.fit(X_sample, y_sample)
        rfe_df = pd.DataFrame({"Feature": X_train.columns, "RFE_Ranking": rfe.ranking_, "RFE_Selected": rfe.support_})
        
        # Combine Selector Scores
        importance_df = pd.merge(mi_df, rf_df, on="Feature")
        importance_df = pd.merge(importance_df, rfe_df, on="Feature")
        
        importance_df["MI_Normalized"] = importance_df["MI_Score"] / (importance_df["MI_Score"].max() + 1e-8)
        importance_df["RF_Normalized"] = importance_df["RF_Importance"] / (importance_df["RF_Importance"].max() + 1e-8)
        importance_df["RFE_Score"] = importance_df["RFE_Selected"].astype(int)
        importance_df["Combined_Score"] = (importance_df["MI_Normalized"] + importance_df["RF_Normalized"] + importance_df["RFE_Score"]) / 3
        
        importance_df.sort_values(by="Combined_Score", ascending=False, inplace=True)
        
        # Save feature selection report
        FEATURE_IMPORTANCE_DIR.mkdir(parents=True, exist_ok=True)
        importance_df.to_csv(FEATURE_IMPORTANCE_DIR / "feature_selection_results.csv", index=False)
        logger.info(f"Feature selection report saved to {FEATURE_IMPORTANCE_DIR / 'feature_selection_results.csv'}")
        
        top_features = importance_df["Feature"].head(15).tolist()
        logger.info(f"Top selected features: {top_features}")
        
        # Save preprocessor artifact for online inference alignment
        preprocessor_artifact = {
            "cat_stats": cat_stats,
            "seller_stats": seller_stats,
            "state_stats": state_stats,
            "global_mean_price": global_mean_price,
            "global_mean_freight": global_mean_freight,
            "le_state": le_state if "customer_state" in train_mapped.columns else None,
            "freq_map": freq_map if "product_category_name_english" in train_mapped.columns else {},
            "scaler_minmax": scaler_minmax if minmax_cols else None,
            "scaler_std": scaler_std if std_cols else None,
            "minmax_cols": minmax_cols,
            "std_cols": std_cols,
            "feature_cols": feature_cols,
            "top_features": top_features,
            "train_medians": X_train.median().to_dict()
        }
        MODELS_DIR.mkdir(parents=True, exist_ok=True)
        with open(MODELS_DIR / "preprocessor.pkl", "wb") as f:
            pickle.dump(preprocessor_artifact, f)
        logger.info(f"Preprocessor artifact saved to {MODELS_DIR / 'preprocessor.pkl'}")

        if test_mapped is not None:
            return X_train_scaled, X_test_scaled, y_train, y_test, top_features, importance_df
        else:
            return X_train_scaled, X_train, y_train, top_features, importance_df
            
    except Exception as e:
        logger.error(f"Error in feature selection pipeline: {str(e)}")
        raise e
