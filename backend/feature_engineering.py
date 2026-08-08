import pandas as pd

# -----------------------------------
# Load cleaned dataset
# -----------------------------------
df = pd.read_csv("../dataset/cleaned_master_dataset.csv")

print("=" * 60)
print("FEATURE ENGINEERING")
print("=" * 60)

# Convert purchase timestamp to datetime
df["order_purchase_timestamp"] = pd.to_datetime(
    df["order_purchase_timestamp"]
)

# -----------------------------------
# Date Features
# -----------------------------------
df["purchase_year"] = df["order_purchase_timestamp"].dt.year
df["purchase_month"] = df["order_purchase_timestamp"].dt.month
df["purchase_day"] = df["order_purchase_timestamp"].dt.day
df["purchase_weekday"] = df["order_purchase_timestamp"].dt.dayofweek

# -----------------------------------
# Product Volume
# -----------------------------------
df["product_volume"] = (
    df["product_length_cm"]
    * df["product_width_cm"]
    * df["product_height_cm"]
)

print("\nNew Features Created Successfully!")

print("\nNew Columns:")
print([
    "purchase_year",
    "purchase_month",
    "purchase_day",
    "purchase_weekday",
    "product_volume"
])

print("\nFirst 5 Rows of New Features:")
print(df[
    [
        "purchase_year",
        "purchase_month",
        "purchase_day",
        "purchase_weekday",
        "product_volume"
    ]
].head())

# -----------------------------------
# Save Feature Engineered Dataset
# -----------------------------------
df.to_csv(
    "../dataset/feature_engineered_dataset.csv",
    index=False
)

print("\nFeature engineered dataset saved successfully!")