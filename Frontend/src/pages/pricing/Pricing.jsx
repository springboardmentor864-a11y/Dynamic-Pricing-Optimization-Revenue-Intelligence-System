import { useEffect, useMemo, useState } from "react";
import api from "../../api/axios";
import "./Pricing.css";

function Pricing() {
    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState("");
    const [recommendation, setRecommendation] = useState(null);

    const [proposedPrice, setProposedPrice] = useState("");
    const [simulation, setSimulation] = useState(null);

    const [loadingProducts, setLoadingProducts] = useState(true);
    const [loadingRecommendation, setLoadingRecommendation] =
        useState(false);
    const [loadingSimulation, setLoadingSimulation] =
        useState(false);

    const [error, setError] = useState("");

    /* =====================================================
       LOAD PRODUCTS
    ===================================================== */

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        try {
            setLoadingProducts(true);
            setError("");

            const response = await api.get("/products/");

            setProducts(
                Array.isArray(response.data)
                    ? response.data
                    : []
            );
        } catch (error) {
            console.error("Products Error:", error);

            setError(
                error.response?.data?.detail ||
                "Failed to load products."
            );
        } finally {
            setLoadingProducts(false);
        }
    };

    /* =====================================================
       PRODUCT CHANGE
    ===================================================== */

    const handleProductChange = async (e) => {
        const productId = e.target.value;

        setSelectedProduct(productId);
        setRecommendation(null);
        setSimulation(null);
        setProposedPrice("");
        setError("");

        if (!productId) {
            return;
        }

        try {
            setLoadingRecommendation(true);

            const response = await api.get(
                `/pricing/${productId}`
            );

            const data =
                response.data?.data || null;

            setRecommendation(data);

            if (
                data?.recommended_price !== null &&
                data?.recommended_price !== undefined
            ) {
                setProposedPrice(
                    Number(data.recommended_price).toFixed(2)
                );
            }
        } catch (error) {
            console.error(
                "Pricing Recommendation Error:",
                error
            );

            setError(
                error.response?.data?.detail ||
                "Failed to generate pricing recommendation."
            );
        } finally {
            setLoadingRecommendation(false);
        }
    };

    /* =====================================================
       FORMAT PRICE
    ===================================================== */

    const formatPrice = (price) => {
        if (
            price === null ||
            price === undefined ||
            price === ""
        ) {
            return "-";
        }

        const number = Number(price);

        if (!Number.isFinite(number)) {
            return "-";
        }

        return number.toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    /* =====================================================
       FORMAT NUMBER
    ===================================================== */

    const formatNumber = (value) => {
        if (
            value === null ||
            value === undefined ||
            value === ""
        ) {
            return "-";
        }

        const number = Number(value);

        if (!Number.isFinite(number)) {
            return "-";
        }

        return number.toLocaleString("en-IN", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        });
    };

    /* =====================================================
       FORMAT PERCENTAGE
    ===================================================== */

    const formatPercent = (value) => {
        if (
            value === null ||
            value === undefined ||
            value === ""
        ) {
            return "-";
        }

        const number = Number(value);

        if (!Number.isFinite(number)) {
            return "-";
        }

        const sign = number > 0 ? "+" : "";

        return `${sign}${number.toFixed(2)}%`;
    };

    /* =====================================================
       PRICE DIRECTION
    ===================================================== */

    const getPriceDirection = () => {
        if (!recommendation) {
            return "neutral";
        }

        const current =
            Number(recommendation.current_price);

        const recommended =
            Number(recommendation.recommended_price);

        if (recommended > current) {
            return "increase";
        }

        if (recommended < current) {
            return "decrease";
        }

        return "neutral";
    };

    /* =====================================================
       RECOMMENDATION MESSAGE
    ===================================================== */

    const getRecommendationMessage = () => {
        if (!recommendation) {
            return "";
        }

        const current =
            Number(recommendation.current_price);

        const recommended =
            Number(recommendation.recommended_price);

        if (recommended > current) {
            return "The AI pricing engine identifies an opportunity to increase the product price based on observed competitor pricing.";
        }

        if (recommended < current) {
            return "The AI pricing engine suggests a lower price to improve market competitiveness.";
        }

        return "The current price is closely aligned with the available competitor pricing.";
    };

    /* =====================================================
       SIMULATION
    ===================================================== */

    const handleSimulation = async () => {
        setError("");
        setSimulation(null);

        if (!selectedProduct) {
            setError("Please select a product first.");
            return;
        }

        const price = Number(proposedPrice);

        if (
            !Number.isFinite(price) ||
            price <= 0
        ) {
            setError(
                "Please enter a valid proposed price greater than zero."
            );
            return;
        }

        try {
            setLoadingSimulation(true);

            const response = await api.post(
                "/pricing/simulate",
                {
                    product_id: Number(selectedProduct),
                    proposed_price: price,
                }
            );

            setSimulation(
                response.data?.data || null
            );
        } catch (error) {
            console.error(
                "Pricing Simulation Error:",
                error
            );

            setError(
                error.response?.data?.detail ||
                "Failed to run pricing simulation."
            );
        } finally {
            setLoadingSimulation(false);
        }
    };

    /* =====================================================
       QUICK SCENARIOS
    ===================================================== */

    const setScenario = (type) => {
        if (!recommendation) {
            return;
        }

        const current =
            Number(recommendation.current_price);

        const recommended =
            Number(recommendation.recommended_price);

        let value = current;

        if (type === "current") {
            value = current;
        }

        if (type === "recommended") {
            value = recommended;
        }

        if (type === "plus5") {
            value = current * 1.05;
        }

        if (type === "plus10") {
            value = current * 1.10;
        }

        if (type === "minus5") {
            value = current * 0.95;
        }

        setProposedPrice(value.toFixed(2));
        setSimulation(null);
        setError("");
    };

    /* =====================================================
       MARKET POSITION
    ===================================================== */

    const marketPosition = useMemo(() => {
        if (!simulation) {
            return null;
        }

        return simulation.market_position || "Unavailable";
    }, [simulation]);

    /* =====================================================
       SIMULATION STATUS
    ===================================================== */

    const getSimulationStatusClass = () => {
        if (!simulation) {
            return "";
        }

        const value =
            Number(
                simulation.revenue_change_percent
            );

        if (value > 0) {
            return "positive";
        }

        if (value < 0) {
            return "negative";
        }

        return "neutral";
    };

    const getSimulationStatusText = () => {
        if (!simulation) {
            return "";
        }

        if (simulation.scenario_status) {
            return simulation.scenario_status;
        }

        const value =
            Number(
                simulation.revenue_change_percent
            );

        if (value > 0) {
            return "Potential Revenue Improvement";
        }

        if (value < 0) {
            return "Potential Revenue Decline";
        }

        return "Revenue Approximately Unchanged";
    };

    /* =====================================================
       REVENUE BAR WIDTH
    ===================================================== */

    const getRevenueBarWidth = () => {
        if (!simulation) {
            return 50;
        }

        const current =
            Number(
                simulation.current_estimated_revenue
            );

        const proposed =
            Number(
                simulation.estimated_revenue
            );

        if (
            !Number.isFinite(current) ||
            !Number.isFinite(proposed) ||
            current <= 0
        ) {
            return 50;
        }

        const ratio =
            (proposed / current) * 50;

        return Math.max(
            8,
            Math.min(ratio, 92)
        );
    };

    /* =====================================================
       EMPTY STATE
    ===================================================== */

    if (
        !loadingProducts &&
        !selectedProduct
    ) {
        return (
            <div className="pricing-container">

                <div className="pricing-header">

                    <div className="pricing-eyebrow">
                        AI PRICING ENGINE
                    </div>

                    <h1>
                        AI Pricing & Revenue Optimization
                    </h1>

                    <p>
                        Analyze market prices, evaluate
                        pricing scenarios, and identify
                        potential revenue opportunities.
                    </p>

                </div>

                {error && (
                    <div className="pricing-error">

                        <span className="pricing-error-icon">
                            !
                        </span>

                        <span>
                            {error}
                        </span>

                        <button
                            type="button"
                            onClick={() => setError("")}
                        >
                            ×
                        </button>

                    </div>
                )}

                <div className="pricing-selector">

                    <div className="pricing-selector-header">

                        <div>

                            <h2>
                                Select Product
                            </h2>

                            <p>
                                Choose a product to analyze
                                its market position and
                                pricing opportunity.
                            </p>

                        </div>

                    </div>

                    <label htmlFor="pricing-product">
                        PRODUCT
                    </label>

                    <select
                        id="pricing-product"
                        value={selectedProduct}
                        onChange={handleProductChange}
                        disabled={loadingProducts}
                    >

                        <option value="">
                            {loadingProducts
                                ? "Loading products..."
                                : "Select Product"}
                        </option>

                        {products.map((product) => (
                            <option
                                key={product.id}
                                value={product.id}
                            >
                                {product.product_name}
                            </option>
                        ))}

                    </select>

                </div>

                <div className="pricing-empty">

                    <div className="pricing-empty-icon">
                        ₹
                    </div>

                    <h3>
                        Start a Pricing Analysis
                    </h3>

                    <p>
                        Select a product to compare market
                        prices, generate an AI recommendation,
                        and simulate revenue scenarios.
                    </p>

                </div>

            </div>
        );
    }

    /* =====================================================
       MAIN UI
    ===================================================== */

    return (
        <div className="pricing-container">

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="pricing-header">

                <div className="pricing-eyebrow">
                    AI PRICING ENGINE
                </div>

                <h1>
                    AI Pricing & Revenue Optimization
                </h1>

                <p>
                    Analyze market prices, evaluate pricing
                    scenarios, and identify potential revenue
                    opportunities.
                </p>

            </div>

            {/* =================================================
                ERROR
            ================================================= */}

            {error && (
                <div className="pricing-error">

                    <span className="pricing-error-icon">
                        !
                    </span>

                    <span>
                        {error}
                    </span>

                    <button
                        type="button"
                        onClick={() => setError("")}
                    >
                        ×
                    </button>

                </div>
            )}

            {/* =================================================
                PRODUCT SELECTOR
            ================================================= */}

            <div className="pricing-selector">

                <div className="pricing-selector-header">

                    <div>

                        <h2>
                            Select Product
                        </h2>

                        <p>
                            Choose a product to analyze its
                            market position and pricing opportunity.
                        </p>

                    </div>

                </div>

                <label htmlFor="pricing-product">
                    PRODUCT
                </label>

                <select
                    id="pricing-product"
                    value={selectedProduct}
                    onChange={handleProductChange}
                    disabled={
                        loadingRecommendation ||
                        loadingSimulation
                    }
                >

                    <option value="">
                        Select Product
                    </option>

                    {products.map((product) => (
                        <option
                            key={product.id}
                            value={product.id}
                        >
                            {product.product_name}
                        </option>
                    ))}

                </select>

            </div>

            {/* =================================================
                LOADING
            ================================================= */}

            {loadingRecommendation && (
                <div className="pricing-loading">

                    <span className="pricing-loading-spinner"></span>

                    <span>
                        Analyzing market pricing data...
                    </span>

                </div>
            )}

            {/* =================================================
                RESULTS
            ================================================= */}

            {recommendation &&
                !loadingRecommendation && (

                    <div className="pricing-results">

                        {/* =================================================
                            PRODUCT HEADER
                        ================================================= */}

                        <div className="pricing-product">

                            <div>

                                <div className="pricing-result-eyebrow">
                                    PRICING ANALYSIS
                                </div>

                                <h2>
                                    {recommendation.product_name}
                                </h2>

                                <p>
                                    Product ID:{" "}
                                    <strong>
                                        {recommendation.product_id}
                                    </strong>
                                </p>

                            </div>

                        </div>

                        {/* =================================================
                            MARKET PRICE CARDS
                        ================================================= */}

                        <div className="pricing-cards">

                            <div className="pricing-card">

                                <span>
                                    CURRENT PRICE
                                </span>

                                <strong>
                                    ₹ {formatPrice(
                                        recommendation.current_price
                                    )}
                                </strong>

                            </div>

                            <div className="pricing-card">

                                <span>
                                    AVERAGE COMPETITOR
                                </span>

                                <strong>
                                    {recommendation.average_competitor_price === null
                                        ? "-"
                                        : `₹ ${formatPrice(
                                            recommendation.average_competitor_price
                                        )}`}
                                </strong>

                            </div>

                            <div className="pricing-card">

                                <span>
                                    LOWEST COMPETITOR
                                </span>

                                <strong>
                                    {recommendation.lowest_competitor_price === null
                                        ? "-"
                                        : `₹ ${formatPrice(
                                            recommendation.lowest_competitor_price
                                        )}`}
                                </strong>

                            </div>

                            <div className="pricing-card">

                                <span>
                                    HIGHEST COMPETITOR
                                </span>

                                <strong>
                                    {recommendation.highest_competitor_price === null
                                        ? "-"
                                        : `₹ ${formatPrice(
                                            recommendation.highest_competitor_price
                                        )}`}
                                </strong>

                            </div>

                        </div>

                        {/* =================================================
                            AI RECOMMENDATION
                        ================================================= */}

                        <div
                            className={`recommendation-card ${getPriceDirection()}`}
                        >

                            <div className="recommendation-content">

                                <div>

                                    <div className="recommendation-eyebrow">
                                        AI RECOMMENDATION
                                    </div>

                                    <p>
                                        Recommended Market Price
                                    </p>

                                </div>

                                <h2>
                                    ₹ {formatPrice(
                                        recommendation.recommended_price
                                    )}
                                </h2>

                            </div>

                            <span className="recommendation-message">
                                {getRecommendationMessage()}
                            </span>

                            <button
                                type="button"
                                className="recommendation-use-button"
                                onClick={() => {
                                    setProposedPrice(
                                        Number(
                                            recommendation.recommended_price
                                        ).toFixed(2)
                                    );

                                    setSimulation(null);
                                    setError("");
                                }}
                            >
                                Use AI Recommendation
                            </button>

                        </div>

                        {/* =================================================
                            MARKET SUMMARY
                        ================================================= */}

                        <div className="competitor-summary">

                            <div>

                                <div className="competitor-summary-eyebrow">
                                    MARKET ANALYSIS
                                </div>

                                <h3>
                                    Competitive Landscape
                                </h3>

                                <p>
                                    {recommendation.competitor_count} competitor
                                    price{recommendation.competitor_count === 1 ? "" : "s"} analyzed
                                </p>

                            </div>

                            <strong>
                                {recommendation.competitor_count}
                            </strong>

                        </div>

                        {/* =================================================
                            SCENARIO LAB
                        ================================================= */}

                        <div className="scenario-lab">

                            <div className="scenario-lab-header">

                                <div>

                                    <div className="scenario-eyebrow">
                                        WHAT-IF ANALYSIS
                                    </div>

                                    <h2>
                                        Pricing Scenario Lab
                                    </h2>

                                    <p>
                                        Test a pricing decision before
                                        applying it to your product.
                                    </p>

                                </div>

                                <div className="scenario-badge">
                                    DECISION SUPPORT
                                </div>

                            </div>

                            {/* =================================================
                                SCENARIO CONTROLS
                            ================================================= */}

                            <div className="scenario-controls">

                                <div className="scenario-input-section">

                                    <label htmlFor="proposed-price">
                                        PROPOSED PRICE
                                    </label>

                                    <div className="scenario-input-wrapper">

                                        <span>
                                            ₹
                                        </span>

                                        <input
                                            id="proposed-price"
                                            type="number"
                                            min="0.01"
                                            step="0.01"
                                            value={proposedPrice}
                                            onChange={(e) => {
                                                setProposedPrice(
                                                    e.target.value
                                                );
                                                setSimulation(null);
                                            }}
                                            placeholder="Enter price"
                                            disabled={
                                                loadingSimulation
                                            }
                                        />

                                    </div>

                                </div>

                                <button
                                    type="button"
                                    className="scenario-run-button"
                                    onClick={handleSimulation}
                                    disabled={
                                        loadingSimulation ||
                                        !proposedPrice
                                    }
                                >

                                    {loadingSimulation ? (
                                        <>
                                            <span className="pricing-button-spinner"></span>
                                            Analyzing Scenario...
                                        </>
                                    ) : (
                                        "Run Scenario Analysis"
                                    )}

                                </button>

                            </div>

                            {/* =================================================
                                QUICK SCENARIOS
                            ================================================= */}

                            <div className="quick-scenarios">

                                <span>
                                    QUICK SCENARIOS
                                </span>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setScenario("current")
                                    }
                                >
                                    Current Price
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setScenario("recommended")
                                    }
                                >
                                    AI Recommended
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setScenario("plus5")
                                    }
                                >
                                    +5%
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setScenario("plus10")
                                    }
                                >
                                    +10%
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setScenario("minus5")
                                    }
                                >
                                    -5%
                                </button>

                            </div>

                            {/* =================================================
                                CURRENT VS PROPOSED
                            ================================================= */}

                            <div className="scenario-comparison">

                                <div className="scenario-price-box current">

                                    <span>
                                        CURRENT SCENARIO
                                    </span>

                                    <strong>
                                        ₹ {formatPrice(
                                            recommendation.current_price
                                        )}
                                    </strong>

                                    <small>
                                        Existing price
                                    </small>

                                </div>

                                <div className="scenario-arrow">
                                    →
                                </div>

                                <div className="scenario-price-box proposed">

                                    <span>
                                        PROPOSED SCENARIO
                                    </span>

                                    <strong>
                                        ₹ {formatPrice(
                                            proposedPrice
                                        )}
                                    </strong>

                                    <small>
                                        Price under evaluation
                                    </small>

                                </div>

                                <div className="scenario-change">

                                    <span>
                                        PRICE CHANGE
                                    </span>

                                    <strong>
                                        {recommendation.current_price &&
                                        proposedPrice
                                            ? formatPercent(
                                                (
                                                    (
                                                        Number(proposedPrice) -
                                                        Number(
                                                            recommendation.current_price
                                                        )
                                                    ) /
                                                    Number(
                                                        recommendation.current_price
                                                    )
                                                ) * 100
                                            )
                                            : "-"}
                                    </strong>

                                </div>

                            </div>

                            {/* =================================================
                                SIMULATION RESULTS
                            ================================================= */}

                            {simulation && (

                                <div className="scenario-results">

                                    <div className="scenario-results-heading">

                                        <div>

                                            <div className="scenario-eyebrow">
                                                SIMULATION RESULT
                                            </div>

                                            <h3>
                                                Revenue Impact Analysis
                                            </h3>

                                        </div>

                                        <span
                                            className={`scenario-status ${getSimulationStatusClass()}`}
                                        >
                                            {getSimulationStatusText()}
                                        </span>

                                    </div>

                                    {/* RESULT CARDS */}

                                    <div className="scenario-result-grid">

                                        <div className="scenario-result-card">

                                            <span>
                                                ESTIMATED DEMAND
                                            </span>

                                            <strong>
                                                {formatNumber(
                                                    simulation.estimated_demand
                                                )}
                                            </strong>

                                            <small>
                                                Baseline:{" "}
                                                {formatNumber(
                                                    simulation.baseline_demand
                                                )}
                                            </small>

                                        </div>

                                        <div className="scenario-result-card">

                                            <span>
                                                EXPECTED REVENUE
                                            </span>

                                            <strong>
                                                ₹ {formatPrice(
                                                    simulation.estimated_revenue
                                                )}
                                            </strong>

                                            <small>
                                                Current: ₹{" "}
                                                {formatPrice(
                                                    simulation.current_estimated_revenue
                                                )}
                                            </small>

                                        </div>

                                        <div
                                            className={`scenario-result-card ${getSimulationStatusClass()}`}
                                        >

                                            <span>
                                                REVENUE IMPACT
                                            </span>

                                            <strong>
                                                {formatPercent(
                                                    simulation.revenue_change_percent
                                                )}
                                            </strong>

                                            <small>
                                                ₹{" "}
                                                {formatPrice(
                                                    simulation.revenue_change
                                                )}
                                            </small>

                                        </div>

                                        <div className="scenario-result-card">

                                            <span>
                                                MARKET POSITION
                                            </span>

                                            <strong className="market-position-value">
                                                {marketPosition}
                                            </strong>

                                            <small>
                                                {simulation.competitor_count} competitors
                                                analyzed
                                            </small>

                                        </div>

                                    </div>

                                    {/* =================================================
                                        REVENUE COMPARISON
                                    ================================================= */}

                                    <div className="revenue-comparison">

                                        <div className="revenue-comparison-header">

                                            <div>

                                                <span>
                                                    REVENUE OUTLOOK
                                                </span>

                                                <h4>
                                                    Current vs Proposed Scenario
                                                </h4>

                                            </div>

                                            <strong
                                                className={
                                                    getSimulationStatusClass()
                                                }
                                            >
                                                {formatPercent(
                                                    simulation.revenue_change_percent
                                                )}
                                            </strong>

                                        </div>

                                        <div className="revenue-bars">

                                            <div className="revenue-bar-row">

                                                <div className="revenue-bar-label">

                                                    <span>
                                                        Current
                                                    </span>

                                                    <strong>
                                                        ₹{" "}
                                                        {formatPrice(
                                                            simulation.current_estimated_revenue
                                                        )}
                                                    </strong>

                                                </div>

                                                <div className="revenue-bar-track">

                                                    <div
                                                        className="revenue-bar current"
                                                        style={{
                                                            width: "50%",
                                                        }}
                                                    />

                                                </div>

                                            </div>

                                            <div className="revenue-bar-row">

                                                <div className="revenue-bar-label">

                                                    <span>
                                                        Proposed
                                                    </span>

                                                    <strong>
                                                        ₹{" "}
                                                        {formatPrice(
                                                            simulation.estimated_revenue
                                                        )}
                                                    </strong>

                                                </div>

                                                <div className="revenue-bar-track">

                                                    <div
                                                        className={`revenue-bar proposed ${getSimulationStatusClass()}`}
                                                        style={{
                                                            width: `${getRevenueBarWidth()}%`,
                                                        }}
                                                    />

                                                </div>

                                            </div>

                                        </div>

                                    </div>

                                    {/* =================================================
                                        MARKET POSITION
                                    ================================================= */}

                                    <div className="market-position-panel">

                                        <div className="market-position-header">

                                            <div>

                                                <span>
                                                    MARKET POSITION
                                                </span>

                                                <h4>
                                                    Competitive Price Range
                                                </h4>

                                            </div>

                                            <strong>
                                                {marketPosition}
                                            </strong>

                                        </div>

                                        {simulation.average_competitor_price !== null ? (

                                            <>

                                                <div className="market-range">

                                                    <div className="market-range-labels">

                                                        <span>
                                                            ₹{" "}
                                                            {formatPrice(
                                                                simulation.lowest_competitor_price
                                                            )}
                                                        </span>

                                                        <span>
                                                            ₹{" "}
                                                            {formatPrice(
                                                                simulation.average_competitor_price
                                                            )}
                                                        </span>

                                                        <span>
                                                            ₹{" "}
                                                            {formatPrice(
                                                                simulation.highest_competitor_price
                                                            )}
                                                        </span>

                                                    </div>

                                                    <div className="market-range-track">

                                                        <div className="market-range-low" />

                                                        <div className="market-range-average">

                                                            <span>
                                                                MARKET AVG
                                                            </span>

                                                        </div>

                                                        <div className="market-range-high" />

                                                    </div>

                                                    <div className="market-range-caption">

                                                        <span>
                                                            Lowest
                                                        </span>

                                                        <span>
                                                            Average
                                                        </span>

                                                        <span>
                                                            Highest
                                                        </span>

                                                    </div>

                                                </div>

                                                <div className="market-position-note">

                                                    Proposed price:
                                                    <strong>
                                                        ₹{" "}
                                                        {formatPrice(
                                                            simulation.proposed_price
                                                        )}
                                                    </strong>

                                                    <span>
                                                        {marketPosition}
                                                    </span>

                                                </div>

                                            </>

                                        ) : (

                                            <div className="market-no-data">
                                                Competitor pricing data is not
                                                available for this product.
                                            </div>

                                        )}

                                    </div>

                                    {/* =================================================
                                        AI DECISION INSIGHT
                                    ================================================= */}

                                    <div
                                        className={`ai-decision-card ${getSimulationStatusClass()}`}
                                    >

                                        <div className="ai-decision-icon">
                                            AI
                                        </div>

                                        <div className="ai-decision-content">

                                            <div className="scenario-eyebrow">
                                                AI DECISION INSIGHT
                                            </div>

                                            <h3>
                                                {getSimulationStatusText()}
                                            </h3>

                                            <p>
                                                {simulation.simulation_note}
                                            </p>

                                        </div>

                                    </div>

                                    {/* =================================================
                                        DETAILED METRICS
                                    ================================================= */}

                                    <div className="scenario-details">

                                        <div>

                                            <span>
                                                PRICE CHANGE
                                            </span>

                                            <strong>
                                                ₹{" "}
                                                {formatPrice(
                                                    simulation.price_change
                                                )}
                                            </strong>

                                            <small>
                                                {formatPercent(
                                                    simulation.price_change_percent
                                                )}
                                            </small>

                                        </div>

                                        <div>

                                            <span>
                                                DEMAND CHANGE
                                            </span>

                                            <strong>
                                                {formatNumber(
                                                    Number(
                                                        simulation.estimated_demand
                                                    ) -
                                                    Number(
                                                        simulation.baseline_demand
                                                    )
                                                )}
                                            </strong>

                                            <small>
                                                Estimated units
                                            </small>

                                        </div>

                                        <div>

                                            <span>
                                                CURRENT REVENUE
                                            </span>

                                            <strong>
                                                ₹{" "}
                                                {formatPrice(
                                                    simulation.current_estimated_revenue
                                                )}
                                            </strong>

                                            <small>
                                                Baseline scenario
                                            </small>

                                        </div>

                                        <div>

                                            <span>
                                                PROPOSED REVENUE
                                            </span>

                                            <strong>
                                                ₹{" "}
                                                {formatPrice(
                                                    simulation.estimated_revenue
                                                )}
                                            </strong>

                                            <small>
                                                Simulated scenario
                                            </small>

                                        </div>

                                    </div>

                                    {/* =================================================
                                        SIMULATION NOTE
                                    ================================================= */}

                                    <div className="simulation-note">

                                        <span className="simulation-note-icon">
                                            i
                                        </span>

                                        <p>
                                            This scenario is a pricing simulation
                                            based on the available product,
                                            sales, and competitor data. It should
                                            be interpreted as decision-support
                                            analysis rather than a guaranteed
                                            revenue forecast.
                                        </p>

                                    </div>

                                </div>

                            )}

                        </div>

                    </div>
                )}

        </div>
    );
}

export default Pricing;