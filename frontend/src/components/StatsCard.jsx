import {
  Package,
  DollarSign,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";
import { motion } from "framer-motion";
import { useData } from "../context/DataContext";

function formatAbbreviated(value, isCurrency = true) {
  const num = typeof value === "number" ? value : parseFloat(value);
  if (isNaN(num)) return value;
  
  const prefix = isCurrency ? "₹" : "";
  if (num >= 1e9) {
    return `${prefix}${(num / 1e9).toFixed(2)}B`;
  }
  if (num >= 1e6) {
    return `${prefix}${(num / 1e6).toFixed(1)}M`;
  }
  if (num >= 1e3) {
    return `${prefix}${(num / 1e3).toFixed(1)}K`;
  }
  return `${prefix}${num.toLocaleString()}`;
}

export default function StatsCard() {
  const { stats } = useData();

  const cards = [
    {
      title: "Total Products",
      value: formatAbbreviated(stats.totalProducts || 0, false),
      fullValue: (stats.totalProducts || 0).toLocaleString(),
      subtext: `Avg. Price: ₹${Number(stats.averagePrice || 0).toFixed(2)}`,
      icon: Package,
      color: "bg-blue-500",
    },
    {
      title: "Total Revenue",
      value: formatAbbreviated(stats.totalRevenue || 0, true),
      fullValue: `₹${Number(stats.totalRevenue || 0).toLocaleString()}`,
      subtext: `Avg. Rev: ₹${Number(stats.averageRevenue || 0).toLocaleString()}`,
      icon: DollarSign,
      color: "bg-emerald-500",
    },
    {
      title: "Estimated Profit",
      value: formatAbbreviated(stats.profit || 0, true),
      fullValue: `₹${Number(stats.profit || 0).toLocaleString()}`,
      subtext: "Dynamic 30% margin yield",
      icon: TrendingUp,
      color: "bg-violet-500",
    },
    {
      title: "Inventory Asset Value",
      value: formatAbbreviated(stats.inventoryValue || 0, true),
      fullValue: `₹${Number(stats.inventoryValue || 0).toLocaleString()}`,
      subtext: `${stats.lowStock || 0} Low Stock Alerts`,
      icon: ShoppingCart,
      color: "bg-amber-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
      {cards.map((card, index) => {
        const Icon = card.icon;

        return (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6 flex flex-col justify-between cursor-pointer"
          >
            <div className="flex justify-between items-start gap-4">
              <div className="space-y-1 min-w-0 flex-1">
                <p className="text-gray-500 text-sm font-semibold tracking-wide truncate">
                  {card.title}
                </p>
                <h2 
                  className="text-xl sm:text-2xl font-semibold text-slate-800 mt-1 tracking-tight break-words"
                  title={card.fullValue}
                >
                  {card.value}
                </h2>
              </div>
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow flex-shrink-0 ${card.color}`}
              >
                <Icon size={24} />
              </div>
            </div>
            {card.subtext && (
              <div className="mt-4 pt-3 border-t border-slate-50 text-xs font-semibold text-slate-500">
                {card.subtext}
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}