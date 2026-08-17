import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Download, Trash2, SlidersHorizontal } from 'lucide-react';
import { getApiUrl } from '../config';
import { useSystem } from '../context/SystemContext';
import { useAuth } from '../context/AuthContext';
import GlassSelect from '../components/GlassSelect';

const PredictionHistory = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { showToast } = useSystem();
  
  // Filter States
  const [search, setSearch] = useState('');
  const [modelFilter, setModelFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Fetch prediction logs from API with active parameters
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['predictionsHistory', modelFilter, categoryFilter, search],
    queryFn: async () => {
      let url = getApiUrl(`/api/predictions/history?`);
      if (modelFilter) url += `model_used=${encodeURIComponent(modelFilter)}&`;
      if (categoryFilter) url += `category=${encodeURIComponent(categoryFilter)}&`;
      if (search) url += `search=${encodeURIComponent(search)}&`;
      
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to load predictions history.');
      const json = await res.json();
      return json.success !== undefined ? json.data : json;
    }
  });

  // Clear Logs Mutation
  const clearHistoryMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(getApiUrl('/api/predictions/clear'), { method: 'POST' });
      if (!res.ok) throw new Error('Failed to wipe logs.');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['predictionsHistory'] });
      showToast('success', 'Prediction history logs successfully purged.');
    },
    onError: (err) => {
      showToast('error', err.message);
    }
  });

  // Extract unique categories and models for filter selector dropdowns
  const { data: filterOptions = { categories: [], models: [] } } = useQuery({
    queryKey: ['filterOptions'],
    queryFn: async () => {
      // Get categories list
      const catRes = await fetch(getApiUrl('/categories'));
      let categories = [];
      if (catRes.ok) {
        const json = await catRes.json();
        const catData = json.success !== undefined ? json.data : json;
        categories = (catData.categories || []).map(c => c.english);
      }
      
      const models = [
        'Linear Regression',
        'Decision Tree',
        'Random Forest',
        'Extra Trees',
        'Gradient Boosting',
        'XGBoost Regressor',
        'CatBoost Regressor',
        'LightGBM Regressor'
      ];
      
      return { categories, models };
    }
  });

  const handleExportCSV = () => {
    const logsList = Array.isArray(logs) ? logs : [];
    if (logsList.length === 0) {
      showToast('info', 'No logs available to export.');
      return;
    }
    
    // Compile CSV client-side
    const headers = ['ID', 'Product ID', 'Product Name', 'Category', 'Actual Price', 'Predicted Price', 'Model Used', 'Confidence', 'Reason (LLM Output)', 'Date', 'Operator'];
    const rows = logsList.map(l => [
      l.id,
      l.product_id,
      `"${(l.product_name || '').replace(/"/g, '""')}"`,
      l.category,
      l.actual_price !== undefined && l.actual_price !== null ? l.actual_price : '',
      l.predicted_price,
      l.model_used,
      `${l.confidence}%`,
      `"${(l.llm_reason || l.llm_output || '').replace(/"/g, '""')}"`,
      l.created_date || l.timestamp,
      l.user_email || l.user
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `pricepilot_predictions_history_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('success', 'CSV export complete.');
  };

  const handleExportPDF = () => {
    const logsList = Array.isArray(logs) ? logs : [];
    if (logsList.length === 0) {
      showToast('info', 'No logs available to export.');
      return;
    }
    
    const printWindow = window.open('', '_blank');
    const tableRows = logsList.map(l => `
      <tr>
        <td>${l.product_id || l.id}</td>
        <td>${l.product_name || 'N/A'}</td>
        <td>${l.category}</td>
        <td>$${l.predicted_price.toFixed(2)}</td>
        <td>${l.model_used || l.model_name || 'N/A'}</td>
        <td>${l.confidence}%</td>
        <td>${l.created_date || l.timestamp}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>PricePilot AI - Prediction History Report</title>
          <style>
            body { font-family: sans-serif; color: #333; margin: 40px; }
            h1 { font-family: sans-serif; color: #1a1a1a; margin-bottom: 5px; }
            p { font-size: 12px; color: #666; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; font-size: 11px; }
            th { background-color: #f5f5f5; font-weight: bold; }
            tr:nth-child(even) { background-color: #f9f9f9; }
          </style>
        </head>
        <body>
          <h1>PricePilot AI - Prediction History Report</h1>
          <p>Generated on: ${new Date().toLocaleString()} | Filtered Dataset Audit Logs</p>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Product Name</th>
                <th>Category</th>
                <th>Predicted Price</th>
                <th>Model Solver</th>
                <th>Confidence</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
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
    showToast('success', 'PDF export complete.');
  };

  const handleClearHistory = () => {
    if (user.role !== 'Admin') {
      showToast('error', 'Only administrative accounts can wipe logs.');
      return;
    }
    
    if (window.confirm('WARNING: This will permanently wipe all stored prediction history logs from the platform. Proceed?')) {
      clearHistoryMutation.mutate();
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto pb-12 select-none">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight font-outfit">Prediction Audit Logs</h1>
          <p className="text-xs text-[#B8BCC8] mt-1.5 font-medium">Review, filter, and audit price prediction run history.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleExportCSV}
            className="btn-secondary uppercase font-bold tracking-wider text-[10px]"
          >
            <Download className="w-4 h-4 text-[#0098f3]" /> Export CSV
          </button>
          <button 
            onClick={handleExportPDF}
            className="btn-secondary uppercase font-bold tracking-wider text-[10px]"
          >
            <Download className="w-4 h-4 text-[#da4e24]" /> Export PDF
          </button>
          {user?.role === 'Admin' && (
            <button 
              onClick={handleClearHistory}
              disabled={clearHistoryMutation.isPending}
              className="btn-danger uppercase font-bold tracking-wider text-[10px]"
            >
              <Trash2 className="w-4 h-4" /> Purge Logs
            </button>
          )}
        </div>
      </div>

      {/* Filter panel */}
      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-widest font-outfit">
          <SlidersHorizontal className="w-4 h-4 text-[#da4e24]" />
          <span>Search Filters</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#B8BCC8]/50 absolute left-3 top-3.5" />
            <input
              type="text"
              placeholder="Search product ID or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white/[0.03] border border-white/[0.08] focus:border-[#da4e24] text-white rounded-xl text-xs outline-none transition-all placeholder-[#B8BCC8]/40 focus:bg-white/[0.06]"
            />
          </div>

          {/* Model selection */}
          <GlassSelect
            value={modelFilter}
            onChange={(val) => setModelFilter(val)}
            options={[
              { value: '', label: 'All Models' },
              ...(filterOptions.models || []).map(m => ({ value: m, label: m }))
            ]}
            className="w-full"
          />

          {/* Category selection */}
          <GlassSelect
            value={categoryFilter}
            onChange={(val) => setCategoryFilter(val)}
            options={[
              { value: '', label: 'All Categories' },
              ...(filterOptions.categories || []).map(c => ({ value: c, label: c }))
            ]}
            className="w-full"
          />
        </div>
      </div>

      {/* Audit Grid */}
      <div className="glass-card overflow-hidden shadow-lg">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-[#B8BCC8]/40 font-semibold animate-pulse">
            Querying logs archive database...
          </div>
        ) : (
          <div className="overflow-x-auto p-4">
            <table className="glass-table min-w-[900px]">
              <thead>
                <tr>
                  <th className="glass-table-header">Date</th>
                  <th className="glass-table-header">Product ID / Item Name</th>
                  <th className="glass-table-header">Category</th>
                  <th className="glass-table-header">Model Used</th>
                  <th className="glass-table-header">Confidence</th>
                  <th className="glass-table-header">Predicted Price</th>
                  <th className="glass-table-header">Reason (LLM Output)</th>
                  <th className="glass-table-header">Operator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.02]">
                {Array.isArray(logs) && logs.length > 0 ? (
                  logs.map((log) => (
                    <tr key={log.id} className="glass-table-row">
                      <td className="glass-table-cell text-xs text-[#B8BCC8]/50 font-bold">
                        {new Date(log.created_date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className="glass-table-cell font-semibold text-white max-w-[250px] truncate">
                        <div>
                          <span className="block truncate text-xs text-[#0098f3] font-mono">{log.product_id}</span>
                          <span className="block truncate font-bold text-white font-outfit mt-0.5">{log.product_name}</span>
                        </div>
                      </td>
                      <td className="glass-table-cell text-xs capitalize font-semibold text-[#B8BCC8]">
                        {log.category.replace(/_/g, ' ')}
                      </td>
                      <td className="glass-table-cell">
                        <span className="px-2.5 py-1 rounded-lg bg-white/[0.04] text-[#B8BCC8] border border-white/[0.08] text-[9px] font-bold uppercase tracking-wider">
                          {log.model_used.replace(' Regressor', '')}
                        </span>
                      </td>
                      <td className="glass-table-cell">
                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold ${log.confidence >= 80 ? 'badge-active' : log.confidence >= 60 ? 'badge-warning' : 'badge-suspended'}`}>
                          {Math.round(log.confidence)}%
                        </span>
                      </td>
                      <td className="glass-table-cell font-mono font-bold text-white">
                        ₹{log.predicted_price.toFixed(2)}
                      </td>
                      <td className="glass-table-cell text-xs text-[#B8BCC8] max-w-[280px] whitespace-normal leading-relaxed">
                        {log.llm_reason || log.llm_output || 'No recommendation generated.'}
                      </td>
                      <td className="glass-table-cell text-xs text-[#B8BCC8]/60 font-semibold truncate font-mono">
                        {log.user_email}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-xs text-[#B8BCC8]/40 font-bold">
                      No prediction logs found. Make predictions inside the simulator to populate this grid.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PredictionHistory;
