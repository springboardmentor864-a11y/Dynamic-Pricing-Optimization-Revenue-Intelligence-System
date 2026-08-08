import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder

# ============================================================
# Load Feature Engineered Dataset
# ============================================================

df = pd.read_csv("../dataset/feature_engineered_dataset.csv")

print("=" * 60)
print("DATA PREPROCESSING")
print("=" * 60)

print("\nDataset Loaded Successfully!")
print("Rows :", df.shape[0])
print("Columns :", df.shape[1])

# ============================================================
# Handle Missing Values
# ============================================================

# Numeric Columns
numeric_columns = df.select_dtypes(include=["int64", "float64"]).columns

for column in numeric_columns:
    df[column] = df[column].fillna(df[column].median())

# Categorical Columns
categorical_columns = df.select_dtypes(include=["object", "string"]).columns

for column in categorical_columns:
    df[column] = df[column].fillna("Unknown")

print("\nMissing values handled successfully.")

# ============================================================
# Remove Unnecessary Columns
# ============================================================

columns_to_drop = [
    "order_id",
    "customer_id",
    "seller_id",
    "product_id",
    "shipping_limit_date",
    "order_purchase_timestamp",
    "order_approved_at",
    "order_delivered_carrier_date",
    "order_delivered_customer_date",
    "order_estimated_delivery_date"
]

df = df.drop(columns=columns_to_drop)

print("\nUnnecessary columns removed.")

# ============================================================
# Encode Categorical Columns
# ============================================================

label_encoder = LabelEncoder()

categorical_columns = df.select_dtypes(include=["object", "string"]).columns

for column in categorical_columns:
    df[column] = label_encoder.fit_transform(df[column])

print("\nCategorical columns encoded successfully.")

# ============================================================
# Separate Features and Target
# ============================================================

# Target Variable
y = df["price"]

# Feature Variables
X = df.drop("price", axis=1)

print("\nFeatures and Target created.")
print("Features Shape :", X.shape)
print("Target Shape :", y.shape)

# ============================================================
# Train-Test Split
# ============================================================

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42
)

print("\nTrain-Test Split Completed!")

print("Training Samples :", len(X_train))
print("Testing Samples :", len(X_test))

# ============================================================
# Save Processed Datasets
# ============================================================

X_train.to_csv("../dataset/X_train.csv", index=False)
X_test.to_csv("../dataset/X_test.csv", index=False)

y_train.to_csv("../dataset/y_train.csv", index=False)
y_test.to_csv("../dataset/y_test.csv", index=False)

print("\nProcessed datasets saved successfully!")

print("\nSaved Files:")
print("X_train.csv")
print("X_test.csv")
print("y_train.csv")
print("y_test.csv")

print("\nPreprocessing Completed Successfully!")