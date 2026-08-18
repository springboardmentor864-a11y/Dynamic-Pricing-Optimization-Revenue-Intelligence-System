import { useState } from "react";
import api from "../../api/axios";
import "./Prediction.css";

function Prediction() {
    const initialForm = {
        freight_value: "",
        payment_value: "",
        payment_installments: "",
        product_weight_g: "",
        product_length_cm: "",
        product_height_cm: "",
        product_width_cm: "",
        model_name: "random_forest",
    };

    const [formData, setFormData] = useState(initialForm);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // =====================================================
    // HANDLE INPUT CHANGE
    // =====================================================

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    // =====================================================
    // CLEAR FORM
    // =====================================================

    const clearForm = () => {
        setFormData(initialForm);
        setResult(null);
        setError("");
    };

    // =====================================================
    // HANDLE SUBMIT
    // =====================================================

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setResult(null);

        const numericFields = [
            "freight_value",
            "payment_value",
            "payment_installments",
            "product_weight_g",
            "product_length_cm",
            "product_height_cm",
            "product_width_cm",
        ];

        for (const field of numericFields) {
            if (
                formData[field] === "" ||
                Number(formData[field]) < 0
            ) {
                setError(
                    "Please enter valid values in all fields."
                );
                return;
            }
        }

        if (Number(formData.payment_installments) < 1) {
            setError(
                "Payment installments must be at least 1."
            );
            return;
        }

        setLoading(true);

        try {
            const data = {
                freight_value: Number(
                    formData.freight_value
                ),

                payment_value: Number(
                    formData.payment_value
                ),

                payment_installments: Number(
                    formData.payment_installments
                ),

                product_weight_g: Number(
                    formData.product_weight_g
                ),

                product_length_cm: Number(
                    formData.product_length_cm
                ),

                product_height_cm: Number(
                    formData.product_height_cm
                ),

                product_width_cm: Number(
                    formData.product_width_cm
                ),

                model_name: formData.model_name,
            };

            const response = await api.post(
                "/predict/",
                data
            );

            console.log(
                "Prediction Result:",
                response.data
            );

            setResult(response.data);

        } catch (error) {
            console.error(
                "Prediction Error:",
                error
            );

            setError(
                error.response?.data?.detail ||
                "Unable to generate prediction."
            );

        } finally {
            setLoading(false);
        }
    };

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
    // UI
    // =====================================================

    return (
        <div className="prediction-container">

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="prediction-header">

                <div className="prediction-eyebrow">
                    AI PRICING ENGINE
                </div>

                <h1>
                    AI Price Prediction
                </h1>

                <p>
                    Predict the optimal product price using
                    trained machine learning models.
                </p>

            </div>


            {/* =================================================
                FORM
            ================================================= */}

            <form
                className="prediction-form"
                onSubmit={handleSubmit}
            >

                <div className="prediction-form-header">

                    <div>

                        <h2>
                            Product Information
                        </h2>

                        <p>
                            Enter the product and payment details
                            to generate a price prediction.
                        </p>

                    </div>

                </div>


                <div className="prediction-fields">

                    {/* FREIGHT */}

                    <div className="form-group">

                        <label htmlFor="freight_value">
                            Freight Value
                        </label>

                        <input
                            id="freight_value"
                            type="number"
                            name="freight_value"
                            value={formData.freight_value}
                            onChange={handleChange}
                            placeholder="Enter freight value"
                            min="0"
                            step="0.01"
                            required
                        />

                    </div>


                    {/* PAYMENT */}

                    <div className="form-group">

                        <label htmlFor="payment_value">
                            Payment Value
                        </label>

                        <input
                            id="payment_value"
                            type="number"
                            name="payment_value"
                            value={formData.payment_value}
                            onChange={handleChange}
                            placeholder="Enter payment value"
                            min="0"
                            step="0.01"
                            required
                        />

                    </div>


                    {/* INSTALLMENTS */}

                    <div className="form-group">

                        <label htmlFor="payment_installments">
                            Payment Installments
                        </label>

                        <input
                            id="payment_installments"
                            type="number"
                            name="payment_installments"
                            value={formData.payment_installments}
                            onChange={handleChange}
                            placeholder="Enter installments"
                            min="1"
                            required
                        />

                    </div>


                    {/* WEIGHT */}

                    <div className="form-group">

                        <label htmlFor="product_weight_g">
                            Product Weight (g)
                        </label>

                        <input
                            id="product_weight_g"
                            type="number"
                            name="product_weight_g"
                            value={formData.product_weight_g}
                            onChange={handleChange}
                            placeholder="Enter weight"
                            min="0"
                            step="0.01"
                            required
                        />

                    </div>


                    {/* LENGTH */}

                    <div className="form-group">

                        <label htmlFor="product_length_cm">
                            Product Length (cm)
                        </label>

                        <input
                            id="product_length_cm"
                            type="number"
                            name="product_length_cm"
                            value={formData.product_length_cm}
                            onChange={handleChange}
                            placeholder="Enter length"
                            min="0"
                            step="0.01"
                            required
                        />

                    </div>


                    {/* HEIGHT */}

                    <div className="form-group">

                        <label htmlFor="product_height_cm">
                            Product Height (cm)
                        </label>

                        <input
                            id="product_height_cm"
                            type="number"
                            name="product_height_cm"
                            value={formData.product_height_cm}
                            onChange={handleChange}
                            placeholder="Enter height"
                            min="0"
                            step="0.01"
                            required
                        />

                    </div>


                    {/* WIDTH */}

                    <div className="form-group">

                        <label htmlFor="product_width_cm">
                            Product Width (cm)
                        </label>

                        <input
                            id="product_width_cm"
                            type="number"
                            name="product_width_cm"
                            value={formData.product_width_cm}
                            onChange={handleChange}
                            placeholder="Enter width"
                            min="0"
                            step="0.01"
                            required
                        />

                    </div>


                    {/* MODEL */}

                    <div className="form-group">

                        <label htmlFor="model_name">
                            Machine Learning Model
                        </label>

                        <select
                            id="model_name"
                            name="model_name"
                            value={formData.model_name}
                            onChange={handleChange}
                        >

                            <option value="random_forest">
                                Random Forest
                            </option>

                            <option value="xgboost">
                                XGBoost
                            </option>

                            <option value="linear_regression">
                                Linear Regression
                            </option>

                            <option value="decision_tree">
                                Decision Tree
                            </option>

                        </select>

                    </div>

                </div>


                {/* =================================================
                    BUTTONS
                ================================================= */}

                <div className="prediction-buttons">

                    <button
                        type="submit"
                        className="predict-button"
                        disabled={loading}
                    >
                        {loading
                            ? "Predicting..."
                            : "Predict Price"}
                    </button>

                    <button
                        type="button"
                        className="clear-button"
                        onClick={clearForm}
                        disabled={loading}
                    >
                        Clear
                    </button>

                </div>

            </form>


            {/* =================================================
                ERROR
            ================================================= */}

            {error && (

                <div className="prediction-error">

                    <span className="error-icon">
                        !
                    </span>

                    <span>
                        {error}
                    </span>

                </div>

            )}


            {/* =================================================
                RESULT
            ================================================= */}

            {result && (

                <div className="prediction-result">

                    <div className="result-header">

                        <div>

                            <div className="result-eyebrow">
                                PREDICTION COMPLETE
                            </div>

                            <h2>
                                Prediction Result
                            </h2>

                        </div>

                    </div>


                    {/* PREDICTED PRICE */}

                    <div className="predicted-price">

                        <span>
                            Predicted Price
                        </span>

                        <strong>
                            {formatINR(
                                result.predicted_price
                            )}
                        </strong>

                    </div>


                    {/* RESULT DETAILS */}

                    <div className="result-details">

                        <div className="result-detail-item">

                            <span>
                                Model
                            </span>

                            <strong>
                                {result.model}
                            </strong>

                        </div>


                        <div className="result-detail-item">

                            <span>
                                Prediction ID
                            </span>

                            <strong>
                                #{result.prediction_id}
                            </strong>

                        </div>

                    </div>

                </div>

            )}

        </div>
    );
}

export default Prediction;