import pandas as pd

# Load CSV files
order_items = pd.read_csv("../dataset/olist_order_items_dataset.csv")
orders = pd.read_csv("../dataset/olist_orders_dataset.csv")
products = pd.read_csv("../dataset/olist_products_dataset.csv")

datasets = {
    "Order Items": order_items,
    "Orders": orders,
    "Products": products
}

for name, df in datasets.items():
    print("=" * 60)
    print(f"Dataset: {name}")
    print("=" * 60)

    # Total rows and columns
    print(f"Rows: {df.shape[0]}")
    print(f"Columns: {df.shape[1]}")

    # Column names
    print("\nColumn Names:")
    print(df.columns.tolist())

    # Data types
    print("\nData Types:")
    print(df.dtypes)

    # Missing values
    print("\nMissing Values:")
    print(df.isnull().sum())

    # Duplicate records
    print("\nDuplicate Rows:")
    print(df.duplicated().sum())

    print("\nFirst 5 Rows:")
    print(df.head())

    print("\n\n")