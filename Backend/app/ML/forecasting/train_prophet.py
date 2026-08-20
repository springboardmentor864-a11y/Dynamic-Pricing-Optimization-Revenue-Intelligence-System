import os
import pickle

import pandas as pd
from prophet import Prophet


# --------------------------------------------------
# Project Paths
# --------------------------------------------------

CURRENT_DIR = os.path.dirname(__file__)

PROJECT_ROOT = os.path.abspath(
    os.path.join(
        CURRENT_DIR,
        "../../../../"
    )
)

ORDERS_PATH = os.path.join(
    PROJECT_ROOT,
    "Datasets",
    "olist_orders_dataset.csv"
)

ORDER_ITEMS_PATH = os.path.join(
    PROJECT_ROOT,
    "Datasets",
    "olist_order_items_dataset.csv"
)

MODEL_DIR = os.path.join(
    CURRENT_DIR,
    "../saved_models"
)

MODEL_PATH = os.path.join(
    MODEL_DIR,
    "prophet.pkl"
)


# --------------------------------------------------
# Load Olist Brazilian E-commerce Dataset
# --------------------------------------------------

print("Loading Olist Brazilian e-commerce dataset...")

orders = pd.read_csv(ORDERS_PATH)

order_items = pd.read_csv(ORDER_ITEMS_PATH)

print("Orders dataset shape:")
print(orders.shape)

print("Order items dataset shape:")
print(order_items.shape)


# --------------------------------------------------
# Keep Delivered Orders
# --------------------------------------------------

print("\nFiltering delivered orders...")

orders = orders[
    orders["order_status"] == "delivered"
].copy()

print(
    "Delivered orders:",
    len(orders)
)


# --------------------------------------------------
# Merge Orders and Order Items
# --------------------------------------------------

print("\nMerging orders and order items...")

df = order_items.merge(
    orders[
        [
            "order_id",
            "order_purchase_timestamp"
        ]
    ],
    on="order_id",
    how="inner"
)

print(
    "Merged dataset shape:",
    df.shape
)


# --------------------------------------------------
# Convert Purchase Date
# --------------------------------------------------

df["order_purchase_timestamp"] = pd.to_datetime(
    df["order_purchase_timestamp"]
)


# --------------------------------------------------
# Create Monthly Demand
# --------------------------------------------------

print("\nCreating monthly demand dataset...")

df["month"] = (
    df["order_purchase_timestamp"]
    .dt.to_period("M")
)


monthly = (
    df.groupby("month")
    .agg(
        units_sold=("order_item_id", "count"),
        revenue=("price", "sum")
    )
    .reset_index()
)


# --------------------------------------------------
# Create Continuous Monthly Timeline
# --------------------------------------------------

monthly["month"] = monthly["month"].dt.to_timestamp()

full_months = pd.date_range(
    start=monthly["month"].min(),
    end=monthly["month"].max(),
    freq="MS"
)

monthly = (
    monthly
    .set_index("month")
    .reindex(full_months, fill_value=0)
    .rename_axis("month")
    .reset_index()
)


# --------------------------------------------------
# Prepare Data for Prophet
# --------------------------------------------------

forecast_data = monthly[
    [
        "month",
        "units_sold"
    ]
].rename(
    columns={
        "month": "ds",
        "units_sold": "y"
    }
)


# --------------------------------------------------
# Validate Forecast Dataset
# --------------------------------------------------

forecast_data["ds"] = pd.to_datetime(
    forecast_data["ds"]
)

forecast_data["y"] = pd.to_numeric(
    forecast_data["y"],
    errors="coerce"
)

forecast_data = forecast_data.dropna(
    subset=["ds", "y"]
)

forecast_data = forecast_data.sort_values(
    "ds"
).reset_index(drop=True)


print("\nForecast dataset:")
print(forecast_data)

print("\nForecast dataset shape:")
print(forecast_data.shape)

print("\nFirst 5 rows:")
print(forecast_data.head())

print("\nLast 5 rows:")
print(forecast_data.tail())


# --------------------------------------------------
# Train Prophet Model
# --------------------------------------------------

print("\nTraining Prophet demand forecasting model...")

model = Prophet(
    yearly_seasonality=True,
    weekly_seasonality=False,
    daily_seasonality=False
)

model.fit(
    forecast_data
)

print(
    "Prophet demand model trained successfully."
)


# --------------------------------------------------
# Save Model
# --------------------------------------------------

os.makedirs(
    MODEL_DIR,
    exist_ok=True
)

with open(
    MODEL_PATH,
    "wb"
) as file:

    pickle.dump(
        model,
        file
    )


print("\nModel saved successfully at:")

print(MODEL_PATH)