import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Database, Table, Layers, CheckCircle2, Filter, Tag } from 'lucide-react';

const DatasetPage = () => {
  // Feature Importance Data based on Extra Trees Feature Importances
  const featureImportances = [
    { feature: 'Freight Value', importance: 0.285 },
    { feature: 'Product Weight (g)', importance: 0.224 },
    { feature: 'Product Volume (cm³)', importance: 0.182 },
    { feature: 'Product Category', importance: 0.115 },
    { feature: 'Photos Quantity', importance: 0.068 },
    { feature: 'Description Length', importance: 0.045 },
    { feature: 'Product Length (cm)', importance: 0.038 },
    { feature: 'Purchase Month', importance: 0.024 },
    { feature: 'Purchase Weekday', importance: 0.019 },
  ];

  // Raw dataset sample rows
  const datasetSamples = [
    { item_id: 1, category: 'Computers', weight: '1200g', freight: '$18.50', volume: '4500 cm³', price: '₹245.50' },
    { item_id: 2, category: 'Furniture', weight: '8500g', freight: '$42.00', volume: '72000 cm³', price: '₹480.00' },
    { item_id: 3, category: 'Health & Beauty', weight: '350g', freight: '$8.20', volume: '1200 cm³', price: '₹89.90' },
    { item_id: 4, category: 'Sports', weight: '1800g', freight: '$15.00', volume: '9800 cm³', price: '₹165.00' },
    { item_id: 5, category: 'Watches', weight: '220g', freight: '$9.50', volume: '450 cm³', price: '₹320.00' },
  ];

  const statCards = [
    { title: 'Total Rows', value: '112,650', subtitle: 'Cleaned E-Commerce Records', color: 'text-purple-400', border: 'border-purple-500/30' },
    { title: 'Total Columns', value: '16', subtitle: 'Attributes & Metadata', color: 'text-blue-400', border: 'border-blue-500/30' },
    { title: 'Input Features', value: '15', subtitle: 'Predictor Variables', color: 'text-emerald-400', border: 'border-emerald-500/30' },
    { title: 'Target Variable', value: 'price', subtitle: 'Product Unit Valuation (₹)', color: 'text-amber-400', border: 'border-amber-500/30' },
    { title: 'Missing Values', value: '0', subtitle: '100% Preprocessed Clean Data', color: 'text-cyan-400', border: 'border-cyan-500/30' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="pb-4 border-b border-slate-800">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-semibold mb-2">
          <Database className="w-3.5 h-3.5 text-cyan-400" /> Olist Brazilian E-Commerce Dataset
        </div>
        <h1 className="text-2xl lg:text-3xl font-extrabold text-white">
          Dataset Overview & <span className="gradient-text">Feature Importance</span>
        </h1>
        <p className="text-xs text-slate-400">
          Exploratory summary of the 112k order records dataset used for dynamic price training.
        </p>
      </div>

      {/* 5 Required Dataset Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((card, idx) => (
          <div key={idx} className={`rounded-2xl glass-card p-5 border ${card.border} hover:scale-[1.02] transition duration-200`}>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">{card.title}</p>
            <h3 className={`text-2xl font-extrabold font-mono ${card.color}`}>{card.value}</h3>
            <p className="text-[11px] text-slate-500 mt-1">{card.subtitle}</p>
          </div>
        ))}
      </div>

      {/* Feature Importance Chart */}
      <div className="rounded-3xl glass-card p-6 border border-slate-800">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-purple-400" /> Feature Importance Distribution (Extra Trees)
            </h3>
            <p className="text-xs text-slate-400">Relative Gini impurity weight assigned to each predictor feature</p>
          </div>
          <span className="text-xs font-mono text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20 font-bold">
            Freight & Weight Top Predictors
          </span>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={featureImportances}
              margin={{ top: 10, right: 30, left: 100, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis type="number" stroke="#64748b" fontSize={11} domain={[0, 0.35]} />
              <YAxis type="category" dataKey="feature" stroke="#94a3b8" fontSize={12} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '12px',
                  color: '#f8fafc',
                }}
                formatter={(val) => [`${(val * 100).toFixed(1)}% Weight`, 'Importance']}
              />
              <Bar dataKey="importance" fill="#8b5cf6" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Dataset Sample Table */}
      <div className="rounded-3xl glass-card p-6 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Table className="w-5 h-5 text-blue-400" /> Sample Cleaned Rows Preview
          </h3>
          <span className="text-xs text-slate-400 font-mono">5 of 112,650 rows</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-sans text-[11px] uppercase">
                <th className="py-3 px-4">Item ID</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Weight</th>
                <th className="py-3 px-4">Freight Value</th>
                <th className="py-3 px-4">Volume</th>
                <th className="py-3 px-4">Target Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {datasetSamples.map((row, i) => (
                <tr key={i} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 font-bold text-purple-400">#{row.item_id}</td>
                  <td className="py-3 px-4 text-slate-200 font-sans">{row.category}</td>
                  <td className="py-3 px-4 text-slate-300">{row.weight}</td>
                  <td className="py-3 px-4 text-slate-300">{row.freight}</td>
                  <td className="py-3 px-4 text-slate-300">{row.volume}</td>
                  <td className="py-3 px-4 font-bold text-emerald-400 text-sm">{row.price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default DatasetPage;
