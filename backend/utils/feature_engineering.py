import pandas as pd
import numpy as np


def engineer_features(df):
    numeric_columns = [
        "price",
        "stock",
        "sales",
        "revenue",
        "competitorPrice",
        "costPrice",
        "profit",
        "margin"
    ]

    for col in numeric_columns:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0)

    # Cost price setup
    if "costPrice" not in df.columns and "price" in df.columns:
        df["costPrice"] = np.round(df["price"] * 0.70, 2)
    elif "costPrice" in df.columns:
        df["costPrice"] = np.where(df["costPrice"] <= 0, np.round(df["price"] * 0.70, 2), df["costPrice"])

    # Revenue calculation - row-wise fallback
    if "revenue" not in df.columns:
        df["revenue"] = np.round(df["price"] * df["sales"], 2)
    else:
        df["revenue"] = np.where((df["revenue"] <= 0) | df["revenue"].isna(), np.round(df["price"] * df["sales"], 2), df["revenue"])

    # Profit calculation - row-wise fallback
    if "profit" not in df.columns:
        df["profit"] = np.round(df["revenue"] - (df["costPrice"] * df["sales"]), 2)
    else:
        df["profit"] = np.where((df["profit"] == 0) | df["profit"].isna(), np.round(df["revenue"] - (df["costPrice"] * df["sales"]), 2), df["profit"])

    # Margin calculation - row-wise fallback
    if "margin" not in df.columns:
        df["margin"] = np.where(df["price"] > 0, np.round(((df["price"] - df["costPrice"]) / df["price"]) * 100, 2), 30.0)
    else:
        df["margin"] = np.where((df["margin"] <= 0) | df["margin"].isna(), np.where(df["price"] > 0, np.round(((df["price"] - df["costPrice"]) / df["price"]) * 100, 2), 30.0), df["margin"])

    # Competitor price difference
    if "competitorPrice" in df.columns and "price" in df.columns:
        df["priceDifference"] = np.round(df["competitorPrice"] - df["price"], 2)

    # Average revenue per sale
    if "revenue" in df.columns and "sales" in df.columns:
        df["averageRevenue"] = np.round(df["revenue"] / df["sales"].replace(0, 1), 2)

    # Demand level
    if "sales" in df.columns:
        df["demandLevel"] = np.where(
            df["sales"] > 100,
            "High",
            np.where(
                df["sales"] > 50,
                "Medium",
                "Low"
            )
        )

    # Stock status
    if "stock" in df.columns:
        df["stockStatus"] = np.where(
            df["stock"] < 20,
            "Low Stock",
            "Available"
        )

    # Profit margin percentage relative to competitor
    if "price" in df.columns and "competitorPrice" in df.columns:
        df["profitMargin"] = np.round(
            ((df["price"] - df["competitorPrice"]) / df["price"].replace(0, 1)) * 100,
            2
        )

    df.replace([np.inf, -np.inf], 0, inplace=True)

    for col in df.columns:
        if df[col].dtype == object or pd.api.types.is_string_dtype(df[col]):
            df[col] = df[col].fillna("Unknown")
        else:
            df[col] = df[col].fillna(0)

    return df
