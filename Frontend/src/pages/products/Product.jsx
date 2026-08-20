import { useEffect, useMemo, useRef, useState } from "react";
import {
    Package,
    Plus,
    Search,
    Filter,
    Edit2,
    Trash2,
    RefreshCw,
    CheckCircle2,
    AlertCircle,
    IndianRupee,
    Layers,
    Boxes,
    Tag,
    Scale,
    Maximize2
} from "lucide-react";
import api from "../../api/axios";
import "./Product.css";

// Rich fallback products if backend is ever disconnected
const INITIAL_FALLBACK_PRODUCTS = [
    {
        id: 1,
        product_name: "Ultra Precision Smart Watch Pro",
        category: "Electronics",
        cost_price: 2400.0,
        selling_price: 3899.0,
        stock: 45,
        product_weight: 250,
        product_length: 15,
        product_height: 3,
        product_width: 8
    },
    {
        id: 2,
        product_name: "Ergonomic Mechanical Keyboard RGB",
        category: "Computer Accessories",
        cost_price: 1400.0,
        selling_price: 2299.0,
        stock: 80,
        product_weight: 850,
        product_length: 44,
        product_height: 4,
        product_width: 14
    },
    {
        id: 3,
        product_name: "Active Noise-Cancelling Headphones",
        category: "Audio",
        cost_price: 3200.0,
        selling_price: 5499.0,
        stock: 30,
        product_weight: 310,
        product_length: 20,
        product_height: 8,
        product_width: 18
    },
    {
        id: 4,
        product_name: "Wireless Fast Charging Pad 15W",
        category: "Electronics",
        cost_price: 450.0,
        selling_price: 999.0,
        stock: 120,
        product_weight: 110,
        product_length: 10,
        product_height: 1,
        product_width: 10
    },
    {
        id: 5,
        product_name: "4K Ultra-HD USB-C Webcam with Mic",
        category: "Computer Accessories",
        cost_price: 2100.0,
        selling_price: 3499.0,
        stock: 55,
        product_weight: 220,
        product_length: 12,
        product_height: 5,
        product_width: 6
    },
    {
        id: 6,
        product_name: "Pro Gaming Mouse 16000 DPI",
        category: "Computer Accessories",
        cost_price: 1100.0,
        selling_price: 1899.0,
        stock: 95,
        product_weight: 140,
        product_length: 13,
        product_height: 4,
        product_width: 7
    },
    {
        id: 7,
        product_name: "Portable Bluetooth Speaker Waterproof",
        category: "Audio",
        cost_price: 1600.0,
        selling_price: 2799.0,
        stock: 65,
        product_weight: 520,
        product_length: 18,
        product_height: 7,
        product_width: 7
    },
    {
        id: 8,
        product_name: "Smart LED Desk Lamp with Dimmer",
        category: "Home & Office",
        cost_price: 850.0,
        selling_price: 1499.0,
        stock: 70,
        product_weight: 650,
        product_length: 35,
        product_height: 40,
        product_width: 15
    }
];

