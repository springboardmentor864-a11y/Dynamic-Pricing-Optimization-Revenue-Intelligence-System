import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  getCompetitorSummary,
  getCompetitorAnalysis,
  getProductCompetitorComparison,
  addCompetitorPrice,
  updateCompetitorPrice,
  deleteCompetitorPrice,
  getCompetitorRecommendation,
  importCompetitorCSV,
  refreshCompetitorData,
  resetCompetitorData
} from '../services/api';
import KPICard from '../components/KPICard';
import SkeletonLoader from '../components/SkeletonLoader';
import EmptyState from '../components/EmptyState';
import {
  Store,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Layers,
  Sparkles,
  Search,
  Filter,
  RefreshCw,
  Upload,
  Trash2,
  Plus,
  Edit,
  Eye,
  X,
  AlertTriangle,
  CheckCircle2,
  BarChart2,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  Award,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Info,
  Package,
  Check,
  AlertCircle
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';

const STATUS_COLORS = {
  UNDERPRICED: '#10b981', // Emerald
  COMPETITIVE: '#3b82f6', // Blue
  OVERPRICED: '#ef4444'   // Rose
};

const CompetitorAnalysisPage = () => {
  const { isAdmin } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();

  // Summary State
  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(true);

  // Analysis Data Table State
  const [analysisData, setAnalysisData] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loadingAnalysis, setLoadingAnalysis] = useState(true);

  // Filters & Pagination State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [competitorFilter, setCompetitorFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sortBy, setSortBy] = useState('product_name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Selected Product for Charting & Detail Modal
  const [selectedProductId, setSelectedProductId] = useState('');
  const [detailProduct, setDetailProduct] = useState(null);
  const [detailComparison, setDetailComparison] = useState(null);
  const [recommendationInfo, setRecommendationInfo] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Modal Controls
  const [isAddPriceModalOpen, setIsAddPriceModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Form State for Add Competitor Price
  const [formData, setFormData] = useState({
    product_id: '',
    competitor_name: '',
    competitor_product_name: '',
    competitor_price: '',
    currency: 'INR',
    source: 'Manual',
    captured_at: new Date().toISOString().split('T')[0],
    category: 'Electronics',
    brand: 'Generic',
    our_price: ''
  });

  // CSV Import State
  const [importFile, setImportFile] = useState(null);
  const [importReport, setImportReport] = useState(null);
  const [isImporting, setIsImporting] = useState(false);

  // Fetch Summary
  const fetchSummary = async () => {
    setLoadingSummary(true);
    try {
      const data = await getCompetitorSummary();
      setSummary(data);
    } catch (err) {
      showError('Failed to load competitor summary metrics.');
    } finally {
      setLoadingSummary(false);
    }
  };

  // Fetch Analysis Table Data
  const fetchAnalysis = async () => {
    setLoadingAnalysis(true);
    try {
      const params = {
        search: searchTerm,
        status: statusFilter,
        competitor: competitorFilter,
        category: categoryFilter,
        sort_by: sortBy,
        sort_order: sortOrder,
        page: currentPage,
        limit: pageSize
      };
      const res = await getCompetitorAnalysis(params);
      setAnalysisData(res.data || []);
      setTotalProducts(res.total || 0);

      if (res.data && res.data.length > 0 && !selectedProductId) {
        setSelectedProductId(res.data[0].product_id);
      }
    } catch (err) {
      showError('Failed to load competitor analysis data.');
    } finally {
      setLoadingAnalysis(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  useEffect(() => {
    fetchAnalysis();
  }, [searchTerm, statusFilter, competitorFilter, categoryFilter, sortBy, sortOrder, currentPage]);

  // Load Details & Recommendation when Modal opens
  const handleOpenDetailModal = async (product) => {
    setDetailProduct(product);
    setLoadingDetail(true);
    try {
      const [compDetail, recDetail] = await Promise.all([
        getProductCompetitorComparison(product.product_id),
        getCompetitorRecommendation(product.product_id)
      ]);
      setDetailComparison(compDetail);
      setRecommendationInfo(recDetail);
    } catch (err) {
      showError('Failed to load product detail comparison.');
    } finally {
      setLoadingDetail(false);
    }
  };

  // Submit Add Competitor Price Form
  const handleAddPriceSubmit = async (e) => {
    e.preventDefault();
    if (!formData.product_id || !formData.competitor_name || !formData.competitor_price) {
      showError('Please fill in all required fields (Product ID, Competitor, Price).');
      return;
    }
    if (parseFloat(formData.competitor_price) <= 0) {
      showError('Competitor price must be greater than 0.');
      return;
    }

    setIsActionLoading(true);
    try {
      const payload = {
        product_id: formData.product_id,
        competitor_name: formData.competitor_name,
        competitor_product_name: formData.competitor_product_name || formData.product_id,
        competitor_price: parseFloat(formData.competitor_price),
        currency: formData.currency,
        source: formData.source,
        captured_at: formData.captured_at,
        category: formData.category,
        brand: formData.brand,
        our_price: formData.our_price ? parseFloat(formData.our_price) : undefined
      };

      await addCompetitorPrice(payload);
      showSuccess('Competitor price added successfully!');
      setIsAddPriceModalOpen(false);
      setFormData({
        product_id: '',
        competitor_name: '',
        competitor_product_name: '',
        competitor_price: '',
        currency: 'INR',
        source: 'Manual',
        captured_at: new Date().toISOString().split('T')[0],
        category: 'Electronics',
        brand: 'Generic',
        our_price: ''
      });
      fetchSummary();
      fetchAnalysis();
    } catch (err) {
      showError(err.response?.data?.detail || 'Failed to add competitor price.');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Submit CSV Import Form
  const handleCSVImportSubmit = async (e) => {
    e.preventDefault();
    if (!importFile) {
      showError('Please select a CSV file to import.');
      return;
    }

    setIsImporting(true);
    setImportReport(null);
    try {
      const res = await importCompetitorCSV(importFile);
      setImportReport(res);
      if (res.successful_rows > 0) {
        showSuccess(`Imported ${res.successful_rows} competitor price records!`);
        fetchSummary();
        fetchAnalysis();
      } else {
        showError('No valid records were imported. Please check validation errors.');
      }
    } catch (err) {
      showError(err.response?.data?.detail || 'Failed to import CSV file.');
    } finally {
      setIsImporting(false);
    }
  };

  // Admin Actions
  const handleRefreshData = async () => {
    setIsActionLoading(true);
    try {
      await refreshCompetitorData();
      showSuccess('Competitor data re-seeded successfully!');
      fetchSummary();
      fetchAnalysis();
    } catch (err) {
      showError('Failed to refresh competitor data.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleResetData = async () => {
    setIsActionLoading(true);
    try {
      await resetCompetitorData();
      showSuccess('All competitor price records deleted.');
      setIsResetConfirmOpen(false);
      fetchSummary();
      fetchAnalysis();
    } catch (err) {
      showError('Failed to reset competitor data.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const formatINR = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  // Selected product summary for charts
  const selectedProductItem = useMemo(() => {
    return analysisData.find((item) => item.product_id === selectedProductId) || analysisData[0];
  }, [analysisData, selectedProductId]);

  // Chart 1 Data: Competitor Price Comparison Bar Chart
  const compBarData = useMemo(() => {
    if (!selectedProductItem) return [];
    return [{
      name: selectedProductItem.product_name,
      'Our Price': selectedProductItem.our_price,
      'Avg Competitor': selectedProductItem.average_competitor_price,
      'Lowest Competitor': selectedProductItem.lowest_competitor_price,
      'Highest Competitor': selectedProductItem.highest_competitor_price
    }];
  }, [selectedProductItem]);

  // Chart 2 Data: Price Position Spectrum (Lowest -> Avg -> Our Price -> Highest)
  const positionSpectrumData = useMemo(() => {
    if (!selectedProductItem) return [];
    return [
      { point: 'Lowest Competitor', price: selectedProductItem.lowest_competitor_price, fill: '#10b981' },
      { point: 'Avg Competitor', price: selectedProductItem.average_competitor_price, fill: '#3b82f6' },
      { point: 'Our Price', price: selectedProductItem.our_price, fill: '#8b5cf6' },
      { point: 'Highest Competitor', price: selectedProductItem.highest_competitor_price, fill: '#ef4444' }
    ];
  }, [selectedProductItem]);

  // Chart 3 Data: Competitive Status Distribution Donut
  const statusPieData = useMemo(() => {
    if (!summary || !summary.status_distribution) return [];
    return Object.entries(summary.status_distribution).map(([st, pct]) => ({
      name: st,
      value: pct,
      color: STATUS_COLORS[st] || '#64748b'
    }));
  }, [summary]);

  // Chart 4 Data: Price Gap across products
  const priceGapChartData = useMemo(() => {
    return analysisData.slice(0, 10).map((item) => ({
      name: item.product_id,
      gap: item.price_difference,
      pctGap: item.price_difference_percentage
    }));
  }, [analysisData]);

  const totalPages = Math.ceil(totalProducts / pageSize) || 1;

  return (
    <div className="space-[#111827] text-slate-100 min-h-screen pb-12 space-y-8">
      
      {/* Header & Controls Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-purple-600/10 border border-purple-500/20 text-purple-400">
            <Store className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              Competitor Price Analysis
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Revenue Intelligence
              </span>
            </h1>
            <p className="text-sm text-slate-400">
              Benchmark internal prices against market rivals and unlock dynamic optimization opportunities.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center flex-wrap gap-2.5">
          {isAdmin && (
            <>
              <button
                onClick={() => setIsAddPriceModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-purple-500/20"
              >
                <Plus className="w-3.5 h-3.5" /> Add Competitor Price
              </button>

              <button
                onClick={() => setIsImportModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-blue-500/20"
              >
                <Upload className="w-3.5 h-3.5" /> Import CSV
              </button>

              <button
                onClick={handleRefreshData}
                disabled={isActionLoading}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isActionLoading ? 'animate-spin' : ''}`} /> Refresh
              </button>

              <button
                onClick={() => setIsResetConfirmOpen(true)}
                className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-bold transition"
                title="Reset competitor records"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Section 7: Dashboard KPI Cards */}
      {loadingSummary ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <SkeletonLoader key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : summary ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <KPICard
            title="Total Products"
            value={summary.total_products_analyzed}
            subtitle="Analyzed Products"
            icon={Package}
            gradient="bg-blue-500"
            borderGlow="border-blue-500/30"
          />

          <KPICard
            title="Competitive"
            value={summary.competitive_products}
            subtitle={`${summary.status_distribution?.COMPETITIVE || 0}% within ±10%`}
            icon={CheckCircle2}
            gradient="bg-blue-500"
            borderGlow="border-blue-500/30"
            trend="up"
            trendValue="Aligned"
          />

          <KPICard
            title="Overpriced Products"
            value={summary.overpriced_products}
            subtitle=">10% Above Market"
            icon={TrendingUp}
            gradient="bg-rose-500"
            borderGlow="border-rose-500/30"
            trend="down"
            trendValue="High Margin"
          />

          <KPICard
            title="Underpriced Products"
            value={summary.underpriced_products}
            subtitle=">10% Below Market"
            icon={TrendingDown}
            gradient="bg-emerald-500"
            borderGlow="border-emerald-500/30"
            trend="up"
            trendValue="High Value"
          />

          <KPICard
            title="Avg Price Gap"
            value={`${summary.average_price_gap >= 0 ? '+' : ''}${formatINR(summary.average_price_gap)}`}
            subtitle={`${summary.average_percentage_gap >= 0 ? '+' : ''}${summary.average_percentage_gap}% vs Market`}
            icon={Layers}
            gradient="bg-purple-500"
            borderGlow="border-purple-500/30"
          />

          <KPICard
            title="Pricing Opportunities"
            value={summary.potential_pricing_opportunities}
            subtitle="Actionable Products"
            icon={Award}
            gradient="bg-cyan-500"
            borderGlow="border-cyan-500/30"
          />
        </div>
      ) : null}

      {/* Dynamic AI Insights Bulletin */}
      {summary && summary.insights && (
        <div className="bg-gradient-to-r from-purple-900/40 via-indigo-900/30 to-slate-900/80 p-6 rounded-2xl border border-purple-500/30 shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-2 text-purple-400 font-bold text-sm mb-3">
            <Sparkles className="w-4 h-4 text-purple-300 animate-pulse" />
            <span>Market Intelligence Bulletins</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {summary.insights.map((insight, idx) => (
              <div key={idx} className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{insight}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section 10: Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Competitor Price Comparison Bar Chart */}
        <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800/80 backdrop-blur-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-purple-400" />
                Competitor Price Comparison
              </h3>
              <p className="text-xs text-slate-400">Our price vs competitor price bounds</p>
            </div>

            <div className="w-full sm:w-56">
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-purple-500"
              >
                {analysisData.map((item) => (
                  <option key={item.product_id} value={item.product_id}>
                    {item.product_name} ({item.product_id})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="h-64 w-full">
            {compBarData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={compBarData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip formatter={(val) => [`₹${val.toLocaleString('en-IN')}`, 'Price']} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                  <Legend />
                  <Bar dataKey="Our Price" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Avg Competitor" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Lowest Competitor" fill="#10b981" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Highest Competitor" fill="#ef4444" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyState title="Select a product" />}
          </div>
        </div>

        {/* Chart 2: Price Position Spectrum */}
        <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800/80 backdrop-blur-md space-y-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <LineChartIcon className="w-5 h-5 text-emerald-400" />
              Price Position Spectrum
            </h3>
            <p className="text-xs text-slate-400">Lowest → Avg → Our Price → Highest</p>
          </div>

          <div className="h-64 w-full">
            {positionSpectrumData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={positionSpectrumData} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis type="number" stroke="#64748b" tickFormatter={(v) => `₹${v}`} />
                  <YAxis type="category" dataKey="point" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <Tooltip formatter={(val) => [`₹${val.toLocaleString('en-IN')}`, 'Price']} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                  <Bar dataKey="price" radius={[0, 6, 6, 0]}>
                    {positionSpectrumData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyState title="No Position Data" />}
          </div>
        </div>

        {/* Chart 3: Competitive Status Distribution */}
        <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800/80 backdrop-blur-md space-y-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-indigo-400" />
              Competitive Status Distribution
            </h3>
            <p className="text-xs text-slate-400">Breakdown of UNDERPRICED, COMPETITIVE, OVERPRICED</p>
          </div>

          <div className="h-52 my-2">
            {statusPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value">
                    {statusPieData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val) => [`${val}%`, 'Percentage']} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : <EmptyState title="No Status Data" />}
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs">
            {statusPieData.map((item) => (
              <div key={item.name} className="flex items-center justify-between p-2 rounded-xl bg-slate-800/50 border border-slate-800">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-300 font-medium text-[11px]">{item.name}</span>
                </div>
                <span className="font-bold text-white font-mono">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 4: Price Gap across products */}
        <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800/80 backdrop-blur-md space-y-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-cyan-400" />
              Price Difference Gap Across Products
            </h3>
            <p className="text-xs text-slate-400">Price difference (Our Price - Avg Competitor)</p>
          </div>

          <div className="h-64 w-full">
            {priceGapChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priceGapChartData} margin={{ top: 20, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip formatter={(val) => [`₹${val.toLocaleString('en-IN')}`, 'Price Gap']} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                  <Bar dataKey="gap" fill="#3b82f6" radius={[6, 6, 0, 0]}>
                    {priceGapChartData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.gap <= 0 ? '#10b981' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyState title="No Gap Data" />}
          </div>
        </div>

      </div>

      {/* Section 8: Comparison Table */}
      <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800/80 backdrop-blur-md space-y-6">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-purple-400" />
              Competitor Analysis Data Table
            </h3>
            <p className="text-xs text-slate-400">
              Side-by-side product pricing metrics, price gaps, status, and explainable recommendations
            </p>
          </div>

          <div className="text-xs font-mono text-slate-400">
            Showing <span className="text-white font-bold">{analysisData.length}</span> of <span className="text-white font-bold">{totalProducts}</span> products
          </div>
        </div>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search product name, ID or brand..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-xl pl-9 pr-3 py-2.5 focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-purple-500"
            >
              <option value="All">All Competitive Statuses</option>
              <option value="UNDERPRICED">UNDERPRICED (&lt; -10%)</option>
              <option value="COMPETITIVE">COMPETITIVE (±10%)</option>
              <option value="OVERPRICED">OVERPRICED (&gt; +10%)</option>
            </select>
          </div>

          <div>
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
              className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-purple-500"
            >
              <option value="All">All Categories</option>
              {summary?.categories?.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={competitorFilter}
              onChange={(e) => { setCompetitorFilter(e.target.value); setCurrentPage(1); }}
              className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-purple-500"
            >
              <option value="All">All Competitors</option>
              {summary?.competitors?.map((comp) => (
                <option key={comp} value={comp}>{comp}</option>
              ))}
            </select>
          </div>

        </div>

        {/* Comparison Data Grid */}
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-800/80 text-slate-400 uppercase font-semibold tracking-wider">
              <tr>
                <th onClick={() => { setSortBy('product_name'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }} className="p-3.5 cursor-pointer hover:text-white">
                  Product Details <ArrowUpDown className="w-3 h-3 inline ml-1" />
                </th>
                <th onClick={() => { setSortBy('our_price'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }} className="p-3.5 text-right cursor-pointer hover:text-white">
                  Our Price <ArrowUpDown className="w-3 h-3 inline ml-1" />
                </th>
                <th className="p-3.5 text-right">Lowest Competitor</th>
                <th onClick={() => { setSortBy('average_competitor_price'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }} className="p-3.5 text-right cursor-pointer hover:text-white">
                  Avg Competitor <ArrowUpDown className="w-3 h-3 inline ml-1" />
                </th>
                <th className="p-3.5 text-right">Highest Competitor</th>
                <th onClick={() => { setSortBy('price_difference'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }} className="p-3.5 text-right cursor-pointer hover:text-white">
                  Difference <ArrowUpDown className="w-3 h-3 inline ml-1" />
                </th>
                <th className="p-3.5 text-center">Status</th>
                <th onClick={() => { setSortBy('recommended_price'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }} className="p-3.5 text-right cursor-pointer hover:text-white">
                  Recommended Price <ArrowUpDown className="w-3 h-3 inline ml-1" />
                </th>
                <th className="p-3.5 text-center">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/80 bg-slate-900/40">
              {loadingAnalysis ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    <SkeletonLoader className="h-8 w-full mb-2" />
                    <SkeletonLoader className="h-8 w-full mb-2" />
                    <SkeletonLoader className="h-8 w-full" />
                  </td>
                </tr>
              ) : analysisData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center">
                    <EmptyState title="No Analysis Records" message="Try adjusting search or status filters." />
                  </td>
                </tr>
              ) : (
                analysisData.map((item) => {
                  const isSelected = item.product_id === selectedProductId;
                  const isNegative = item.price_difference < 0;

                  return (
                    <tr
                      key={item.product_id}
                      onClick={() => setSelectedProductId(item.product_id)}
                      className={`hover:bg-slate-800/50 transition cursor-pointer ${
                        isSelected ? 'bg-purple-900/20 border-l-4 border-l-purple-500' : ''
                      }`}
                    >
                      <td className="p-3.5 font-medium">
                        <div className="text-white font-bold">{item.product_name}</div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          <span className="text-purple-400">{item.product_id}</span> • {item.category} • {item.brand}
                        </div>
                      </td>

                      <td className="p-3.5 text-right font-mono font-bold text-white">
                        {formatINR(item.our_price)}
                      </td>

                      <td className="p-3.5 text-right font-mono text-emerald-400 font-bold">
                        {formatINR(item.lowest_competitor_price)}
                      </td>

                      <td className="p-3.5 text-right font-mono text-slate-300">
                        {formatINR(item.average_competitor_price)}
                      </td>

                      <td className="p-3.5 text-right font-mono text-rose-400">
                        {formatINR(item.highest_competitor_price)}
                      </td>

                      <td className="p-3.5 text-right font-mono">
                        <div className={`font-bold ${isNegative ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isNegative ? '' : '+'}{formatINR(item.price_difference)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          ({isNegative ? '' : '+'}{item.price_difference_percentage}%)
                        </div>
                      </td>

                      <td className="p-3.5 text-center">
                        <span
                          className={`inline-block text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${
                            item.competitive_status === 'UNDERPRICED'
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                              : item.competitive_status === 'COMPETITIVE'
                              ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                              : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                          }`}
                        >
                          {item.competitive_status}
                        </span>
                      </td>

                      <td className="p-3.5 text-right font-mono font-bold text-purple-300">
                        {formatINR(item.recommended_price)}
                      </td>

                      <td className="p-3.5 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDetailModal(item);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30 text-xs font-semibold transition inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> View
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <div className="text-xs text-slate-400">
            Page <span className="text-white font-bold">{currentPage}</span> of <span className="text-white font-bold">{totalPages}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 border border-slate-700 text-xs font-bold transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i + 1}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-8 h-8 rounded-xl text-xs font-bold transition ${
                  currentPage === i + 1
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                }`}
              >
                {i + 1}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 border border-slate-700 text-xs font-bold transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* Section 9: Product Detail View Modal */}
      {detailProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full p-6 space-y-6 shadow-2xl relative my-8">
            
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                    {detailProduct.product_id}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">{detailProduct.category}</span>
                </div>
                <h2 className="text-xl font-bold text-white mt-1">{detailProduct.product_name}</h2>
                <p className="text-xs text-slate-400">Brand: <span className="text-white font-bold">{detailProduct.brand}</span></p>
              </div>

              <button
                onClick={() => { setDetailProduct(null); setDetailComparison(null); setRecommendationInfo(null); }}
                className="p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingDetail ? (
              <div className="p-8 text-center">
                <SkeletonLoader className="h-40 w-full" />
              </div>
            ) : detailComparison ? (
              <div className="space-y-6">

                {/* Market Statistics Header Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-2xl bg-purple-900/20 border border-purple-500/30 text-center">
                    <p className="text-[11px] text-purple-300 font-semibold uppercase">Our Price</p>
                    <p className="text-lg font-extrabold text-white font-mono mt-0.5">{formatINR(detailComparison.our_price)}</p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-emerald-900/20 border border-emerald-500/30 text-center">
                    <p className="text-[11px] text-emerald-400 font-semibold uppercase">Lowest Competitor</p>
                    <p className="text-lg font-extrabold text-emerald-400 font-mono mt-0.5">{formatINR(detailComparison.lowest_competitor_price)}</p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700 text-center">
                    <p className="text-[11px] text-slate-400 font-semibold uppercase">Avg Competitor</p>
                    <p className="text-lg font-extrabold text-slate-200 font-mono mt-0.5">{formatINR(detailComparison.average_competitor_price)}</p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-rose-900/20 border border-rose-500/30 text-center">
                    <p className="text-[11px] text-rose-400 font-semibold uppercase">Highest Competitor</p>
                    <p className="text-lg font-extrabold text-rose-400 font-mono mt-0.5">{formatINR(detailComparison.highest_competitor_price)}</p>
                  </div>
                </div>

                {/* Price Position Banner */}
                <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Price Position</p>
                    <p className="text-sm font-bold text-white mt-0.5">
                      Our price is <span className={detailComparison.price_difference <= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {Math.abs(detailComparison.price_difference_percentage)}% {detailComparison.price_difference <= 0 ? 'below' : 'above'}
                      </span> the competitor average.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Competitive Status:</span>
                    <span className={`text-xs font-extrabold px-3 py-1 rounded-full border ${
                      detailComparison.competitive_status === 'UNDERPRICED'
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        : detailComparison.competitive_status === 'COMPETITIVE'
                        ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                        : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                    }`}>
                      {detailComparison.competitive_status}
                    </span>
                  </div>
                </div>

                {/* Section 5: Explainable Recommendation */}
                <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-950/60 to-indigo-950/60 border border-purple-500/40 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-purple-300 font-bold text-sm">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      PricePilot AI Recommendation Engine
                    </div>
                    <div className="text-base font-extrabold font-mono text-emerald-400">
                      Recommended: {formatINR(detailComparison.recommended_price)}
                    </div>
                  </div>
                  <p className="text-slate-300 leading-relaxed pt-1">{detailComparison.recommendation_reason}</p>
                </div>

                {/* Competitor Prices Breakdown Table */}
                <div>
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Competitor Prices Breakdown</h4>
                  <div className="overflow-x-auto rounded-xl border border-slate-800">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-800 text-slate-400 uppercase font-semibold">
                        <tr>
                          <th className="p-2.5">Competitor Name</th>
                          <th className="p-2.5">Marketplace / Source</th>
                          <th className="p-2.5 text-right">Price</th>
                          <th className="p-2.5 text-right">Difference</th>
                          <th className="p-2.5 text-center">Captured Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 bg-slate-900/60">
                        {detailComparison.competitors.map((comp) => (
                          <tr key={comp.name} className="hover:bg-slate-800/40">
                            <td className="p-2.5 font-bold text-white">{comp.name}</td>
                            <td className="p-2.5 text-slate-400">{comp.marketplace} ({comp.source})</td>
                            <td className="p-2.5 text-right font-mono font-bold text-emerald-400">{formatINR(comp.price)}</td>
                            <td className="p-2.5 text-right font-mono">
                              <span className={comp.difference >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                                {comp.difference >= 0 ? '+' : ''}{formatINR(comp.difference)} ({comp.difference_percentage}%)
                              </span>
                            </td>
                            <td className="p-2.5 text-center text-slate-400 font-mono">{comp.captured_at || 'Recent'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            ) : null}

            <div className="border-t border-slate-800 pt-4 flex justify-end">
              <button
                onClick={() => { setDetailProduct(null); setDetailComparison(null); setRecommendationInfo(null); }}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition"
              >
                Close View
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Section 11: Add Competitor Price Modal Form */}
      {isAddPriceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-purple-400" />
                Add Competitor Price
              </h3>
              <button onClick={() => setIsAddPriceModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddPriceSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Product ID *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. P1001"
                    value={formData.product_id}
                    onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Competitor Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Amazon"
                    value={formData.competitor_name}
                    onChange={(e) => setFormData({ ...formData, competitor_name: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Competitor Product Name</label>
                <input
                  type="text"
                  placeholder="e.g. Wireless Noise Cancelling Headphones"
                  value={formData.competitor_product_name}
                  onChange={(e) => setFormData({ ...formData, competitor_product_name: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Competitor Price *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="2399"
                    value={formData.competitor_price}
                    onChange={(e) => setFormData({ ...formData, competitor_price: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Our Price (Optional)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="2499"
                    value={formData.our_price}
                    onChange={(e) => setFormData({ ...formData, our_price: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Currency *</label>
                  <input
                    type="text"
                    required
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Data Source *</label>
                  <select
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="Manual">Manual Entry</option>
                    <option value="Competitor API">Competitor API</option>
                    <option value="E-Commerce Feed">E-Commerce Feed</option>
                    <option value="CSV Import">CSV Import</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Captured Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.captured_at}
                    onChange={(e) => setFormData({ ...formData, captured_at: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddPriceModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isActionLoading}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold shadow-lg shadow-purple-500/20"
                >
                  {isActionLoading ? 'Saving...' : 'Add Price'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Section 14: CSV Import Modal Form & Validation Report */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-400" />
                Import Competitor Prices CSV
              </h3>
              <button onClick={() => { setIsImportModalOpen(false); setImportReport(null); }} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCSVImportSubmit} className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700 font-mono text-[11px] text-slate-400 space-y-1">
                <p className="font-bold text-slate-300">Expected CSV Header:</p>
                <p>product_id,competitor_name,competitor_product_name,competitor_price,currency,source,captured_at</p>
              </div>

              <input
                type="file"
                accept=".csv"
                onChange={(e) => setImportFile(e.target.files[0])}
                className="text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
              />

              {importReport && (
                <div className="p-4 rounded-2xl bg-slate-800 border border-slate-700 space-y-2">
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-emerald-400">Successful: {importReport.successful_rows}</span>
                    <span className="text-rose-400">Failed: {importReport.failed_rows}</span>
                  </div>

                  {importReport.validation_errors?.length > 0 && (
                    <div className="max-h-32 overflow-y-auto space-y-1 text-[11px] text-rose-300 pt-2 border-t border-slate-700">
                      {importReport.validation_errors.map((err, idx) => (
                        <p key={idx}>• {err}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => { setIsImportModalOpen(false); setImportReport(null); }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isImporting || !importFile}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-500/20 flex items-center gap-2"
                >
                  {isImporting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  Import CSV
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Reset Confirm Modal */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-lg font-bold text-white">Reset Competitor Prices?</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              This will delete all competitor pricing records in the database. You can re-seed the default dataset anytime using "Refresh".
            </p>
            <div className="flex justify-end gap-3 pt-3">
              <button onClick={() => setIsResetConfirmOpen(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold">
                Cancel
              </button>
              <button onClick={handleResetData} disabled={isActionLoading} className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-500/20">
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CompetitorAnalysisPage;
