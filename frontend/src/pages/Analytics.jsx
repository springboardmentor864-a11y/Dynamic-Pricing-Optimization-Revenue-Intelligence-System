import RevenueChart from "../components/RevenueChart";
import CompetitorComparison from "../components/CompetitorComparison";
import AIInsights from "../components/AIInsights";
import { useData } from "../context/DataContext";

import {
  TrendingUp,
  DollarSign,
  BarChart3,
  Package,
} from "lucide-react";

export default function Analytics() {
  const { stats, isDataLoaded } = useData();

  function formatAbbreviated(value, isCurrency = true) {
    const num = typeof value === "number" ? value : parseFloat(value);
    if (isNaN(num)) return value;
    const prefix = isCurrency ? "₹" : "";
    if (num >= 1e9) return `${prefix}${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${prefix}${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `${prefix}${(num / 1e3).toFixed(1)}K`;
    return `${prefix}${num.toLocaleString()}`;
  }

  const cards = [
    {
      title: "Total Revenue",
      value: isDataLoaded ? formatAbbreviated(stats.totalRevenue || 0, true) : "No dataset available",
      icon: DollarSign,
      color: "bg-blue-500",
    },
    {
      title: "Estimated Profit",
      value: isDataLoaded ? formatAbbreviated(stats.profit || 0, true) : "No dataset available",
      icon: TrendingUp,
      color: "bg-green-500",
    },
    {
      title: "Total Products",
      value: isDataLoaded ? (stats.totalProducts || 0).toLocaleString() : "No dataset available",
      icon: Package,
      color: "bg-purple-500",
    },
    {
      title: "Model Accuracy",
      value: isDataLoaded ? `${stats.predictionAccuracy || 92}%` : "No dataset available",
      icon: BarChart3,
      color: "bg-orange-500",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-blue-50 p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
          Analytics & Performance Insights
        </h1>
        <p className="text-gray-500 mt-2">
          AI Powered Dynamic Business Metrics
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        {cards.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className="bg-white rounded-2xl shadow-md border border-slate-100 p-6 hover:shadow-lg transition duration-200"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-500 font-semibold text-sm">
                    {item.title}
                  </p>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 mt-3">
                    {item.value}
                  </h2>
                </div>
                <div
                  className={`w-14 h-14 rounded-2xl ${item.color} flex items-center justify-center text-white shadow-sm flex-shrink-0`}
                >
                  <Icon size={26} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-8">
          <RevenueChart />
          <CompetitorComparison />
        </div>
        <div>
          <AIInsights />
        </div>
      </div>
    </div>
  );
}