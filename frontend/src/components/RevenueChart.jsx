import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useData } from "../context/DataContext";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export default function RevenueChart() {
  const { stats, products, isDataLoaded, darkMode } = useData();

  const [view, setView] = useState("Revenue");

  const chartData = useMemo(() => {
    if (stats && stats.monthlyAnalytics && stats.monthlyAnalytics.length > 0) {
      return stats.monthlyAnalytics;
    }
    return MONTHS.map((month) => ({
      month,
      Revenue: 0,
      Sales: 0,
      Profit: 0,
      Forecast: 0,
    }));
  }, [stats]);

  const totalRevenue = chartData.reduce(
    (sum, item) => sum + item.Revenue,
    0
  );

  const totalSales = chartData.reduce(
    (sum, item) => sum + item.Sales,
    0
  );

  const totalProfit = chartData.reduce(
    (sum, item) => sum + item.Profit,
    0
  );

  if (!isDataLoaded && !products.length) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-lg border border-slate-200 dark:border-slate-800 p-10 text-center">
        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">
          Revenue Analytics
        </h2>
        <p className="text-slate-600 dark:text-slate-300 mt-3 text-lg font-medium">
          Upload a dataset to see charts.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-900 rounded-3xl shadow-lg border border-slate-200 dark:border-slate-800 p-8"
    >
      <div className="flex flex-col lg:flex-row justify-between items-center mb-8 gap-6">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Revenue Analytics
          </h2>
          <p className="text-slate-600 dark:text-slate-300 text-lg mt-2 font-medium">
            Monthly Business Performance & Financial Trends
          </p>
        </div>

        <div className="flex gap-3 flex-wrap">
          {["Revenue", "Sales", "Profit", "Forecast"].map((type) => (
            <button
              key={type}
              onClick={() => setView(type)}
              className={`px-5 py-2.5 rounded-xl font-bold transition shadow-sm cursor-pointer text-base ${
                view === type
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={380}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient
              id="gradient"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="5%"
                stopColor={darkMode ? "#60a5fa" : "#2563eb"}
                stopOpacity={0.8}
              />
              <stop
                offset="95%"
                stopColor={darkMode ? "#60a5fa" : "#2563eb"}
                stopOpacity={0.05}
              />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#334155" : "#cbd5e1"} />
          <XAxis dataKey="month" stroke={darkMode ? "#f1f5f9" : "#334155"} fontSize={14} fontWeight={600} tickLine={false} />
          <YAxis stroke={darkMode ? "#f1f5f9" : "#334155"} fontSize={14} fontWeight={600} tickLine={false} />
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
          <Area
            type="monotone"
            dataKey={view}
            stroke={darkMode ? "#60a5fa" : "#2563eb"}
            fill="url(#gradient)"
            strokeWidth={4}
          />
        </AreaChart>
      </ResponsiveContainer>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-700/60 rounded-2xl p-6">
          <p className="text-slate-700 dark:text-blue-200 font-bold text-lg">Total Revenue</p>
          <h2 className="text-3xl font-extrabold text-blue-700 dark:text-blue-300 mt-2">
            ₹{totalRevenue.toLocaleString()}
          </h2>
        </div>

        <div className="bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-700/60 rounded-2xl p-6">
          <p className="text-slate-700 dark:text-emerald-200 font-bold text-lg">Total Sales</p>
          <h2 className="text-3xl font-extrabold text-emerald-700 dark:text-emerald-300 mt-2">
            {totalSales.toLocaleString()}
          </h2>
        </div>

        <div className="bg-purple-50 dark:bg-purple-950/70 border border-purple-200 dark:border-purple-700/60 rounded-2xl p-6">
          <p className="text-slate-700 dark:text-purple-200 font-bold text-lg">Estimated Profit</p>
          <h2 className="text-3xl font-extrabold text-purple-700 dark:text-purple-300 mt-2">
            ₹{totalProfit.toLocaleString()}
          </h2>
        </div>
      </div>
    </motion.div>
  );
}