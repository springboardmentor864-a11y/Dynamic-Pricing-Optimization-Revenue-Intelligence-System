/* =========================================================
   PREDICTION HISTORY
========================================================= */

import { useEffect, useState } from "react";
import api from "../../api/axios";
import "./PredictionHistory.css";

function PredictionHistory() {
    const [predictions, setPredictions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        api.get("/predictions/")
            .then((response) => {
                console.log(
                    "Prediction History:",
                    response.data
                );

                setPredictions(
                    Array.isArray(response.data)
                        ? response.data
                        : []
                );
            })
            .catch((error) => {
                console.error(
                    "Prediction History Error:",
                    error
                );

                setError(
                    "Unable to load prediction history."
                );
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);


    /* =====================================================
       LOADING
    ===================================================== */

    if (loading) {
        return (
            <div className="prediction-history-container">

                <div className="prediction-history-header">

                    <div className="prediction-history-eyebrow">
                        AI ACTIVITY
                    </div>

                    <h1>
                        Prediction History
                    </h1>

                    <p>
                        View all AI-generated product price predictions.
                    </p>

                </div>

                <div className="prediction-history-loading">

                    <span className="history-loading-spinner"></span>

                    <span>
                        Loading prediction history...
                    </span>

                </div>

            </div>
        );
    }


    /* =====================================================
       ERROR
    ===================================================== */

    if (error) {
        return (
            <div className="prediction-history-container">

                <div className="prediction-history-header">

                    <div className="prediction-history-eyebrow">
                        AI ACTIVITY
                    </div>

                    <h1>
                        Prediction History
                    </h1>

                    <p>
                        View all AI-generated product price predictions.
                    </p>

                </div>

                <div className="prediction-history-error">

                    <span className="history-error-icon">
                        !
                    </span>

                    <span>
                        {error}
                    </span>

                </div>

            </div>
        );
    }


    /* =====================================================
       MAIN PAGE
    ===================================================== */

    return (
        <div className="prediction-history-container">

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="prediction-history-header">

                <div className="prediction-history-eyebrow">
                    AI ACTIVITY
                </div>

                <h1>
                    Prediction History
                </h1>

                <p>
                    View all AI-generated product price predictions.
                </p>

            </div>


            {/* =================================================
                SUMMARY
            ================================================= */}

            <div className="prediction-history-summary">

                <div className="history-summary-item">

                    <span>
                        TOTAL PREDICTIONS
                    </span>

                    <strong>
                        {predictions.length}
                    </strong>

                </div>

                <div className="history-summary-divider"></div>

                <div className="history-summary-item">

                    <span>
                        LATEST MODEL
                    </span>

                    <strong className="history-model-value">
                        {predictions.length > 0
                            ? predictions[0].model_name || "—"
                            : "—"}
                    </strong>

                </div>

            </div>


            {/* =================================================
                HISTORY SECTION
            ================================================= */}

            <div className="prediction-history-section">

                <div className="prediction-history-section-header">

                    <div>
                        <h2>
                            Recent Predictions
                        </h2>

                        <p>
                            Your previously generated AI price predictions.
                        </p>
                    </div>

                </div>


                {/* =================================================
                    TABLE
                ================================================= */}

                <div className="prediction-history-card">

                    {predictions.length === 0 ? (

                        <div className="prediction-empty">

                            <div className="prediction-empty-icon">
                                ◷
                            </div>

                            <h3>
                                No Prediction History
                            </h3>

                            <p>
                                Generate a price prediction to see
                                your prediction history here.
                            </p>

                        </div>

                    ) : (

                        <div className="prediction-history-table-wrapper">

                            <table className="prediction-history-table">

                                <thead>

                                    <tr>

                                        <th>
                                            ID
                                        </th>

                                        <th>
                                            MODEL
                                        </th>

                                        <th>
                                            PREDICTED PRICE
                                        </th>

                                        <th>
                                            DATE
                                        </th>

                                    </tr>

                                </thead>

                                <tbody>

                                    {predictions.map((item) => (

                                        <tr key={item.id}>

                                            <td className="prediction-id">
                                                #{item.id}
                                            </td>

                                            <td className="prediction-model">

                                                <span className="model-badge">
                                                    {item.model_name || "Unknown"}
                                                </span>

                                            </td>

                                            <td className="prediction-price">

                                                ₹{" "}
                                                {Number(
                                                    item.predicted_price || 0
                                                ).toFixed(2)}

                                            </td>

                                            <td className="prediction-date">

                                                {item.created_at
                                                    ? new Date(
                                                        item.created_at
                                                    ).toLocaleString("en-IN")
                                                    : "—"}

                                            </td>

                                        </tr>

                                    ))}

                                </tbody>

                            </table>

                        </div>

                    )}

                </div>

            </div>

        </div>
    );
}

export default PredictionHistory;
