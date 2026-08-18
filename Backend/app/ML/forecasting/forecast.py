from app.ML.forecasting.prophet_loader import load_prophet_model


def forecast_prices(periods: int = 30):

    model = load_prophet_model()

    future = model.make_future_dataframe(
        periods=periods,
        freq="MS"
    )

    forecast = model.predict(future)

    result = forecast[
        [
            "ds",
            "yhat",
            "yhat_lower",
            "yhat_upper"
        ]
    ].tail(periods)

    return result