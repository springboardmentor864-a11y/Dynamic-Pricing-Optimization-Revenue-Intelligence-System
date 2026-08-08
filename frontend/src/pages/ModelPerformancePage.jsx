import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
} from 'recharts';
import { Award, BarChart2, CheckCircle2, Sparkles, Brain } from 'lucide-react';

const ModelPerformancePage = () => {
  // Exact model metrics matching request with Training Time & Prediction Time
  const modelComparison = [
    { model: 'Extra Trees', mae: 31.1766, rmse: 108.6525, r2: 0.6742, trainTime: '4.2s', predTime: '38 ms', isBest: true, rank: 1 },
    { model: 'Random Forest', mae: 34.6840, rmse: 115.5896, r2: 0.6312, trainTime: '6.8s', predTime: '45 ms', isBest: false, rank: 2 },
    { model: 'CatBoost', mae: 50.3322, rmse: 121.5160, r2: 0.5925, trainTime: '12.4s', predTime: '52 ms', isBest: false, rank: 3 },
    { model: 'XGBoost', mae: 48.5589, rmse: 122.5239, r2: 0.5857, trainTime: '5.1s', predTime: '40 ms', isBest: false, rank: 4 },
    { model: 'LightGBM', mae: 54.8767, rmse: 127.8262, r2: 0.5490, trainTime: '2.3s', predTime: '25 ms', isBest: false, rank: 5 },
    { model: 'Decision Tree', mae: 39.8448, rmse: 157.4229, r2: 0.3160, trainTime: '0.8s', predTime: '12 ms', isBest: false, rank: 6 },
    { model: 'Linear Regression', mae: 78.9077, rmse: 168.7753, r2: 0.2138, trainTime: '0.2s', predTime: '5 ms', isBest: false, rank: 7 },
  ];

  const chartData = [...modelComparison].sort((a, b) => a.r2 - b.r2);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold mb-2">
            <Award className="w-3.5 h-3.5 text-amber-400" /> Benchmark Results
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white">
            Machine Learning <span className="gradient-text">Model Performance</span>
          </h1>
          <p className="text-xs text-slate-400">
            Comparative analysis of 7 regression algorithms evaluated on MAE, RMSE, R², training, and latency.
          </p>
        </div>

        {/* Best Model Banner Badge */}
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-r from-purple-900/60 to-indigo-900/60 border border-purple-500/40">
          <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
            <Award className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300">Top Performing Model</span>
            <h4 className="text-sm font-extrabold text-white flex items-center gap-1.5">
              Extra Trees Regressor <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </h4>
          </div>
        </div>
      </div>

      {/* Model Performance Comparison Table */}
      <div className="rounded-3xl glass-card border border-slate-800 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-400" /> ML Model Leaderboard Table
            </h3>
            <p className="text-xs text-slate-400">Evaluated on test dataset split (X_test / y_test)</p>
          </div>
          <span className="text-xs text-slate-400 font-mono">Sorted by R² Score</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-sans text-[11px] uppercase tracking-wider">
                <th className="py-3.5 px-4">Rank</th>
                <th className="py-3.5 px-4">Model Name</th>
                <th className="py-3.5 px-4">MAE</th>
                <th className="py-3.5 px-4">RMSE</th>
                <th className="py-3.5 px-4">R² Score</th>
                <th className="py-3.5 px-4">Train Time</th>
                <th className="py-3.5 px-4">Prediction Time</th>
                <th className="py-3.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {modelComparison.map((row) => (
                <tr
                  key={row.model}
                  className={`transition-all duration-200 ${
                    row.isBest
                      ? 'bg-purple-950/40 hover:bg-purple-900/50 border-l-4 border-l-purple-500 font-bold'
                      : 'hover:bg-slate-800/40'
                  }`}
                >
                  <td className="py-4 px-4 text-slate-400">#{row.rank}</td>
                  <td className="py-4 px-4 font-sans text-sm font-semibold text-white flex items-center gap-2">
                    {row.model}
                    {row.isBest && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-500 to-amber-500 text-white shadow-md">
                        <Sparkles className="w-3 h-3" /> BEST MODEL
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-slate-300">{row.mae.toFixed(4)}</td>
                  <td className="py-4 px-4 text-slate-300">{row.rmse.toFixed(4)}</td>
                  <td className="py-4 px-4 font-bold text-emerald-400 text-sm">{row.r2.toFixed(4)}</td>
                  <td className="py-4 px-4 text-slate-400">{row.trainTime}</td>
                  <td className="py-4 px-4 text-purple-300">{row.predTime}</td>
                  <td className="py-4 px-4 text-center">
                    {row.isBest ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                        <CheckCircle2 className="w-3 h-3" /> Selected Model
                      </span>
                    ) : (
                      <span className="text-slate-500 text-[11px]">Evaluated</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Horizontal Bar Chart */}
      <div className="rounded-3xl glass-card border border-slate-800 p-6">
        <h3 className="text-base font-bold text-white flex items-center gap-2 mb-6">
          <BarChart2 className="w-5 h-5 text-blue-400" /> R² Score Comparison (Horizontal Bar Chart)
        </h3>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart layout="vertical" data={chartData} margin={{ top: 10, right: 30, left: 100, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis type="number" stroke="#64748b" fontSize={11} domain={[0, 0.8]} />
              <YAxis type="category" dataKey="model" stroke="#94a3b8" fontSize={12} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc' }} />
              <Bar dataKey="r2" radius={[0, 8, 8, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.isBest ? '#a855f7' : entry.r2 > 0.5 ? '#3b82f6' : '#475569'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};

export default ModelPerformancePage;
