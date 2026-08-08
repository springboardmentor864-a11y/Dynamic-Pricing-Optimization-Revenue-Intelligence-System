import React, { useState } from 'react';
import usePredictionHistory from '../hooks/usePredictionHistory';
import { useToast } from '../context/ToastContext';
import { 
  History, Search, Download, Trash2, ArrowUpDown, ChevronLeft, 
  ChevronRight, Sparkles, CheckCircle2, Eye, X, FileText
} from 'lucide-react';

const HistoryPage = () => {
  const { history, deletePrediction, clearHistory, exportToCSV } = usePredictionHistory();
  const toast = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState(null);
  const itemsPerPage = 8;

  // Filter search
  const filtered = history.filter((item) => {
    const term = searchTerm.toLowerCase();
    return (
      item.id.toLowerCase().includes(term) ||
      (item.category && item.category.toLowerCase().includes(term)) ||
      (item.recommendation && item.recommendation.toLowerCase().includes(term))
    );
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'price') {
      return (b.predictedPrice || 0) - (a.predictedPrice || 0);
    }
    return new Date(b.timestamp) - new Date(a.timestamp);
  });

  // Pagination
  const totalPages = Math.ceil(sorted.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = sorted.slice(startIndex, startIndex + itemsPerPage);

  const handleExportCSV = () => {
    if (history.length === 0) {
      toast.warning('No prediction logs available to export.');
      return;
    }
    exportToCSV();
    toast.success('Prediction history CSV report downloaded successfully!');
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all prediction history logs?')) {
      clearHistory();
      toast.info('Prediction history cleared.');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#1F2937]">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold mb-2">
            <History className="w-3.5 h-3.5 text-purple-400" /> PostgreSQL & Session Audit Log
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white">
            Prediction <span className="gradient-text">History Log</span>
          </h1>
          <p className="text-xs text-slate-400">
            Audit trail of all executed ML price predictions with search, filter, and CSV report export.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-500/20 transition"
          >
            <Download className="w-4 h-4" /> Export CSV Report
          </button>
          
          {history.length > 0 && (
            <button
              onClick={handleClearAll}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-rose-950 text-slate-300 hover:text-rose-400 border border-[#1F2937] hover:border-rose-800 font-medium text-xs transition"
            >
              <Trash2 className="w-4 h-4" /> Clear All
            </button>
          )}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="rounded-[18px] bg-[#111827] p-4 border border-[#1F2937] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by ID, Category..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 rounded-xl glass-input text-xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <ArrowUpDown className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-400">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1.5 rounded-xl glass-input text-xs bg-[#111827]"
          >
            <option value="date">Most Recent</option>
            <option value="price">Highest Price</option>
          </select>
        </div>
      </div>

      {/* History Table */}
      <div className="rounded-[18px] bg-[#111827] border border-[#1F2937] p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[#1F2937] text-slate-400 font-sans text-[11px] uppercase">
                <th className="py-3 px-4">Prediction ID</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Freight</th>
                <th className="py-3 px-4">Weight</th>
                <th className="py-3 px-4">Predicted Price</th>
                <th className="py-3 px-4">Recommendation</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {paginatedItems.length > 0 ? (
                paginatedItems.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-purple-400">{row.id}</td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px] font-mono">
                      {new Date(row.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3.5 px-4 text-slate-200">{row.category || 'Electronics'}</td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono">{row.freight}</td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono">{row.weight}</td>
                    <td className="py-3.5 px-4 font-bold text-emerald-400 text-sm font-mono">
                      ₹{(row.predictedPrice || 0).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 text-[11px]">
                      <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 font-semibold">
                        {row.recommendation || 'Optimal Price Valuation'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center space-x-1">
                      <button
                        onClick={() => setSelectedItem(row)}
                        className="p-1.5 rounded-lg text-blue-400 hover:bg-blue-500/10 transition"
                        title="View Full Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => { deletePrediction(row.id); toast.info('Log entry removed.'); }}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition"
                        title="Delete log"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-slate-500 font-sans text-xs">
                    No prediction history logs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 mt-4 border-t border-[#1F2937] text-xs">
            <span className="text-slate-400 font-mono">
              Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, sorted.length)} of {sorted.length} records
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="p-2 rounded-xl bg-slate-900 border border-[#1F2937] text-slate-300 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-mono text-purple-300 font-bold px-2">{currentPage} / {totalPages}</span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="p-2 rounded-xl bg-slate-900 border border-[#1F2937] text-slate-300 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-[#070b14]/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-[#1F2937] rounded-[18px] p-6 max-w-md w-full shadow-2xl space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-[#1F2937] pb-3">
              <h4 className="text-base font-bold text-white flex items-center gap-2 font-sans">
                <FileText className="w-4 h-4 text-purple-400" /> Log #{selectedItem.id}
              </h4>
              <button onClick={() => setSelectedItem(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-[#1F2937] flex justify-between">
                <span className="text-slate-500 font-sans">Predicted Price</span>
                <span className="text-emerald-400 font-bold text-sm">₹{(selectedItem.predictedPrice || 0).toFixed(2)}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-[#1F2937] flex justify-between">
                <span className="text-slate-500 font-sans">Category</span>
                <span className="text-blue-300 font-bold">{selectedItem.category}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-[#1F2937] flex justify-between">
                <span className="text-slate-500 font-sans">Confidence</span>
                <span className="text-purple-300 font-bold">{selectedItem.confidence || '96.5%'}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-[#1F2937] flex justify-between">
                <span className="text-slate-500 font-sans">ML Engine</span>
                <span className="text-slate-200">{selectedItem.model || 'Extra Trees Regressor'}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedItem(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold font-sans"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default HistoryPage;
