import { useMemo } from "react";
import { useData } from "../context/DataContext";
import { motion } from "framer-motion";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

export default function CompetitorComparison() {
  const { products, isDataLoaded, darkMode } = useData();

  const chartData = useMemo(() => {
    if (!products || !products.length) return [];

    return products.slice(0, 8).map((item) => ({
      product: item.product || item.name || "Unknown",
      OurPrice: Number(item.price || 0),
      Competitor: Number(
        item.competitorPrice ??
        item.competitor_price ??
        item.marketPrice ??
        item.market_price ??
        item.price ??
        0
      ),
    }));
  }, [products]);

  if (!isDataLoaded && !products.length) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-lg border border-slate-200 dark:border-slate-800 p-8">
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
          Competitor Pricing Comparison
        </h2>
        <p className="text-slate-600 dark:text-slate-300 mt-3 text-base font-medium">
          Upload a CSV or Excel dataset first.
        </p>
      </div>
    );
  }

  const avgOurPrice = chartData.length > 0
    ? chartData.reduce((sum, item) => sum + item.OurPrice, 0) / chartData.length
    : 0;

  const avgCompetitorPrice = chartData.length > 0
    ? chartData.reduce((sum, item) => sum + item.Competitor, 0) / chartData.length
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-900 rounded-3xl shadow-lg border border-slate-200 dark:border-slate-800 p-8"
    >
      <div className="mb-8">
        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Competitor Pricing Intelligence
        </h2>
        <p className="text-slate-600 dark:text-slate-300 text-lg mt-2 font-medium">
          Compare internal listing prices against active market benchmarks
        </p>
      </div>

      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#334155" : "#cbd5e1"} />
          <XAxis dataKey="product" stroke={darkMode ? "#f1f5f9" : "#334155"} fontSize={13} fontWeight={600} tickLine={false} />
          <YAxis stroke={darkMode ? "#f1f5f9" : "#334155"} fontSize={13} fontWeight={600} tickLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: darkMode ? "#0f172a" : "#ffffff",
              borderColor: darkMode ? "#475569" : "#cbd5e1",
              borderRadius: "16px",
              color: darkMode ? "#ffffff" : "#0f172a",
              fontWeight: "700",
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.4)"
            }}
          />
          <Legend wrapperStyle={{ color: darkMode ? "#ffffff" : "#0f172a", fontWeight: "700" }} />
          <Bar dataKey="OurPrice" fill={darkMode ? "#60a5fa" : "#2563eb"} radius={[6, 6, 0, 0]} />
          <Bar dataKey="Competitor" fill={darkMode ? "#34d399" : "#10b981"} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-700/60 rounded-2xl p-6">
          <h3 className="font-bold text-slate-800 dark:text-blue-200 text-lg">Products Compared</h3>
          <p className="text-3xl font-extrabold text-blue-700 dark:text-blue-300 mt-2">
            {chartData.length}
          </p>
        </div>

        <div className="bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-700/60 rounded-2xl p-6">
          <h3 className="font-bold text-slate-800 dark:text-emerald-200 text-lg">Avg Our Price</h3>
          <p className="text-3xl font-extrabold text-emerald-700 dark:text-emerald-300 mt-2">
            ₹{avgOurPrice.toFixed(2)}
          </p>
        </div>

        <div className="bg-purple-50 dark:bg-purple-950/70 border border-purple-200 dark:border-purple-700/60 rounded-2xl p-6">
          <h3 className="font-bold text-slate-800 dark:text-purple-200 text-lg">Avg Competitor Price</h3>
          <p className="text-3xl font-extrabold text-purple-700 dark:text-purple-300 mt-2">
            ₹{avgCompetitorPrice.toFixed(2)}
          </p>
        </div>
      </div>
    </motion.div>
  );
}