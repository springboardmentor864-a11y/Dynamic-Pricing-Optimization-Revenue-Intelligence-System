import React, { useState } from 'react';
import { useDashboardData } from '../context/DashboardDataContext';
import ErrorState from '../components/ErrorState';
import { Database, Search, Eye, Pin, CheckCircle, AlertTriangle, Download } from 'lucide-react';
import { getApiUrl } from '../config';
import { useSystem } from '../context/SystemContext';

const DatasetExplorer = () => {
  const { showToast } = useSystem();
  
  // Table state managers
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleColumns, setVisibleColumns] = useState({
    product_id: true,
    product_category_name: true,
    price: true,
    freight_value: true,
    product_weight_g: true,
    product_volume: true,
    product_photos_qty: true,
    estimated_delivery_days: true
  });
  const [pinnedColumns, setPinnedColumns] = useState({
    product_id: false,
    price: false
  });
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [page, setPage] = useState(0);
  const [showAdvancedStats, setShowAdvancedStats] = useState(false);
  const pageSize = 10;

  const {
    explorerData: explorerStats,
    loading: isLoading,
    apiOffline,
    reconnect
  } = useDashboardData();

  if (apiOffline) {
    return <ErrorState type="offline" onAction={reconnect} />;
  }

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse max-w-7xl mx-auto pb-12">
        <div className="h-10 w-1/4 bg-white/5 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-white/5 rounded-2xl" />)}
        </div>
        <div className="h-96 bg-white/5 rounded-2xl" />
      </div>
    );
  }

  const preview = explorerStats?.preview || [];
  const summaryStatistics = explorerStats?.summary_statistics || [];
  const correlationHeatmap = explorerStats?.correlation_heatmap || { columns: [], data: [] };

  const handleDownloadDataset = () => {
    // Generate mock trigger and download the preview as JSON
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(preview, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href",     dataStr);
    downloadAnchor.setAttribute("download", "pricepilot_dataset_preview.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('success', 'Preview dataset download triggered.');
  };

  // Toggle Visibility
  const toggleColumnVisibility = (col) => {
    setVisibleColumns(prev => ({ ...prev, [col]: !prev[col] }));
  };

  // Toggle Pinning
  const toggleColumnPinning = (col) => {
    setPinnedColumns(prev => ({ ...prev, [col]: !prev[col] }));
  };

  // Sorting Handler
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Client-side processing
  let processedRows = [...preview];

  // Search filter
  if (searchQuery) {
    processedRows = processedRows.filter(row => 
      row.product_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.product_category_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  // Sorting
  if (sortConfig.key) {
    processedRows.sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return sortConfig.direction === 'asc' 
        ? String(aVal).localeCompare(String(bVal)) 
        : String(bVal).localeCompare(String(aVal));
    });
  }

  // Pagination bounds
  const totalPages = Math.ceil(processedRows.length / pageSize);
  const pagedRows = processedRows.slice(page * pageSize, (page + 1) * pageSize);

  // Column definitions
  const columnsList = [
    { key: 'product_id', label: 'Product ID' },
    { key: 'product_category_name', label: 'Category' },
    { key: 'price', label: 'Price (₹)' },
    { key: 'freight_value', label: 'Freight (₹)' },
    { key: 'product_weight_g', label: 'Weight (g)' },
    { key: 'product_volume', label: 'Volume (cm³)' },
    { key: 'product_photos_qty', label: 'Photos' },
    { key: 'estimated_delivery_days', label: 'Delivery (Days)' }
  ];

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto pb-12 select-none">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight font-outfit">Dataset Explorer</h1>
          <p className="text-xs text-[#B8BCC8] mt-1.5 font-medium">Audit raw data sheets, profiling summaries, and features elasticity correlations.</p>
        </div>
        <button 
          onClick={handleDownloadDataset}
          className="btn-secondary flex items-center gap-2 self-start uppercase font-bold tracking-wider text-[10px]"
        >
          <Download className="w-4 h-4 text-[#0098f3]" /> Download Preview JSON
        </button>
      </div>

      {/* Summary KPI Panel */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Records Loaded', value: explorerStats?.total_records?.toLocaleString() || '95,748', desc: 'Active transactional rows', icon: CheckCircle, color: 'text-[#2ED47A]', bg: 'bg-[#2ED47A]/10 border-[#2ED47A]/20' },
          { label: 'Columns Scope', value: explorerStats?.total_columns || '11', desc: 'Predictive features parameters', icon: Database, color: 'text-[#0098f3]', bg: 'bg-[#0098f3]/10 border-[#0098f3]/20' },
          { label: 'Duplicate Records', value: explorerStats?.duplicate_records || '0', desc: 'Clean duplicate counts', icon: AlertTriangle, color: 'text-[#F8B84E]', bg: 'bg-[#F8B84E]/10 border-[#F8B84E]/20' },
          { label: 'Missing Values Count', value: explorerStats?.total_missing_values || '0', desc: 'Zero null threshold bounds', icon: CheckCircle, color: 'text-[#2ED47A]', bg: 'bg-[#2ED47A]/10 border-[#2ED47A]/20' }
        ].map((item, idx) => (
          <div key={idx} className="glass-card p-4.5 flex flex-col justify-between h-28">
            <div>
              <span className="text-[9px] font-bold text-[#B8BCC8]/50 uppercase tracking-widest block font-outfit">{item.label}</span>
              <span className="text-lg font-extrabold text-white tracking-tight block mt-1.5 font-outfit">{item.value}</span>
            </div>
            <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-white/[0.06]">
              <span className="text-[9px] text-[#B8BCC8]/60 font-semibold">{item.desc}</span>
              <div className={`p-1 rounded-lg ${item.bg} border shrink-0 flex items-center justify-center`}>
                <item.icon className={`w-3.5 h-3.5 ${item.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Table grid layout options */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/[0.02] border border-white/[0.06] p-4 rounded-2xl backdrop-blur-xl">
          {/* Search */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-[#B8BCC8]/50 absolute left-3 top-3.5" />
            <input
              type="text"
              placeholder="Search product ID or category..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(0);
              }}
              className="w-full pl-9 pr-4 py-2.5 bg-white/[0.03] border border-white/[0.08] focus:border-[#da4e24] text-white rounded-xl text-xs outline-none transition-all placeholder-[#B8BCC8]/40 focus:bg-white/[0.06]"
            />
          </div>

          <div className="flex items-center gap-3">
            {/* Column visibility dropdown */}
            <div className="relative group">
              <button className="px-3.5 py-2 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] rounded-xl text-[10px] uppercase tracking-wider font-bold text-[#B8BCC8] hover:text-white flex items-center gap-2 transition-all">
                <Eye className="w-3.5 h-3.5 text-[#0098f3]" /> Columns
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-[#0d0d0d]/95 border border-white/[0.08] backdrop-blur-[20px] rounded-xl shadow-2xl z-50 p-2 hidden group-focus-within:block group-hover:block text-[11px] space-y-1.5 font-semibold">
                {columnsList.map(col => (
                  <label key={col.key} className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-white/5 text-[#B8BCC8] hover:text-white cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={visibleColumns[col.key]}
                      onChange={() => toggleColumnVisibility(col.key)}
                      className="rounded border-white/[0.08] bg-white/[0.03] text-[#da4e24] focus:ring-0 w-3.5 h-3.5"
                    />
                    <span>{col.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Column pinning dropdown */}
            <div className="relative group">
              <button className="px-3.5 py-2 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] rounded-xl text-[10px] uppercase tracking-wider font-bold text-[#B8BCC8] hover:text-white flex items-center gap-2 transition-all">
                <Pin className="w-3.5 h-3.5 text-[#da4e24]" /> Pinned
              </button>
              <div className="absolute right-0 mt-2 w-44 bg-[#0d0d0d]/95 border border-white/[0.08] backdrop-blur-[20px] rounded-xl shadow-2xl z-50 p-2 hidden group-focus-within:block group-hover:block text-[11px] space-y-1.5 font-semibold">
                {['product_id', 'price'].map(col => (
                  <label key={col} className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-white/5 text-[#B8BCC8] hover:text-white cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={pinnedColumns[col]}
                      onChange={() => toggleColumnPinning(col)}
                      className="rounded border-white/[0.08] bg-white/[0.03] text-[#da4e24] focus:ring-0 w-3.5 h-3.5"
                    />
                    <span>{col === 'product_id' ? 'Product ID' : 'Price'}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Data Grid table sheet */}
        <div className="glass-card overflow-hidden shadow-lg">
          <div className="overflow-x-auto p-4">
            <table className="glass-table min-w-[1000px]">
              <thead>
                <tr>
                  {columnsList.map(col => {
                    if (!visibleColumns[col.key]) return null;
                    const isPinned = pinnedColumns[col.key];
                    return (
                      <th 
                        key={col.key} 
                        onClick={() => handleSort(col.key)}
                        className={`glass-table-header cursor-pointer hover:text-white ${isPinned ? 'sticky left-0 bg-[#0B0F19]/90 z-10' : ''}`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span>{col.label}</span>
                          {sortConfig.key === col.key && (
                            <span className="text-[10px] text-[#da4e24]">{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>
                          )}
                          {isPinned && <Pin className="w-3 h-3 text-[#da4e24] ml-auto shrink-0 animate-pulse" />}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.02]">
                {pagedRows.length > 0 ? (
                  pagedRows.map((row, idx) => (
                    <tr key={idx} className="glass-table-row">
                      {columnsList.map(col => {
                        if (!visibleColumns[col.key]) return null;
                        const isPinned = pinnedColumns[col.key];
                        const val = row[col.key];
                        return (
                          <td 
                            key={col.key} 
                            className={`glass-table-cell ${isPinned ? 'sticky left-0 bg-[#0d0d0d]/95 z-10 font-bold border-r border-white/[0.04]' : ''} ${col.key === 'product_id' ? 'font-mono text-xs text-[#0098f3]' : ''}`}
                          >
                            {col.key === 'price' || col.key === 'freight_value'
                              ? `₹${parseFloat(val).toFixed(2)}`
                              : typeof val === 'number' 
                                ? val.toLocaleString()
                                : val}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-xs text-[#B8BCC8]/40 font-semibold">
                      No rows matching filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table Paginator */}
          <div className="px-6 py-4 border-t border-white/[0.06] bg-white/[0.01] flex items-center justify-between text-xs text-[#B8BCC8]/50 font-bold">
            <span>Showing {page * pageSize + 1} - {Math.min((page + 1) * pageSize, processedRows.length)} of {processedRows.length} preview rows</span>
            <div className="flex gap-2">
              <button
                disabled={page === 0}
                onClick={() => setPage(prev => Math.max(0, prev - 1))}
                className="px-3.5 py-1.5 bg-white/[0.03] border border-white/[0.08] hover:border-white/[0.16] hover:bg-white/[0.06] rounded-xl text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all uppercase tracking-wider text-[9px]"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage(prev => Math.min(totalPages - 1, prev + 1))}
                className="px-3.5 py-1.5 bg-white/[0.03] border border-white/[0.08] hover:border-white/[0.16] hover:bg-white/[0.06] rounded-xl text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all uppercase tracking-wider text-[9px]"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Statistical Profiles Toggle Accordion */}
      <div className="glass-card p-6 rounded-[24px]">
        <button
          onClick={() => setShowAdvancedStats(!showAdvancedStats)}
          className="w-full flex items-center justify-between text-xs font-bold text-white uppercase tracking-widest font-outfit focus:outline-none"
        >
          <span className="flex items-center gap-2">
            <Database className="w-4 h-4 text-[#da4e24]" /> Advanced Dataset Statistical Profiles
          </span>
          <span className="px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[9px] transition-all">
            {showAdvancedStats ? 'Collapse Stats ▲' : 'Expand Stats ▼'}
          </span>
        </button>

        {showAdvancedStats && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pt-6 border-t border-white/[0.06] mt-4 animate-fadeIn">
            
            {/* Descriptive Summary Sheet */}
            <div className="lg:col-span-8 space-y-4">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-widest font-outfit">Descriptive Summaries</h3>
                <p className="text-[10px] text-[#B8BCC8]/60 font-medium mt-0.5">Statistical properties of modeling feature variables</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[500px] text-xs">
                  <thead>
                    <tr className="border-b border-white/[0.06] text-left">
                      <th className="py-2.5 text-[#B8BCC8]/60 font-bold uppercase tracking-widest text-[9px] font-outfit">Feature</th>
                      <th className="py-2.5 text-[#B8BCC8]/60 font-bold uppercase tracking-widest text-[9px] font-outfit">Mean</th>
                      <th className="py-2.5 text-[#B8BCC8]/60 font-bold uppercase tracking-widest text-[9px] font-outfit">Std Dev</th>
                      <th className="py-2.5 text-[#B8BCC8]/60 font-bold uppercase tracking-widest text-[9px] font-outfit">Min</th>
                      <th className="py-2.5 text-[#B8BCC8]/60 font-bold uppercase tracking-widest text-[9px] font-outfit">Median</th>
                      <th className="py-2.5 text-[#B8BCC8]/60 font-bold uppercase tracking-widest text-[9px] font-outfit">Max</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {summaryStatistics.map((stat, idx) => (
                      <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 font-bold text-white capitalize font-outfit">{stat.feature.replace(/_/g, ' ').replace('g', '(g)').replace('cm', '(cm)')}</td>
                        <td className="py-3 font-mono text-[#B8BCC8]">{stat.mean.toFixed(2)}</td>
                        <td className="py-3 font-mono text-[#B8BCC8]">{stat.std.toFixed(2)}</td>
                        <td className="py-3 font-mono text-[#B8BCC8]">{stat.min.toFixed(2)}</td>
                        <td className="py-3 font-mono text-[#B8BCC8]">{stat.p50.toFixed(2)}</td>
                        <td className="py-3 font-mono text-[#B8BCC8]">{stat.max.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Correlation heat grid card */}
            <div className="lg:col-span-4 space-y-4">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-widest font-outfit">Correlation Matrix</h3>
                <p className="text-[10px] text-[#B8BCC8]/60 font-medium mt-0.5">Visual coefficient mapping between continuous keys</p>
              </div>

              <div className="space-y-2">
                <div className="grid grid-cols-7 gap-1 text-[8px] font-bold text-[#B8BCC8]/40 text-center uppercase tracking-widest select-none font-outfit">
                  <div></div>
                  <div>Price</div>
                  <div>Freight</div>
                  <div>Weight</div>
                  <div>Len</div>
                  <div>Hgt</div>
                  <div>Wdt</div>
                </div>
                
                {correlationHeatmap.columns.map((colName, rIdx) => (
                  <div key={rIdx} className="grid grid-cols-7 gap-1 items-center">
                    <span className="text-[8px] font-bold text-[#B8BCC8]/50 uppercase tracking-widest truncate pr-1 text-right select-none font-outfit">
                      {colName === 'price' ? 'Price' : colName === 'freight_value' ? 'Freight' : colName === 'product_weight_g' ? 'Weight' : colName.split('_').slice(-1)[0]}
                    </span>
                    {correlationHeatmap.data[rIdx]?.map((val, cIdx) => {
                      const absVal = Math.abs(val);
                      let cellBg = 'bg-white/[0.02] border-white/[0.04]';
                      let textColor = 'text-[#B8BCC8]/60';
                      
                      if (val > 0) {
                        cellBg = `bg-[#da4e24]/70`;
                        textColor = 'text-white font-extrabold';
                      } else if (val < 0) {
                        cellBg = `bg-[#FF5D73]/70`;
                        textColor = 'text-white font-extrabold';
                      }
                      
                      return (
                        <div 
                          key={cIdx} 
                          className={`h-7.5 rounded-lg flex items-center justify-center text-[9px] border transition-all relative group shadow-sm ${cellBg}`}
                          style={{ opacity: rIdx === cIdx ? 1 : Math.max(0.15, absVal) }}
                          title={`${colName} vs ${correlationHeatmap.columns[cIdx]}: ${val}`}
                        >
                          <span className={textColor}>{val.toFixed(2)}</span>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
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

export default DatasetExplorer;
