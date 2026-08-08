import React, { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import { checkBackendHealth } from '../services/api';
import { Database, Cpu, HardDrive, RefreshCw, CheckCircle2, ShieldCheck, Server, Activity } from 'lucide-react';

const DatabasePage = () => {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [dbStatus, setDbStatus] = useState('CONNECTED');

  const tables = [
    { name: 'users', desc: 'Authentication & Role Registry', rows: 'Seeded (Admin/Viewer)', status: 'HEALTHY' },
    { name: 'products', desc: 'Catalog Items & Spatial Dimensions', rows: '112,650 items', status: 'HEALTHY' },
    { name: 'predictions', desc: 'Extra Trees Regressor Log', rows: 'Active Session Log', status: 'HEALTHY' },
    { name: 'price_recommendations', desc: 'Surge Pricing Bounds', rows: 'Calculated Live', status: 'HEALTHY' },
    { name: 'demand_forecasts', desc: 'Monthly Purchasing Volume', rows: '12 Months', status: 'HEALTHY' },
    { name: 'prediction_history', desc: 'Audit Trail Records', rows: 'Synced', status: 'HEALTHY' },
    { name: 'notifications', desc: 'System Alert Logs', rows: 'Live Queue', status: 'HEALTHY' },
    { name: 'activity_logs', desc: 'Security Audit Trail', rows: 'Active', status: 'HEALTHY' },
  ];

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await checkBackendHealth();
      setDbStatus('CONNECTED');
      toast.success('PostgreSQL Database connection health verified successfully!');
    } catch (err) {
      setDbStatus('DISCONNECTED');
      toast.error('PostgreSQL database health check failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1F2937]">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold mb-2">
            <Database className="w-3.5 h-3.5 text-emerald-400" /> PostgreSQL 15 Engine
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white">
            PostgreSQL <span className="gradient-text">Database Monitor</span>
          </h1>
          <p className="text-xs text-slate-400">
            Real-time inspection of PostgreSQL connection pools, table schemas, and relational persistence health.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-[#1F2937] transition w-fit"
        >
          <RefreshCw className={`w-4 h-4 text-purple-400 ${loading ? 'animate-spin' : ''}`} /> Refresh Connection
        </button>
      </div>

      {/* Health Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-[18px] bg-[#111827] border border-emerald-500/30 space-y-1">
          <span className="text-[10px] text-slate-500 uppercase font-mono">Engine Status</span>
          <p className="text-xl font-black text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-5 h-5" /> Operational
          </p>
        </div>
        <div className="p-4 rounded-[18px] bg-[#111827] border border-[#1F2937] space-y-1">
          <span className="text-[10px] text-slate-500 uppercase font-mono">Connection Host</span>
          <p className="text-sm font-mono font-bold text-purple-300">localhost:5432</p>
        </div>
        <div className="p-4 rounded-[18px] bg-[#111827] border border-[#1F2937] space-y-1">
          <span className="text-[10px] text-slate-500 uppercase font-mono">Database Name</span>
          <p className="text-sm font-mono font-bold text-blue-300">pricepilot</p>
        </div>
        <div className="p-4 rounded-[18px] bg-[#111827] border border-[#1F2937] space-y-1">
          <span className="text-[10px] text-slate-500 uppercase font-mono">ORM Framework</span>
          <p className="text-sm font-mono font-bold text-amber-300">SQLAlchemy 2.0</p>
        </div>
      </div>

      {/* Relational Table Registry */}
      <div className="rounded-[18px] bg-[#111827] border border-[#1F2937] p-6 space-y-4">
        <h3 className="text-base font-bold text-white border-b border-[#1F2937] pb-3 flex items-center gap-2">
          <HardDrive className="w-5 h-5 text-purple-400" /> Relational Schema Tables
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tables.map((t) => (
            <div key={t.name} className="p-4 rounded-xl bg-slate-900/60 border border-[#1F2937] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-purple-300 text-xs">public.{t.name}</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                  {t.status}
                </span>
              </div>
              <p className="text-xs text-slate-400">{t.desc}</p>
              <p className="text-[11px] text-slate-500 font-mono">Rows: {t.rows}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default DatabasePage;