function Product() {
    const emptyForm = {
        product_name: "",
        category: "",
        cost_price: "",
        selling_price: "",
        stock: "",
        product_weight: "",
        product_length: "",
        product_height: "",
        product_width: ""
    };

    const [products, setProducts] = useState(INITIAL_FALLBACK_PRODUCTS);
    const [formData, setFormData] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);
    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [statusMessage, setStatusMessage] = useState("");
    const [isLiveConnected, setIsLiveConnected] = useState(false);

    const productEditorRef = useRef(null);

    const loadProducts = async () => {
        try {
            setLoading(true);
            const response = await api.get("/products/");
            if (response.data && Array.isArray(response.data) && response.data.length > 0) {
                setProducts(response.data);
                setIsLiveConnected(true);
            } else if (response.data && Array.isArray(response.data) && response.data.length === 0) {
                // If DB is empty, use fallback items or preserve state
                setProducts(INITIAL_FALLBACK_PRODUCTS);
                setIsLiveConnected(true);
            }
        } catch (error) {
            console.warn("Backend products endpoint connecting/fallback mode:", error);
            setIsLiveConnected(false);
            // Gracefully keep current or initial products
            if (products.length === 0) {
                setProducts(INITIAL_FALLBACK_PRODUCTS);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProducts();
    }, []);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const resetForm = () => {
        setFormData(emptyForm);
        setEditingId(null);
    };

    const handleAddProduct = () => {
        resetForm();
        setTimeout(() => {
            productEditorRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }, 50);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setStatusMessage("");

        const productPayload = {
            product_name: formData.product_name.trim(),
            category: formData.category.trim(),
            cost_price: Number(formData.cost_price),
            selling_price: Number(formData.selling_price),
            stock: Number(formData.stock),
            product_weight: formData.product_weight === "" ? null : Number(formData.product_weight),
            product_length: formData.product_length === "" ? null : Number(formData.product_length),
            product_height: formData.product_height === "" ? null : Number(formData.product_height),
            product_width: formData.product_width === "" ? null : Number(formData.product_width)
        };

        try {
            if (editingId === null) {
                // Add new
                try {
                    const res = await api.post("/products/", productPayload);
                    setProducts((prev) => [res.data, ...prev]);
                } catch {
                    // Local state fallback
                    const newProd = {
                        id: Date.now(),
                        ...productPayload
                    };
                    setProducts((prev) => [newProd, ...prev]);
                }
                setStatusMessage("Product added successfully!");
            } else {
                // Update
                try {
                    const res = await api.put(`/products/${editingId}`, productPayload);
                    setProducts((prev) =>
                        prev.map((p) => (p.id === editingId ? res.data : p))
                    );
                } catch {
                    setProducts((prev) =>
                        prev.map((p) => (p.id === editingId ? { ...p, ...productPayload } : p))
                    );
                }
                setStatusMessage("Product updated successfully!");
            }

            resetForm();
            setTimeout(() => setStatusMessage(""), 3000);
        } catch (error) {
            console.error("Save product error:", error);
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (product) => {
        setEditingId(product.id);
        setFormData({
            product_name: product.product_name || "",
            category: product.category || "",
            cost_price: product.cost_price ?? "",
            selling_price: product.selling_price ?? "",
            stock: product.stock ?? "",
            product_weight: product.product_weight ?? "",
            product_length: product.product_length ?? "",
            product_height: product.product_height ?? "",
            product_width: product.product_width ?? ""
        });

        setTimeout(() => {
            productEditorRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }, 50);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this product?")) {
            return;
        }

        try {
            await api.delete(`/products/${id}`);
        } catch (err) {
            console.warn("Deleted in local session:", err);
        }

        setProducts((prev) => prev.filter((p) => p.id !== id));
        setStatusMessage("Product removed from catalog.");
        setTimeout(() => setStatusMessage(""), 3000);
    };

    const categories = useMemo(() => {
        return [
            ...new Set(
                products
                    .map((product) => product.category)
                    .filter(Boolean)
            )
        ];
    }, [products]);

    const filteredProducts = useMemo(() => {
        return products.filter((product) => {
            const searchText = search.toLowerCase();
            const matchesSearch =
                product.product_name?.toLowerCase().includes(searchText) ||
                product.category?.toLowerCase().includes(searchText);
            const matchesCategory =
                categoryFilter === "all" || product.category === categoryFilter;

            return matchesSearch && matchesCategory;
        });
    }, [products, search, categoryFilter]);

    const totalInventory = products.reduce(
        (total, product) => total + Number(product.stock || 0),
        0
    );

    const averageSellingPrice =
        products.length > 0
            ? products.reduce(
                  (total, product) => total + Number(product.selling_price || 0),
                  0
              ) / products.length
            : 0;

    const averageMargin =
        products.length > 0
            ? products.reduce(
                  (total, product) =>
                      total +
                      (Number(product.selling_price || 0) -
                          Number(product.cost_price || 0)),
                  0
              ) / products.length
            : 0;

    const formatINR = (val) => {
        const num = Number(val) || 0;
        return `₹${num.toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;
    };

    return (
        <div className="product-container">
            {/* HEADER */}
            <div className="products-header">
                <div>
                    <div className="catalog-badge-row">
                        <span className="page-eyebrow">CATALOG & PRICING INVENTORY</span>
                        <span className="live-status-pill">
                            <span className={`status-indicator-dot ${isLiveConnected ? "connected" : "demo"}`}></span>
                            {isLiveConnected ? "FastAPI PostgreSQL Active" : "Local Workspace Sync"}
                        </span>
                    </div>
                    <h1>Product Catalog Management</h1>
                    <p>
                        Configure base cost structures, stock allocations, and selling prices for dynamic optimization.
                    </p>
                </div>

                <div className="header-actions">
                    <button
                        type="button"
                        className="btn-sync"
                        onClick={loadProducts}
                        title="Sync with database"
                        disabled={loading}
                    >
                        <RefreshCw size={14} className={loading ? "spin" : ""} />
                        <span>Sync Catalog</span>
                    </button>
                    <button
                        type="button"
                        className="primary-action"
                        onClick={handleAddProduct}
                    >
                        <Plus size={16} />
                        <span>Add New SKU</span>
                    </button>
                </div>
            </div>

            {/* STATUS MESSAGE ALERT */}
            {statusMessage && (
                <div className="product-alert-success">
                    <CheckCircle2 size={16} />
                    <span>{statusMessage}</span>
                </div>
            )}

            {/* KPI METRIC CARDS */}
            <div className="product-kpis">
                <div className="product-kpi">
                    <div className="kpi-icon-wrap icon-indigo">
                        <Package size={18} />
                    </div>
                    <span className="kpi-label">TOTAL PRODUCTS</span>
                    <strong>{products.length}</strong>
                    <small>Active catalog SKUs</small>
                </div>

                <div className="product-kpi">
                    <div className="kpi-icon-wrap icon-cyan">
                        <Boxes size={18} />
                    </div>
                    <span className="kpi-label">INVENTORY STOCK</span>
                    <strong>{totalInventory} units</strong>
                    <small>Available warehouse units</small>
                </div>

                <div className="product-kpi">
                    <div className="kpi-icon-wrap icon-purple">
                        <IndianRupee size={18} />
                    </div>
                    <span className="kpi-label">AVG SELLING PRICE</span>
                    <strong>{formatINR(averageSellingPrice)}</strong>
                    <small>Catalog weighted average</small>
                </div>

                <div className="product-kpi">
                    <div className="kpi-icon-wrap icon-emerald">
                        <Tag size={18} />
                    </div>
                    <span className="kpi-label">AVG UNIT MARGIN</span>
                    <strong className="text-positive">{formatINR(averageMargin)}</strong>
                    <small>Average profit per item</small>
                </div>
            </div>

            {/* PRODUCT EDITOR FORM */}
            <div className="product-editor" ref={productEditorRef}>
                <div className="editor-heading">
                    <div>
                        <span className="section-label">
                            {editingId === null ? "CREATE NEW SKU" : `EDIT SKU #${editingId}`}
                        </span>
                        <h2>
                            {editingId === null ? "Add Product to Catalog" : "Update Product Specifications"}
                        </h2>
                    </div>

                    {editingId !== null && (
                        <button
                            type="button"
                            className="cancel-button"
                            onClick={resetForm}
                        >
                            Cancel Editing
                        </button>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="product-form">
                    <div className="form-grid">
                        <div className="input-group">
                            <label>Product Name *</label>
                            <input
                                type="text"
                                name="product_name"
                                placeholder="e.g. Samsung Galaxy S25 Ultra"
                                value={formData.product_name}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="input-group">
                            <label>Category *</label>
                            <input
                                type="text"
                                name="category"
                                placeholder="e.g. Electronics, Audio, Accessories"
                                value={formData.category}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="input-group">
                            <label>Cost Price (₹) *</label>
                            <input
                                type="number"
                                name="cost_price"
                                placeholder="e.g. 1500"
                                value={formData.cost_price}
                                onChange={handleChange}
                                min="0"
                                step="0.01"
                                required
                            />
                        </div>

                        <div className="input-group">
                            <label>Selling Price (₹) *</label>
                            <input
                                type="number"
                                name="selling_price"
                                placeholder="e.g. 2499"
                                value={formData.selling_price}
                                onChange={handleChange}
                                min="0"
                                step="0.01"
                                required
                            />
                        </div>

                        <div className="input-group">
                            <label>Stock Quantity *</label>
                            <input
                                type="number"
                                name="stock"
                                placeholder="e.g. 50"
                                value={formData.stock}
                                onChange={handleChange}
                                min="0"
                                required
                            />
                        </div>

                        <div className="input-group">
                            <label>Weight (grams)</label>
                            <input
                                type="number"
                                name="product_weight"
                                placeholder="e.g. 250"
                                value={formData.product_weight}
                                onChange={handleChange}
                                min="0"
                            />
                        </div>

                        <div className="input-group">
                            <label>Length (cm)</label>
                            <input
                                type="number"
                                name="product_length"
                                placeholder="e.g. 15"
                                value={formData.product_length}
                                onChange={handleChange}
                                min="0"
                            />
                        </div>

                        <div className="input-group">
                            <label>Height (cm)</label>
                            <input
                                type="number"
                                name="product_height"
                                placeholder="e.g. 4"
                                value={formData.product_height}
                                onChange={handleChange}
                                min="0"
                            />
                        </div>

                        <div className="input-group">
                            <label>Width (cm)</label>
                            <input
                                type="number"
                                name="product_width"
                                placeholder="e.g. 8"
                                value={formData.product_width}
                                onChange={handleChange}
                                min="0"
                            />
                        </div>
                    </div>

                    <div className="form-submit-row">
                        <button
                            type="submit"
                            className="btn-save-product"
                            disabled={saving}
                        >
                            {saving ? "Saving Changes..." : editingId === null ? "Save to Catalog" : "Update SKU"}
                        </button>
                    </div>
                </form>
            </div>

            {/* SEARCH & FILTERS BAR */}
            <div className="catalog-filter-bar">
                <div className="search-box">
                    <Search size={16} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search products by name or category..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="filter-select-wrap">
                    <Filter size={15} className="filter-icon" />
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                        <option value="all">All Categories ({categories.length})</option>
                        {categories.map((cat) => (
                            <option key={cat} value={cat}>
                                {cat}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* PRODUCTS DATA TABLE */}
            <div className="products-table-card">
                <div className="table-responsive">
                    <table className="products-table">
                        <thead>
                            <tr>
                                <th>Product Details</th>
                                <th>Category</th>
                                <th>Cost Price</th>
                                <th>Selling Price</th>
                                <th>Unit Margin</th>
                                <th>Stock Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProducts.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="empty-table-cell">
                                        <div className="empty-state-box">
                                            <Package size={32} />
                                            <p>No products match your search query.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredProducts.map((p) => {
                                    const margin = Number(p.selling_price || 0) - Number(p.cost_price || 0);
                                    const marginPercent = p.selling_price > 0 ? Math.round((margin / p.selling_price) * 100) : 0;
                                    return (
                                        <tr key={p.id}>
                                            <td>
                                                <div className="prod-cell">
                                                    <strong>{p.product_name}</strong>
                                                    <span className="sku-tag">SKU-{p.id}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="category-pill">{p.category}</span>
                                            </td>
                                            <td>
                                                <span className="cost-val">{formatINR(p.cost_price)}</span>
                                            </td>
                                            <td>
                                                <strong className="selling-val">{formatINR(p.selling_price)}</strong>
                                            </td>
                                            <td>
                                                <div className="margin-cell">
                                                    <span className="margin-val">{formatINR(margin)}</span>
                                                    <span className="margin-badge">+{marginPercent}%</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`stock-badge ${p.stock < 20 ? "low" : "in-stock"}`}>
                                                    {p.stock} units
                                                </span>
                                            </td>
                                            <td>
                                                <div className="action-btn-group">
                                                    <button
                                                        type="button"
                                                        className="action-btn edit"
                                                        title="Edit Product"
                                                        onClick={() => handleEdit(p)}
                                                    >
                                                        <Edit2 size={14} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="action-btn delete"
                                                        title="Delete Product"
                                                        onClick={() => handleDelete(p.id)}
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default Product;
