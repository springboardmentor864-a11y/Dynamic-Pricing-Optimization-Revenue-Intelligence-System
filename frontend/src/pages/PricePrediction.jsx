import { useState, useEffect } from "react";
import { useData } from "../context/DataContext";
import api from "../services/api";
import toast from "react-hot-toast";
import {
  Brain,
  Sparkles,
  Info,
  RefreshCw,
} from "lucide-react";

export default function PricePrediction() {
  const { recommendations, activeDatasetHash } = useData();
  const [productNames, setProductNames] = useState([]);

  const [selectedProduct, setSelectedProduct] = useState("");
  const [modelName, setModelName] = useState("Random Forest");
  const [form, setForm] = useState({
    stock: "",
    sales: "",
    revenue: "",
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    api.get("/products/names").then((res) => {
      setProductNames(res.data || []);
    }).catch(console.error);
    setSelectedProduct("");
    setResult(null);
    setForm({ stock: "", sales: "", revenue: "" });
  }, [activeDatasetHash]);

  const handleProductChange = async (productName) => {
    setSelectedProduct(productName);
    setResult(null);
    if (productName) {
      try {
        const res = await api.get("/products/by-name", { params: { name: productName } });
        if (res.data) {
          setForm({
            stock: res.data.stock || 0,
            sales: res.data.sales || 0,
            revenue: res.data.revenue || 0,
          });
        }
      } catch (e) {
        console.error(e);
      }
    } else {
      setForm({
        stock: "",
        sales: "",
        revenue: "",
      });
    }
  };

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handlePredict = async (e) => {
    e.preventDefault();
    if (!selectedProduct) {
      toast.error("Please select a product first.");
      return;
    }

    setLoading(true);
    setResult(null);

    const payload = {
      product_name: selectedProduct,
      stock: Number(form.stock),
      sales: Number(form.sales),
      revenue: Number(form.revenue),
      model_name: modelName,
    };

    try {
      const res = await api.post("/predict-price", payload);
      if (res.data) {
        setResult(res.data);
        toast.success("Prediction calculated successfully!");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Failed to calculate prediction.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <Brain className="text-blue-600" size={36} />
            AI Price Prediction
          </h1>
          <p className="text-slate-500 text-lg mt-2">
            Optimize margins and predict selling prices using multiple Machine Learning and time-series models.
          </p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column - Predictor Panel */}
        <div className="lg:col-span-5 space-y-8">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-6 space-y-6">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Sparkles className="text-blue-600" size={24} />
              Prediction Setup
            </h2>

            <form onSubmit={handlePredict} className="space-y-4">
              {/* Product Selection */}
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-2">
                  Select Target Product
                </label>
                <select
                  value={selectedProduct}
                  onChange={(e) => handleProductChange(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                  required
                >
                  <option value="">-- Choose Product --</option>
                  {productNames.map((name, idx) => (
                    <option key={idx} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Model Selection */}
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-2">
                  Prediction Model
                </label>
                <select
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                >
                  <option value="Random Forest">Random Forest Regressor</option>
                  <option value="XGBoost">XGBoost Regressor</option>
                  <option value="Prophet">Prophet (Time Series)</option>
                  <option value="ARIMA">ARIMA (Time Series)</option>
                  <option value="Deep Learning (MLP)">Deep Learning (MLP Neural Net)</option>
                </select>
              </div>

              {/* Numerical Inputs (What-if variables) */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    Stock
                  </label>
                  <input
                    type="number"
                    name="stock"
                    value={form.stock}
                    onChange={handleChange}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    Recent Sales
                  </label>
                  <input
                    type="number"
                    name="sales"
                    value={form.sales}
                    onChange={handleChange}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    Revenue
                  </label>
                  <input
                    type="number"
                    name="revenue"
                    value={form.revenue}
                    onChange={handleChange}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg hover:shadow-blue-200 transition duration-300 disabled:bg-blue-400 disabled:shadow-none mt-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="animate-spin" size={20} />
                    Calculating...
                  </>
                ) : (
                  <>
                    <Sparkles size={20} />
                    Run AI Prediction
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Prediction Result Display */}
          {result && (
            <div className="bg-gradient-to-br from-slate-900 to-blue-950 rounded-3xl shadow-xl p-6 text-white space-y-6 animate-fade-in">
              <h3 className="text-xl font-bold flex items-center gap-2 border-b border-white/10 pb-3">
                <Brain className="text-blue-400" size={22} />
                Prediction Output
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                  <span className="text-xs text-blue-300 uppercase font-bold tracking-wider">
                    Recommended Price
                  </span>
                  <h4 className="text-3xl font-extrabold mt-1 text-white">
                    ₹{result.predictedPrice.toLocaleString()}
                  </h4>
                </div>

                <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex flex-col justify-center">
                  <span className="text-xs text-blue-300 uppercase font-bold tracking-wider mb-2">
                    Suggested Action
                  </span>
                  <div>
                    <span
                      className={`px-3 py-1.5 rounded-xl font-extrabold text-sm ${
                        result.action === "Increase"
                          ? "bg-green-500/20 text-green-300 border border-green-500/30"
                          : result.action === "Decrease"
                          ? "bg-red-500/20 text-red-300 border border-red-500/30"
                          : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                      }`}
                    >
                      {result.action} Price
                    </span>
                  </div>
                </div>
              </div>

              {/* Confidence Gauge */}
              <div className="bg-white/5 rounded-2xl p-4 border border-white/5 space-y-2">
                <div className="flex justify-between items-center text-sm font-semibold">
                  <span className="text-slate-300">Model Confidence</span>
                  <span className="text-blue-400">{result.confidenceScore}%</span>
                </div>
                <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-1000"
                    style={{ width: `${result.confidenceScore}%` }}
                  />
                </div>
                <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                  <Info size={12} />
                  Calculated using {modelName} training metrics.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Catalog Recommendations Table */}
        <div className="lg:col-span-7 bg-white rounded-3xl shadow-xl border border-slate-100 p-6 space-y-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              Pricing Recommendation Directory
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              Dynamic pricing suggestions generated from the latest dataset.
            </p>
          </div>

          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full">
              <thead>
                <tr className="border-b text-slate-400 text-xs font-bold uppercase tracking-wider">
                  <th className="text-left py-3">Product</th>
                  <th className="text-center py-3">Price</th>
                  <th className="text-center py-3">Suggested</th>
                  <th className="text-center py-3">Rev. Gain</th>
                  <th className="text-center py-3">Action</th>
                  <th className="text-center py-3">Risk</th>
                  <th className="text-left py-3 pl-4">Reason</th>
                </tr>
              </thead>
              <tbody>
                {recommendations.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-slate-400">
                      No recommendations computed. Upload a dataset first.
                    </td>
                  </tr>
                ) : (
                  recommendations.map((item, idx) => {
                    const priceVal = Number(item.price || 0);
                    const suggestedVal = Number(item.suggestedPrice || priceVal);
                    const revGain = Number(item.revenueIncrease || 0);
                    const recAction = item.recommendation || "Maintain Price";
                    const risk = item.risk || "Low";
                    
                    return (
                      <tr
                        key={idx}
                        className="border-b hover:bg-slate-50/50 transition text-sm"
                      >
                        <td className="py-4 font-semibold text-slate-800 max-w-[150px] truncate">
                          {item.product}
                        </td>
                        <td className="text-center py-4 font-bold text-slate-700">
                          ₹{priceVal.toLocaleString()}
                        </td>
                        <td className="text-center py-4 font-bold text-blue-600">
                          ₹{suggestedVal.toLocaleString()}
                        </td>
                        <td className="text-center py-4 font-semibold text-emerald-600">
                          +₹{revGain.toLocaleString()}
                        </td>
                        <td className="text-center py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-[11px] font-bold inline-block ${
                              recAction.includes("Increase")
                                ? "bg-green-100 text-green-700"
                                : recAction.includes("Decrease")
                                ? "bg-red-100 text-red-700"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {recAction}
                          </span>
                        </td>
                        <td className="text-center py-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold inline-block ${
                              risk === "High"
                                ? "bg-red-50 text-red-600 border border-red-100"
                                : risk === "Medium"
                                ? "bg-amber-50 text-amber-600 border border-amber-100"
                                : "bg-slate-50 text-slate-600 border border-slate-100"
                            }`}
                          >
                            {risk}
                          </span>
                        </td>
                        <td className="py-4 text-slate-500 text-xs pl-4 max-w-[180px] truncate">
                          {item.reason}
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
    </div>
  );
}