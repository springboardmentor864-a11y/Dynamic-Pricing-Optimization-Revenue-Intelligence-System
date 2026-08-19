import { useMemo, useState } from "react";
import { useData } from "../context/DataContext";
import {
  Bell,
  AlertTriangle,
  Package,
} from "lucide-react";

export default function Alerts() {
  const { anomalies, products } = useData();

  const [dismissedAlertIds, setDismissedAlertIds] = useState([]);

  const activeAlerts = useMemo(() => {
    return anomalies
      .filter((item) => !dismissedAlertIds.includes(item.id))
      .map((item, idx) => {
        const stock = Number(item.stock || 0);
        const price = Number(item.price || 0);
        const sales = Number(item.sales || 0);
        
        let priority = "Medium";
        let message = "AI Flagged: Product represents a statistical pricing outlier.";
        
        if (stock < 10) {
          priority = "High";
          message = "Critical: Very low inventory level matched with abnormal sales volume.";
        } else if (price > 50000 && sales < 5) {
          priority = "High";
          message = "Anomaly Alert: Extremely high listing price with stagnant inventory velocity.";
        } else if (stock === 0) {
          priority = "High";
          message = "Stockout Alert: Product is out of stock.";
        }

        return {
          id: item.id || idx,
          product: item.product || "Unknown Product",
          message,
          priority,
          time: "Just updated",
        };
      });
  }, [anomalies, dismissedAlertIds]);

  const stats = useMemo(() => {
    const total = activeAlerts.length;
    const critical = activeAlerts.filter((a) => a.priority === "High").length;
    const lowStockCount = products.filter((p) => Number(p.stock || 0) < 20).length;

    return [
      {
        title: "Active Alerts",
        value: total.toString(),
        icon: Bell,
        color: "bg-blue-500",
      },
      {
        title: "Critical Anomalies",
        value: critical.toString(),
        icon: AlertTriangle,
        color: "bg-red-500",
      },
      {
        title: "Low Stock Warnings",
        value: lowStockCount.toString(),
        icon: Package,
        color: "bg-amber-500",
      },
    ];
  }, [activeAlerts, products]);

  const handleDismiss = (id) => {
    setDismissedAlertIds([...dismissedAlertIds, id]);
  };

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
          <Bell className="text-blue-600 dark:text-blue-400 animate-bounce" size={40} />
          Price Alerts & Outliers
        </h1>
        <p className="text-slate-600 dark:text-slate-300 text-xl mt-3 font-medium">
          AI monitors sales patterns, product inventory velocity, and competitor prices to flag dynamic pricing anomalies.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className="bg-white dark:bg-slate-900 rounded-3xl shadow-md border border-slate-200 dark:border-slate-800 p-6 flex items-center justify-between hover:shadow-lg transition duration-200"
            >
              <div>
                <p className="text-slate-600 dark:text-slate-300 font-bold text-base">{item.title}</p>
                <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white mt-2 tracking-tight">{item.value}</h2>
              </div>
              <div className={`w-16 h-16 rounded-2xl ${item.color} flex items-center justify-center text-white shadow-md flex-shrink-0`}>
                <Icon size={28} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Alerts Feed */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Dynamic AI Notification Feed</h2>
          <p className="text-slate-600 dark:text-slate-300 text-base mt-1 font-medium">
            Outliers and anomalies highlighted by Isolation Forest clustering model.
          </p>
        </div>

        <div className="divide-y divide-slate-200 dark:divide-slate-800">
          {activeAlerts.length === 0 ? (
            <div className="text-center py-14 text-slate-500 dark:text-slate-300 text-lg font-semibold">
              No active alerts or pricing anomalies found in the current dataset.
            </div>
          ) : (
            activeAlerts.map((alert) => (
              <div
                key={alert.id}
                className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-6 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition gap-4"
              >
                <div className="space-y-1">
                  <h3 className="font-bold text-slate-900 dark:text-white text-xl">{alert.product}</h3>
                  <p className="text-slate-700 dark:text-slate-200 text-base font-medium">{alert.message}</p>
                  <span className="text-sm text-slate-500 dark:text-slate-400 block pt-1 font-medium">{alert.time}</span>
                </div>

                <div className="flex items-center gap-4 self-end sm:self-auto flex-shrink-0">
                  <span
                    className={`px-4 py-1.5 rounded-full text-sm font-bold tracking-wide ${
                      alert.priority === "High"
                        ? "bg-red-100 text-red-800 border border-red-300 dark:bg-red-950/90 dark:text-red-300 dark:border-red-600"
                        : "bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950/90 dark:text-amber-300 dark:border-amber-600"
                    }`}
                  >
                    {alert.priority} Priority
                  </span>

                  <button
                    onClick={() => handleDismiss(alert.id)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100 px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition cursor-pointer"
                  >
                    Dismiss Alert
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}