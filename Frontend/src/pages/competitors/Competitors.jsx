import { useEffect, useRef, useState } from "react";
import api from "../../api/axios";
import "./Competitors.css";

function Competitors() {
    const [competitors, setCompetitors] = useState([]);
    const [products, setProducts] = useState([]);

    const [editingId, setEditingId] = useState(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");

    const competitorFormRef = useRef(null);

    const emptyForm = {
        product_id: "",
        competitor_name: "",
        competitor_price: ""
    };

    const [formData, setFormData] = useState(emptyForm);

    // =========================
    // LOAD DATA
    // =========================

    useEffect(() => {
        loadCompetitors();
        loadProducts();
    }, []);

    const loadCompetitors = async () => {
        try {
            setLoading(true);

            const response = await api.get("/competitors/");

            console.log("COMPETITORS RESPONSE:", response.data);

            if (Array.isArray(response.data)) {
                setCompetitors(response.data);
            } else {
                setCompetitors([]);
            }

            setError("");
        } catch (err) {
            console.error("LOAD COMPETITORS ERROR:", err);

            setError(
                err.response?.data?.detail ||
                "Failed to load competitor prices."
            );
        } finally {
            setLoading(false);
        }
    };

    const loadProducts = async () => {
        try {
            const response = await api.get("/products/");

            console.log("PRODUCTS RESPONSE:", response.data);

            if (Array.isArray(response.data)) {
                setProducts(response.data);
            } else {
                setProducts([]);
            }
        } catch (err) {
            console.error("LOAD PRODUCTS ERROR:", err);

            setError(
                err.response?.data?.detail ||
                "Failed to load products."
            );
        }
    };

    // =========================
    // FORM
    // =========================

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value
        }));
    };

    const clearForm = () => {
        setEditingId(null);
        setFormData({ ...emptyForm });
        setError("");
    };

    const handleAddCompetitor = () => {
        clearForm();

        setTimeout(() => {
            competitorFormRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });
        }, 50);
    };

    // =========================
    // ADD / UPDATE
    // =========================

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (saving) {
            return;
        }

        setError("");

        const productId = Number(formData.product_id);
        const competitorName = formData.competitor_name.trim();
        const competitorPrice = Number(formData.competitor_price);

        // Validation

        if (!formData.product_id) {
            setError("Please select a product.");
            return;
        }

        if (!competitorName) {
            setError("Please enter the competitor name.");
            return;
        }

        if (competitorName.length < 2) {
            setError(
                "Competitor name must contain at least 2 characters."
            );
            return;
        }

        if (
            !Number.isFinite(competitorPrice) ||
            competitorPrice <= 0
        ) {
            setError("Competitor price must be greater than 0.");
            return;
        }

        try {
            setSaving(true);

            if (editingId === null) {
                // ADD

                console.log("ADDING COMPETITOR:", {
                    product_id: productId,
                    competitor_name: competitorName,
                    competitor_price: competitorPrice
                });

                await api.post("/competitors/", {
                    product_id: productId,
                    competitor_name: competitorName,
                    competitor_price: competitorPrice
                });

                console.log("COMPETITOR ADDED");
            } else {
                // UPDATE

                console.log("UPDATING COMPETITOR:", editingId);

                await api.put(`/competitors/${editingId}`, {
                    competitor_name: competitorName,
                    competitor_price: competitorPrice
                });

                console.log("COMPETITOR UPDATED");
            }

            clearForm();

            await loadCompetitors();

        } catch (err) {
            console.error("SAVE COMPETITOR ERROR:", err);

            const detail = err.response?.data?.detail;

            if (typeof detail === "string") {
                setError(detail);
            } else if (Array.isArray(detail)) {
                setError(
                    detail
                        .map((item) => item.msg || "Validation error")
                        .join(", ")
                );
            } else {
                setError("Failed to save competitor price.");
            }
        } finally {
            setSaving(false);
        }
    };

    // =========================
    // EDIT
    // =========================

    const handleEdit = (item) => {
        console.log("EDITING:", item);

        setEditingId(item.id);

        setFormData({
            product_id: String(item.product_id ?? ""),
            competitor_name: item.competitor_name ?? "",
            competitor_price: String(item.competitor_price ?? "")
        });

        setError("");

        setTimeout(() => {
            competitorFormRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });
        }, 50);
    };

    // =========================
    // DELETE
    // =========================

    const handleDelete = async (id) => {
        if (saving) {
            return;
        }

        const confirmed = window.confirm(
            "Are you sure you want to delete this competitor price?"
        );

        if (!confirmed) {
            return;
        }

        try {
            setSaving(true);
            setError("");

            console.log("DELETING COMPETITOR:", id);

            await api.delete(`/competitors/${id}`);

            console.log("COMPETITOR DELETED");

            if (editingId === id) {
                clearForm();
            }

            await loadCompetitors();

        } catch (err) {
            console.error("DELETE COMPETITOR ERROR:", err);

            setError(
                err.response?.data?.detail ||
                "Failed to delete competitor price."
            );
        } finally {
            setSaving(false);
        }
    };

    // =========================
    // HELPERS
    // =========================

    const getProductName = (productId) => {
        const product = products.find(
            (item) => Number(item.id) === Number(productId)
        );

        return product?.product_name || `Product #${productId}`;
    };

    const formatPrice = (price) => {
        const value = Number(price);

        if (!Number.isFinite(value)) {
            return "0.00";
        }

        return value.toFixed(2);
    };

    const formatDate = (date) => {
        if (!date) {
            return "-";
        }

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) {
            return "-";
        }

        return parsedDate.toLocaleString("en-IN");
    };

    // =========================
    // KPI VALUES
    // =========================

    const prices = competitors
        .map((item) => Number(item.competitor_price))
        .filter((price) => Number.isFinite(price));

    const averagePrice =
        prices.length > 0
            ? prices.reduce((sum, price) => sum + price, 0) /
              prices.length
            : 0;

    const lowestPrice =
        prices.length > 0
            ? Math.min(...prices)
            : 0;

    const highestPrice =
        prices.length > 0
            ? Math.max(...prices)
            : 0;

    // =========================
    // UI
    // =========================

    return (
        <div className="competitor-container">

            {/* HEADER */}

            <div className="competitor-header">

                <div>
                    <span className="page-eyebrow">
                        COMPETITOR INTELLIGENCE
                    </span>

                    <h1>Competitors</h1>

                    <p>
                        Track competitor prices and compare them
                        with your product pricing.
                    </p>
                </div>

                <button
                    type="button"
                    className="primary-action"
                    onClick={handleAddCompetitor}
                >
                    + Add Competitor
                </button>

            </div>

            {/* ERROR */}

            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}

            {/* KPI CARDS */}

            <div className="competitor-kpis">

                <div className="competitor-kpi">
                    <span className="kpi-label">
                        Total Records
                    </span>

                    <strong>
                        {competitors.length}
                    </strong>

                    <small>
                        Competitor prices tracked
                    </small>
                </div>

                <div className="competitor-kpi">
                    <span className="kpi-label">
                        Average Price
                    </span>

                    <strong>
                        ₹{formatPrice(averagePrice)}
                    </strong>

                    <small>
                        Average competitor price
                    </small>
                </div>

                <div className="competitor-kpi">
                    <span className="kpi-label">
                        Lowest Price
                    </span>

                    <strong>
                        ₹{formatPrice(lowestPrice)}
                    </strong>

                    <small>
                        Lowest recorded price
                    </small>
                </div>

                <div className="competitor-kpi">
                    <span className="kpi-label">
                        Highest Price
                    </span>

                    <strong>
                        ₹{formatPrice(highestPrice)}
                    </strong>

                    <small>
                        Highest recorded price
                    </small>
                </div>

            </div>

            {/* FORM */}

            <div
                className="competitor-editor"
                ref={competitorFormRef}
            >

                <div className="editor-heading">

                    <div>
                        <span className="section-label">
                            {editingId === null
                                ? "NEW COMPETITOR"
                                : "EDIT COMPETITOR"}
                        </span>

                        <h2>
                            {editingId === null
                                ? "Add competitor price"
                                : "Update competitor price"}
                        </h2>
                    </div>

                    {editingId !== null && (
                        <button
                            type="button"
                            className="cancel-btn"
                            onClick={clearForm}
                            disabled={saving}
                        >
                            Cancel
                        </button>
                    )}

                </div>

                <form
                    className="competitor-form"
                    onSubmit={handleSubmit}
                >

                    {/* PRODUCT */}

                    <div className="form-group">

                        <label htmlFor="product_id">
                            Product
                        </label>

                        <select
                            id="product_id"
                            name="product_id"
                            value={formData.product_id}
                            onChange={handleChange}
                            disabled={
                                editingId !== null || saving
                            }
                            required
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

                    {/* COMPETITOR NAME */}

                    <div className="form-group">

                        <label htmlFor="competitor_name">
                            Competitor Name
                        </label>

                        <input
                            id="competitor_name"
                            type="text"
                            name="competitor_name"
                            placeholder="e.g. Amazon"
                            value={formData.competitor_name}
                            onChange={handleChange}
                            disabled={saving}
                            required
                        />

                    </div>

                    {/* PRICE */}

                    <div className="form-group">

                        <label htmlFor="competitor_price">
                            Competitor Price
                        </label>

                        <input
                            id="competitor_price"
                            type="number"
                            name="competitor_price"
                            placeholder="55000"
                            value={formData.competitor_price}
                            onChange={handleChange}
                            min="0.01"
                            step="0.01"
                            disabled={saving}
                            required
                        />

                    </div>

                    {/* BUTTONS */}

                    <div className="competitor-buttons">

                        <button
                            type="submit"
                            disabled={saving}
                        >
                            {saving
                                ? "Saving..."
                                : editingId === null
                                    ? "Add Competitor"
                                    : "Update Competitor"}
                        </button>

                        {editingId !== null && (
                            <button
                                type="button"
                                className="cancel-btn"
                                onClick={clearForm}
                                disabled={saving}
                            >
                                Cancel
                            </button>
                        )}

                    </div>

                </form>

            </div>

            {/* LIST */}

            <div className="competitor-list">

                <div className="competitor-list-header">

                    <div>
                        <h2>
                            All Competitor Prices
                        </h2>

                        <p>
                            Monitor market pricing for your products
                        </p>
                    </div>

                    <span>
                        {competitors.length} Records
                    </span>

                </div>

                {/* LOADING */}

                {loading && (
                    <div className="competitor-loading">
                        Loading competitor prices...
                    </div>
                )}

                {/* EMPTY */}

                {!loading && competitors.length === 0 && (
                    <div className="competitor-empty">

                        <h3>
                            No competitor prices
                        </h3>

                        <p>
                            Add your first competitor price
                            using the form above.
                        </p>

                    </div>
                )}

                {/* TABLE */}

                {!loading && competitors.length > 0 && (
                    <div className="competitor-table-wrapper">

                        <table className="competitor-table">

                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Product</th>
                                    <th>Competitor</th>
                                    <th>Price</th>
                                    <th>Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>

                                {competitors.map((item) => (

                                    <tr key={item.id}>

                                        <td>
                                            #{item.id}
                                        </td>

                                        <td>
                                            {getProductName(
                                                item.product_id
                                            )}
                                        </td>

                                        <td>
                                            {item.competitor_name}
                                        </td>

                                        <td>
                                            ₹{" "}
                                            {formatPrice(
                                                item.competitor_price
                                            )}
                                        </td>

                                        <td>
                                            {formatDate(
                                                item.recorded_at
                                            )}
                                        </td>

                                        <td>

                                            <button
                                                type="button"
                                                className="edit-btn"
                                                onClick={() =>
                                                    handleEdit(item)
                                                }
                                                disabled={saving}
                                            >
                                                Edit
                                            </button>

                                            <button
                                                type="button"
                                                className="delete-btn"
                                                onClick={() =>
                                                    handleDelete(item.id)
                                                }
                                                disabled={saving}
                                            >
                                                Delete
                                            </button>

                                        </td>

                                    </tr>

                                ))}

                            </tbody>

                        </table>

                    </div>
                )}

            </div>

        </div>
    );
}

export default Competitors;