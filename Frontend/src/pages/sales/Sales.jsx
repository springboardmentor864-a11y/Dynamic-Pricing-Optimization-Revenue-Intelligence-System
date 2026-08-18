import { useEffect, useMemo, useRef, useState } from "react";
import api from "../../api/axios";
import "./Sales.css";

function Sales() {
    const [sales, setSales] = useState([]);
    const [products, setProducts] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const salesFormRef = useRef(null);

    const emptyForm = {
        product_id: "",
        quantity_sold: "",
        revenue: "",
        sale_date: ""
    };

    const [formData, setFormData] = useState(emptyForm);

    useEffect(() => {
        loadSales();
        loadProducts();
    }, []);

    const loadSales = async () => {
        try {
            setLoading(true);

            const response = await api.get("/sales/");

            setSales(response.data);
            setError("");
        } catch (error) {
            console.error("Sales Error:", error);

            setError(
                typeof error.response?.data?.detail === "string"
                    ? error.response.data.detail
                    : "Failed to load sales."
            );
        } finally {
            setLoading(false);
        }
    };

    const loadProducts = async () => {
        try {
            const response = await api.get("/products/");

            setProducts(response.data);
        } catch (error) {
            console.error("Products Error:", error);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const clearForm = () => {
        setEditingId(null);
        setFormData(emptyForm);
        setError("");
    };

    const scrollToForm = () => {
        setTimeout(() => {
            salesFormRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }, 50);
    };

    const handleAddSale = () => {
        clearForm();
        scrollToForm();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setSaving(true);

        if (
            !formData.product_id ||
            !formData.quantity_sold ||
            !formData.revenue ||
            !formData.sale_date
        ) {
            setError("Please fill in all fields.");
            setSaving(false);
            return;
        }

        const data = {
            product_id: Number(formData.product_id),
            quantity_sold: Number(formData.quantity_sold),
            revenue: Number(formData.revenue),
            sale_date: new Date(formData.sale_date).toISOString()
        };

        try {
            if (editingId === null) {
                await api.post("/sales/", data);
            } else {
                await api.put(`/sales/${editingId}`, {
                    quantity_sold: data.quantity_sold,
                    revenue: data.revenue,
                    sale_date: data.sale_date
                });
            }

            clearForm();
            await loadSales();
            await loadProducts();

        } catch (error) {
            console.error("Save Sale Error:", error);

            const detail = error.response?.data?.detail;

            if (typeof detail === "string") {
                setError(detail);
            } else if (Array.isArray(detail)) {
                setError(
                    detail
                        .map((item) => item.msg || "Validation error")
                        .join(", ")
                );
            } else {
                setError("Failed to save sale.");
            }
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (sale) => {
        setEditingId(sale.id);

        setFormData({
            product_id: sale.product_id ?? "",
            quantity_sold: sale.quantity_sold ?? "",
            revenue: sale.revenue ?? "",
            sale_date: sale.sale_date
                ? new Date(sale.sale_date)
                    .toISOString()
                    .slice(0, 16)
                : ""
        });

        setError("");

        scrollToForm();
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this sale?")) {
            return;
        }

        try {
            await api.delete(`/sales/${id}`);

            await loadSales();
            await loadProducts();

        } catch (error) {
            console.error("Delete Sale Error:", error);

            const detail = error.response?.data?.detail;

            setError(
                typeof detail === "string"
                    ? detail
                    : "Failed to delete sale."
            );
        }
    };

    const getProductName = (productId) => {
        const product = products.find(
            (item) => Number(item.id) === Number(productId)
        );

        return product?.product_name || `Product #${productId}`;
    };

    const totalRevenue = useMemo(() => {
        return sales.reduce(
            (total, sale) =>
                total + Number(sale.revenue || 0),
            0
        );
    }, [sales]);

    const totalUnitsSold = useMemo(() => {
        return sales.reduce(
            (total, sale) =>
                total + Number(sale.quantity_sold || 0),
            0
        );
    }, [sales]);

    const averageSaleValue = useMemo(() => {
        return sales.length > 0
            ? totalRevenue / sales.length
            : 0;
    }, [sales.length, totalRevenue]);

    return (
        <div className="sales-container">

            {/* HEADER */}

            <div className="sales-header">

                <div>
                    <span className="page-eyebrow">
                        SALES MANAGEMENT
                    </span>

                    <h1>Sales</h1>

                    <p>
                        Track sales, revenue and product performance
                        from one place.
                    </p>
                </div>

                <button
                    type="button"
                    className="primary-action"
                    onClick={handleAddSale}
                >
                    + Add Sale
                </button>

            </div>

            {/* ERROR */}

            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}

            {/* KPI CARDS */}

            <div className="sales-kpis">

                <div className="sales-kpi">
                    <span className="kpi-label">
                        Total Sales
                    </span>

                    <strong>
                        {sales.length}
                    </strong>

                    <small>
                        Sales transactions recorded
                    </small>
                </div>

                <div className="sales-kpi">
                    <span className="kpi-label">
                        Units Sold
                    </span>

                    <strong>
                        {totalUnitsSold}
                    </strong>

                    <small>
                        Total products sold
                    </small>
                </div>

                <div className="sales-kpi">
                    <span className="kpi-label">
                        Total Revenue
                    </span>

                    <strong>
                        ₹ {totalRevenue.toFixed(2)}
                    </strong>

                    <small>
                        Revenue generated
                    </small>
                </div>

                <div className="sales-kpi">
                    <span className="kpi-label">
                        Average Sale
                    </span>

                    <strong>
                        ₹ {averageSaleValue.toFixed(2)}
                    </strong>

                    <small>
                        Average revenue per sale
                    </small>
                </div>

            </div>

            {/* SALES FORM */}

            <div
                className="sales-editor"
                ref={salesFormRef}
            >

                <div className="editor-heading">

                    <div>
                        <span className="section-label">
                            {editingId === null
                                ? "NEW SALE"
                                : "EDIT SALE"}
                        </span>

                        <h2>
                            {editingId === null
                                ? "Record a sale"
                                : "Update sale"}
                        </h2>
                    </div>

                    {editingId !== null && (
                        <button
                            type="button"
                            className="cancel-button"
                            onClick={clearForm}
                        >
                            Cancel
                        </button>
                    )}

                </div>

                <form
                    onSubmit={handleSubmit}
                    className="sales-form"
                >

                    <div className="input-group">
                        <label>Product</label>

                        <select
                            name="product_id"
                            value={formData.product_id}
                            onChange={handleChange}
                            required
                            disabled={editingId !== null}
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

                    <div className="input-group">
                        <label>Quantity Sold</label>

                        <input
                            type="number"
                            name="quantity_sold"
                            placeholder="5"
                            value={formData.quantity_sold}
                            onChange={handleChange}
                            min="1"
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label>Revenue</label>

                        <input
                            type="number"
                            name="revenue"
                            placeholder="25000"
                            value={formData.revenue}
                            onChange={handleChange}
                            min="0.01"
                            step="0.01"
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label>Sale Date</label>

                        <input
                            type="datetime-local"
                            name="sale_date"
                            value={formData.sale_date}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="save-sale-button"
                        disabled={saving}
                    >
                        {saving
                            ? "Saving..."
                            : editingId === null
                                ? "Add Sale"
                                : "Update Sale"}
                    </button>

                </form>

            </div>

            {/* SALES TABLE */}

            <div className="sales-section">

                <div className="sales-section-header">

                    <div>
                        <span className="section-label">
                            SALES HISTORY
                        </span>

                        <h2>All Sales</h2>
                    </div>

                </div>

                {loading ? (
                    <div className="sales-empty">
                        <h3>Loading sales...</h3>

                        <p>
                            Fetching your sales records.
                        </p>
                    </div>
                ) : sales.length === 0 ? (
                    <div className="sales-empty">
                        <h3>No sales records found</h3>

                        <p>
                            Add your first sale to start tracking
                            revenue.
                        </p>
                    </div>
                ) : (
                    <div className="sales-table-wrapper">

                        <table className="sales-table">

                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Product</th>
                                    <th>Quantity</th>
                                    <th>Revenue</th>
                                    <th>Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>

                                {sales.map((sale) => (
                                    <tr key={sale.id}>

                                        <td>
                                            #{sale.id}
                                        </td>

                                        <td>
                                            <div className="sale-product-cell">

                                                <div className="product-avatar">
                                                    {getProductName(
                                                        sale.product_id
                                                    )
                                                        ?.charAt(0)
                                                        ?.toUpperCase()}
                                                </div>

                                                <div>
                                                    <strong>
                                                        {getProductName(
                                                            sale.product_id
                                                        )}
                                                    </strong>

                                                    <span>
                                                        Product ID #{sale.product_id}
                                                    </span>
                                                </div>

                                            </div>
                                        </td>

                                        <td>
                                            {sale.quantity_sold}
                                        </td>

                                        <td>
                                            <strong>
                                                ₹ {" "}
                                                {Number(
                                                    sale.revenue || 0
                                                ).toFixed(2)}
                                            </strong>
                                        </td>

                                        <td>
                                            {sale.sale_date
                                                ? new Date(
                                                    sale.sale_date
                                                ).toLocaleString("en-IN")
                                                : "-"}
                                        </td>

                                        <td>
                                            <div className="table-actions">

                                                <button
                                                    type="button"
                                                    className="edit-btn"
                                                    onClick={() =>
                                                        handleEdit(sale)
                                                    }
                                                >
                                                    Edit
                                                </button>

                                                <button
                                                    type="button"
                                                    className="delete-btn"
                                                    onClick={() =>
                                                        handleDelete(sale.id)
                                                    }
                                                >
                                                    Delete
                                                </button>

                                            </div>
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

export default Sales;
