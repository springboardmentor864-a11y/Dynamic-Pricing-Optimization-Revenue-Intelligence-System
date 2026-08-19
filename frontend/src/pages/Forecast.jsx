import { useState, useMemo, useEffect } from "react";
import { useData } from "../context/DataContext";
import api from "../services/api";
import toast from "react-hot-toast";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Calendar,
  Sparkles,
  Info,
  RefreshCw,
  BarChart2,
  Brain,
} from "lucide-react";

const MONTH_MAP = {'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'May': 5, 'Jun': 6,
                   'Jul': 7, 'Aug': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12};

export default function Forecast() {
  const { activeDatasetHash } = useData();
  const [selectedProduct, setSelectedProduct] = useState("");
  const [modelName, setModelName] = useState("Random Forest");
  const [horizon, setHorizon] = useState("30 days");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const [productNames, setProductNames] = useState([]);
  const [productDetails, setProductDetails] = useState(null);
  const [historyData, setHistoryData] = useState([]);

  useEffect(() => {
    api.get("/products/names").then((res) => {
      setProductNames(res.data || []);
    }).catch(console.error);
    setSelectedProduct("");
    setResult(null);
    setProductDetails(null);
    setHistoryData([]);
  }, [activeDatasetHash]);

  const handleProductChange = async (productName) => {
    setSelectedProduct(productName);
    setResult(null);
    setProductDetails(null);
    setHistoryData([]);
    if (productName) {
      try {
        const detailsRes = await api.get("/products/by-name", { params: { name: productName } });
        if (detailsRes.data) {
          setProductDetails(detailsRes.data);
        }
        
        const historyRes = await api.get("/products/history", { params: { name: productName } });
        if (historyRes.data) {
          setHistoryData(historyRes.data);
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  const chartData = useMemo(() => {
    if (!selectedProduct) return [];

    let prodHistory = historyData
      .map((p) => ({
        month: p.month || "Unknown",
        sales: Number(p.sales || 0),
        monthIdx: MONTH_MAP[p.month] || 1,
      }))
      .sort((a, b) => a.monthIdx - b.monthIdx);

    if (prodHistory.length === 0 && productDetails) {
      prodHistory.push({
        month: "Current",
        sales: Number(productDetails.sales || 0),
        monthIdx: 1,
      });
    }

    if (result && result.forecastDemand !== undefined) {
      prodHistory = [
        ...prodHistory,
        {
          month: `Forecast (${horizon})`,
          sales: result.forecastDemand,
          isForecast: true,
          monthIdx: 13,
        },
      ];
    }

    return prodHistory;
  }, [selectedProduct, historyData, productDetails, result, horizon]);

  const handleForecast = async (e) => {
    e.preventDefault();
    if (!selectedProduct || !productDetails) {
      toast.error("Please select a product first.");
      return;
    }

    setLoading(true);
    setResult(null);

    const payload = {
      product_name: selectedProduct,
      price: Number(productDetails.price || 0),
      stock: Number(productDetails.stock || 0),
      revenue: Number(productDetails.revenue || 0),
      model_name: modelName,
      horizon: horizon,
    };

    try {
      const res = await api.post("/forecast-demand", payload);
      if (res.data) {
        setResult(res.data);
        toast.success("Demand forecast generated successfully!");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Failed to generate demand forecast.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
          <BarChart2 className="text-blue-600" size={36} />
          Demand Forecasting Engine
        </h1>
        <p className="text-slate-500 text-lg mt-2">
          Project future inventory needs and predict sales metrics over short, medium, and long-term horizons.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column - Setup */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-6 space-y-6">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Calendar className="text-blue-600" size={24} />
              Forecast Parameters
            </h2>

            <form onSubmit={handleForecast} className="space-y-4">
              {/* Product Select */}
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-2">
                  Select Product
                </label>
                <select
                  value={selectedProduct}
                  onChange={(e) => {
                    handleProductChange(e.target.value);
                  }}
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

              {/* Model Select */}
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-2">
                  Forecasting Model
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

              {/* Horizon Select */}
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-2">
                  Forecast Horizon
                </label>
                <select
                  value={horizon}
                  onChange={(e) => setHorizon(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                >
                  <option value="7 days">Short-Term: Next 7 Days</option>
                  <option value="14 days">Short-Term: Next 14 Days</option>
                  <option value="30 days">Short-Term: Next 30 Days</option>
                  <option value="3 months">Medium-Term: Next 3 Months</option>
                  <option value="6 months">Medium-Term: Next 6 Months</option>
                  <option value="12 months">Long-Term: Next 12 Months</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg hover:shadow-blue-200 transition duration-300 disabled:bg-blue-400 mt-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="animate-spin" size={20} />
                    Forecasting...
                  </>
                ) : (
                  <>
                    <Sparkles size={20} />
                    Generate Forecast
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Results Summary */}
          {result && (
            <div className="bg-gradient-to-br from-slate-900 to-blue-950 rounded-3xl shadow-xl p-6 text-white space-y-6 animate-fade-in">
              <h3 className="text-xl font-bold flex items-center gap-2 border-b border-white/10 pb-3">
                <Brain className="text-blue-400" size={22} />
                Forecast Output
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                  <span className="text-xs text-blue-300 uppercase font-bold tracking-wider">
                    Predicted Units
                  </span>
                  <h4 className="text-3xl font-extrabold mt-1 text-white">
                    {result.forecastDemand.toLocaleString()}
                  </h4>
                  <span className="text-[10px] text-slate-400 block mt-1">Expected sales units</span>
                </div>

                <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex flex-col justify-center">
                  <span className="text-xs text-blue-300 uppercase font-bold tracking-wider mb-2">
                    Demand Trend
                  </span>
                  <div>
                    <span
                      className={`px-3 py-1.5 rounded-xl font-extrabold text-xs inline-block ${
                        result.demandTrend === "Increasing Demand"
                          ? "bg-green-500/20 text-green-300 border border-green-500/30"
                          : result.demandTrend === "Decreasing Demand"
                          ? "bg-red-500/20 text-red-300 border border-red-500/30"
                          : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                      }`}
                    >
                      {result.demandTrend}
                    </span>
                  </div>
                </div>
              </div>

              {/* Confidence Score */}
              <div className="bg-white/5 rounded-2xl p-4 border border-white/5 space-y-2">
                <div className="flex justify-between items-center text-sm font-semibold">
                  <span className="text-slate-300">Confidence Score</span>
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
                  Based on historical seasonal trend data.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Visual Chart */}
        <div className="lg:col-span-8 bg-white rounded-3xl shadow-xl border border-slate-100 p-6 flex flex-col space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              Demand & Sales Trend Visualization
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              Historical units sold mapped alongside future demand predictions.
            </p>
          </div>

          <div className="flex-1 min-h-[350px] w-full">
            {chartData.length === 0 ? (
              <div className="h-full w-full flex flex-col justify-center items-center text-slate-400 bg-slate-50 rounded-2xl p-8 border border-dashed border-slate-200">
                <BarChart2 size={48} className="mb-2 text-slate-300 animate-pulse" />
                Select a product to view trend analytics.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={380}>
                <LineChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="month"
                    stroke="#94a3b8"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    label={{
                      value: "Units Sold",
                      angle: -90,
                      position: "insideLeft",
                      style: { fill: "#94a3b8", fontWeight: "bold" },
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      color: "#fff",
                      borderRadius: "16px",
                      border: "none",
                      boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Line
                    type="monotone"
                    name="Historical Sales"
                    dataKey="sales"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={{ stroke: "#3b82f6", strokeWidth: 2, r: 4, fill: "#fff" }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}