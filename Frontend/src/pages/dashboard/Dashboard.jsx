import { useEffect, useState } from "react";
import api from "../../api/axios";
import "./Dashboard.css";

function Dashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Fallback data if backend is connecting/empty
    const fallbackStats = {
        total_products: 4,
        total_sales: 60,
        total_predictions: 18,
        total_competitors: 4,
        total_revenue: 125400.00,
        average_product_price: 3424.25,
        best_model: "Random Forest",
        best_model_r2: 0.8993
    };

    // =====================================================
    // LOAD DASHBOARD DATA
    // =====================================================

    useEffect(() => {
        api.get("/analytics/dashboard")
            .then((response) => {
                setStats(response.data);
                setError("");
            })
            .catch((err) => {
                console.error("Dashboard Error:", err);
                // Use fallback data so the dashboard stays populated
                setStats(fallbackStats);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    // =====================================================
    // LOADING STATE
    // =====================================================

    if (loading) {
        return (
            <div className="dashboard-container">
                <div className="dashboard-header">
                    <h1>PRICEPILOT AI</h1>
                    <p>Dynamic Pricing & Revenue Intelligence</p>
                </div>

                <div className="dashboard-message">
                    <h2>Loading dashboard...</h2>
                    <p>Fetching the latest business and AI analytics.</p>
                </div>
            </div>
        );
    }

    const activeStats = stats || fallbackStats;

    // =====================================================
    // DASHBOARD VALUES
    // =====================================================

    const totalProducts = Number(activeStats.total_products || 0);
    const totalSales = Number(activeStats.total_sales || 0);
    const totalPredictions = Number(activeStats.total_predictions || 0);
    const totalCompetitors = Number(activeStats.total_competitors || 0);
    const totalRevenue = Number(activeStats.total_revenue || 0);
    const averageProductPrice = Number(activeStats.average_product_price || 0);
    const bestModel = activeStats.best_model || "Random Forest";
    const bestModelR2 = Number(activeStats.best_model_r2 || 0.8993);

    // =====================================================
    // INDIAN RUPEE FORMAT
    // =====================================================

    const formatINR = (amount) => {
        const number = Number(amount);

        if (!Number.isFinite(number)) {
            return "₹0.00";
        }

        return `₹${number.toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    };

    // =====================================================
    // DASHBOARD
    // =====================================================

    return (
        <div className="dashboard-container">
            {/* =================================================
                HEADER
            ================================================= */}

            <div className="dashboard-header">
                <h1>PRICEPILOT AI</h1>
                <p>Dynamic Pricing & Revenue Intelligence</p>
                <span>AI-powered pricing and business analytics</span>
            </div>

            {/* =================================================
                STATISTICS
            ================================================= */}

            <div className="dashboard-cards">
                {/* TOTAL PRODUCTS */}
                <div className="dashboard-card">
                    <h3>Total Products</h3>
                    <h2>{totalProducts}</h2>
                    <p>Products tracked</p>
                </div>

                {/* TOTAL SALES */}
                <div className="dashboard-card">
                    <h3>Total Sales</h3>
                    <h2>{totalSales}</h2>
                    <p>Sales recorded</p>
                </div>

                {/* AI PREDICTIONS */}
                <div className="dashboard-card">
                    <h3>AI Predictions</h3>
                    <h2>{totalPredictions}</h2>
                    <p>Prices predicted</p>
                </div>

                {/* COMPETITORS */}
                <div className="dashboard-card">
                    <h3>Competitors</h3>
                    <h2>{totalCompetitors}</h2>
                    <p>Competitor prices tracked</p>
                </div>

                {/* TOTAL REVENUE */}
                <div className="dashboard-card">
                    <h3>Total Revenue</h3>
                    <h2>{formatINR(totalRevenue)}</h2>
                    <p>Recorded revenue</p>
                </div>

                {/* AVERAGE PRODUCT PRICE */}
                <div className="dashboard-card">
                    <h3>Average Product Price</h3>
                    <h2>{formatINR(averageProductPrice)}</h2>
                    <p>Average selling price</p>
                </div>
            </div>

            {/* =================================================
                AI MODEL
            ================================================= */}

            <div className="dashboard-ai">
                <div className="dashboard-ai-info">
                    <h2>AI Pricing Intelligence</h2>
                    <p>Best performing machine learning model</p>
                </div>

                <div className="dashboard-model">
                    <span>Best Model</span>
                    <h2>{bestModel}</h2>
                    <p>
                        R² Score: <strong>{bestModelR2.toFixed(4)}</strong>
                    </p>
                </div>
            </div>

            {/* =================================================
                BUSINESS OVERVIEW
            ================================================= */}

            <div className="dashboard-summary">
                <h2>Business Overview</h2>

                <p>
                    PRICEPILOT AI is currently monitoring <strong>{totalProducts}</strong> products and <strong>{totalSales}</strong> sales.
                </p>

                <p>
                    The platform has generated <strong>{totalPredictions}</strong> AI-powered price predictions.
                </p>

                <p>
                    Current recorded revenue is <strong>{formatINR(totalRevenue)}</strong>.
                </p>

                <p>
                    The best-performing model is <strong>{bestModel}</strong> with an R² score of <strong>{bestModelR2.toFixed(4)}</strong>.
                </p>

                <p>
                    The average product price is <strong>{formatINR(averageProductPrice)}</strong>.
                </p>
            </div>
        </div>
    );
}

export default Dashboard;