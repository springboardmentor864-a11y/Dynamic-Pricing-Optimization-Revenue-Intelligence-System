import os
import pandas as pd

from sklearn.model_selection import train_test_split


# ==========================================================
# PROJECT PATHS
# ==========================================================

BASE_DIR = os.path.abspath(
    os.path.join(
        os.path.dirname(__file__),
        "..",
        "..",
        ".."
    )
)

DATASET_DIR = os.path.join(BASE_DIR, "Datasets")


# ==========================================================
# LOAD DATASETS
# ==========================================================

def load_datasets():

    orders = pd.read_csv(
        os.path.join(DATASET_DIR, "olist_orders_dataset.csv")
    )

    order_items = pd.read_csv(
        os.path.join(DATASET_DIR, "olist_order_items_dataset.csv")
    )

    products = pd.read_csv(
        os.path.join(DATASET_DIR, "olist_products_dataset.csv")
    )

    payments = pd.read_csv(
        os.path.join(DATASET_DIR, "olist_order_payments_dataset.csv")
    )

    return (
        orders,
        order_items,
        products,
        payments
    )


# ==========================================================
# MERGE DATASETS
# ==========================================================

def merge_datasets(
    orders,
    order_items,
    products,
    payments
):

    df = pd.merge(
        order_items,
        orders,
        on="order_id",
        how="inner"
    )

    df = pd.merge(
        df,
        payments,
        on="order_id",
        how="inner"
    )

    df = pd.merge(
        df,
        products,
        on="product_id",
        how="inner"
    )

    return df


# ==========================================================
# CLEAN DATA
# ==========================================================

def clean_data(df):

    df = df.drop_duplicates()

    required_columns = [
        "price",
        "freight_value",
        "payment_value",
        "payment_installments",
        "product_weight_g",
        "product_length_cm",
        "product_height_cm",
        "product_width_cm"
    ]

    df = df.dropna(subset=required_columns)

    df = df[df["price"] > 0]
    df = df[df["payment_value"] > 0]
    df = df[df["product_weight_g"] > 0]

    df = df.reset_index(drop=True)

    return df


# ==========================================================
# FEATURE ENGINEERING
# ==========================================================

def create_features(df):

    feature_columns = [

        "freight_value",

        "payment_value",

        "payment_installments",

        "product_weight_g",

        "product_length_cm",

        "product_height_cm",

        "product_width_cm"

    ]

    target_column = "price"

    X = df[feature_columns]

    y = df[target_column]

    return X, y


# ==========================================================
# PREPARE DATA
# ==========================================================

def prepare_data():

    (
        orders,
        order_items,
        products,
        payments
    ) = load_datasets()

    df = merge_datasets(
        orders,
        order_items,
        products,
        payments
    )

    df = clean_data(df)

    X, y = create_features(df)

    X_train, X_test, y_train, y_test = train_test_split(

        X,

        y,

        test_size=0.20,

        random_state=42

    )

    return (

        X_train,

        X_test,

        y_train,

        y_test

    )