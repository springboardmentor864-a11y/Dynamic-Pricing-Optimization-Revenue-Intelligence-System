import { useState } from "react";
import { X } from "lucide-react";
import { useData } from "../context/DataContext";
import calculateStats from "../utils/calculateStats";
import api from "../services/api";
import toast from "react-hot-toast";
import { addActivityLog } from "../utils/activityLogger";

export default function AddProductModal({ isOpen, onClose, editProductId = null }) {
  const { products, setProducts, setStats } = useData();

  const [form, setForm] = useState(() => {
    const editProduct = editProductId !== null ? products.find((p) => p.id === editProductId) : null;
    if (editProduct) {
      return {
        product: editProduct.product || "",
        category: editProduct.category || "",
        price: editProduct.price || "",
        stock: editProduct.stock || "",
        sales: editProduct.sales || "",
      };
    }
    return {
      product: "",
      category: "",
      price: "",
      stock: "",
      sales: "",
    };
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const revenue = Number(form.price) * Number(form.sales);
    const profit = revenue * 0.3;

    const payload = {
      product: form.product,
      category: form.category,
      price: Number(form.price),
      stock: Number(form.stock),
      sales: Number(form.sales),
      revenue,
      profit,
      margin: 30,
    };

    setLoading(true);
    const toastId = toast.loading(editProductId !== null ? "Updating product..." : "Saving product...");
    try {
      let res;
      if (editProductId !== null) {
        res = await api.put(`/products/${editProductId}`, payload);
      } else {
        res = await api.post("/products", payload);
      }

      if (res.data && res.data.status === "success") {
        setProducts(res.data.products || []);
        setStats(res.data.stats || calculateStats(res.data.products));
        
        if (editProductId !== null) {
          addActivityLog("Product Updated", `Product ${payload.product} was modified.`, "edit");
        } else {
          addActivityLog("Product Added", `Product ${payload.product} was created.`, "plus");
        }

        toast.success(editProductId !== null ? "Product updated successfully!" : "Product added successfully!", { id: toastId });

        setForm({
          product: "",
          category: "",
          price: "",
          stock: "",
          sales: "",
        });
        onClose();
      } else {
        toast.error("Operation failed.", { id: toastId });
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Failed to save product.", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      onClick={handleOverlayClick}
      className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 cursor-pointer"
    >
      <div className="bg-white rounded-3xl w-full max-w-lg p-8 cursor-default" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">
            {editProductId !== null ? "Edit Product" : "Add Product"}
          </h2>
          <button onClick={onClose}>
            <X />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="product"
            placeholder="Product Name"
            value={form.product}
            onChange={handleChange}
            className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
            required
          />

          <input
            type="text"
            name="category"
            placeholder="Category"
            value={form.category}
            onChange={handleChange}
            className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
            required
          />

          <input
            type="number"
            name="price"
            placeholder="Price"
            value={form.price}
            onChange={handleChange}
            className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
            required
          />

          <input
            type="number"
            name="stock"
            placeholder="Stock"
            value={form.stock}
            onChange={handleChange}
            className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
            required
          />

          <input
            type="number"
            name="sales"
            placeholder="Sales"
            value={form.sales}
            onChange={handleChange}
            className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
            required
          />

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 rounded-xl border hover:bg-gray-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition disabled:bg-blue-400"
            >
              {loading
                ? (editProductId !== null ? "Updating..." : "Saving...")
                : (editProductId !== null ? "Update Product" : "Save Product")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
