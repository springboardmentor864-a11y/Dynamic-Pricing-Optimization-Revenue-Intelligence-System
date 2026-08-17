import React, { useState, useEffect } from 'react';
import { getBusinessInsights } from '../services/aiService';
import { Sparkles } from 'lucide-react';
import { useDashboardData } from '../context/DashboardDataContext';
import ErrorState from '../components/ErrorState';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, BarChart, Bar } from 'recharts';
import { TrendingUp, Activity, Clock, ArrowUpRight, CheckCircle, AlertCircle, RefreshCw, Layers } from 'lucide-react';
import { getApiUrl } from '../config';

const Analytics = () => {
  const {
    dashboardStats: stats,
    loading: isLoading,
    apiOffline,
    errorStates,
    refreshAllData: refetch,
    reconnect
  } = useDashboardData();

  const isError = errorStates?.dashboard;

  const [aiInsights, setAiInsights] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  const fetchBusinessInsights = async () => {
    if (!stats) return;
    setAiInsights('');
    setAiError('');
    setAiLoading(true);
    try {
      const insightsData = await getBusinessInsights(stats.top_products || []);
      setAiInsights(insightsData);
    } catch (e) {
      console.error(e);
      setAiError('Failed to load AI business insights.');
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    if (stats) {
      fetchBusinessInsights();
    }
  }, [stats]);

  if (apiOffline) {
    return <ErrorState type="offline" onAction={reconnect} />;
  }

  // Fallback / mock telemetry sets
  const predictionAccuracyHistory = [
    { month: 'Jan', mae: 18.2, r2: 0.76 },
    { month: 'Feb', mae: 17.5, r2: 0.77 },
    { month: 'Mar', mae: 16.9, r2: 0.79 },
    { month: 'Apr', mae: 16.1, r2: 0.80 },
    { month: 'May', mae: 15.8, r2: 0.81 },
    { month: 'Jun', mae: 15.4, r2: 0.811 }
  ];

  const apiRequestsData = [
    { day: 'Mon', requests: 1240 },
    { day: 'Tue', requests: 1450 },
    { day: 'Wed', requests: 1890 },
    { day: 'Thu', requests: 1720 },
    { day: 'Fri', requests: 2100 },
    { day: 'Sat', requests: 950 },
    { day: 'Sun', requests: 820 }
  ];

  const monthlyRev = stats?.monthly_revenue || [
    { month: 'Jan', revenue: 120000 },
    { month: 'Feb', revenue: 145000 },
    { month: 'Mar', revenue: 190000 },
    { month: 'Apr', revenue: 170000 },
    { month: 'May', revenue: 215000 },
    { month: 'Jun', revenue: 235000 }
  ];

  const kpis = [
    { label: 'Forecast Accuracy', value: '87.4%', desc: 'ARIMA variance Explanation', icon: CheckCircle, change: '+1.2%', color: 'text-[#2ED47A]', bg: 'bg-[#2ED47A]/10 border-[#2ED47A]/20' },
    { label: 'Avg Inference Latency', value: '0.16 ms', desc: 'SIMD multi-core compiled', icon: Clock, change: '-4.2%', color: 'text-[#da4e24]', bg: 'bg-[#da4e24]/10 border-[#da4e24]/20' },
    { label: 'Daily API Calls', value: '1,453', desc: 'Integrations and dashboards', icon: Activity, change: '+12.5%', color: 'text-[#0098f3]', bg: 'bg-[#0098f3]/10 border-[#0098f3]/20' }
  ];

  return (
    <div className="space-y-6 animate-fadeIn max-w-7xl mx-auto pb-12 select-none">
      
      {/* 1. Hero Section */}
      <div className="glass-card p-6 relative overflow-hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-[24px]">
        <div className="absolute -right-24 -top-24 w-48 h-48 bg-[#da4e24]/15 blur-3xl rounded-full pointer-events-none" />
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight font-outfit">Revenue & Prediction Analytics</h1>
          <p className="text-xs text-[#B8BCC8] mt-1.5 font-medium">Audit model fitting histories, request volumes, and active gross yield margins.</p>
        </div>
      </div>

      {/* 2. KPI Grid (Exactly 3 cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="glass-card p-5 flex flex-col justify-between h-32 rounded-[24px]">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[9px] font-bold text-[#B8BCC8]/50 uppercase tracking-widest block font-outfit">{kpi.label}</span>
                <span className="text-xl font-extrabold text-white tracking-tight mt-2 block font-outfit">{kpi.value}</span>
              </div>
              <div className={`p-1.5 rounded-xl border shrink-0 flex items-center justify-center ${kpi.bg}`}>
                <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
              </div>
            </div>
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/[0.06] text-[10px] text-[#B8BCC8]/60 font-semibold">
              <span>{kpi.desc}</span>
              <span className={`font-bold flex items-center gap-0.5 ${kpi.change.startsWith('+') ? 'text-[#2ED47A]' : 'text-[#B8BCC8]/70'}`}>
                <ArrowUpRight className="w-3.5 h-3.5" /> {kpi.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* 3. Main dual charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Cumulative revenue curve (Gross Yield Area Chart) */}
        <div className="glass-card p-6 lg:col-span-8 space-y-4 rounded-[24px]">
          <div>
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider font-outfit">E-Commerce Gross Yield Curve</h3>
            <p className="text-[11px] text-[#B8BCC8]/60 font-medium">6-month transaction volume development comparison</p>
          </div>
          <div className="h-80 relative z-10 font-sans">
            {isLoading ? (
              <div className="h-full w-full bg-white/[0.02] border border-white/[0.04] rounded-2xl animate-pulse" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyRev} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#da4e24" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#da4e24" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="month" stroke="#B8BCC8" opacity={0.6} fontSize={8} tickLine={false} />
                  <YAxis stroke="#B8BCC8" opacity={0.6} fontSize={8} tickLine={false} formatter={(v) => `₹${v/1000}k`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(18,22,34,0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', fontSize: '10px', color: '#FFF', backdropFilter: 'blur(20px)' }}
                    itemStyle={{ color: '#FFFFFF' }}
                  />
                  <Area type="monotone" dataKey="revenue" name="Total Revenue" stroke="#da4e24" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* API requests volume (Bar Chart) */}
        <div className="glass-card p-6 lg:col-span-4 space-y-4 rounded-[24px]">
          <div>
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider font-outfit">Prediction Request Volume</h3>
            <p className="text-[11px] text-[#B8BCC8]/60 font-medium">Weekly request count served via APIs</p>
          </div>
          <div className="h-80 relative z-10 font-sans">
            {isLoading ? (
              <div className="h-full w-full bg-white/[0.02] border border-white/[0.04] rounded-2xl animate-pulse flex items-center justify-center" />
            ) : isError ? (
              <div className="h-full w-full flex flex-col items-center justify-center text-center space-y-3 p-4">
                <AlertCircle className="w-8 h-8 text-[#FF5D73]" />
                <button onClick={refetch} className="btn-secondary text-[10px]">Retry</button>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={apiRequestsData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="day" stroke="#B8BCC8" opacity={0.6} fontSize={8} tickLine={false} />
                  <YAxis stroke="#B8BCC8" opacity={0.6} fontSize={8} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(18,22,34,0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', fontSize: '10px', color: '#FFF', backdropFilter: 'blur(20px)' }}
                    itemStyle={{ color: '#FFFFFF' }}
                  />
                  <Bar dataKey="requests" name="API Calls" fill="url(#indigoGlow)" radius={[5, 5, 0, 0]}>
                    <defs>
                      <linearGradient id="indigoGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0098f3" />
                        <stop offset="100%" stopColor="#da4e24" />
                      </linearGradient>
                    </defs>
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

      {/* AI Business Insights */}
      <div className="glass-card p-6 space-y-3.5 rounded-[24px]">
        <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2 border-b border-white/[0.06] pb-2.5 font-outfit">
          <Sparkles className="w-4.5 h-4.5 text-[#da4e24]" /> AI Business Insights & Revenue Opportunities
        </h3>
        {aiLoading ? (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-2 text-[#B8BCC8]/50">
            <div className="w-4 h-4 border-2 border-[#da4e24] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs uppercase tracking-wider font-bold">Generating strategic recommendations...</span>
          </div>
        ) : aiError ? (
          <div className="p-3 bg-[#FF5D73]/10 border border-[#FF5D73]/20 text-[#FF5D73] rounded-xl flex items-center justify-between text-xs font-bold font-outfit">
            <span>{aiError}</span>
            <button 
              type="button" 
              onClick={fetchBusinessInsights}
              className="px-2.5 py-1 bg-white/5 hover:bg-white/10 rounded font-bold uppercase text-[9px] tracking-wider transition-colors"
            >
              Retry
            </button>
          </div>
        ) : (
          <p className="text-xs text-[#B8BCC8]/85 leading-relaxed font-medium whitespace-pre-line font-outfit">
            {aiInsights || "Awaiting catalog analytics resolution..."}
          </p>
        )}
      </div>

      {/* 5. Footer Information */}
      <div className="pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row justify-between items-center gap-3 text-[9px] text-[#B8BCC8]/40 font-bold uppercase tracking-widest font-mono">
        <span>PricePilot AI OS v2.0.0</span>
        <div className="flex gap-4">
          <span>System Online</span>
          <span>Inference Driver: Psycopg2</span>
          <span>Telemetry Status: Healthy</span>
        </div>
      </div>

    </div>
  );
};

export default Analytics;
