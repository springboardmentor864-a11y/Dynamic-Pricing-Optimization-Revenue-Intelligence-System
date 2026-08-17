import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Sparkles, TrendingUp, DollarSign, Cpu, Calculator, RefreshCw } from 'lucide-react';
import { getApiUrl } from '../config';

const RevenueOptimizer = ({ categories }) => {
  const [formData, setFormData] = useState({
    category: '',
    month: '7',
    previous_orders: '',
    price: ''
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (categories && categories.length > 0 && !formData.category) {
      setFormData(prev => ({ ...prev, category: categories[0] }));
    }
  }, [categories]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    const monthVal = parseInt(formData.month);
    const prevOrdersVal = parseInt(formData.previous_orders);
    const priceVal = parseFloat(formData.price);

    if (isNaN(prevOrdersVal) || prevOrdersVal < 0 || isNaN(priceVal) || priceVal <= 0) {
      setError("Please enter valid positive values for previous orders and price.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(getApiUrl('/optimize-revenue'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: formData.category,
          month: monthVal,
          previous_orders: prevOrdersVal,
          price: priceVal
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Revenue optimization failed.");
      }

      const data = await response.json();
      setResult(data.success !== undefined && data.data !== undefined ? data.data : data);
    } catch (err) {
      setError(err.message || "Failed to connect to backend server. Make sure server is trained and running.");
    } finally {
      setLoading(false);
    }
  };

  // Chart data
  const chartData = result ? [
    { name: 'Current Revenue', revenue: result.current_revenue, fill: '#0098f3' },
    { name: 'Optimized Revenue', revenue: result.optimized_revenue, fill: '#06b6d4' }
  ] : [];

  return (
    <div className="space-y-8 animate-fadeIn max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-purple-400">
          AI Revenue Optimizer
        </h1>
        <p className="text-gray-400 mt-1">
          Evaluate elasticity curves to locate the optimal product pricing index that maximizes total gross revenue.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Form Input */}
        <form onSubmit={handleSubmit} className="glass-panel p-6 rounded-2xl border-glow-purple space-y-5">
          <h3 className="text-md font-bold text-white flex items-center gap-2">
            <Calculator className="w-4 h-4 text-purple-400" />
            Optimizer Input parameters
          </h3>

          <div className="space-y-4">
            {/* Category selection */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Product Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-black/60 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
              >
                {categories.map((cat, idx) => (
                  <option key={idx} value={cat} className="bg-[#0f0a1c] text-white">
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Month */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Target Month</label>
              <select
                name="month"
                value={formData.month}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-black/60 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
              >
                {[
                  { v: 1, l: 'January' }, { v: 2, l: 'February' }, { v: 3, l: 'March' }, { v: 4, l: 'April' },
                  { v: 5, l: 'May' }, { v: 6, l: 'June' }, { v: 7, l: 'July' }, { v: 8, l: 'August' },
                  { v: 9, l: 'September' }, { v: 10, l: 'October' }, { v: 11, l: 'November' }, { v: 12, l: 'December' }
                ].map(m => (
                  <option key={m.v} value={m.v} className="bg-[#0f0a1c]">{m.l}</option>
                ))}
              </select>
            </div>

            {/* Previous Orders */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Base Sales Volume (Units)</label>
              <input
                type="number"
                name="previous_orders"
                value={formData.previous_orders}
                onChange={handleChange}
                placeholder="e.g. 200"
                required
                className="w-full px-4 py-2.5 bg-black/60 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>

            {/* Price */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">AI Predicted Base Price (₹)</label>
              <input
                type="number"
                step="0.01"
                name="price"
                value={formData.price}
                onChange={handleChange}
                placeholder="e.g. 80.00"
                required
                className="w-full px-4 py-2.5 bg-black/60 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold text-sm transition-all duration-300 shadow-[0_0_25px_rgba(147,51,234,0.4)] disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Optimizing pricing elasticity...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-200" />
                Run Revenue Optimizer
              </span>
            )}
          </button>
        </form>

        {/* Results Panel */}
        <div className="space-y-6">
          {loading && (
            <div className="glass-panel p-8 rounded-2xl border-glow-purple flex flex-col items-center justify-center text-center space-y-4 h-96 animate-pulse">
              <div className="w-16 h-16 rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin" />
              <p className="text-gray-400 text-sm">Evaluating elasticity simulations and demand curves...</p>
            </div>
          )}

          {!loading && !result && !error && (
            <div className="glass-panel p-8 rounded-2xl border-glow-blue flex flex-col items-center justify-center text-center space-y-4 h-96">
              <div className="p-4 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <DollarSign className="w-8 h-8 animate-pulse" />
              </div>
              <h3 className="text-white font-bold">Awaiting Optimization parameters</h3>
              <p className="text-gray-400 text-sm max-w-xs">
                Fill the parameter fields on the left and click submit to solve pricing thresholds.
              </p>
            </div>
          )}

          {error && (
            <div className="glass-panel p-8 rounded-2xl border border-red-500/30 flex flex-col items-center justify-center text-center space-y-4 h-96 bg-red-500/5">
              <div className="p-3 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 font-bold text-lg">!</div>
              <h3 className="text-white font-bold">Optimization Failed</h3>
              <p className="text-red-300 text-xs max-w-xs leading-relaxed">{error}</p>
            </div>
          )}

          {result && (
            <div className="glass-panel p-6 rounded-2xl border-glow-neon flex flex-col justify-between h-96 relative overflow-hidden animate-fadeIn">
              {/* Top info and badge */}
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Revenue Optimization Solver</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <h3 className="text-3xl font-black text-white text-glow">
                      ₹{result.optimized_revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h3>
                    <span className="text-[10px] text-gray-400">max yield</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-xs px-2.5 py-1 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.15)]">
                  <TrendingUp className="w-3.5 h-3.5" /> +{result.improvement_percentage}%
                </div>
              </div>

              {/* Grid comparison of values */}
              <div className="grid grid-cols-2 gap-4 py-2 border-y border-white/5 text-xs">
                <div className="space-y-1.5">
                  <span className="block text-[9px] text-gray-500 font-semibold uppercase tracking-wide">Current Price Structure</span>
                  <p className="text-gray-300">Price: <span className="font-semibold text-white">₹{result.current_price.toFixed(2)}</span></p>
                  <p className="text-gray-300">Volume: <span className="font-semibold text-white">{result.current_demand} units</span></p>
                  <p className="text-gray-300">Revenue: <span className="font-semibold text-purple-400">₹{result.current_revenue.toLocaleString()}</span></p>
                </div>
                <div className="space-y-1.5 border-l border-white/5 pl-4">
                  <span className="block text-[9px] text-cyan-400 font-bold uppercase tracking-wide">AI Optimized Structure</span>
                  <p className="text-gray-300">Price: <span className="font-bold text-cyan-300">₹{result.optimized_price.toFixed(2)}</span></p>
                  <p className="text-gray-300">Volume: <span className="font-semibold text-white">{result.optimized_demand} units</span></p>
                  <p className="text-gray-300">Revenue: <span className="font-bold text-cyan-300">₹{result.optimized_revenue.toLocaleString()}</span></p>
                </div>
              </div>

              {/* Bar Comparison Chart */}
              <div className="h-32 w-full pt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 10, left: 15, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                    <XAxis type="number" stroke="#666" fontSize={9} tickLine={false} />
                    <YAxis type="category" dataKey="name" stroke="#666" fontSize={9} tickLine={false} width={80} />
                    <Tooltip content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-[#0f091c]/95 border border-white/10 p-2 rounded-xl text-[10px]">
                            <span className="font-bold text-white">₹{payload[0].value.toLocaleString()}</span>
                          </div>
                        );
                      }
                      return null;
                    }} />
                    <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                      {chartData.map((entry, index) => (
                        <rect key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="p-3 bg-white/5 border border-white/5 rounded-xl text-[10px] text-gray-400 flex items-center justify-between">
                <span>Elasticity Model:</span>
                <span className="font-semibold text-purple-400 flex items-center gap-1">
                  <Cpu className="w-3.5 h-3.5" /> RandomForest Solver
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RevenueOptimizer;
