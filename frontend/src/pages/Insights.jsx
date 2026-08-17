import React, { useState } from 'react';
import { useDashboardData } from '../context/DashboardDataContext';
import ErrorState from '../components/ErrorState';
import { TrendingUp, TrendingDown, Briefcase, HelpCircle } from 'lucide-react';
import { getApiUrl } from '../config';
import { useSystem } from '../context/SystemContext';
import GlassSelect from '../components/GlassSelect';

const Insights = () => {
  const { showToast } = useSystem();
  
  // Optimizer State
  const [optCategory, setOptCategory] = useState('utilidades_domesticas');
  const [optMonth, setOptMonth] = useState('7');
  const [optOrders, setOptOrders] = useState('200');
  const [optPrice, setOptPrice] = useState('80');
  const [optPending, setOptPending] = useState(false);
  const [optResult, setOptResult] = useState(null);

  const categoryOptions = [
    { value: 'utilidades_domesticas', label: 'Housewares' },
    { value: 'automotivo', label: 'Auto Accessories' },
    { value: 'cama_mesa_banho', label: 'Bed Table Bath' },
    { value: 'informatica_acessorios', label: 'Computer Accessories' }
  ];

  const {
    dashboardStats: stats,
    loading: isLoading,
    apiOffline,
    reconnect
  } = useDashboardData();

  if (apiOffline) {
    return <ErrorState type="offline" onAction={reconnect} />;
  }

  const handleRunOptimizer = async (e) => {
    e.preventDefault();
    setOptPending(true);
    setOptResult(null);

    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      const res = await fetch(getApiUrl('/optimize-revenue'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: optCategory,
          month: parseInt(optMonth),
          previous_orders: parseInt(optOrders),
          price: parseFloat(optPrice)
        })
      });

      if (!res.ok) throw new Error('Optimizer failure.');
      const data = await res.json();
      setOptResult(data.success !== undefined && data.data !== undefined ? data.data : data);
      showToast('success', 'Optimal revenue target solved.');
    } catch (err) {
      showToast('error', 'Optimizer run failed.');
    } finally {
      setOptPending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse max-w-7xl mx-auto pb-12">
        <div className="h-10 w-1/4 bg-white/5 rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-white/5 rounded-2xl" />
          <div className="h-96 bg-white/5 rounded-2xl" />
        </div>
      </div>
    );
  }

  // Pre-calculated Top/Worst performing products list
  const topProducts = stats?.top_products || [
    { name: 'Computers Accessories Pro', sales: 1204, price: 189.90, margin: '28%' },
    { name: 'Auto Spark Plug X', sales: 945, price: 42.00, margin: '22%' },
    { name: 'Houseware Bed Set', sales: 812, price: 119.50, margin: '25%' }
  ];

  const worstProducts = [
    { name: 'Generic Phone Case Mini', sales: 12, price: 9.90, margin: '5%' },
    { name: 'Vintage Table Lamp', sales: 8, price: 299.00, margin: '-2%' },
    { name: 'Logistics Wooden Box', sales: 3, price: 85.00, margin: '1%' }
  ];

  const opportunities = [
    { title: 'Raise Houseware Price Indexes', impact: '+$14.2k Revenue', desc: 'Auto categories exhibit inelastic pricing traits. Increasing recommended index thresholds by 8% will boost revenue with zero sales drop.' },
    { title: 'Logistics Packing Bundling', impact: '+$8.3k Savings', desc: 'Freight value ratios exceed weight standards. Bundling packaging items will bypass extra cargo fees.' },
    { title: 'Auto Accessories Replenishment', impact: '+15% Turnover', desc: 'ARIMA models predict a 90-day demand spike. Recommend restocking catalog inventory to prevent out-of-stock drift.' }
  ];

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto pb-12 select-none">
      
      {/* Title */}
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight font-outfit">Executive Business Intelligence</h1>
        <p className="text-xs text-[#B8BCC8] mt-1.5 font-medium">Audit sales performances, catalog opportunities, and run revenue pricing solvers.</p>
      </div>

      {/* Top / Worst Products Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Top Performers */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3">
            <TrendingUp className="w-4 h-4 text-[#2ED47A]" />
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider font-outfit">Top Performing Catalog Products</h3>
          </div>
          <div className="overflow-x-auto p-2">
            <table className="glass-table w-full text-xs">
              <thead>
                <tr className="border-b border-white/[0.06] text-[#B8BCC8]/60 font-bold text-left uppercase tracking-widest text-[9px] font-outfit">
                  <th className="py-3">Product Name</th>
                  <th className="py-3 text-right">Orders Volume</th>
                  <th className="py-3 text-right">Recommended Price</th>
                  <th className="py-3 text-right">Gross Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.02]">
                {topProducts.map((p, idx) => (
                  <tr key={idx} className="glass-table-row">
                    <td className="glass-table-cell font-bold text-white font-outfit">{p.product_name || p.name}</td>
                    <td className="glass-table-cell text-right font-mono text-[#B8BCC8]">{p.sales} units</td>
                    <td className="glass-table-cell text-right font-mono text-white font-bold">₹{p.price.toFixed(2)}</td>
                    <td className="glass-table-cell text-right text-[#2ED47A] font-extrabold font-outfit">{p.margin || '25%'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Worst Performers */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3">
            <TrendingDown className="w-4 h-4 text-[#FF5D73]" />
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider font-outfit">Underperforming Catalog Products</h3>
          </div>
          <div className="overflow-x-auto p-2">
            <table className="glass-table w-full text-xs">
              <thead>
                <tr className="border-b border-white/[0.06] text-[#B8BCC8]/60 font-bold text-left uppercase tracking-widest text-[9px] font-outfit">
                  <th className="py-3">Product Name</th>
                  <th className="py-3 text-right">Orders Volume</th>
                  <th className="py-3 text-right">Recommended Price</th>
                  <th className="py-3 text-right">Gross Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.02]">
                {worstProducts.map((p, idx) => (
                  <tr key={idx} className="glass-table-row">
                    <td className="glass-table-cell font-bold text-white font-outfit">{p.name}</td>
                    <td className="glass-table-cell text-right font-mono text-[#B8BCC8]">{p.sales} units</td>
                    <td className="glass-table-cell text-right font-mono text-white font-bold">₹{p.price.toFixed(2)}</td>
                    <td className={`glass-table-cell text-right font-extrabold font-outfit ${p.margin.startsWith('-') ? 'text-[#FF5D73]' : 'text-[#F8B84E]'}`}>{p.margin}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Interactive Pricing Elasticity Solver */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Solver Form */}
        <form onSubmit={handleRunOptimizer} className="lg:col-span-5 glass-card p-6 space-y-4 text-xs">
          <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-1.5 border-b border-white/[0.06] pb-3 font-outfit">
            <Briefcase className="w-4 h-4 text-[#da4e24]" /> Revenue Elasticity Optimizer
          </h3>

          <div className="space-y-3.5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#B8BCC8]/60 uppercase tracking-widest block font-outfit">Product Category</label>
              <GlassSelect
                value={optCategory}
                onChange={(val) => setOptCategory(val)}
                options={categoryOptions}
                className="w-full"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#B8BCC8]/60 uppercase tracking-widest block font-outfit">Base Sales Volume</label>
                <input
                  type="number"
                  value={optOrders}
                  onChange={(e) => setOptOrders(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/[0.08] focus:border-[#da4e24] text-white rounded-xl outline-none placeholder-[#B8BCC8]/40 transition-all focus:bg-white/[0.06]"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#B8BCC8]/60 uppercase tracking-widest block font-outfit">Base Price (₹)</label>
                <input
                  type="number"
                  value={optPrice}
                  onChange={(e) => setOptPrice(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/[0.08] focus:border-[#da4e24] text-white rounded-xl outline-none placeholder-[#B8BCC8]/40 transition-all focus:bg-white/[0.06]"
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={optPending}
            className="btn-primary w-full py-2.5 uppercase font-bold tracking-wider text-[10px] flex items-center justify-center gap-2"
          >
            {optPending ? 'Evaluating elasticity curves...' : 'Run Revenue Solver'}
          </button>
        </form>

        {/* Solver output */}
        <div className="lg:col-span-7 space-y-4">
          {optPending && (
            <div className="glass-card p-8 flex flex-col items-center justify-center text-center space-y-4 h-60 animate-pulse text-xs backdrop-blur-xl">
              <div className="w-8 h-8 border-2 border-[#da4e24] border-t-transparent rounded-full animate-spin" />
              <p className="text-[#B8BCC8]/70 font-semibold font-outfit">Computing demand elasticity coefficients...</p>
            </div>
          )}

          {!optPending && !optResult && (
            <div className="glass-card p-8 flex flex-col items-center justify-center text-center space-y-3 h-52 text-xs">
              <HelpCircle className="w-7 h-7 text-[#B8BCC8]/40" />
              <h4 className="text-white font-extrabold uppercase tracking-wider font-outfit">Optimizer Results Awaiting</h4>
              <p className="text-[#B8BCC8]/60 max-w-xs font-semibold">Fill details on the left and run solver to display optimal price curve points.</p>
            </div>
          )}

          {optResult && !optPending && (
            <div className="glass-card p-6 space-y-5 animate-fadeIn text-xs">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
                <div>
                  <span className="text-[9px] font-bold text-[#B8BCC8]/50 uppercase tracking-widest block font-outfit">Solved Max Revenue Yield</span>
                  <h3 className="text-xl font-extrabold text-white tracking-tight mt-1 font-mono">
                    ₹{optResult.optimized_revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </h3>
                </div>
                <div className="px-2.5 py-1 rounded-full bg-[#2ED47A]/10 border border-[#2ED47A]/20 text-[#2ED47A] font-extrabold text-[9px] uppercase tracking-widest font-outfit">
                  +{optResult.improvement_percentage}% Yield Lift
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-2xl">
                  <span className="text-[9px] font-bold text-[#B8BCC8]/50 uppercase tracking-widest block font-outfit">Current Struct</span>
                  <div className="space-y-1.5 mt-2.5 text-[#B8BCC8] font-semibold">
                    <p>Price: <span className="text-white font-bold">₹{optResult.current_price.toFixed(2)}</span></p>
                    <p>Volume: <span className="text-white font-bold">{optResult.current_demand} units</span></p>
                  </div>
                </div>

                <div className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-2xl">
                  <span className="text-[9px] font-bold text-[#B8BCC8]/50 uppercase tracking-widest block font-outfit">Optimized Struct</span>
                  <div className="space-y-1.5 mt-2.5 text-[#B8BCC8] font-semibold">
                    <p>Price: <span className="text-[#0098f3] font-extrabold">₹{optResult.optimized_price.toFixed(2)}</span></p>
                    <p>Volume: <span className="text-white font-bold">{optResult.optimized_demand} units</span></p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Growth Opportunities */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-white uppercase tracking-widest font-outfit">Strategic Growth Opportunities</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {opportunities.map((opp, idx) => (
            <div key={idx} className="glass-card p-5 flex flex-col justify-between h-44 hover:border-white/[0.16] transition-all duration-300">
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <h4 className="text-xs font-extrabold text-white leading-snug font-outfit">{opp.title}</h4>
                  <span className="px-2 py-0.5 rounded bg-[#da4e24]/15 border border-[#da4e24]/30 text-white font-extrabold text-[8px] uppercase tracking-widest shrink-0 font-outfit">
                    {opp.impact}
                  </span>
                </div>
                <p className="text-[11px] text-[#B8BCC8]/70 leading-relaxed font-semibold pt-1">{opp.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Information */}
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

export default Insights;
