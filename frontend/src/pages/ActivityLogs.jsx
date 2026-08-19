import { useState } from "react";
import {
  Activity,
  PlusCircle,
  Pencil,
  Trash2,
  Brain,
  Download,
  LogIn,
} from "lucide-react";

const ICON_MAP = {
  plus: PlusCircle,
  edit: Pencil,
  trash: Trash2,
  brain: Brain,
  download: Download,
  login: LogIn,
};

const COLOR_MAP = {
  plus: "text-green-600",
  edit: "text-blue-600",
  trash: "text-red-600",
  brain: "text-purple-600",
  download: "text-orange-500",
  login: "text-cyan-600",
};

export default function ActivityLogs() {
  const [logs, setLogs] = useState(() => {
    const baseLogs = [
      {
        id: 1,
        iconType: "login",
        title: "User Session Logged",
        description: "Pricing account authenticated successfully.",
        time: "10 mins ago",
      },
      {
        id: 2,
        iconType: "plus",
        title: "Product Configured",
        description: "Dataset uploaded successfully.",
        time: "30 mins ago",
      },
    ];

    const localLogsStr = localStorage.getItem("activity_logs");
    if (localLogsStr) {
      try {
        const parsed = JSON.parse(localLogsStr);
        return [...parsed, ...baseLogs];
      } catch (err) {
        console.error(err);
        return baseLogs;
      }
    }
    return baseLogs;
  });

  const handleClearLogs = () => {
    localStorage.removeItem("activity_logs");
    setLogs([
      {
        id: 1,
        iconType: "login",
        title: "User Session Logged",
        description: "Pricing account authenticated successfully.",
        time: "Just now",
      },
    ]);
  };

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Activity Logs</h1>
          <p className="text-slate-500 text-lg mt-2">Audit and track system operations and dataset pricing runs.</p>
        </div>
        <button
          onClick={handleClearLogs}
          className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-5 py-3 rounded-2xl transition text-sm cursor-pointer"
        >
          Clear Logs
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="flex items-center gap-3 px-8 py-6 border-b border-slate-100 bg-slate-50/50">
          <Activity className="text-blue-600 animate-pulse" size={24} />
          <h2 className="text-xl font-bold text-slate-800">Operation Logs</h2>
        </div>

        <div className="divide-y divide-slate-100">
          {logs.map((log) => {
            const IconComponent = ICON_MAP[log.iconType] || Activity;
            const colorClass = COLOR_MAP[log.iconType] || "text-slate-500";

            return (
              <div
                key={log.id}
                className="flex items-center justify-between px-8 py-6 hover:bg-slate-50/30 transition"
              >
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100">
                    <IconComponent size={22} className={colorClass} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">{log.title}</h3>
                    <p className="text-slate-500 text-sm mt-1">{log.description}</p>
                  </div>
                </div>
                <span className="text-xs text-slate-400 font-medium">{log.time}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}