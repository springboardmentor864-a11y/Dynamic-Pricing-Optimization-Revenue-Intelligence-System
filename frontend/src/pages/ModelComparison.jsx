import React, { useState, useEffect } from 'react';
import { getModelComparison } from '../services/aiService';
import { Sparkles } from 'lucide-react';
import { useDashboardData } from '../context/DashboardDataContext';
import ErrorState from '../components/ErrorState';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Award, Trophy, Clock, Zap, Download, Table, AlertTriangle, ShieldCheck, RefreshCw, BarChart2 } from 'lucide-react';
import { getApiUrl } from '../config';

const ModelComparison = () => {
  const {
    modelMetrics: metrics,
    loading: isLoading,
    apiOffline,
    errorStates,
    refreshAllData: refetch,
    reconnect
  } = useDashboardData();

  const isError = errorStates?.metrics;

  const [aiRecommendation, setAiRecommendation] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  const fetchModelComparison = async () => {
    if (!metrics) return;
    
    const comparisonMetrics = Object.entries(metrics).map(([name, m]) => ({
      model_name: name,
      "R2 Score": m['R2 Score'] || 0,
      MAE: m.MAE || 0,
      RMSE: m.RMSE || 0,
      "Prediction Time": m['Prediction Time'] || 0
    }));

    setAiRecommendation('');
    setAiError('');
    setAiLoading(true);
    try {
      const analysis = await getModelComparison(comparisonMetrics);
      setAiRecommendation(analysis);
    } catch (e) {
      console.error(e);
      setAiError('Failed to load AI model comparison recommendation.');
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    if (metrics) {
      fetchModelComparison();
    }
  }, [metrics]);

  if (apiOffline) {
    return <ErrorState type="offline" onAction={reconnect} />;
  }

  const MODEL_METADATA = {
    "Linear Regression": { memory: "0.2 MB", useCase: "Baseline price index forecasting." },
    "Decision Tree": { memory: "2.4 MB", useCase: "Simple rules representation on tabular rows." },
    "Random Forest": { memory: "48.1 MB", useCase: "Standard tabular price regression." },
    "Extra Trees": { memory: "446.5 MB", useCase: "Robust simulation on noisy marketplace dataset." },
    "Gradient Boosting": { memory: "12.8 MB", useCase: "Tabular regression on moderate rows." },
    "XGBoost Regressor": { memory: "8.4 MB", useCase: "Production pricing simulations." },
    "LightGBM Regressor": { memory: "4.2 MB", useCase: "High-volume transactional catalogs." },
    "CatBoost Regressor": { memory: "16.1 MB", useCase: "Datasets with categorical categories." }
  };

  const modelRows = React.useMemo(() => {
    if (!metrics) return [];
    return Object.entries(metrics).map(([name, m]) => ({
      name: name.replace(" Regressor", "").replace(" Regression", ""),
      fullName: name,
      r2: m['R2 Score'] || 0,
      mae: m.MAE || 0,
      rmse: m.RMSE || 0,
      trainTime: m['Train Time'] || 0,
      predTime: m['Prediction Time'] || 0,
      isWinner: m.Winner || false,
      memory: MODEL_METADATA[name]?.memory || '8.4 MB',
      useCase: MODEL_METADATA[name]?.useCase || 'General regression.'
    })).sort((a, b) => b.r2 - a.r2);
  }, [metrics]);

  const topModels = modelRows.slice(0, 3);
  const radarData = React.useMemo(() => {
    const defaultData = [
      { subject: 'R² Accuracy', A: 95, B: 90, C: 82 },
      { subject: 'MAE Efficiency', A: 90, B: 85, C: 70 },
      { subject: 'Prediction Speed', A: 85, B: 92, C: 60 },
      { subject: 'Train Fit Runtime', A: 70, B: 88, C: 50 },
      { subject: 'RAM Footprint', A: 15, B: 40, C: 85 }
    ];

    if (topModels.length < 3) return defaultData;

    return [
      {
        subject: 'R² Accuracy',
        [topModels[0].name]: Math.round(topModels[0].r2 * 100),
        [topModels[1].name]: Math.round(topModels[1].r2 * 100),
        [topModels[2].name]: Math.round(topModels[2].r2 * 100),
      },
      {
        subject: 'MAE Efficiency',
        [topModels[0].name]: Math.round(100 - (topModels[0].mae / 50) * 100),
        [topModels[1].name]: Math.round(100 - (topModels[1].mae / 50) * 100),
        [topModels[2].name]: Math.round(100 - (topModels[2].mae / 50) * 100),
      },
      {
        subject: 'Prediction Speed',
        [topModels[0].name]: Math.round(Math.max(10, 100 - (topModels[0].predTime * 1000 * 50))),
        [topModels[1].name]: Math.round(Math.max(10, 100 - (topModels[1].predTime * 1000 * 50))),
        [topModels[2].name]: Math.round(Math.max(10, 100 - (topModels[2].predTime * 1000 * 50))),
      },
      {
        subject: 'Train Fit Runtime',
        [topModels[0].name]: Math.round(Math.max(10, 100 - (topModels[0].trainTime / 150) * 100)),
        [topModels[1].name]: Math.round(Math.max(10, 100 - (topModels[1].trainTime / 150) * 100)),
        [topModels[2].name]: Math.round(Math.max(10, 100 - (topModels[2].trainTime / 150) * 100)),
      },
      {
        subject: 'RAM Footprint',
        [topModels[0].name]: Math.round(Math.max(5, 100 - (parseFloat(topModels[0].memory) / 450) * 100)),
        [topModels[1].name]: Math.round(Math.max(5, 100 - (parseFloat(topModels[1].memory) / 450) * 100)),
        [topModels[2].name]: Math.round(Math.max(5, 100 - (parseFloat(topModels[2].memory) / 450) * 100)),
      }
    ];
  }, [topModels]);

  const handleDownloadReport = () => {
    if (modelRows.length === 0) return;
    const reportText = `# Model Comparison Report\n\nGenerated: ${new Date().toLocaleString()}\n\n` +
      `| Model Name | R² Score | MAE (₹) | RMSE (₹) | Memory | Fit Time (s) |\n` +
      `| :--- | :--- | :--- | :--- | :--- | :--- |\n` +
      modelRows.map(r => `| ${r.fullName} | ${r.r2.toFixed(5)} | ${r.mae.toFixed(2)} | ${r.rmse.toFixed(2)} | ${r.memory} | ${r.trainTime.toFixed(2)}s |`).join('\n');
      
    const blob = new Blob([reportText], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `pricepilot_models_benchmark_${Date.now()}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('success', 'Benchmark report downloaded.');
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto pb-12 select-none">
      
      {/* 1. Hero Section */}
      <div className="glass-card p-6 relative overflow-hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-[24px]">
        <div className="absolute -right-24 -top-24 w-48 h-48 bg-[#da4e24]/15 blur-3xl rounded-full pointer-events-none" />
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight font-outfit">Model Benchmarks</h1>
          <p className="text-xs text-[#B8BCC8] mt-1.5 font-medium">Contrast algorithm accuracy R², error distributions, storage load, and latency specs.</p>
        </div>
        <button 
          onClick={handleDownloadReport}
          disabled={isLoading || isError || modelRows.length === 0}
          className="btn-secondary flex items-center gap-2 self-start uppercase font-bold tracking-wider text-[10px] disabled:opacity-50"
        >
          <Download className="w-4 h-4 text-[#0098f3]" /> Download Report
        </button>
      </div>

      {/* 2. Primary KPI stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Champion Model', value: topModels[0]?.fullName?.replace(' Regressor', '') || 'N/A', desc: 'Highest R² score on metrics' },
          { label: 'Peak Accuracy R²', value: topModels[0]?.r2 ? topModels[0].r2.toFixed(5) : '0.00000', desc: 'Validation accuracy indicator' },
          { label: 'Average MAE Error', value: topModels[0]?.mae ? `₹${topModels[0].mae.toFixed(2)}` : '₹0.00', desc: 'Mean Absolute Deviation' },
          { label: 'Avg SIMD Latency', value: topModels[0]?.predTime ? `${(topModels[0].predTime * 1000).toFixed(3)}ms` : '0.00ms', desc: 'Single-row execution time' }
        ].map((item, idx) => (
          <div key={idx} className="glass-card p-4.5 flex flex-col justify-between h-28 rounded-[24px]">
            <div>
              <span className="text-[9px] font-bold text-[#B8BCC8]/50 uppercase tracking-widest block font-outfit">{item.label}</span>
              <span className="text-sm font-extrabold text-white tracking-tight block mt-1.5 truncate font-outfit">{item.value}</span>
            </div>
            <span className="text-[9px] text-[#B8BCC8]/60 font-semibold mt-3 pt-2.5 border-t border-white/[0.06] block">{item.desc}</span>
          </div>
        ))}
      </div>

      {/* 3. Visualizations (4-state logic) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Radar Chart (top 3 compare) */}
        <div className="lg:col-span-5 glass-card p-6 space-y-4 rounded-[24px]">
          <div>
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider font-outfit">Normalized Characteristics</h3>
            <p className="text-[11px] text-[#B8BCC8]/60 font-medium">Normalized specs mapping (higher index = better result)</p>
          </div>

          <div className="h-72 relative z-10 font-sans">
            {isLoading ? (
              /* State 1: Loading */
              <div className="h-full w-full bg-white/[0.02] border border-white/[0.04] rounded-2xl animate-pulse flex items-center justify-center">
                <span className="text-[#B8BCC8]/40 text-xs font-semibold">Plotting Radar...</span>
              </div>
            ) : isError ? (
              /* State 4: API Error */
              <div className="h-full w-full flex flex-col items-center justify-center text-center space-y-3 p-4">
                <AlertCircle className="w-8 h-8 text-[#FF5D73]" />
                <h4 className="text-white font-bold text-xs uppercase tracking-wider">Metrics Unavailable</h4>
                <button 
                  onClick={() => { setRetryKey(k => k + 1); refetch(); }}
                  className="px-3 py-1.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white rounded-lg text-[9px] uppercase tracking-wider font-bold transition-all flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Retry Loading
                </button>
              </div>
            ) : modelRows.length === 0 ? (
              /* State 3: No Data */
              <div className="h-full w-full flex flex-col items-center justify-center text-center space-y-2">
                <BarChart2 className="w-7 h-7 text-[#B8BCC8]/40" />
                <p className="text-[#B8BCC8]/50 text-xs font-semibold">No active models benchmarked.</p>
              </div>
            ) : (
              /* State 2: Has Data (custom colors) */
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.06)" />
                  <PolarAngleAxis dataKey="subject" stroke="#B8BCC8" fontSize={8} tickLine={false} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="rgba(255,255,255,0.1)" tick={false} />
                  {topModels.map((m, idx) => {
                    const strokeColor = idx === 0 ? '#da4e24' : idx === 1 ? '#0098f3' : '#2ED47A';
                    return (
                      <Radar
                        key={m.name}
                        name={m.name}
                        dataKey={m.name}
                        stroke={strokeColor}
                        fill={strokeColor}
                        fillOpacity={0.15}
                      />
                    );
                  })}
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(18,22,34,0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', fontSize: '10px', color: '#FFF', backdropFilter: 'blur(20px)' }}
                    itemStyle={{ color: '#FFFFFF' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '9px', opacity: 0.8, paddingTop: '10px' }} />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Compact Benchmarks Table */}
        <div className="lg:col-span-7 glass-card p-6 space-y-4 rounded-[24px]">
          <div>
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider font-outfit">Detailed Benchmarks Table</h3>
            <p className="text-[11px] text-[#B8BCC8]/60 font-medium">Ranked regression algorithm metrics comparison</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-white/[0.06] text-[#B8BCC8]/60 font-bold uppercase tracking-widest text-[9px] font-outfit">
                  <th className="py-2.5">Rank</th>
                  <th className="py-2.5">Model</th>
                  <th className="py-2.5 text-right">R² Score</th>
                  <th className="py-2.5 text-right">MAE</th>
                  <th className="py-2.5 text-right">Latency</th>
                  <th className="py-2.5 text-right">Memory</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.02] font-semibold text-[#B8BCC8]">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#B8BCC8]/50 animate-pulse">Loading benchmarks...</td>
                  </tr>
                ) : modelRows.length > 0 ? (
                  modelRows.map((model, idx) => {
                    const isFirst = idx === 0;
                    return (
                      <tr key={model.name} className={`hover:bg-white/[0.02] transition-colors ${isFirst ? 'text-white' : ''}`}>
                        <td className="py-3">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${isFirst ? 'bg-[#da4e24] text-white' : 'bg-white/5 text-[#B8BCC8]'}`}>
                            {idx + 1}
                          </span>
                        </td>
                        <td className="py-3 font-outfit font-bold">{model.fullName.replace(' Regressor', '')}</td>
                        <td className="py-3 text-right font-mono">{model.r2.toFixed(5)}</td>
                        <td className="py-3 text-right font-mono">₹{model.mae.toFixed(2)}</td>
                        <td className="py-3 text-right font-mono">{(model.predTime * 1000).toFixed(2)}ms</td>
                        <td className="py-3 text-right font-mono text-[10px]">{model.memory}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#B8BCC8]/40 font-semibold">No benchmark metrics logged.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
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

export default ModelComparison;
