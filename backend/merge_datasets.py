import pandas as pd

# Read datasets
order_items = pd.read_csv("../dataset/olist_order_items_dataset.csv")
orders = pd.read_csv("../dataset/olist_orders_dataset.csv")
products = pd.read_csv("../dataset/olist_products_dataset.csv")

print("Datasets Loaded Successfully!")

# Merge Order Items with Orders
merged_data = pd.merge(
    order_items,
    orders,
    on="order_id",
    how="left"
)

# Merge the above result with Products
master_dataset = pd.merge(
    merged_data,
    products,
    on="product_id",
    how="left"
)

print("\nMaster Dataset Created Successfully!")

print("\nRows:", master_dataset.shape[0])
print("Columns:", master_dataset.shape[1])

print("\nColumn Names:")
print(master_dataset.columns.tolist())

print("\nFirst 5 Rows:")
print(master_dataset.head())

# Save merged dataset
master_dataset.to_csv(
    "../dataset/master_dataset.csv",
    index=False
)

print("\nmaster_dataset.csv saved successfully!")