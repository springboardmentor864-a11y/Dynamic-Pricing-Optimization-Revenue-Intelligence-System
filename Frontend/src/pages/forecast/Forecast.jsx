import { useState } from "react";
import api from "../../api/axios";
import "./Forecast.css";

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from "recharts";

function Forecast() {
    const [periods, setPeriods] = useState(12);
    const [forecast, setForecast] = useState([]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    /* =====================================================
       GENERATE FORECAST
    ===================================================== */

    const handleForecast = async () => {
        const value = Number(periods);

        if (
            !Number.isInteger(value) ||
            value < 1 ||
            value > 365
        ) {
            setError(
                "Forecast period must be between 1 and 365 months."
            );
            return;
        }

        try {
            setLoading(true);
            setError("");
            setForecast([]);

            const response = await api.post(
                "/forecast/",
                {
                    periods: value
                }
            );

            console.log(
                "Forecast Response:",
                response.data
            );

            const forecastData =
                response.data?.forecast || [];

            if (
                !Array.isArray(forecastData) ||
                forecastData.length === 0
            ) {
                setError(
                    "No forecast data was returned."
                );
                return;
            }

            setForecast(forecastData);

        } catch (error) {
            console.error(
                "Forecast Error:",
                error
            );

            setError(
                error.response?.data?.detail ||
                "Failed to generate forecast."
            );

        } finally {
            setLoading(false);
        }
    };

    /* =====================================================
       FORMAT NUMBER
    ===================================================== */

    const formatNumber = (value) => {
        const number = Number(value);

        if (!Number.isFinite(number)) {
            return "0.00";
        }

        return number.toFixed(2);
    };

    /* =====================================================
       FORMAT DATE
    ===================================================== */

    const formatDate = (date) => {
        if (!date) {
            return "-";
        }

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) {
            return "-";
        }

        return parsedDate.toLocaleDateString(
            "en-IN",
            {
                year: "numeric",
                month: "short",
                day: "numeric"
            }
        );
    };

    /* =====================================================
       MAIN UI
    ===================================================== */

    return (
        <div className="forecast-container">

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="forecast-header">

                <div className="forecast-eyebrow">
                    AI FORECASTING
                </div>

                <h1>
                    Forecast
                </h1>

                <p className="forecast-description">
                    Generate future demand predictions
                    using the Prophet forecasting model.
                </p>

            </div>


            {/* =================================================
                CONTROLS
            ================================================= */}

            <div className="forecast-controls">

                <div className="forecast-input-group">

                    <label>
                        FORECAST PERIOD
                    </label>

                    <div className="forecast-input-wrapper">

                        <input
                            type="number"
                            min="1"
                            max="365"
                            value={periods}
                            onChange={(e) =>
                                setPeriods(e.target.value)
                            }
                            disabled={loading}
                        />

                        <span>
                            months
                        </span>

                    </div>

                </div>

                <button
                    type="button"
                    onClick={handleForecast}
                    disabled={loading}
                    className="forecast-generate-button"
                >
                    {loading
                        ? "Generating..."
                        : "Generate Forecast"
                    }
                </button>

            </div>


            {/* =================================================
                ERROR
            ================================================= */}

            {error && (
                <div className="forecast-error">

                    <span className="forecast-error-icon">
                        !
                    </span>

                    <span>
                        {error}
                    </span>

                </div>
            )}


            {/* =================================================
                LOADING
            ================================================= */}

            {loading && (
                <div className="forecast-loading">

                    <span className="forecast-loading-spinner"></span>

                    <div>

                        <h2>
                            Generating forecast...
                        </h2>

                        <p>
                            Prophet is analyzing the historical
                            pricing trend. Please wait.
                        </p>

                    </div>

                </div>
            )}


            {/* =================================================
                EMPTY STATE
            ================================================= */}

            {!loading &&
                !error &&
                forecast.length === 0 && (

                    <div className="forecast-empty">

                        <div className="forecast-empty-icon">
                            ↗
                        </div>

                        <h2>
                            No Forecast Generated
                        </h2>

                        <p>
                            Select the number of months and click
                            Generate Forecast to view future predictions.
                        </p>

                    </div>
                )}


            {/* =================================================
                RESULTS
            ================================================= */}

            {forecast.length > 0 && (
                <div className="forecast-results">

                    {/* =================================================
                        RESULTS HEADER
                    ================================================= */}

                    <div className="forecast-results-header">

                        <div>

                            <h2>
                                Forecast Results
                            </h2>

                            <p>
                                AI-generated demand forecast based
                                on historical pricing trends.
                            </p>

                        </div>

                    </div>


                    {/* =================================================
                        SUMMARY
                    ================================================= */}

                    <div className="forecast-summary">

                        <div className="forecast-summary-item">

                            <span>
                                FORECAST PERIOD
                            </span>

                            <strong>
                                {forecast.length}
                            </strong>

                            <p>
                                Months
                            </p>

                        </div>


                        <div className="forecast-summary-divider"></div>


                        <div className="forecast-summary-item">

                            <span>
                                FIRST PREDICTION
                            </span>

                            <strong>
                                {formatNumber(
                                    forecast[0]?.predicted_demand
                                )}
                            </strong>

                            <p>
                                {formatDate(
                                    forecast[0]?.date
                                )}
                            </p>

                        </div>


                        <div className="forecast-summary-divider"></div>


                        <div className="forecast-summary-item">

                            <span>
                                LAST PREDICTION
                            </span>

                            <strong>
                                {formatNumber(
                                    forecast[
                                        forecast.length - 1
                                    ]?.predicted_demand
                                )}
                            </strong>

                            <p>
                                {formatDate(
                                    forecast[
                                        forecast.length - 1
                                    ]?.date
                                )}
                            </p>

                        </div>

                    </div>


                    {/* =================================================
                        CHART SECTION
                    ================================================= */}

                    <div className="forecast-chart-section">

                        <div className="forecast-section-heading">

                            <div>

                                <h3>
                                    Demand Forecast
                                </h3>

                                <p>
                                    Predicted demand with lower and
                                    upper confidence bounds.
                                </p>

                            </div>

                        </div>

                        <div className="forecast-chart">

                            <ResponsiveContainer
                                width="100%"
                                height={400}
                            >

                                <LineChart
                                    data={forecast}
                                    margin={{
                                        top: 15,
                                        right: 20,
                                        left: 10,
                                        bottom: 15
                                    }}
                                >

                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                    />

                                    <XAxis
                                        dataKey="date"
                                        tick={{
                                            fontSize: 11
                                        }}
                                    />

                                    <YAxis
                                        tick={{
                                            fontSize: 11
                                        }}
                                        label={{
                                            value: "Predicted Demand",
                                            angle: -90,
                                            position: "insideLeft",
                                            style: {
                                                fontSize: 11
                                            }
                                        }}
                                    />

                                    <Tooltip
                                        formatter={(
                                            value,
                                            name
                                        ) => [
                                            formatNumber(value),
                                            name
                                        ]}
                                    />

                                    <Legend
                                        wrapperStyle={{
                                            fontSize: "12px"
                                        }}
                                    />

                                    <Line
                                        type="monotone"
                                        dataKey="predicted_demand"
                                        name="Predicted Demand"
                                        strokeWidth={3}
                                        dot={false}
                                    />

                                    <Line
                                        type="monotone"
                                        dataKey="lower_bound"
                                        name="Lower Bound"
                                        strokeWidth={1}
                                        dot={false}
                                    />

                                    <Line
                                        type="monotone"
                                        dataKey="upper_bound"
                                        name="Upper Bound"
                                        strokeWidth={1}
                                        dot={false}
                                    />

                                </LineChart>

                            </ResponsiveContainer>

                        </div>

                    </div>


                    {/* =================================================
                        TABLE SECTION
                    ================================================= */}

                    <div className="forecast-table-section">

                        <div className="forecast-section-heading">

                            <div>

                                <h3>
                                    Forecast Details
                                </h3>

                                <p>
                                    Detailed predicted values for
                                    each forecast period.
                                </p>

                            </div>

                        </div>

                        <div className="forecast-table-wrapper">

                            <table className="forecast-table">

                                <thead>

                                    <tr>

                                        <th>
                                            DATE
                                        </th>

                                        <th>
                                            PREDICTED DEMAND
                                        </th>

                                        <th>
                                            LOWER BOUND
                                        </th>

                                        <th>
                                            UPPER BOUND
                                        </th>

                                    </tr>

                                </thead>

                                <tbody>

                                    {forecast.map(
                                        (item, index) => (

                                            <tr key={index}>

                                                <td className="forecast-date">
                                                    {formatDate(
                                                        item.date
                                                    )}
                                                </td>

                                                <td className="forecast-predicted">
                                                    {formatNumber(
                                                        item.predicted_demand
                                                    )}
                                                </td>

                                                <td className="forecast-lower">
                                                    {formatNumber(
                                                        item.lower_bound
                                                    )}
                                                </td>

                                                <td className="forecast-upper">
                                                    {formatNumber(
                                                        item.upper_bound
                                                    )}
                                                </td>

                                            </tr>

                                        )
                                    )}

                                </tbody>

                            </table>

                        </div>

                    </div>

                </div>
            )}

        </div>
    );
}

export default Forecast;