import {
  Package,
  TrendingUp,
  AlertTriangle,
  DollarSign,
} from "lucide-react";
import { useData } from "../context/DataContext";

export default function ProductStats() {
  const { stats, anomalies } = useData();

  const dynamicStats = [
    {
      title: "Total Products",
      value: Number(stats.totalProducts || 0).toLocaleString(),
      icon: Package,
      color: "bg-blue-500",
    },
    {
      title: "Price Changes",
      value: Number(stats.priceChanges || 0).toLocaleString(),
      icon: TrendingUp,
      color: "bg-green-500",
    },
    {
      title: "Active Alerts",
      value: Number(anomalies.length || stats.competitorAlerts || 0).toLocaleString(),
      icon: AlertTriangle,
      color: "bg-orange-500",
    },
    {
      title: "Average Price",
      value: `₹${Number(stats.averagePrice || 0).toFixed(2)}`,
      icon: DollarSign,
      color: "bg-purple-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {dynamicStats.map((item) => {
        const Icon = item.icon;

        return (
          <div
            key={item.title}
            className="bg-white rounded-3xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300"
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-500 text-lg">
                  {item.title}
                </p>
                <h2 className="text-5xl font-bold mt-5">
                  {item.value}
                </h2>
              </div>
              <div
                className={`${item.color} w-20 h-20 rounded-3xl flex items-center justify-center text-white shadow-lg`}
              >
                <Icon size={38} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}