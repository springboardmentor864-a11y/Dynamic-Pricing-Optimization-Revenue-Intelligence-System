import { useEffect, useMemo, useState } from "react";
import api from "../../api/axios";
import "./Analytics.css";

function formatModelName(model) {
    const names = {
        linear_regression: "Linear Regression",
        decision_tree: "Decision Tree",
        random_forest: "Random Forest",
        xgboost: "XGBoost",
    };

    return names[model] || model || "Unknown";
}

function formatNumber(value, decimals = 2) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
        return "0.00";
    }

    return number.toFixed(decimals);
}

function formatCurrency(value) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
        return "₹0.00";
    }

    return `₹${number.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
}

function Analytics() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadAnalytics = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await api.get(
                    "/analytics/dashboard"
                );

                console.log("Analytics Data:", response.data);

                setStats(response.data);
            } catch (err) {
                console.error("Analytics Error:", err);

                setError(
                    err.response?.data?.detail ||
                    "Unable to load analytics data."
                );
            } finally {
                setLoading(false);
            }
        };

        loadAnalytics();
    }, []);

    const modelMetrics = stats?.model_metrics || {};
    const models = Object.keys(modelMetrics);

    const bestModel = stats?.best_model || "Not Available";
    const bestModelR2 = Number(stats?.best_model_r2) || 0;

    const totalRevenue = Number(stats?.total_revenue) || 0;
    const averageProductPrice =
        Number(stats?.average_product_price) || 0;

    const totalProducts = Number(stats?.total_products) || 0;
    const totalSales = Number(stats?.total_sales) || 0;
    const totalPredictions =
        Number(stats?.total_predictions) || 0;
    const totalCompetitors =
        Number(stats?.total_competitors) || 0;

    const modelAnalysis = useMemo(() => {
        if (models.length === 0) {
            return {
                best: null,
                lowestMae: null,
                lowestRmse: null,
            };
        }

        let best = null;
        let lowestMae = null;
        let lowestRmse = null;

        models.forEach((model) => {
            const metrics = modelMetrics[model] || {};

            const r2 = Number(metrics.R2) || 0;
            const mae = Number(metrics.MAE);
            const rmse = Number(metrics.RMSE);

            if (
                !best ||
                r2 > Number(best.metrics.R2 || 0)
            ) {
                best = {
                    model,
                    metrics,
                };
            }

            if (
                Number.isFinite(mae) &&
                (!lowestMae ||
                    mae <
                        Number(
                            lowestMae.metrics.MAE ||
                            Infinity
                        ))
            ) {
                lowestMae = {
                    model,
                    metrics,
                };
            }

            if (
                Number.isFinite(rmse) &&
                (!lowestRmse ||
                    rmse <
                        Number(
                            lowestRmse.metrics.RMSE ||
                            Infinity
                        ))
            ) {
                lowestRmse = {
                    model,
                    metrics,
                };
            }
        });

        return {
            best,
            lowestMae,
            lowestRmse,
        };
    }, [models, modelMetrics]);

    if (loading) {
        return (
            <div className="analytics-container">
                <div className="analytics-header">
                    <div className="analytics-eyebrow">
                        BUSINESS INTELLIGENCE
                    </div>

                    <h1>Analytics</h1>

                    <p>
                        Detailed business intelligence,
                        pricing analysis, and AI model
                        performance.
                    </p>
                </div>

                <div className="analytics-loading">
                    <span className="analytics-loading-spinner" />

                    <h2>Loading analytics...</h2>

                    <p>
                        Preparing your business
                        intelligence insights.
                    </p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="analytics-container">
                <div className="analytics-header">
                    <div className="analytics-eyebrow">
                        BUSINESS INTELLIGENCE
                    </div>

                    <h1>Analytics</h1>

                    <p>
                        Detailed business intelligence,
                        pricing analysis, and AI model
                        performance.
                    </p>
                </div>

                <div className="analytics-error">
                    <span className="analytics-error-icon">
                        !
                    </span>

                    <div>
                        <h2>
                            Unable to load analytics
                        </h2>

                        <p>{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="analytics-container">
                <div className="analytics-header">
                    <div className="analytics-eyebrow">
                        BUSINESS INTELLIGENCE
                    </div>

                    <h1>Analytics</h1>

                    <p>
                        Detailed business intelligence,
                        pricing analysis, and AI model
                        performance.
                    </p>
                </div>

                <div className="analytics-empty">
                    <div className="analytics-empty-icon">
                        ◷
                    </div>

                    <h2>No Analytics Data</h2>

                    <p>
                        There is currently no analytics
                        information available.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="analytics-container">

            {/* HEADER */}
            <div className="analytics-header">
                <div className="analytics-eyebrow">
                    BUSINESS INTELLIGENCE
                </div>

                <h1>Analytics</h1>

                <p>
                    Detailed analysis of revenue,
                    pricing intelligence, and AI
                    model performance.
                </p>
            </div>


            {/* BUSINESS PERFORMANCE */}
            <section className="analytics-section">

                <div className="analytics-section-heading">
                    <div>
                        <div className="section-eyebrow">
                            BUSINESS PERFORMANCE
                        </div>

                        <h2>
                            Revenue & Sales Analysis
                        </h2>

                        <p>
                            Analyze the financial activity
                            behind your pricing system.
                        </p>
                    </div>
                </div>

                <div className="analysis-grid">

                    <div className="analysis-card">
                        <span className="analysis-label">
                            TOTAL REVENUE
                        </span>

                        <strong className="analysis-value">
                            {formatCurrency(totalRevenue)}
                        </strong>

                        <p>
                            Revenue generated from
                            recorded sales.
                        </p>
                    </div>


                    <div className="analysis-card">
                        <span className="analysis-label">
                            TOTAL SALES
                        </span>

                        <strong className="analysis-value">
                            {totalSales}
                        </strong>

                        <p>
                            Recorded sales transactions.
                        </p>
                    </div>


                    <div className="analysis-card">
                        <span className="analysis-label">
                            AVERAGE PRICE
                        </span>

                        <strong className="analysis-value">
                            {formatCurrency(
                                averageProductPrice
                            )}
                        </strong>

                        <p>
                            Average price across products.
                        </p>
                    </div>


                    <div className="analysis-card">
                        <span className="analysis-label">
                            REVENUE PER SALE
                        </span>

                        <strong className="analysis-value">
                            {formatCurrency(
                                totalSales > 0
                                    ? totalRevenue /
                                          totalSales
                                    : 0
                            )}
                        </strong>

                        <p>
                            Average revenue per transaction.
                        </p>
                    </div>

                </div>
            </section>


            {/* PRICING INTELLIGENCE */}
            <section className="analytics-section">

                <div className="analytics-section-heading">
                    <div>
                        <div className="section-eyebrow">
                            PRICING INTELLIGENCE
                        </div>

                        <h2>
                            Pricing Dataset Coverage
                        </h2>

                        <p>
                            Measure how much pricing
                            intelligence is available.
                        </p>
                    </div>
                </div>

                <div className="pricing-analysis">

                    <div className="pricing-analysis-main">
                        <span>
                            PRODUCTS UNDER ANALYSIS
                        </span>

                        <strong>
                            {totalProducts}
                        </strong>

                        <p>
                            Products currently tracked
                            by PRICEPILOT AI.
                        </p>
                    </div>


                    <div className="pricing-analysis-item">
                        <span>
                            COMPETITOR RECORDS
                        </span>

                        <strong>
                            {totalCompetitors}
                        </strong>

                        <p>
                            Competitor pricing records
                            available for analysis.
                        </p>
                    </div>


                    <div className="pricing-analysis-item">
                        <span>
                            AI PREDICTIONS
                        </span>

                        <strong>
                            {totalPredictions}
                        </strong>

                        <p>
                            Historical AI predictions
                            generated by the system.
                        </p>
                    </div>

                </div>
            </section>


            {/* AI PERFORMANCE */}
            <section className="analytics-section">

                <div className="analytics-section-heading">
                    <div>
                        <div className="section-eyebrow">
                            AI PERFORMANCE
                        </div>

                        <h2>
                            Best Performing Model
                        </h2>

                        <p>
                            Identify the model with the
                            strongest predictive performance.
                        </p>
                    </div>
                </div>

                <div className="best-model">

                    <div className="best-model-left">
                        <span>
                            RECOMMENDED MODEL
                        </span>

                        <h2>
                            {formatModelName(bestModel)}
                        </h2>

                        <p>
                            Highest R² score among the
                            available trained models.
                        </p>
                    </div>

                    <div className="best-model-score">
                        <span>R² SCORE</span>

                        <strong>
                            {formatNumber(
                                bestModelR2,
                                4
                            )}
                        </strong>
                    </div>

                </div>
            </section>


            {/* MODEL COMPARISON */}
            <section className="analytics-section model-section">

                <div className="analytics-section-heading">
                    <div>
                        <div className="section-eyebrow">
                            MACHINE LEARNING
                        </div>

                        <h2>
                            Model Comparison
                        </h2>

                        <p>
                            Compare R², MAE, and RMSE across
                            all trained prediction models.
                        </p>
                    </div>
                </div>


                <div className="performance-list">

                    {models.length === 0 ? (
                        <div className="no-model-data">
                            No model performance data
                            available.
                        </div>
                    ) : (
                        models.map((model) => {
                            const metrics =
                                modelMetrics[model] || {};

                            const r2 =
                                Number(metrics.R2) || 0;

                            const percentage = Math.max(
                                0,
                                Math.min(100, r2 * 100)
                            );

                            return (
                                <div
                                    className="model-performance-row"
                                    key={model}
                                >
                                    <div className="model-performance-header">
                                        <span>
                                            {formatModelName(
                                                model
                                            )}
                                        </span>

                                        <strong>
                                            {formatNumber(
                                                r2,
                                                4
                                            )}
                                        </strong>
                                    </div>

                                    <div className="model-performance-track">
                                        <div
                                            className="model-performance-fill"
                                            style={{
                                                width: `${percentage}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>


                <div className="model-table-heading">
                    <h3>
                        Detailed Model Comparison
                    </h3>

                    <p>
                        Error and accuracy metrics for
                        every trained model.
                    </p>
                </div>


                <div className="model-table-wrapper">

                    {models.length === 0 ? (
                        <div className="no-model-data">
                            No model comparison data
                            available.
                        </div>
                    ) : (
                        <table className="model-table">

                            <thead>
                                <tr>
                                    <th>MODEL</th>
                                    <th>MAE</th>
                                    <th>RMSE</th>
                                    <th>R² SCORE</th>
                                </tr>
                            </thead>

                            <tbody>
                                {models.map((model) => {
                                    const metrics =
                                        modelMetrics[model] ||
                                        {};

                                    const isBest =
                                        model === bestModel;

                                    return (
                                        <tr key={model}>

                                            <td className="model-name">
                                                {formatModelName(
                                                    model
                                                )}

                                                {isBest && (
                                                    <span className="best-tag">
                                                        BEST
                                                    </span>
                                                )}
                                            </td>

                                            <td>
                                                {formatNumber(
                                                    metrics.MAE,
                                                    4
                                                )}
                                            </td>

                                            <td>
                                                {formatNumber(
                                                    metrics.RMSE,
                                                    4
                                                )}
                                            </td>

                                            <td className="r2-score">
                                                {formatNumber(
                                                    metrics.R2,
                                                    4
                                                )}
                                            </td>

                                        </tr>
                                    );
                                })}
                            </tbody>

                        </table>
                    )}

                </div>
            </section>


            {/* INSIGHTS */}
            <section className="analytics-section insights-section">

                <div className="analytics-section-heading">
                    <div>
                        <div className="section-eyebrow">
                            AI INSIGHTS
                        </div>

                        <h2>
                            Key Business Findings
                        </h2>

                        <p>
                            Important observations derived
                            from your current analytics data.
                        </p>
                    </div>
                </div>


                <div className="insights-grid">

                    <div className="insight-item">
                        <div className="insight-number">
                            01
                        </div>

                        <div>
                            <h3>
                                Best Overall Model
                            </h3>

                            <p>
                                {formatModelName(
                                    modelAnalysis.best?.model ||
                                        bestModel
                                )}{" "}
                                currently provides the
                                strongest R² score of{" "}
                                <strong>
                                    {formatNumber(
                                        bestModelR2,
                                        4
                                    )}
                                </strong>.
                            </p>
                        </div>
                    </div>


                    <div className="insight-item">
                        <div className="insight-number">
                            02
                        </div>

                        <div>
                            <h3>
                                Lowest MAE
                            </h3>

                            <p>
                                {modelAnalysis.lowestMae
                                    ? formatModelName(
                                          modelAnalysis
                                              .lowestMae
                                              .model
                                      )
                                    : "No model data"}{" "}
                                has the lowest mean
                                absolute error.
                            </p>
                        </div>
                    </div>


                    <div className="insight-item">
                        <div className="insight-number">
                            03
                        </div>

                        <div>
                            <h3>
                                Lowest RMSE
                            </h3>

                            <p>
                                {modelAnalysis.lowestRmse
                                    ? formatModelName(
                                          modelAnalysis
                                              .lowestRmse
                                              .model
                                      )
                                    : "No model data"}{" "}
                                has the lowest root
                                mean squared error.
                            </p>
                        </div>
                    </div>


                    <div className="insight-item">
                        <div className="insight-number">
                            04
                        </div>

                        <div>
                            <h3>
                                Pricing Coverage
                            </h3>

                            <p>
                                The system currently tracks{" "}
                                <strong>
                                    {totalProducts}
                                </strong>{" "}
                                products,{" "}
                                <strong>
                                    {totalCompetitors}
                                </strong>{" "}
                                competitor records, and{" "}
                                <strong>
                                    {totalPredictions}
                                </strong>{" "}
                                AI predictions.
                            </p>
                        </div>
                    </div>

                </div>
            </section>


            {/* BUSINESS INTERPRETATION */}
            <section className="analytics-summary">

                <div className="section-eyebrow">
                    BUSINESS INTERPRETATION
                </div>

                <h2>
                    Analytics Summary
                </h2>

                <p>
                    The system has recorded{" "}
                    <strong>
                        {totalSales}
                    </strong>{" "}
                    sales generating{" "}
                    <strong>
                        {formatCurrency(totalRevenue)}
                    </strong>{" "}
                    in revenue.
                </p>

                <p>
                    The current average product price
                    is{" "}
                    <strong>
                        {formatCurrency(
                            averageProductPrice
                        )}
                    </strong>.
                </p>

                <p>
                    The strongest model is{" "}
                    <strong>
                        {formatModelName(bestModel)}
                    </strong>{" "}
                    with an R² score of{" "}
                    <strong>
                        {formatNumber(
                            bestModelR2,
                            4
                        )}
                    </strong>.
                </p>

                <p>
                    These analytics can be combined
                    with the Pricing and Forecast modules
                    to support data-driven pricing decisions.
                </p>

            </section>

        </div>
    );
}

export default Analytics;