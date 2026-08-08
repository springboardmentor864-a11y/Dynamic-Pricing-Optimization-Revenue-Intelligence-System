import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { LineChart as LineChartIcon, BarChart2, PieChart as PieChartIcon, TrendingUp, Filter, Activity } from 'lucide-react';

const AnalyticsPage = () => {
  const [timeRange, setTimeRange] = useState('2026');

  // Bar Chart: Average Product Prices by Category
  const avgPricesData = [
    { category: 'Computers & Tech', avgPrice: 340.5, items: 12400 },
    { category: 'Watches & Jewelry', avgPrice: 285.0, items: 8900 },
    { category: 'Office Furniture', avgPrice: 215.8, items: 15200 },
    { category: 'Home Appliances', avgPrice: 168.4, items: 22100 },
    { category: 'Health & Beauty', avgPrice: 110.2, items: 18400 },
    { category: 'Sports & Outdoors', avgPrice: 94.6, items: 14300 },
    { category: 'Toys & Games', avgPrice: 62.3, items: 11200 },
    { category: 'Fashion Accessories', avgPrice: 48.9, items: 10150 },
  ];

  // Line Chart: Monthly Predictions Trend
  const monthlyPredictionsData = [
    { month: 'Jan', predictions: 8400, avgPrice: 112 },
    { month: 'Feb', predictions: 9200, avgPrice: 118 },
    { month: 'Mar', predictions: 11500, avgPrice: 124 },
    { month: 'Apr', predictions: 10800, avgPrice: 121 },
    { month: 'May', predictions: 13400, avgPrice: 132 },
    { month: 'Jun', predictions: 14800, avgPrice: 129 },
    { month: 'Jul', predictions: 16200, avgPrice: 138 },
    { month: 'Aug', predictions: 15900, avgPrice: 135 },
    { month: 'Sep', predictions: 17300, avgPrice: 144 },
    { month: 'Oct', predictions: 18900, avgPrice: 148 },
    { month: 'Nov', predictions: 21400, avgPrice: 162 },
    { month: 'Dec', predictions: 24800, avgPrice: 175 },
  ];

  // Pie Chart: Product Categories Distribution
  const categoryDistributionData = [
    { name: 'Health & Beauty', value: 24.5, color: '#a855f7' },
    { name: 'Bed & Bath', value: 18.2, color: '#3b82f6' },
    { name: 'Sports & Leisure', value: 15.8, color: '#10b981' },
    { name: 'Furniture & Decor', value: 14.1, color: '#f59e0b' },
    { name: 'Computers & Electronics', value: 12.6, color: '#ec4899' },
    { name: 'Other Categories', value: 14.8, color: '#64748b' },
  ];

  // Area Chart: Demand Forecast
  const demandForecastData = [
    { month: 'Q1 2025', actualDemand: 28000, forecastDemand: 27500 },
    { month: 'Q2 2025', actualDemand: 34000, forecastDemand: 33800 },
    { month: 'Q3 2025', actualDemand: 39000, forecastDemand: 39500 },
    { month: 'Q4 2025', actualDemand: 48000, forecastDemand: 47200 },
    { month: 'Q1 2026', actualDemand: 51000, forecastDemand: 51800 },
    { month: 'Q2 2026', actualDemand: 58000, forecastDemand: 57400 },
    { month: 'Q3 2026 (Est)', actualDemand: null, forecastDemand: 64500 },
    { month: 'Q4 2026 (Est)', actualDemand: null, forecastDemand: 72000 },
  ];

  // Scatter Plot: Freight Value vs Product Weight vs Predicted Price
  const scatterCorrelationData = [
    { freight: 12, weight: 450, price: 110 },
    { freight: 18, weight: 1200, price: 245 },
    { freight: 25, weight: 3400, price: 380 },
    { freight: 42, weight: 8500, price: 650 },
    { freight: 8, weight: 220, price: 75 },
    { freight: 15, weight: 980, price: 185 },
    { freight: 32, weight: 5400, price: 510 },
    { freight: 65, weight: 14000, price: 1250 },
    { freight: 11, weight: 650, price: 135 },
    { freight: 28, weight: 4100, price: 420 },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-semibold mb-2">
            <LineChartIcon className="w-3.5 h-3.5 text-blue-400" /> Dynamic Pricing Intelligence
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white">
            Analytics & <span className="gradient-text">Market Insights</span>
          </h1>
          <p className="text-xs text-slate-400">
            Visualization of price distributions, category share, demand forecast, and feature correlations.
          </p>
        </div>

        {/* Time Selector */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <div className="flex bg-slate-900/80 rounded-xl p-1 border border-slate-800 text-xs">
            {['2026', '2025', 'All Time'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 rounded-lg font-medium transition ${
                  timeRange === range ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid Row 1: Bar Chart & Pie Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Bar Chart: Average Product Prices */}
        <div className="lg:col-span-2 rounded-3xl glass-card p-6 border border-slate-800">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-purple-400" /> Average Product Prices by Category
              </h3>
              <p className="text-xs text-slate-400">Mean unit prices across primary product categories (₹)</p>
            </div>
            <span className="text-xs font-mono text-purple-400 font-bold bg-purple-500/10 px-2.5 py-1 rounded-full border border-purple-500/20">
              8 Segments
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={avgPricesData} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="category" stroke="#64748b" fontSize={11} interval={0} angle={-15} textAnchor="end" />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc' }}
                  formatter={(value) => [`₹${value}`, 'Avg Price']}
                />
                <Bar dataKey="avgPrice" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart: Product Categories */}
        <div className="rounded-3xl glass-card p-6 border border-slate-800 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2 mb-1">
              <PieChartIcon className="w-5 h-5 text-emerald-400" /> Category Share
            </h3>
            <p className="text-xs text-slate-400 mb-4">Percentage breakdown of 112,650 items</p>

            <div className="h-52 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryDistributionData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                    {categoryDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} formatter={(val) => [`${val}%`, 'Share']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-800 text-[11px]">
            {categoryDistributionData.map((cat, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                <span className="text-slate-300 truncate">{cat.name}</span>
                <span className="font-mono font-bold text-slate-400 ml-auto">{cat.value}%</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Grid Row 2: Line Chart & Area Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Line Chart */}
        <div className="rounded-3xl glass-card p-6 border border-slate-800">
          <h3 className="text-base font-bold text-white flex items-center gap-2 mb-6">
            <LineChartIcon className="w-5 h-5 text-blue-400" /> Monthly Price Prediction Volume
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyPredictionsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
                <Line type="monotone" dataKey="predictions" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Area Chart */}
        <div className="rounded-3xl glass-card p-6 border border-slate-800">
          <h3 className="text-base font-bold text-white flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-emerald-400" /> Quarterly Demand Forecast
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={demandForecastData}>
                <defs>
                  <linearGradient id="forecastColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
                <Area type="monotone" dataKey="forecastDemand" stroke="#10b981" strokeWidth={3} fill="url(#forecastColor)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Grid Row 3: Scatter Plot (Price vs Weight & Freight Correlation) */}
      <div className="rounded-3xl glass-card p-6 border border-slate-800">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-400" /> Price vs Freight & Weight Correlation (Scatter Plot)
            </h3>
            <p className="text-xs text-slate-400">Distribution cluster showing non-linear pricing response to logistics attributes</p>
          </div>
          <span className="text-xs font-mono text-purple-400 font-bold bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
            Scatter Correlation
          </span>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis type="number" dataKey="freight" name="Freight ($)" stroke="#64748b" fontSize={11} unit="$" />
              <YAxis type="number" dataKey="price" name="Price (₹)" stroke="#64748b" fontSize={11} unit="₹" />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc' }} />
              <Scatter name="Products" data={scatterCorrelationData} fill="#a855f7" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};

export default AnalyticsPage;
