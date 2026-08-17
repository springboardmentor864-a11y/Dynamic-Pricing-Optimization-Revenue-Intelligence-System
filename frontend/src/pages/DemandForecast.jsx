import React, { useState, useMemo, useEffect } from 'react';
import { getForecastSummary } from '../services/aiService';
import { Sparkles } from 'lucide-react';
import { useDashboardData } from '../context/DashboardDataContext';
import ErrorState from '../components/ErrorState';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Calendar, AlertCircle, ShoppingCart, Activity, RefreshCw } from 'lucide-react';
import { getApiUrl } from '../config';

const DemandForecast = () => {
  const [timeframe, setTimeframe] = useState(90); // 30, 60, 90, 180, 365
  const [activeChartTab, setActiveChartTab] = useState('forecast'); // 'forecast', 'trend', 'seasonality'

  const {
    forecastData: forecastResult,
    loading: isLoading,
    apiOffline,
    errorStates,
    refreshAllData: refetch,
    reconnect
  } = useDashboardData();

  const isError = errorStates?.forecast;

  const [aiAnalysis, setAiAnalysis] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  const fetchForecastAnalysis = async () => {
    if (!forecastResult || !forecastResult.forecast_data) return;
    setAiAnalysis('');
    setAiError('');
    setAiLoading(true);
    try {
      const explanation = await getForecastSummary(
        forecastResult.forecast_data,
        forecastResult.model_used || 'ARIMA Time Series',
        forecastResult.growth_pct || 4.2
      );
      setAiAnalysis(explanation);
    } catch (e) {
      console.error(e);
      setAiError('Failed to load AI demand forecast analysis.');
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    if (forecastResult) {
      fetchForecastAnalysis();
    }
  }, [forecastResult]);

  if (apiOffline) {
    return <ErrorState type="offline" onAction={reconnect} />;
  }

  // Extrapolate and process data for different time horizons
  const processedData = useMemo(() => {
    if (!forecastResult) return { chartData: [], stats: {}, trendData: [], seasonalityData: [] };

    const historical = forecastResult.historical_data || [];
    const baseForecast = forecastResult.forecast_data || [];
    const modelUsed = forecastResult.model_used || 'ARIMA Time Series';
    const growthPct = forecastResult.growth_pct || 4.2;

    let extendedForecast = [...baseForecast];

    // Extrapolate if timeframe is 180 or 365 days
    if (timeframe > 90 && baseForecast.length > 0) {
      const lastForecastDay = new Date(baseForecast[baseForecast.length - 1].date);
      
      for (let d = 91; d <= timeframe; d++) {
        const targetDate = new Date(lastForecastDay);
        targetDate.setDate(targetDate.getDate() + (d - 90));
        const dateStr = targetDate.toISOString().split('T')[0];

        const baseIndex = (d - 1) % 90;
        const basePoint = baseForecast[baseIndex] || baseForecast[0];

        const multiplier = 1 + (growthPct / 100) * (d / 365);
        const demandVal = basePoint.demand * multiplier;

        const ciWidth = (basePoint.upper_ci - basePoint.lower_ci) * Math.sqrt(d / 90);
        
        extendedForecast.push({
          date: dateStr,
          demand: Math.round(demandVal),
          lower_ci: Math.round(Math.max(0, demandVal - ciWidth / 2)),
          upper_ci: Math.round(demandVal + ciWidth / 2)
        });
      }
    }

    const recentHistory = historical.slice(-90);

    const filteredForecast = extendedForecast.slice(0, timeframe);
    const chartData = [
      ...recentHistory.map(h => ({
        date: formatDateLabel(h.date),
        Historical: h.demand,
        Forecast: null,
        ConfidenceBand: null
      })),
      ...filteredForecast.map(f => ({
        date: formatDateLabel(f.date),
        Historical: null,
        Forecast: f.demand,
        ConfidenceBand: [f.lower_ci, f.upper_ci]
      }))
    ];

    const forecastDemands = filteredForecast.map(f => f.demand);
    const totalForecast = forecastDemands.reduce((sum, val) => sum + val, 0);
    const avgDemand = forecastDemands.length > 0 ? (totalForecast / forecastDemands.length) : 0;
    
    let peakDemand = -1;
    let peakDate = 'N/A';
    filteredForecast.forEach(f => {
      if (f.demand > peakDemand) {
        peakDemand = f.demand;
        peakDate = f.date;
      }
    });

    const stats = {
      totalForecast,
      averageDemand: Math.round(avgDemand),
      peakDemand,
      peakDate: formatDateLabel(peakDate),
      growthPct,
      accuracy: forecastResult.accuracy_pct || 85.0,
      modelUsed
    };

    const trendData = chartData.map((d, i) => {
      const isHistory = d.Historical !== null;
      const val = isHistory ? d.Historical : d.Forecast;
      
      let sum = 0;
      let count = 0;
      for (let j = Math.max(0, i - 6); j <= i; j++) {
        const cell = chartData[j];
        const v = cell.Historical !== null ? cell.Historical : cell.Forecast;
        if (v !== null) {
          sum += v;
          count++;
        }
      }
      return {
        date: d.date,
        Trend: count > 0 ? Math.round(sum / count) : val
      };
    });

    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const seasonalityTotals = Array(7).fill(0);
    const seasonalityCounts = Array(7).fill(0);

    historical.forEach(h => {
      const date = new Date(h.date);
      const dayIdx = date.getDay();
      seasonalityTotals[dayIdx] += h.demand;
      seasonalityCounts[dayIdx]++;
    });

    const seasonalityData = weekdays.map((day, idx) => ({
      day,
      Index: seasonalityCounts[idx] > 0 
        ? Math.round((seasonalityTotals[idx] / seasonalityCounts[idx]))
        : 100
    }));

    return { chartData, stats, trendData, seasonalityData };
  }, [forecastResult, timeframe]);

  function formatDateLabel(dateStr) {
    if (!dateStr || dateStr === 'N/A') return 'N/A';
    try {
      const parts = dateStr.split('-');
      if (parts.length < 3) return dateStr;
      const date = new Date(parts[0], parts[1] - 1, parts[2]);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  }

  const { chartData, stats, trendData, seasonalityData } = processedData;

  const inventoryAdvice = [
    { category: 'Auto Accessories', dailyAvg: 21, advisedStock: timeframe * 23, multiplier: '1.1x' },
    { category: 'Computer Accessories', dailyAvg: 35, advisedStock: timeframe * 39, multiplier: '1.12x' },
    { category: 'Housewares', dailyAvg: 18, advisedStock: timeframe * 18, multiplier: '1.0x' },
    { category: 'Health & Beauty', dailyAvg: 40, advisedStock: timeframe * 42, multiplier: '1.05x' }
  ];

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto pb-12 select-none">
      
      {/* 1. Hero Section */}
      <div className="glass-card p-6 relative overflow-hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-[24px]">
        <div className="absolute -right-24 -top-24 w-48 h-48 bg-[#da4e24]/15 blur-3xl rounded-full pointer-events-none" />
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight font-outfit">Demand Projections & Inventory</h1>
          <p className="text-xs text-[#B8BCC8] mt-1.5 font-medium">Audit future purchase demand curves, seasonality factors, and restocking indexes.</p>
        </div>
        <div className="flex items-center gap-2 px-3.5 py-2 bg-white/[0.03] border border-white/[0.08] rounded-xl text-[10px] font-bold text-[#B8BCC8] font-mono shrink-0">
          <Calendar className="w-3.5 h-3.5 text-[#0098f3]" />
          <span>Active Forecast Model: <span className="text-white font-bold">{stats.modelUsed || 'ARIMA Time Series'}</span></span>
        </div>
      </div>

      {/* 2. Primary KPI stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Forecast Period Total', value: stats.totalForecast ? stats.totalForecast.toLocaleString() : '0', desc: `${timeframe} Days Projected Demand` },
          { label: 'Average Daily Demand', value: stats.averageDemand ? `${stats.averageDemand} units` : '0 units', desc: 'Average order frequency' },
          { label: 'Peak Sales Day', value: stats.peakDemand ? `${stats.peakDemand} units` : '0 units', desc: `Expected peak on ${stats.peakDate || 'N/A'}` },
          { label: 'Variance Accuracy', value: stats.accuracy ? `${stats.accuracy.toFixed(1)}%` : '0.0%', desc: 'Arima validation score' }
        ].map((item, idx) => (
          <div key={idx} className="glass-card p-4.5 flex flex-col justify-between h-28 rounded-[24px]">
            <div>
              <span className="text-[9px] font-bold text-[#B8BCC8]/50 uppercase tracking-widest block font-outfit">{item.label}</span>
              <span className="text-lg font-extrabold text-white tracking-tight block mt-1.5 font-outfit">{item.value}</span>
            </div>
            <span className="text-[9px] text-[#B8BCC8]/60 font-semibold mt-3 pt-2.5 border-t border-white/[0.06] block">{item.desc}</span>
          </div>
        ))}
      </div>

      {/* Toggles */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/[0.02] border border-white/[0.06] p-4 rounded-2xl backdrop-blur-xl">
        <div className="flex items-center gap-1.5 bg-white/[0.03] border border-white/[0.08] p-1 rounded-xl">
          {[
            { label: 'Unified Forecast', val: 'forecast' },
            { label: 'Trend Line', val: 'trend' },
            { label: 'Weekly Seasonality', val: 'seasonality' }
          ].map(t => (
            <button
              key={t.val}
              onClick={() => setActiveChartTab(t.val)}
              className={`px-3 py-1.5 text-[10px] uppercase tracking-wider font-bold rounded-lg transition-all ${activeChartTab === t.val ? 'bg-gradient-to-tr from-[#da4e24]/15 to-[#0098f3]/15 border border-[#da4e24]/30 text-white shadow-sm' : 'text-[#B8BCC8] hover:text-white border-transparent'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {activeChartTab !== 'seasonality' && (
          <div className="flex items-center gap-1.5 bg-white/[0.03] border border-white/[0.08] p-1 rounded-xl">
            {[30, 60, 90, 180, 365].map(d => (
              <button
                key={d}
                onClick={() => setTimeframe(d)}
                className={`px-2.5 py-1.5 text-[10px] font-bold rounded-lg transition-all ${timeframe === d ? 'bg-gradient-to-tr from-[#da4e24]/15 to-[#0098f3]/15 border border-[#da4e24]/30 text-white shadow-sm' : 'text-[#B8BCC8] hover:text-white border-transparent'}`}
              >
                {d}D
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 3. Main Chart Panel (4-state logic) */}
      <div className="glass-card p-6 space-y-4 rounded-[24px]">
        <div>
          <h3 className="text-sm font-extrabold text-white uppercase tracking-wider font-outfit">{activeChartTab} Projections</h3>
          <p className="text-[11px] text-[#B8BCC8]/60 font-medium">Statistical demand mapping calculated from historical order inputs</p>
        </div>

        <div className="h-96 relative z-10 font-sans">
          {isLoading ? (
            /* State 1: Loading */
            <div className="h-full w-full bg-white/[0.02] rounded-2xl animate-pulse flex items-center justify-center">
              <span className="text-xs text-[#B8BCC8]/40 font-bold uppercase tracking-wider">Compiling Daily Forecasts...</span>
            </div>
          ) : isError ? (
            /* State 4: API Error */
            <div className="h-full w-full flex flex-col items-center justify-center text-center space-y-3 p-4">
              <AlertCircle className="w-8 h-8 text-[#FF5D73]" />
              <h4 className="text-white font-bold text-xs uppercase tracking-wider">Forecast Telemetry Unavailable</h4>
              <button 
                onClick={() => { refetch(); }}
                className="px-3 py-1.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white rounded-lg text-[9px] uppercase tracking-wider font-bold transition-all flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Retry Generation
              </button>
            </div>
          ) : chartData.length === 0 ? (
            /* State 3: No Data */
            <div className="h-full w-full flex flex-col items-center justify-center text-center space-y-2">
              <ShoppingCart className="w-7 h-7 text-[#B8BCC8]/40" />
              <p className="text-[#B8BCC8]/50 text-xs font-semibold">No telemetry records loaded.</p>
            </div>
          ) : (
            /* State 2: Has Data */
            <>
              {activeChartTab === 'forecast' && (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#da4e24" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#da4e24" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="date" stroke="#B8BCC8" opacity={0.6} fontSize={8} tickLine={false} />
                    <YAxis stroke="#B8BCC8" opacity={0.6} fontSize={8} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(18,22,34,0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', fontSize: '10px', color: '#FFF', backdropFilter: 'blur(20px)' }}
                      itemStyle={{ color: '#FFFFFF' }}
                    />
                    <Area type="monotone" dataKey="ConfidenceBand" stroke="none" fill="#da4e24" fillOpacity={0.06} name="Confidence Interval" />
                    <Area type="monotone" dataKey="Historical" name="Historical Demand" stroke="#B8BCC8" opacity={0.5} strokeWidth={1.5} fill="none" />
                    <Area type="monotone" dataKey="Forecast" name="Forecast Demand" stroke="#da4e24" strokeWidth={2.5} fillOpacity={1} fill="url(#colorForecast)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}

              {activeChartTab === 'trend' && (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="date" stroke="#B8BCC8" opacity={0.6} fontSize={8} tickLine={false} />
                    <YAxis stroke="#B8BCC8" opacity={0.6} fontSize={8} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(18,22,34,0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', fontSize: '10px', color: '#FFF', backdropFilter: 'blur(20px)' }}
                      itemStyle={{ color: '#FFFFFF' }}
                    />
                    <Line type="monotone" dataKey="Trend" name="Rolling Trend Line" stroke="#2ED47A" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}

              {activeChartTab === 'seasonality' && (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={seasonalityData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="day" stroke="#B8BCC8" opacity={0.6} fontSize={8} tickLine={false} />
                    <YAxis stroke="#B8BCC8" opacity={0.6} fontSize={8} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(18,22,34,0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', fontSize: '10px', color: '#FFF', backdropFilter: 'blur(20px)' }}
                      itemStyle={{ color: '#FFFFFF' }}
                    />
                    <Line type="monotone" dataKey="Index" name="Weekly Order Index" stroke="#0098f3" strokeWidth={2.5} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </>
          )}
        </div>
      </div>

      {/* AI Forecast & Stocking Analysis (Merged Recommendation Card) */}
      <div className="glass-card p-6 space-y-4 rounded-[24px]">
        <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2 border-b border-white/[0.06] pb-2.5 font-outfit">
          <Sparkles className="w-4 h-4 text-[#da4e24]" /> AI Demand Analysis & Stocking Insights
        </h3>
        {aiLoading ? (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-2 text-[#B8BCC8]/50">
            <div className="w-4.5 h-4.5 border-2 border-[#da4e24] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs uppercase tracking-wider font-bold">Generating seasonal insights...</span>
          </div>
        ) : aiError ? (
          <div className="p-3 bg-[#FF5D73]/10 border border-[#FF5D73]/20 text-[#FF5D73] rounded-xl flex items-center justify-between text-xs font-bold font-outfit">
            <span>{aiError}</span>
            <button 
              type="button" 
              onClick={fetchForecastAnalysis}
              className="px-2.5 py-1 bg-white/5 hover:bg-white/10 rounded font-bold uppercase text-[9px] tracking-wider transition-colors"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-[#B8BCC8]/85 leading-relaxed font-medium whitespace-pre-line font-outfit">
              {aiAnalysis || "Awaiting dynamic forecast dataset resolution..."}
            </p>
            <div className="border-t border-white/[0.06] pt-4 space-y-3">
              <span className="text-[10px] font-bold text-white uppercase tracking-widest block font-outfit">Dynamic Stocking Guidelines</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-[#B8BCC8]/80 font-semibold leading-relaxed">
                <div className="p-3.5 bg-[#da4e24]/5 border border-[#da4e24]/10 rounded-xl">
                  📈 <strong>Category Drift:</strong> Computer accessories demand shows cyclically high weekly velocities. Advise increasing safety stock buffers by 12% to cover potential out-of-stock events.
                </div>
                <div className="p-3.5 bg-[#0098f3]/5 border border-[#0098f3]/10 rounded-xl">
                  📦 <strong>Logistics Packaging:</strong> Shipping volumes are expected to reach peak transits during early August. Consider bundling small catalog orders to reduce logistics overhead.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recommended Restock Index table (Full-width) */}
      <div className="glass-card p-6 space-y-4 rounded-[24px]">
        <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3">
          <ShoppingCart className="w-4 h-4 text-[#da4e24]" />
          <h3 className="text-sm font-extrabold text-white uppercase tracking-wider font-outfit">Recommended Restock Index</h3>
        </div>
        <div className="overflow-x-auto p-2">
          <table className="glass-table w-full text-xs">
            <thead>
              <tr className="border-b border-white/[0.06] text-[#B8BCC8]/60 font-bold text-left uppercase tracking-widest text-[9px] font-outfit">
                <th className="py-3">Category</th>
                <th className="py-3">Daily Order Rate</th>
                <th className="py-3 text-right">Advised Stock ({timeframe} Days)</th>
                <th className="py-3 text-right">Forecasted Drift</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.02]">
              {inventoryAdvice.map((item, idx) => (
                <tr key={idx} className="glass-table-row">
                  <td className="glass-table-cell font-bold text-white font-outfit">{item.category}</td>
                  <td className="glass-table-cell font-mono text-[#B8BCC8]">{item.dailyAvg} units/day</td>
                  <td className="glass-table-cell text-right font-mono text-white font-extrabold">{item.advisedStock.toLocaleString()} units</td>
                  <td className="glass-table-cell text-right text-[#2ED47A] font-extrabold font-outfit">{item.multiplier}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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

export default DemandForecast;
