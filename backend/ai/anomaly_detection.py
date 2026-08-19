from sklearn.ensemble import IsolationForest


def detect_anomalies(df):

    required = [
        "price",
        "stock",
        "sales",
        "revenue"
    ]

    for col in required:

        if col not in df.columns:
            return []

    X = df[
        [
            "price",
            "stock",
            "sales",
            "revenue"
        ]
    ]

    model = IsolationForest(
        contamination=0.05,
        random_state=42
    )

    df["anomaly"] = model.fit_predict(X)

    return df[
        df["anomaly"] == -1
    ].to_dict(
        orient="records"
    )