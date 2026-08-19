import {
  Database,
  CheckCircle2,
  Trash2,
} from "lucide-react";

import { useData } from "../context/DataContext";

export default function DatasetReport() {
  const { datasetInfo, cleaningReport } = useData();

  if (!datasetInfo || !cleaningReport) return null;

  return (
    <div className="bg-white rounded-3xl shadow-lg border p-6">

      <div className="flex items-center gap-3 mb-6">

        <Database className="text-blue-600" size={28} />

        <h2 className="text-2xl font-bold">
          Dataset Report
        </h2>

      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 rounded-2xl p-5 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-semibold text-blue-500 uppercase tracking-wider">Total Products</p>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-1">
              {(datasetInfo.rows || 0).toLocaleString()}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0">
            <Database size={20} />
          </div>
        </div>

        <div className="bg-green-50 dark:bg-green-950/40 border border-green-100 dark:border-green-900/40 rounded-2xl p-5 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-semibold text-green-500 uppercase tracking-wider">Clean Rows</p>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-1">
              {(cleaningReport.rows_after || 0).toLocaleString()}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/50 flex items-center justify-center text-green-600 dark:text-green-400 flex-shrink-0">
            <CheckCircle2 size={20} />
          </div>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-950/40 border border-yellow-100 dark:border-yellow-900/40 rounded-2xl p-5 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-semibold text-yellow-500 uppercase tracking-wider">Duplicates Removed</p>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-1">
              {(cleaningReport.duplicates_removed || 0).toLocaleString()}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-yellow-100 dark:bg-yellow-900/50 flex items-center justify-center text-yellow-600 dark:text-yellow-400 flex-shrink-0">
            <Trash2 size={20} />
          </div>
        </div>

        <div className="bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/40 rounded-2xl p-5 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-semibold text-purple-500 uppercase tracking-wider">Columns</p>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-1">
              {(datasetInfo.columns?.length || 0).toLocaleString()}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-purple-600 dark:text-purple-400 flex-shrink-0">
            <Database size={20} />
          </div>
        </div>

      </div>

    </div>
  );
}