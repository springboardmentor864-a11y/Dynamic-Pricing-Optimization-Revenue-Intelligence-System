import { useState, useEffect } from "react";
import { Search, Download, Edit, Trash2 } from "lucide-react";
import * as XLSX from "xlsx";

import AddProductModal from "./AddProductModal";
import { useData } from "../context/DataContext";
import api from "../services/api";
import toast from "react-hot-toast";
import { addActivityLog } from "../utils/activityLogger";

export default function ProductTable() {
  const { products, setProducts, setStats, fetchProducts, totalCount, categories } = useData();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("default");
  const [openModal, setOpenModal] = useState(false);
  const [editProductId, setEditProductId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const itemsPerPage = 25;

  // Sync state from server on filters/pagination change
  useEffect(() => {
    fetchProducts(currentPage, itemsPerPage, search, category, sort);
  }, [currentPage, search, category, sort]);

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const deleteProduct = async (id) => {
    if (!window.confirm("Delete this product?")) return;

    const toastId = toast.loading("Deleting product...");
    try {
      const res = await api.delete(`/products/${id}`);
      if (res.data && res.data.status === "success") {
        setProducts(res.data.products || []);
        setStats(res.data.stats || {});
        addActivityLog("Product Deleted", "Removed a product from the database.", "trash");
        toast.success("Product deleted successfully!", { id: toastId });
        setSelectedIds((prev) => prev.filter((item) => item !== id));
        // Reset to first page
        setCurrentPage(1);
      } else {
        toast.error("Failed to delete product.", { id: toastId });
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Failed to delete product.", { id: toastId });
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;
    if (!window.confirm(`Delete ${selectedIds.length} selected products?`)) return;

    const toastId = toast.loading(`Deleting ${selectedIds.length} products...`);
    try {
      const res = await api.post("/products/bulk-delete", { ids: selectedIds });
      if (res.data && res.data.status === "success") {
        setProducts(res.data.products || []);
        setStats(res.data.stats || {});
        addActivityLog("Bulk Delete", `Deleted ${selectedIds.length} products from inventory.`, "trash");
        toast.success("Products deleted successfully!", { id: toastId });
        setSelectedIds([]);
        setCurrentPage(1);
      } else {
        toast.error("Bulk delete failed.", { id: toastId });
      }
    } catch (err) {
      console.error(err);
      toast.error("Bulk delete operation failed.", { id: toastId });
    }
  };

  const fetchExportData = async () => {
    const toastId = toast.loading("Preparing report export...");
    try {
      const res = await api.get("/products", {
        params: { page: 1, limit: 10000, search, category, sort }
      });
      toast.dismiss(toastId);
      return res.data?.products || [];
    } catch (e) {
      toast.dismiss(toastId);
      console.error(e);
      return products;
    }
  };

  const exportCSV = async () => {
    const exportData = await fetchExportData();
    if (exportData.length === 0) {
      toast.error("No product records to export.");
      return;
    }

    const headers = ["product", "category", "price", "stock", "sales", "revenue", "profit"];
    const csv = [
      headers.join(","),
      ...exportData.map((row) =>
        headers.map((field) => `"${row[field] || 0}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "products_export.csv";
    link.click();
    URL.revokeObjectURL(url);
    addActivityLog("Report Exported", "Exported product inventory as CSV.", "download");
    toast.success("CSV exported successfully!");
  };

  const exportExcel = async () => {
    const exportData = await fetchExportData();
    if (exportData.length === 0) {
      toast.error("No product records to export.");
      return;
    }
    const ws = XLSX.utils.json_to_sheet(exportData.map(p => ({
      Product: p.product || p.name,
      Category: p.category || "General",
      Price: Number(p.price || 0),
      Stock: Number(p.stock || 0),
      Sales: Number(p.sales || 0),
      Revenue: Number(p.revenue || 0),
      Profit: Number(p.profit || 0)
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventory");
    XLSX.writeFile(wb, "PricePilot_Inventory.xlsx");
    addActivityLog("Report Exported", "Exported product inventory as Excel.", "download");
    toast.success("Excel exported successfully!");
  };

  const exportPDF = async () => {
    const exportData = await fetchExportData();
    if (exportData.length === 0) {
      toast.error("No product records to export.");
      return;
    }
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>PricePilot AI Product Report</title>
          <style>
            body { font-family: sans-serif; padding: 25px; color: #1e293b; }
            h1 { color: #2563eb; margin-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 25px; }
            th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; }
            th { background-color: #f8fafc; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>PricePilot AI - Product Inventory Report</h1>
          <p>Generated dynamically from active dataset. Total items: ${exportData.length}</p>
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Sales</th>
                <th>Revenue</th>
              </tr>
            </thead>
            <tbody>
              ${exportData.map(p => `
                <tr>
                  <td>${p.product || p.name}</td>
                  <td>${p.category || "General"}</td>
                  <td>₹${Number(p.price || 0).toLocaleString()}</td>
                  <td>${p.stock}</td>
                  <td>${p.sales}</td>
                  <td>₹${Number(p.revenue || 0).toLocaleString()}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
    addActivityLog("Report Exported", "Exported product inventory as PDF.", "download");
    toast.success("PDF report generated!");
  };

  if (!products || products.length === 0) {
    return (
      <div className="bg-white rounded-3xl shadow-lg border p-10 text-center">
        <h2 className="text-3xl font-bold">Product Inventory</h2>
        <p className="text-gray-500 mt-3">No products available. Upload a dataset to begin.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-lg border p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6 mb-8">
        <div>
          <h2 className="text-3xl font-bold">Product Inventory</h2>
          <p className="text-gray-500 mt-2">
            Manage products from your uploaded dataset
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {selectedIds.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-xl flex items-center gap-2 shadow transition cursor-pointer"
            >
              <Trash2 size={16} />
              Delete Selected ({selectedIds.length})
            </button>
          )}

          {/* Search */}
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search product..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10 pr-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 w-64"
            />
          </div>

          {/* Category Filter */}
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2 border rounded-xl"
          >
            <option value="All">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2 border rounded-xl"
          >
            <option value="default">Sort By</option>
            <option value="price-low">Price ↑</option>
            <option value="price-high">Price ↓</option>
            <option value="name">Name A-Z</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b text-gray-500">
              <th className="text-center px-4 py-4 w-12">
                <input
                  type="checkbox"
                  checked={products.length > 0 && products.every(p => selectedIds.includes(p.id))}
                  onChange={(e) => {
                    if (e.target.checked) {
                      const allIds = products.map(p => p.id);
                      setSelectedIds(prev => [...new Set([...prev, ...allIds])]);
                    } else {
                      const pageIds = products.map(p => p.id);
                      setSelectedIds(prev => prev.filter(id => !pageIds.includes(id)));
                    }
                  }}
                  className="w-4 h-4 rounded cursor-pointer accent-blue-600"
                />
              </th>
              <th className="text-left py-4">Product</th>
              <th className="text-center">Category</th>
              <th className="text-center">Price</th>
              <th className="text-center">Stock</th>
              <th className="text-center">Status</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-6 text-gray-500">
                  No products found.
                </td>
              </tr>
            ) : (
              products.map((item, index) => {
                const itemIndex = (currentPage - 1) * itemsPerPage + index;
                const productName = item.product || item.name || "Unknown Product";
                const catName = item.category || "General";
                const price = Number(item.price || 0);
                const stock = Number(item.stock || 0);
                const status =
                  stock === 0
                    ? "Out of Stock"
                    : stock < 20
                    ? "Low Stock"
                    : "Available";

                return (
                  <tr
                    key={item.id || itemIndex}
                    className="border-b hover:bg-gray-50 transition"
                  >
                    <td className="text-center px-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(item.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds(prev => [...prev, item.id]);
                          } else {
                            setSelectedIds(prev => prev.filter(id => id !== item.id));
                          }
                        }}
                        className="w-4 h-4 rounded cursor-pointer accent-blue-600"
                      />
                    </td>
                    <td className="py-5">
                      <div className="flex items-center gap-4">
                        <img
                          src={item.image || `https://picsum.photos/60?random=${itemIndex}`}
                          alt={productName}
                          className="w-14 h-14 rounded-xl object-cover border"
                        />
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {productName}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {item.sku ? `SKU: ${item.sku}` : `Product #${itemIndex + 1}`}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="text-center">{catName}</td>
                    <td className="text-center font-semibold">
                      ₹{price.toLocaleString()}
                    </td>
                    <td className="text-center">{stock}</td>
                    <td className="text-center">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          status === "Available"
                            ? "bg-green-100 text-green-700"
                            : status === "Low Stock"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {status}
                      </span>
                    </td>
                    <td>
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => {
                            setEditProductId(item.id);
                            setOpenModal(true);
                          }}
                          className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition cursor-pointer"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => deleteProduct(item.id)}
                          className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition cursor-pointer"
                        >
                          <Trash2 size={18} />
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

      <div className="flex flex-col md:flex-row justify-between items-center mt-8 gap-4">
        <p className="text-gray-500">
          Showing{" "}
          <span className="font-bold text-black">
            {Math.min(totalCount, (currentPage - 1) * itemsPerPage + 1)}-
            {Math.min(totalCount, currentPage * itemsPerPage)}
          </span>{" "}
          of{" "}
          <span className="font-bold text-black">
            {totalCount}
          </span>{" "}
          products
        </p>

        <div className="flex items-center gap-3">
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow transition cursor-pointer text-sm"
          >
            <Download size={16} />
            CSV
          </button>
          <button
            onClick={exportExcel}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow transition cursor-pointer text-sm"
          >
            <Download size={16} />
            Excel
          </button>
          <button
            onClick={exportPDF}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow transition cursor-pointer text-sm"
          >
            <Download size={16} />
            PDF
          </button>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="px-4 py-2 border rounded-xl hover:bg-gray-100 transition disabled:opacity-50 disabled:hover:bg-white text-sm font-semibold cursor-pointer"
          >
            Previous
          </button>
          <span className="text-sm font-semibold text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="px-4 py-2 border rounded-xl hover:bg-gray-100 transition disabled:opacity-50 disabled:hover:bg-white text-sm font-semibold cursor-pointer"
          >
            Next
          </button>
        </div>
      )}

      <AddProductModal
        key={openModal ? (editProductId !== null ? `edit-${editProductId}` : "add") : "closed"}
        isOpen={openModal}
        onClose={() => {
          setOpenModal(false);
          setEditProductId(null);
        }}
        editProductId={editProductId}
      />
    </div>
  );
}
