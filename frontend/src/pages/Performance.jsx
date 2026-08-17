import React, { useState } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Trophy, Activity, Clock, Zap, Download } from 'lucide-react';

const Performance = ({ metrics, isTraining, onRetrain }) => {
  // If metrics is empty, display a placeholder to run training
  if (!metrics || Object.keys(metrics).length === 0) {
    return (
      <div className="glass-panel p-12 rounded-2xl border-glow-purple text-center max-w-xl mx-auto space-y-6 my-12 animate-fadeIn">
        <div className="p-4 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 w-16 h-16 mx-auto flex items-center justify-center">
          <Activity className="w-8 h-8 animate-pulse" />
        </div>
        <h3 className="text-xl font-bold text-white">Metrics Comparison Awaiting Training</h3>
        <p className="text-gray-400 text-sm leading-relaxed">
          No comparison metrics found. The models must be trained to construct regression evaluation graphs.
        </p>
        <button
          onClick={onRetrain}
          disabled={isTraining}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm transition-all shadow-[0_0_20px_rgba(147,51,234,0.3)] disabled:opacity-50"
        >
          {isTraining ? 'Training Models...' : 'Train ML Engine Now'}
        </button>
      </div>
    );
  }

  // Format metrics into list for charts and tables
  const data = Object.entries(metrics).map(([name, m]) => ({
    name: name.replace(" Regressor", "").replace(" Regression", ""),
    fullName: name,
    r2: m['R2 Score'] !== undefined ? m['R2 Score'] : 0.0,
    mse: m['MSE'] !== undefined ? m['MSE'] : 0.0,
    rmse: m['RMSE'] !== undefined ? m['RMSE'] : 0.0,
    mae: m['MAE'] !== undefined ? m['MAE'] : 0.0,
    trainTime: m['Train Time'] !== undefined ? m['Train Time'] : 0.0,
    predTime: m['Prediction Time'] !== undefined ? m['Prediction Time'] * 1000 : 0.0 // in ms
  }));

  // Leaderboard ranking: Sort descending by R2 score
  const leaderboard = [...data].sort((a, b) => b.r2 - a.r2);

  // Identify best model
  const bestModel = leaderboard[0];

  // Local download of CSV table stats
  const handleDownloadCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Rank,Model Name,R2 Score,MSE,RMSE,MAE,Training Time (s),Prediction Latency (ms)\n";
    leaderboard.forEach((m, idx) => {
      csvContent += `${idx + 1},"${m.fullName}",${m.r2.toFixed(5)},${m.mse.toFixed(4)},${m.rmse.toFixed(4)},${m.mae.toFixed(4)},${m.trainTime.toFixed(4)},${m.predTime.toFixed(2)}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "pricepilot_model_benchmarks.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Custom tooltips
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0f091c]/95 border border-white/10 p-3 rounded-xl shadow-2xl backdrop-blur-md">
          <p className="text-xs font-bold text-white mb-1">{label}</p>
          {payload.map((p, idx) => (
            <p key={idx} className="text-xs" style={{ color: p.color || p.stroke }}>
              {p.name.toUpperCase()}: <span className="font-mono font-bold">{p.value.toFixed(p.value > 10 ? 2 : 4)}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-purple-400">
            Model Performance & Benchmarking
          </h1>
          <p className="text-gray-400 mt-1">
            Analyze R² accuracy targets, error distributions, training times, and prediction latencies for all 8 ML pipelines.
          </p>
        </div>
        
        <button
          onClick={onRetrain}
          disabled={isTraining}
          className="flex items-center gap-2 px-5 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/20 font-semibold text-sm transition-all duration-300"
        >
          {isTraining ? 'Evaluating 8 Pipelines...' : 'Trigger Model Retraining'}
        </button>
      </div>

      {/* Selected Champion Callout */}
      <div className="glass-panel p-6 rounded-2xl border-glow-neon flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute -left-10 -top-10 w-28 h-28 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-full blur-3xl opacity-10" />
        <div className="flex items-start gap-4">
          <div className="p-3.5 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-500 text-white shadow-xl">
            <Trophy className="w-6 h-6 text-yellow-300 animate-bounce" />
          </div>
          <div className="space-y-1">
            <span className="text-xs text-cyan-400 uppercase tracking-widest font-bold">Selected Leaderboard Champion</span>
            <h3 className="text-xl font-bold text-white">{bestModel.fullName}</h3>
            <p className="text-xs text-gray-400">Active model promoted for user pricing queries.</p>
          </div>
        </div>
        
        <div className="flex gap-6 md:border-l border-white/10 md:pl-8">
          <div className="space-y-0.5">
            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">R2 Score</span>
            <p className="text-xl font-mono font-bold text-emerald-400">{bestModel.r2.toFixed(4)}</p>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">MSE</span>
            <p className="text-xl font-mono font-bold text-purple-400">{bestModel.mse.toLocaleString(undefined, { maximumFractionDigits: 1 })}</p>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Training Time</span>
            <p className="text-xl font-mono font-bold text-cyan-400">{bestModel.trainTime.toFixed(3)}s</p>
          </div>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* 1. R2 Score (Leaderboard Ranked) */}
        <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-4">
          <div>
            <h4 className="text-sm font-bold text-white">Models vs R2 Score Leaderboard</h4>
            <p className="text-xs text-gray-500">Higher is better (Accuracy target &gt; 0.8)</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leaderboard} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                <XAxis dataKey="name" stroke="#666" fontSize={9} tickLine={false} />
                <YAxis stroke="#666" fontSize={10} domain={[0, 1]} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                <Bar dataKey="r2" name="R2 Score" fill="url(#r2Grad)" radius={[4, 4, 0, 0]} />
                <defs>
                  <linearGradient id="r2Grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0098f3" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.2} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. MSE & RMSE Comparisons */}
        <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-4">
          <div>
            <h4 className="text-sm font-bold text-white">Error Metrics Comparison (MSE vs RMSE)</h4>
            <p className="text-xs text-gray-500">Lower is better (Minimizing prediction deviations)</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={leaderboard} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                <XAxis dataKey="name" stroke="#666" fontSize={9} tickLine={false} />
                <YAxis stroke="#666" fontSize={10} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
                <Line type="monotone" dataKey="mse" name="MSE" stroke="#22d3ee" strokeWidth={2} dot={{ fill: '#22d3ee', r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="rmse" name="RMSE" stroke="#e11d48" strokeWidth={2} dot={{ fill: '#e11d48', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Training Time Overhead */}
        <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-4">
          <div>
            <h4 className="text-sm font-bold text-white">Training Duration (Seconds)</h4>
            <p className="text-xs text-gray-500">CPU/GPU pipeline duration for fit algorithm calls</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leaderboard} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                <XAxis dataKey="name" stroke="#666" fontSize={9} tickLine={false} />
                <YAxis stroke="#666" fontSize={10} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                <Bar dataKey="trainTime" name="Train Time (s)" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. Prediction Latency comparison */}
        <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-4">
          <div>
            <h4 className="text-sm font-bold text-white">Prediction Latency (Milliseconds)</h4>
            <p className="text-xs text-gray-500">Average sub-second inference response delay</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leaderboard} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                <XAxis dataKey="name" stroke="#666" fontSize={9} tickLine={false} />
                <YAxis stroke="#666" fontSize={10} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                <Bar dataKey="predTime" name="Inference Speed (ms)" fill="#a855f7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Comparison Grid Table */}
      <div className="glass-panel p-6 rounded-2xl border-glow-purple overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h3 className="text-md font-bold text-white">Interactive Leaderboard Table</h3>
          <button
            onClick={handleDownloadCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-xs font-bold text-cyan-300 transition-colors shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            Download Benchmarks (CSV)
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="text-xs text-gray-400 uppercase bg-white/5 tracking-wider border-b border-white/10">
              <tr>
                <th className="py-3 px-4 text-center">Rank</th>
                <th className="py-3 px-4">Model Name</th>
                <th className="py-3 px-4 text-center">R² Score</th>
                <th className="py-3 px-4 text-center">MSE</th>
                <th className="py-3 px-4 text-center">RMSE</th>
                <th className="py-3 px-4 text-center">MAE</th>
                <th className="py-3 px-4 text-center">Train Time</th>
                <th className="py-3 px-4 text-center">Latency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {leaderboard.map((model, idx) => {
                const isBest = model.fullName === bestModel.fullName;
                return (
                  <tr 
                    key={idx} 
                    className={`transition-colors ${
                      isBest ? 'bg-purple-500/10 text-white font-semibold' : 'hover:bg-white/5'
                    }`}
                  >
                    <td className="py-4 px-4 text-center font-mono font-bold text-gray-400">#{idx + 1}</td>
                    <td className="py-4 px-4 flex items-center gap-2">
                      {isBest && <Trophy className="w-4 h-4 text-yellow-400 shrink-0" />}
                      {model.fullName}
                      {isBest && <span className="text-[10px] bg-yellow-400/20 text-yellow-400 border border-yellow-400/30 px-1.5 py-0.5 rounded uppercase font-bold shrink-0">Best</span>}
                    </td>
                    <td className={`py-4 px-4 font-mono text-center font-bold ${isBest ? 'text-emerald-400' : 'text-gray-300'}`}>
                      {model.r2.toFixed(5)}
                    </td>
                    <td className="py-4 px-4 font-mono text-center">{model.mse.toLocaleString(undefined, { maximumFractionDigits: 3 })}</td>
                    <td className="py-4 px-4 font-mono text-center">{model.rmse.toLocaleString(undefined, { maximumFractionDigits: 3 })}</td>
                    <td className="py-4 px-4 font-mono text-center">{model.mae.toLocaleString(undefined, { maximumFractionDigits: 3 })}</td>
                    <td className="py-4 px-4 text-center font-mono">
                      <span className="flex items-center justify-center gap-1">
                        <Clock className="w-3 h-3 text-rose-500" />
                        {model.trainTime.toFixed(4)}s
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center font-mono">
                      <span className="flex items-center justify-center gap-1">
                        <Zap className="w-3 h-3 text-purple-400" />
                        {model.predTime.toFixed(2)} ms
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Performance;
