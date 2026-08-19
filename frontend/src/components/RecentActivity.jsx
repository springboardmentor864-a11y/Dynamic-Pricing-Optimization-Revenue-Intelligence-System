import { useData } from "../context/DataContext";
import {
  Bell,
  CheckCircle2,
  Clock,
  TrendingUp,
  AlertTriangle
} from "lucide-react";

export default function RecentActivity() {
  const { notifications } = useData();

  const activityItems = (notifications && notifications.length > 0)
    ? notifications.slice(0, 5).map((n, idx) => ({
        id: n.id || idx,
        title: n.title,
        description: n.message,
        time: n.time || "Just now",
        icon: n.title?.includes("Alert") || n.title?.includes("Drop") ? AlertTriangle : (n.title?.includes("Recommend") ? TrendingUp : Bell),
        color: n.title?.includes("Alert") ? "bg-red-100 text-red-600" : (n.title?.includes("Recommend") ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600")
      }))
    : [
        {
          id: 1,
          icon: CheckCircle2,
          color: "bg-blue-100 text-blue-600",
          title: "System Active",
          description: "PricePilot AI engine is ready. Upload a dataset to initiate real-time analytics.",
          time: "Just now",
        },
        {
          id: 2,
          icon: Clock,
          color: "bg-purple-100 text-purple-600",
          title: "Market Intelligence",
          description: "Automatic competitor indexer active.",
          time: "Today",
        }
      ];

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-lg p-6">
      <div className="pb-4 mb-4 border-b">
        <h2 className="text-2xl font-bold text-gray-900">
          Recent Activity & Logs
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Real-time updates and active pricing alerts
        </p>
      </div>

      <div className="divide-y divide-gray-100 space-y-2">
        {activityItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className="flex gap-4 pt-3 pb-3 hover:bg-gray-50/50 transition rounded-xl px-2"
            >
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${item.color}`}
              >
                <Icon size={20} />
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 text-sm truncate">
                  {item.title}
                </h3>
                <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                  {item.description}
                </p>
                <p className="text-[11px] text-gray-400 mt-1 font-medium">
                  {item.time}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}