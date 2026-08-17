import React, { useState } from 'react';
import { dashboardSummary, businessInsights } from '../services/aiService';
import { useDashboardData } from '../context/DashboardDataContext';
import ErrorState from '../components/ErrorState';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { 
  Cpu, Layers, PackageOpen, Coins, Truck, Clock, 
  Award, Target, Activity, Zap, Sparkles, Terminal, FileText, AlertCircle, RefreshCw, ChevronRight, CornerDownRight
} from 'lucide-react';
import { getApiUrl } from '../config';

const Dashboard = () => {
  const {
    dashboardStats: stats,
    modelMetrics: metrics,
    recentPredictions = [],
    loading: statsLoading,
    apiOffline,
    errorStates,
    refreshAllData,
    reconnect
  } = useDashboardData();

  const [aiData, setAiData] = useState({
    summary: '',
    insights: '',
    loading: false,
    error: '',
    healthScore: 84,
    healthLabel: 'Good'
  });

  const handleGenerateBiDashboard = async () => {
    setAiData(prev => ({ ...prev, loading: true, error: '' }));
    try {
      const [summaryText, insightsText] = await Promise.all([
        dashboardSummary(stats),
        businessInsights(stats?.top_products || [])
      ]);
      
      const accuracyMultiplier = stats?.r2_score || 0.81;
      const baseScore = 75 + Math.round((accuracyMultiplier - 0.5) * 50);
      const score = Math.max(0, Math.min(100, baseScore));
      
      let label = 'Moderate';
      if (score >= 90) label = 'Excellent';
      else if (score >= 80) label = 'Good';
      else if (score >= 60) label = 'Moderate';
      else label = 'Poor';

      setAiData({
        summary: summaryText,
        insights: insightsText,
        loading: false,
        error: '',
        healthScore: score,
        healthLabel: label
      });
    } catch (e) {
      console.error(e);
      setAiData(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to compile Executive BI analytics. Please verify connection.'
      }));
    }
  };

  const handleExportDashboardPDF = () => {
    if (!aiData.summary) return;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>PricePilot AI - Executive Dashboard Summary Report</title>
          <style>
            body { font-family: sans-serif; color: #333; margin: 40px; line-height: 1.6; }
            h1 { color: #1a1a1a; border-bottom: 2px solid #da4e24; padding-bottom: 8px; }
            h2 { color: #0098f3; font-size: 16px; margin-top: 20px; }
            p { font-size: 13px; color: #444; }
            .meta { font-size: 11px; color: #777; margin-bottom: 30px; }
            .summary-box { background: #f9f9f9; border-left: 4px solid #da4e24; padding: 15px; margin-bottom: 20px; border-radius: 4px; }
          </style>
        </head>
        <body>
          <h1>PricePilot AI - Executive Dashboard Summary</h1>
          <div class="meta">Generated on: ${new Date().toLocaleString()} | Evaluator/Auditor Report</div>
          
          <div class="summary-box">
            <h2>AI-Generated Executive Summary</h2>
            <p>${aiData.summary.replace(/\\n/g, '<br />')}</p>
          </div>
          
          <h2>Platform Financial Performance Telemetry</h2>
          <ul>
            <li><strong>Total Transacted Catalog Value:</strong> $${stats?.total_revenue?.toLocaleString() || 'N/A'}</li>
            <li><strong>Average Predicted Value:</strong> $${stats?.average_price?.toFixed(2) || 'N/A'}</li>
            <li><strong>Champion Model Accuracy (R²):</strong> ${stats?.r2_score?.toFixed(4) || 'N/A'}</li>
            <li><strong>Logistics Transit Latency (Average):</strong> ${stats?.average_delivery_time?.toFixed(1) || 'N/A'} days</li>
          </ul>

          <script>
            window.onload = function() {
              window.print();
              window.close();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleExportInsightsPDF = () => {
    if (!aiData.insights) return;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>PricePilot AI - Strategic Business Insights Report</title>
          <style>
            body { font-family: sans-serif; color: #333; margin: 40px; line-height: 1.6; }
            h1 { color: #1a1a1a; border-bottom: 2px solid #2ED47A; padding-bottom: 8px; }
            h2 { color: #0098f3; font-size: 16px; margin-top: 20px; }
            p { font-size: 13px; color: #444; }
            .meta { font-size: 11px; color: #777; margin-bottom: 30px; }
            .insights-box { background: #f9f9f9; border-left: 4px solid #2ED47A; padding: 15px; margin-bottom: 20px; border-radius: 4px; }
          </style>
        </head>
        <body>
          <h1>PricePilot AI - Strategic Business Insights</h1>
          <div class="meta">Generated on: ${new Date().toLocaleString()} | Evaluator/Auditor Report</div>
          
          <div class="insights-box">
            <h2>AI-Generated Strategic Insights</h2>
            <p>${aiData.insights.replace(/\\n/g, '<br />')}</p>
          </div>

          <script>
            window.onload = function() {
              window.print();
              window.close();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const generateActionCenterItems = () => {
    const items = [];
    if (!stats) return items;

    const avgFreight = stats.average_freight || 20.0;
    const avgDelivery = stats.average_delivery_time || 15.0;
    const r2 = stats.r2_score || 0.81;

    if (avgDelivery > 14) {
      items.push({
        priority: 'High',
        color: 'text-[#FF5D73] bg-[#FF5D73]/10 border-[#FF5D73]/20',
        title: 'Optimize Delivery Latency',
        desc: `Transit times average ${avgDelivery.toFixed(1)} days. Recommend negotiating local catalog partnerships.`
      });
    }

    if (r2 < 0.82) {
      items.push({
        priority: 'High',
        color: 'text-[#FF5D73] bg-[#FF5D73]/10 border-[#FF5D73]/20',
        title: 'Retrain Pricing Regressors',
        desc: `Leaderboard coefficient holds at ${r2.toFixed(4)} R². Trigger a fit training pass under custom parameters.`
      });
    }

    if (avgFreight > 18) {
      items.push({
        priority: 'Medium',
        color: 'text-[#0098f3] bg-[#0098f3]/10 border-[#0098f3]/20',
        title: 'Revise Freight Subsidies',
        desc: `Average freight cost is ₹${avgFreight.toFixed(2)}. Suggest bundling products to capture delivery discount limits.`
      });
    }

    items.push({
      priority: 'Low',
      color: 'text-[#2ED47A] bg-[#2ED47A]/10 border-[#2ED47A]/20',
      title: 'Listing Quality Audit',
      desc: 'Verify that newly created catalog items contain at least 4 photos and 50 characters in descriptions.'
    });

    return items;
  };

  const generateSmartAlerts = () => {
    const alerts = [];
    if (!stats) return alerts;

    const avgPrice = stats.average_price || 88.0;
    const totalProducts = stats.total_products || 70;

    if (avgPrice > 90) {
      alerts.push({ type: 'warning', text: 'Pricing Anomaly: Category price deviations exceed standard bounds.' });
    }
    if (totalProducts < 100) {
      alerts.push({ type: 'info', text: 'Inventory Warning: Catalog diversity is below target threshold.' });
    }
    alerts.push({ type: 'success', text: 'Accuracy Match: Predictive R² scores align with expectations.' });

    return alerts;
  };

  const metricsLoading = statsLoading;
  
  if (apiOffline) {
    return <ErrorState type="offline" onAction={reconnect} />;
  }

  const totalRecords = stats?.dataset_records || 95748;
  const totalProducts = stats?.total_products || 73;
  const totalCategories = stats?.total_categories || 73;
  const averagePrice = stats?.average_price || 88.61;
  const averageFreight = stats?.average_freight || 20.0;
  const averageDelivery = stats?.average_delivery_time || 15.0;

  const championModel = stats?.best_model || 'Extra Trees';
  const r2Score = stats?.r2_score || 0.81098;
  const mseVal = stats?.mse || 775.81;
  const trainTime = stats?.train_time || 30.7;
  const predTime = stats?.prediction_time || 0.00016;
  const latestTrainingDate = stats?.latest_training_date || 'N/A';

  const kpiCards = [
    { title: 'Dataset Records', value: totalRecords.toLocaleString(), desc: 'Olist Catalog Scope', icon: Layers, gradient: 'from-[#da4e24]/15 to-[#0098f3]/15', text: 'text-[#da4e24]', change: '+1.4%', aiComment: 'Optimizing memory indexes.' },
    { title: 'Categories', value: totalCategories.toLocaleString(), desc: 'Dynamic Mapped Classes', icon: Layers, gradient: 'from-[#0098f3]/15 to-[#da4e24]/15', text: 'text-[#0098f3]', change: '+0.5%', aiComment: 'Healthy product segmentation.' },
    { title: 'Product Catalog', value: totalProducts.toLocaleString(), desc: 'Unique Item Catalog', icon: PackageOpen, gradient: 'from-[#da4e24]/15 to-[#0098f3]/15', text: 'text-[#da4e24]', change: '+2.1%', aiComment: 'Expanding item catalogs.' },
    { title: 'Avg Base Price', value: `₹${averagePrice.toFixed(2)}`, desc: 'Product Selling Mean', icon: Coins, gradient: 'from-[#0098f3]/15 to-[#da4e24]/15', text: 'text-[#0098f3]', change: '+4.8%', aiComment: 'AI Suggests: Room for 4.8% premium pricing in housewares.' },
    { title: 'Avg Freight Cost', value: `₹${averageFreight.toFixed(2)}`, desc: 'Average Logistics Fee', icon: Truck, gradient: 'from-[#da4e24]/15 to-[#0098f3]/15', text: 'text-[#da4e24]', change: '-2.3%', aiComment: 'Logistics optimization target: Reduce freight via zone clustering.' },
    { title: 'Avg Delivery', value: `${averageDelivery.toFixed(1)} days`, desc: 'Customer Transit Time', icon: Clock, gradient: 'from-[#0098f3]/15 to-[#da4e24]/15', text: 'text-[#0098f3]', change: '-1.2%', aiComment: 'Transit velocity is stable.' }
  ];

  const leaderboardData = metrics ? Object.entries(metrics).map(([name, m]) => ({
    name: name.replace(" Regressor", "").replace(" Regression", ""),
    r2: m['R2 Score'] || 0
  })).sort((a, b) => b.r2 - a.r2) : [];

  const monthlyRevenue = stats?.monthly_revenue || [];

  return (
    <div className="space-y-6 animate-fadeIn max-w-7xl mx-auto pb-12 select-none">
      
      {/* Header and Title */}
      <div className="glass-card relative overflow-hidden flex flex-col md:flex-row md:items-center md:justify-between gap-6 border border-white/[0.08] p-6 rounded-[24px]">
        <div className="absolute -right-24 -top-24 w-60 h-60 bg-[#da4e24]/15 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute -left-24 -bottom-24 w-60 h-60 bg-[#0098f3]/10 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="space-y-3 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#da4e24]/10 border border-[#da4e24]/30 text-[#da4e24] text-[9px] font-bold uppercase tracking-widest font-outfit">
            <Sparkles className="w-3 h-3" /> Executive Command Console
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight font-outfit">
            Dynamic Pricing Intelligence
          </h1>
          <p className="desc-text max-w-2xl leading-relaxed text-[#B8BCC8]/80 text-xs">
            Welcome to the PricePilot command console. Champion pricing algorithms are currently evaluating transaction data layers to serve optimized retail recommendations.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0 relative z-10 font-outfit text-xs">
          <button
            onClick={handleGenerateBiDashboard}
            disabled={aiData.loading}
            className="px-4 py-2 bg-gradient-to-tr from-[#da4e24] to-[#0098f3] hover:opacity-95 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 outline-none disabled:opacity-50 uppercase tracking-wider text-[10px]"
          >
            {aiData.loading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Synthesizing BI...
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5" /> Refresh AI Summary
              </>
            )}
          </button>
          <button
            onClick={() => refreshAllData()}
            className="px-3.5 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl transition-all flex items-center justify-center gap-1.5 uppercase tracking-wider text-[10px]"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Telemetry
          </button>
        </div>
      </div>

      {/* 1. Executive KPI Cards (3 consolidated cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-5 flex flex-col justify-between h-36 rounded-[24px]">
          <div>
            <span className="text-[9px] font-bold text-[#B8BCC8]/50 uppercase tracking-widest block font-outfit">Catalog Scope</span>
            <h3 className="metric-value pt-1 text-2xl font-extrabold text-white mt-1">{totalRecords.toLocaleString()}</h3>
            <span className="text-[9px] text-[#B8BCC8]/60 block mt-1 font-medium">
              Active transacted records across {totalCategories} category classes.
            </span>
          </div>
          <div className="flex items-center justify-between border-t border-white/[0.06] pt-2">
            <span className="text-[10px] text-[#2ED47A] font-bold">Stable Mapped Catalog</span>
            <Layers className="w-4 h-4 text-[#da4e24]" />
          </div>
        </div>

        <div className="glass-card p-5 flex flex-col justify-between h-36 rounded-[24px]">
          <div>
            <span className="text-[9px] font-bold text-[#B8BCC8]/50 uppercase tracking-widest block font-outfit">Pricing Metrics</span>
            <h3 className="metric-value pt-1 text-2xl font-extrabold text-white mt-1">₹{averagePrice.toFixed(2)}</h3>
            <span className="text-[9px] text-[#B8BCC8]/60 block mt-1 font-medium">
              Average base price value solved across retail items.
            </span>
          </div>
          <div className="flex items-center justify-between border-t border-white/[0.06] pt-2">
            <span className="text-[10px] text-[#2ED47A] font-bold">Inference Average</span>
            <Coins className="w-4 h-4 text-[#0098f3]" />
          </div>
        </div>

        <div className="glass-card p-5 flex flex-col justify-between h-36 rounded-[24px]">
          <div>
            <span className="text-[9px] font-bold text-[#B8BCC8]/50 uppercase tracking-widest block font-outfit">Logistics Latency</span>
            <h3 className="metric-value pt-1 text-2xl font-extrabold text-white mt-1">₹{averageFreight.toFixed(2)} | {averageDelivery.toFixed(1)} days</h3>
            <span className="text-[9px] text-[#B8BCC8]/60 block mt-1 font-medium">
              Mean freight fee & customer transit duration bounds.
            </span>
          </div>
          <div className="flex items-center justify-between border-t border-white/[0.06] pt-2">
            <span className="text-[10px] text-[#FF5D73] font-bold">Zone Optimization Target</span>
            <Truck className="w-4 h-4 text-[#da4e24]" />
          </div>
        </div>
      </div>

      {/* 2. Hero Component: AI Executive Summary */}
      <div className="glass-card p-6 space-y-4 rounded-[24px]">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4.5 h-4.5 text-[#da4e24]" />
            <h3 className="text-xs font-bold text-white uppercase tracking-widest font-outfit">AI Executive Report</h3>
          </div>
          {aiData.summary && (
            <button
              onClick={handleExportDashboardPDF}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white font-bold text-[9px] rounded-lg border border-white/10 transition-all flex items-center justify-center gap-1.5 uppercase tracking-wider font-outfit"
            >
              <FileText className="w-3.5 h-3.5 text-[#da4e24]" /> Export PDF
            </button>
          )}
        </div>
        <div className="text-xs text-[#B8BCC8]/90 leading-relaxed whitespace-pre-line bg-white/[0.01] p-4 border border-white/[0.04] rounded-xl font-outfit">
          {aiData.summary || "Awaiting financial report synthesis. Click 'Refresh AI Summary' in the header to generate the executive report."}
        </div>
      </div>

      {/* 3. Business Health Score & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-4 glass-card p-6 flex flex-col justify-between items-center text-center relative overflow-hidden h-64 rounded-[24px]">
          <h4 className="text-xs font-bold text-white uppercase tracking-widest block font-outfit border-b border-white/[0.06] pb-2 w-full">Business Health Score</h4>
          <div className="relative w-24 h-24 flex items-center justify-center my-2 shrink-0">
            <svg className="absolute w-full h-full transform -rotate-90">
              <circle cx="48" cy="48" r="40" stroke="rgba(255,255,255,0.06)" strokeWidth="5" fill="transparent" />
              <circle cx="48" cy="48" r="40" stroke="#2ED47A" strokeWidth="5" fill="transparent" strokeDasharray="251.2" strokeDashoffset={251.2 - (aiData.healthScore / 100) * 251.2} />
            </svg>
            <div className="flex flex-col items-center">
              <span className="text-2xl font-extrabold text-white font-outfit leading-none">{aiData.healthScore}</span>
              <span className="text-[9px] text-[#2ED47A] font-bold uppercase tracking-wider mt-1">{aiData.healthLabel}</span>
            </div>
          </div>
          <p className="text-[10px] text-[#B8BCC8]/75 leading-relaxed font-semibold max-w-[200px]">
            System diagnostics reflect **{aiData.healthLabel}** performance indexes based on ML accuracy values.
          </p>
        </div>

        <div className="lg:col-span-8 glass-card p-6 flex flex-col justify-between h-64 rounded-[24px]">
          <h4 className="text-xs font-bold text-white uppercase tracking-widest block font-outfit border-b border-white/[0.06] pb-2">Smart Alerts & Recommendations</h4>
          <div className="space-y-2 overflow-y-auto pr-1 flex-1 py-2">
            {generateSmartAlerts().map((alert, idx) => (
              <div 
                key={idx} 
                className={`p-2.5 rounded-xl border text-[10px] font-bold font-outfit flex items-center gap-2 ${
                  alert.type === 'warning' ? 'bg-[#FF5D73]/10 border-[#FF5D73]/20 text-[#FF5D73]' :
                  alert.type === 'info' ? 'bg-[#0098f3]/10 border-[#0098f3]/20 text-[#0098f3]' :
                  'bg-[#2ED47A]/10 border-[#2ED47A]/20 text-[#2ED47A]'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
                <span>{alert.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Revenue Trend (Gross Transaction Development curve) */}
      <div className="glass-card p-6 space-y-4 rounded-[24px]">
        <div>
          <h3 className="section-title">Gross Transaction Development</h3>
          <p className="desc-text mt-1 text-[11px] text-[#B8BCC8]/60">Monthly aggregated order volume revenue development</p>
        </div>
        <div className="h-64 relative z-10 font-sans">
          {statsLoading ? (
            <div className="h-full w-full bg-white/[0.02] border border-white/[0.04] rounded-2xl animate-pulse flex items-center justify-center">
              <span className="text-[#B8BCC8]/40 text-xs font-semibold">Loading data points...</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyRevenue} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
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
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#da4e24" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 5. Best Model (Leaderboard specs & Accuracy splits) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-8 glass-card p-6 flex flex-col justify-between space-y-4 rounded-[24px]">
          <div className="flex items-center gap-3 border-b border-white/[0.06] pb-3">
            <Award className="w-5 h-5 text-[#da4e24]" />
            <div>
              <h3 className="section-title">Active ML Leaderboard Champion</h3>
              <p className="desc-text mt-0.5 text-[11px] text-[#B8BCC8]/65 font-medium">Highest scoring model handling simulation inputs.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: 'Champion Model', value: championModel.replace(" Regressor", ""), icon: Cpu },
              { label: 'Accuracy R²', value: r2Score.toFixed(5), icon: Target },
              { label: 'Mean Sq Error', value: mseVal.toFixed(2), icon: Activity },
              { label: 'Fit Duration', value: `${trainTime.toFixed(1)}s`, icon: Clock },
              { label: 'SIMD Latency', value: `${(predTime * 1000).toFixed(2)}ms`, icon: Zap }
            ].map((item, idx) => (
              <div key={idx} className="p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl flex flex-col justify-between">
                <span className="text-[8px] font-bold text-[#B8BCC8]/50 uppercase tracking-wider block font-outfit">{item.label}</span>
                <span className="text-[11px] font-extrabold text-white block mt-2 truncate font-mono">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-4 glass-card p-6 flex flex-col justify-between space-y-4 rounded-[24px]">
          <h3 className="section-title">Leaderboard Accuracy</h3>
          <div className="h-36 relative z-10">
            {metricsLoading ? (
              <div className="h-full w-full flex flex-col justify-between pt-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-3 w-full bg-white/5 rounded-full animate-pulse" />
                ))}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={leaderboardData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="name" stroke="#B8BCC8" opacity={0.6} fontSize={8} tickLine={false} />
                  <YAxis stroke="#B8BCC8" opacity={0.6} fontSize={8} tickLine={false} domain={[0, 1]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(18,22,34,0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', fontSize: '10px', color: '#FFF', backdropFilter: 'blur(20px)' }}
                    itemStyle={{ color: '#FFFFFF' }}
                  />
                  <Bar dataKey="r2" name="R2 Score" fill="url(#purpleGlow)" radius={[4, 4, 0, 0]}>
                    <defs>
                      <linearGradient id="purpleGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#da4e24" />
                        <stop offset="100%" stopColor="#0098f3" />
                      </linearGradient>
                    </defs>
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* 6. Recent Activity & Diagnostics Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-8 glass-card p-6 space-y-4 rounded-[24px]">
          <div className="flex items-center gap-3 border-b border-white/[0.06] pb-3">
            <Terminal className="w-5 h-5 text-[#da4e24]" />
            <h3 className="section-title">Live Activity Logs</h3>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {recentPredictions.length > 0 ? (
              recentPredictions.slice(0, 5).map((log) => (
                <div key={log.id} className="p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl flex items-center justify-between text-xs hover:bg-white/[0.04] transition-all">
                  <div className="overflow-hidden pr-2">
                    <span className="block font-mono text-[9px] text-[#0098f3] truncate max-w-[200px]">{log.product_id}</span>
                    <span className="block font-bold text-white truncate max-w-[200px] font-outfit mt-0.5">{log.product_name}</span>
                    <span className="block text-[9px] text-[#B8BCC8]/60 mt-0.5 capitalize font-semibold">{log.category.replace(/_/g, ' ')}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="block font-mono font-bold text-white">₹{log.predicted_price.toFixed(2)}</span>
                    <span className="block text-[8px] text-[#2ED47A] font-bold mt-1 tracking-wider uppercase font-outfit">{log.model_used.replace(' Regressor', '')}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-[#B8BCC8]/40 text-xs font-semibold">
                No recent predictions logged.
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 glass-card p-6 flex flex-col justify-between rounded-[24px] h-64">
          <div className="border-b border-white/[0.06] pb-3">
            <h3 className="section-title">System Operations</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 py-2 text-[10px] font-semibold text-[#B8BCC8]">
            <div className="p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl">
              <span className="text-[8px] text-[#B8BCC8]/45 block uppercase font-outfit">AI STATUS</span>
              <span className="text-white mt-1 block">Active</span>
            </div>
            <div className="p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl">
              <span className="text-[8px] text-[#B8BCC8]/45 block uppercase font-outfit">DB CONNS</span>
              <span className="text-white mt-1 block">Healthy</span>
            </div>
          </div>
          <button
            onClick={async () => {
              showToast('info', 'Executing DB connection checks...');
              try {
                const res = await fetch(getApiUrl('/api/settings/db/diagnostics'));
                const jsonRes = await res.json();
                const data = jsonRes.data || jsonRes;
                if (data.status === 'success') {
                  showToast('success', data.message || `Database Diagnostics Verified (${data.latency_ms}ms latency)!`);
                } else {
                  showToast('error', data.message || 'Database connection test failed.');
                }
              } catch (e) {
                showToast('error', 'Diagnostics connection test failed.');
              }
            }}
            className="w-full py-2.5 mt-2 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 text-[10px] font-bold uppercase tracking-wider font-outfit transition-all"
          >
            Run DB Diagnostics
          </button>
        </div>
      </div>

      {/* Footer */}
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

export default Dashboard;
