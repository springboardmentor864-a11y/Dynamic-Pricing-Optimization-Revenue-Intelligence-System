import pandas as pd

# Load master dataset
df = pd.read_csv("../dataset/master_dataset.csv")

print("=" * 60)
print("MASTER DATASET INFORMATION")
print("=" * 60)

print("\nRows:", df.shape[0])
print("Columns:", df.shape[1])

# -----------------------------
# Missing Values
# -----------------------------
print("\nMissing Values Before Cleaning:")
print(df.isnull().sum())

# -----------------------------
# Remove duplicate rows
# -----------------------------
duplicates_before = df.duplicated().sum()
print("\nDuplicate Rows Before Cleaning:", duplicates_before)

df = df.drop_duplicates()

duplicates_after = df.duplicated().sum()
print("Duplicate Rows After Cleaning:", duplicates_after)

# -----------------------------
# Convert date columns
# -----------------------------
date_columns = [
    "shipping_limit_date",
    "order_purchase_timestamp",
    "order_approved_at",
    "order_delivered_carrier_date",
    "order_delivered_customer_date",
    "order_estimated_delivery_date"
]

for column in date_columns:
    df[column] = pd.to_datetime(df[column], errors="coerce")

print("\nDate columns converted successfully.")

# -----------------------------
# Save cleaned dataset
# -----------------------------
df.to_csv("../dataset/cleaned_master_dataset.csv", index=False)

print("\nCleaned dataset saved successfully!")
print("File Name: cleaned_master_dataset.csv")