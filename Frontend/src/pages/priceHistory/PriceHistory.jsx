import { useEffect, useState } from "react";
import api from "../../api/axios";
import "./PriceHistory.css";

function PriceHistory() {
    const [history, setHistory] = useState([]);
    const [products, setProducts] = useState([]);

    const [editingId, setEditingId] = useState(null);
    const [editPrice, setEditPrice] = useState("");

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");


    /* =====================================================
       LOAD DATA
    ===================================================== */

    const loadData = async () => {
        try {
            setLoading(true);
            setError("");

            const [historyResponse, productsResponse] =
                await Promise.all([
                    api.get("/price-history/"),
                    api.get("/products/")
                ]);

            console.log(
                "Price History:",
                historyResponse.data
            );

            console.log(
                "Products:",
                productsResponse.data
            );

            setHistory(
                Array.isArray(historyResponse.data)
                    ? historyResponse.data
                    : []
            );

            setProducts(
                Array.isArray(productsResponse.data)
                    ? productsResponse.data
                    : []
            );

        } catch (error) {
            console.error(
                "Price History Error:",
                error
            );

            setError(
                error.response?.data?.detail ||
                "Unable to load price history."
            );

        } finally {
            setLoading(false);
        }
    };


    /* =====================================================
       INITIAL LOAD
    ===================================================== */

    useEffect(() => {
        loadData();
    }, []);


    /* =====================================================
       GET PRODUCT NAME
    ===================================================== */

    const getProductName = (productId) => {
        const product = products.find(
            (item) => item.id === productId
        );

        return (
            product?.name ||
            product?.product_name ||
            product?.title ||
            `Product #${productId}`
        );
    };


    /* =====================================================
       EDIT
    ===================================================== */

    const handleEdit = (item) => {
        setEditingId(item.id);
        setEditPrice(item.new_price ?? "");
        setError("");
    };


    /* =====================================================
       CANCEL
    ===================================================== */

    const handleCancel = () => {
        setEditingId(null);
        setEditPrice("");
    };


    /* =====================================================
       SAVE
    ===================================================== */

    const handleSave = async (id) => {
        const price = Number(editPrice);

        if (!Number.isFinite(price) || price < 0) {
            setError("Please enter a valid price.");
            return;
        }

        try {
            setSaving(true);
            setError("");

            /*
             * Price history records normally represent
             * an already-created price change.
             *
             * We update the new_price field here.
             */

            const response = await api.put(
                `/price-history/${id}`,
                {
                    new_price: price
                }
            );

            console.log(
                "Updated Price History:",
                response.data
            );

            setHistory((currentHistory) =>
                currentHistory.map((item) =>
                    item.id === id
                        ? {
                            ...item,
                            ...response.data
                        }
                        : item
                )
            );

            setEditingId(null);
            setEditPrice("");

        } catch (error) {
            console.error(
                "Update Price Error:",
                error
            );

            setError(
                error.response?.data?.detail ||
                "Unable to update price."
            );

        } finally {
            setSaving(false);
        }
    };


    /* =====================================================
       DELETE
    ===================================================== */

    const handleDelete = async (id) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this price history record?"
        );

        if (!confirmed) {
            return;
        }

        try {
            setError("");

            await api.delete(
                `/price-history/${id}`
            );

            setHistory((currentHistory) =>
                currentHistory.filter(
                    (item) => item.id !== id
                )
            );

        } catch (error) {
            console.error(
                "Delete Price History Error:",
                error
            );

            setError(
                error.response?.data?.detail ||
                "Unable to delete price history."
            );
        }
    };


    /* =====================================================
       FORMAT PRICE
    ===================================================== */

    const formatPrice = (value) => {
        const number = Number(value);

        if (!Number.isFinite(number)) {
            return "₹ 0.00";
        }

        return `₹ ${number.toFixed(2)}`;
    };


    /* =====================================================
       FORMAT DATE
    ===================================================== */

    const formatDate = (date) => {
        if (!date) {
            return "—";
        }

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) {
            return "—";
        }

        return parsedDate.toLocaleString(
            "en-IN",
            {
                dateStyle: "medium",
                timeStyle: "short"
            }
        );
    };


    /* =====================================================
       LOADING
    ===================================================== */

    if (loading) {
        return (
            <div className="price-page">

                <div className="price-header">

                    <div className="price-eyebrow">
                        PRICE ANALYTICS
                    </div>

                    <h1>
                        Price History
                    </h1>

                    <p>
                        Track and manage historical product prices.
                    </p>

                </div>

                <div className="price-loading">

                    <span className="loading-spinner"></span>

                    <span>
                        Loading price history...
                    </span>

                </div>

            </div>
        );
    }


    /* =====================================================
       MAIN PAGE
    ===================================================== */

    return (
        <div className="price-page">

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="price-header">

                <div className="price-eyebrow">
                    PRICE ANALYTICS
                </div>

                <h1>
                    Price History
                </h1>

                <p>
                    Track and manage historical product prices.
                </p>

            </div>


            {/* =================================================
                ERROR
            ================================================= */}

            {error && (
                <div className="price-error">

                    <span className="error-icon">
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
                SUMMARY
            ================================================= */}

            <div className="price-summary">

                <div className="summary-item">

                    <span className="summary-label">
                        TOTAL RECORDS
                    </span>

                    <strong>
                        {history.length}
                    </strong>

                </div>


                <div className="summary-divider"></div>


                <div className="summary-item">

                    <span className="summary-label">
                        PRODUCTS
                    </span>

                    <strong>
                        {products.length}
                    </strong>

                </div>

            </div>


            {/* =================================================
                HISTORY SECTION
            ================================================= */}

            <div className="history-section">

                <div className="history-section-header">

                    <div>

                        <h2>
                            Recent Price History
                        </h2>

                        <p>
                            View and manage previously recorded product prices.
                        </p>

                    </div>


                    <button
                        type="button"
                        className="refresh-button"
                        onClick={loadData}
                        disabled={loading}
                    >
                        <span>
                            ↻
                        </span>

                        Refresh
                    </button>

                </div>


                {/* =================================================
                    EMPTY STATE
                ================================================= */}

                {history.length === 0 ? (

                    <div className="empty-history">

                        <div className="empty-icon">
                            ₹
                        </div>

                        <h3>
                            No Price History
                        </h3>

                        <p>
                            Price history records will appear here
                            once product prices are changed.
                        </p>

                    </div>

                ) : (

                    /* =================================================
                       TABLE
                    ================================================= */

                    <div className="history-table-wrapper">

                        <table className="history-table">

                            <thead>

                                <tr>

                                    <th>
                                        PRODUCT
                                    </th>

                                    <th>
                                        PREVIOUS PRICE
                                    </th>

                                    <th>
                                        NEW PRICE
                                    </th>

                                    <th>
                                        DATE
                                    </th>

                                    <th>
                                        STATUS
                                    </th>

                                    <th>
                                        ACTIONS
                                    </th>

                                </tr>

                            </thead>


                            <tbody>

                                {history.map((item) => (

                                    <tr key={item.id}>

                                        {/* PRODUCT */}

                                        <td>

                                            <div className="product-cell">

                                                <div className="product-icon">
                                                    P
                                                </div>

                                                <div>

                                                    <strong>
                                                        {getProductName(
                                                            item.product_id
                                                        )}
                                                    </strong>

                                                    <span>
                                                        Product #
                                                        {item.product_id}
                                                    </span>

                                                </div>

                                            </div>

                                        </td>


                                        {/* OLD PRICE */}

                                        <td>

                                            <span className="date-value">
                                                {formatPrice(
                                                    item.old_price
                                                )}
                                            </span>

                                        </td>


                                        {/* NEW PRICE */}

                                        <td>

                                            {editingId === item.id ? (

                                                <div className="price-edit">

                                                    <span>
                                                        ₹
                                                    </span>

                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={editPrice}
                                                        onChange={(e) =>
                                                            setEditPrice(
                                                                e.target.value
                                                            )
                                                        }
                                                        autoFocus
                                                    />

                                                </div>

                                            ) : (

                                                <span className="price-value">
                                                    {formatPrice(
                                                        item.new_price
                                                    )}
                                                </span>

                                            )}

                                        </td>


                                        {/* DATE */}

                                        <td>

                                            <span className="date-value">
                                                {formatDate(
                                                    item.changed_at
                                                )}
                                            </span>

                                        </td>


                                        {/* STATUS */}

                                        <td>

                                            <span className="status-badge">
                                                Price Changed
                                            </span>

                                        </td>


                                        {/* ACTIONS */}

                                        <td>

                                            {editingId === item.id ? (

                                                <div className="action-group">

                                                    <button
                                                        type="button"
                                                        className="save-button"
                                                        onClick={() =>
                                                            handleSave(
                                                                item.id
                                                            )
                                                        }
                                                        disabled={saving}
                                                    >
                                                        {saving
                                                            ? "Saving..."
                                                            : "Save"}
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="cancel-button"
                                                        onClick={
                                                            handleCancel
                                                        }
                                                        disabled={saving}
                                                    >
                                                        Cancel
                                                    </button>

                                                </div>

                                            ) : (

                                                <div className="action-group">

                                                    <button
                                                        type="button"
                                                        className="edit-button"
                                                        onClick={() =>
                                                            handleEdit(
                                                                item
                                                            )
                                                        }
                                                    >
                                                        Edit
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="delete-button"
                                                        onClick={() =>
                                                            handleDelete(
                                                                item.id
                                                            )
                                                        }
                                                    >
                                                        Delete
                                                    </button>

                                                </div>

                                            )}

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

export default PriceHistory;