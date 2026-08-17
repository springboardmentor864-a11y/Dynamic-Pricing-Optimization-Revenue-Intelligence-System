import React, { useState, useEffect } from 'react';
import { explainPricePrediction } from '../services/aiService';
import { useDashboardData } from '../context/DashboardDataContext';
import ErrorState from '../components/ErrorState';
import { 
  Calculator, Search, Sliders, Sparkles, FileDown, 
  TrendingUp, AlertTriangle, Info, ChevronDown, ChevronUp, CheckCircle, HelpCircle
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { getApiUrl } from '../config';
import { useSystem } from '../context/SystemContext';
import { useAuth } from '../context/AuthContext';
import GlassSelect from '../components/GlassSelect';

const Predictor = () => {
  const { user } = useAuth();
  const { showToast } = useSystem();
  const { apiOffline, reconnect, categoriesList = [], refreshAllData } = useDashboardData();

  if (apiOffline) {
    return <ErrorState type="offline" onAction={reconnect} />;
  }
  
  // Input parameters states
  const [productId, setProductId] = useState('');
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState('');
  const [weight, setWeight] = useState(500);
  const [length, setLength] = useState(20);
  const [height, setHeight] = useState(10);
  const [width, setWidth] = useState(15);
  const [photos, setPhotos] = useState(3);
  const [freight, setFreight] = useState(15);
  const [nameLength, setNameLength] = useState(40);
  const [descLength, setDescLength] = useState(250);
  const [mode, setMode] = useState('best');
  const [selectedModel, setSelectedModel] = useState('XGBoost Regressor');

  // Search product states
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchList, setShowSearchList] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  // Results state
  const [prediction, setPrediction] = useState(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const [activeResultTab, setActiveResultTab] = useState('explanation');

  // AI Explanation state
  const [aiExplanation, setAiExplanation] = useState('');
  const [aiPending, setAiPending] = useState(false);
  const [aiError, setAiError] = useState('');

  // Competitive Price Analysis state
  const [compAnalysis, setCompAnalysis] = useState(null);
  const [compPending, setCompPending] = useState(false);
  const [compError, setCompError] = useState(null);
  const [whyExpanded, setWhyExpanded] = useState(false);
  const [showBenchmarkDetails, setShowBenchmarkDetails] = useState(false);

  const fetchCompetitiveAnalysis = async (recommendedPrice) => {
    setCompPending(true);
    setCompError(null);
    setCompAnalysis(null);
    try {
      const payload = {
        product_id: productId || 'sim-id',
        predicted_price: parseFloat(recommendedPrice),
        user_email: user?.email || 'guest@pricepilot.ai',
        generate_ai: true
      };
      
      const res = await fetch(getApiUrl('/api/competitive/analyze'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || data.detail || 'Competitive benchmark unavailable. Price prediction remains available.');
      }
      
      const analysisData = data.success !== undefined ? data.data : data;
      setCompAnalysis(analysisData);
    } catch (err) {
      console.error(err);
      setCompError(err.message || 'Competitive benchmark unavailable. Price prediction remains available.');
    } finally {
      setCompPending(false);
    }
  };

  const fetchAiExplanation = async (predData) => {
    if (!predData) return;
    setAiExplanation('');
    setAiError('');
    setAiPending(true);
    try {
      const explanation = await explainPricePrediction({
        predicted_price: predData.recommended_price,
        current_price: predData.dataset_average || 50.0,
        category: category,
        demand: predData.demand_level || 'Medium',
        confidence: predData.confidence || 85.0,
        model_used: predData.champion_model || selectedModel
      });
      setAiExplanation(explanation);
    } catch (e) {
      console.error(e);
      setAiError('Failed to load AI dynamic price explanation.');
    } finally {
      setAiPending(false);
    }
  };

  // Fetch Categories list
  const categoriesData = categoriesList.map(c => c.english);

  // Handle category fetch default select
  useEffect(() => {
    if (categoriesData.length > 0 && !category) {
      setCategory(categoriesData[0]);
    }
  }, [categoriesData, category]);

  // Handle product lookups
  const handleProductSearch = async (query) => {
    setSearchQuery(query);
    if (!query) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await fetch(getApiUrl(`/api/products/search?query=${query}`));
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.success !== undefined && data.data !== undefined ? data.data : data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectProduct = (prod) => {
    setProductId(prod.product_id);
    setProductName(prod.product_name);
    setCategory(prod.category_english);
    setWeight(prod.weight);
    setLength(prod.length);
    setHeight(prod.height);
    setWidth(prod.width);
    setPhotos(prod.photos);
    setFreight(prod.avg_freight);
    setNameLength(prod.name_length);
    setDescLength(prod.description_length);
    setShowSearchList(false);
    setSearchQuery(prod.product_id);
    showToast('info', `Loaded historical specs for selected Olist item.`);
  };

  const handlePredictSubmit = async (e) => {
    e.preventDefault();
    setPending(true);
    setError(null);
    setPrediction(null);
    setCompAnalysis(null);
    setCompError(null);

    // Dynamic processing delay for enterprise feel
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      const payload = {
        category,
        weight: parseFloat(weight),
        length: parseFloat(length),
        height: parseFloat(height),
        width: parseFloat(width),
        photos: parseInt(photos),
        freight: parseFloat(freight),
        name_length: parseInt(nameLength),
        description_length: parseInt(descLength),
        mode,
        selected_model: mode === 'best' ? '' : selectedModel,
        product_id: productId || null,
        product_name: productName || null,
        user_email: user?.email || 'guest@pricepilot.ai'
      };

      const res = await fetch(getApiUrl('/api/predict'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || data.error || data.detail || 'Prediction solver failed.');
      }

      const data = await res.json();
      const predictionData = data.success !== undefined ? data.data : data;
      setPrediction(predictionData);
      showToast('success', 'Optimal retail price solved successfully.');
      refreshAllData(true);
      fetchAiExplanation(predictionData);
      fetchCompetitiveAnalysis(predictionData.recommended_price);
    } catch (err) {
      setError(err.message);
      showToast('error', err.message);
    } finally {
      setPending(false);
    }
  };

  // Export PDF / CSV
  const handleDownloadReport = (format) => {
    if (!prediction) return;
    const url = getApiUrl(
      `/api/download?category=${category}&weight=${weight}&length=${length}&height=${height}&width=${width}&freight=${freight}&photos=${photos}&name_length=${nameLength}&description_length=${descLength}&mode=${mode}&selected_model=${selectedModel}&format=${format}`
    );
    window.open(url, '_blank');
    showToast('success', `Exporting report as ${format.toUpperCase()}`);
  };

  // Explainable AI relative values calculation
  const explainFactors = () => {
    if (!prediction) return [];
    const volume = length * height * width;
    return [
      { name: 'Category Baseline', value: 35, positive: true },
      { name: 'Product Weight Factor', value: Math.min(30, Math.round(weight / 200)), positive: weight > 1000 },
      { name: 'Package Volume Bounds', value: Math.min(25, Math.round(volume / 500)), positive: volume > 3000 },
      { name: 'Logistics Freight Surcharge', value: Math.min(20, Math.round(freight * 1.5)), positive: freight > 20 },
      { name: 'Photos Listing Quality', value: Math.round(photos * 3), positive: photos >= 3 }
    ];
  };

  // Strategic Insights generator
  const strategicInsights = () => {
    if (!prediction) return [];
    const recommendedPrice = prediction.recommended_price;
    const estimatedProfit = recommendedPrice - freight - (recommendedPrice * 0.15); // mock margin
    const profitMargin = (estimatedProfit / recommendedPrice) * 100;
    
    const insights = [];
    if (profitMargin < 20) {
      insights.push(`Caution: narrow gross margin (${profitMargin.toFixed(1)}%). Consider listing optimization features (richer description, +2 images) to warrant a higher price target.`);
    } else {
      insights.push(`Healthy margin index detected (${profitMargin.toFixed(1)}%). Maintain current recommended retail price to capture sales volume velocity.`);
    }
    
    if (freight > 25) {
      insights.push(`Heavy logistics overhead detected (₹${freight.toFixed(2)}). Investigate volumetric package compression to reduce dimensional freight surcharges.`);
    } else {
      insights.push("Logistics costs are optimal. Advertise 'Free Standard shipping' to lift click-through conversion rates.");
    }
    
    return insights;
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto pb-12 select-none">
      
      {/* Title */}
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight font-outfit">Flagship Pricing Simulator</h1>
        <p className="text-xs text-[#B8BCC8] mt-1.5 font-medium">Configure transactional inputs to solve optimal retail pricing and evaluate margins.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Parameters Form (5 columns) */}
        <form onSubmit={handlePredictSubmit} className="lg:col-span-5 glass-card p-6 space-y-5 text-xs">
          <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2 border-b border-white/[0.06] pb-3 mb-2 font-outfit">
            <Sliders className="w-4 h-4 text-[#da4e24]" /> Dynamic Pricing Controls
          </h3>

          {/* Autocomplete Olist Product Lookup */}
          <div className="space-y-1.5 relative">
            <label className="text-[10px] font-bold text-[#B8BCC8]/60 uppercase tracking-widest block font-outfit">Olist Catalog Product ID</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#B8BCC8]/50 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Lookup existing product ID..."
                value={searchQuery}
                onChange={(e) => handleProductSearch(e.target.value)}
                onFocus={() => setShowSearchList(true)}
                className="w-full pl-9 pr-4 py-2.5 bg-white/[0.03] border border-white/[0.08] focus:border-[#da4e24] text-white rounded-xl text-xs outline-none transition-all placeholder-[#B8BCC8]/40"
              />
            </div>
            {showSearchList && searchResults.length > 0 && (
              <div className="absolute left-0 right-0 mt-1.5 bg-[#0d0d0d]/95 border border-white/[0.08] backdrop-blur-[20px] rounded-xl shadow-2xl z-50 p-1.5 max-h-48 overflow-y-auto divide-y divide-white/[0.04] text-[10px]">
                {searchResults.map(prod => (
                  <button
                    key={prod.product_id}
                    type="button"
                    onClick={() => handleSelectProduct(prod)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 text-[#B8BCC8] hover:text-white transition-colors truncate block"
                  >
                    <span className="font-mono text-[#0098f3] block">{prod.product_id}</span>
                    <span className="block font-bold mt-0.5 truncate text-white">{prod.product_name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4.5 pt-1">
            {/* Category Select */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#B8BCC8]/60 uppercase tracking-widest block font-outfit">Category</label>
              <GlassSelect
                value={category}
                onChange={(val) => setCategory(val)}
                options={categoriesData.map(c => ({ value: c, label: c.replace(/_/g, ' ') }))}
                className="w-full"
              />
            </div>

            {/* Sliders */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex justify-between font-bold text-[10px]">
                  <span className="text-[#B8BCC8]/70">PRODUCT WEIGHT</span>
                  <span className="text-[#da4e24] font-mono">{weight}g</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="15000"
                  step="50"
                  value={weight}
                  onChange={(e) => setWeight(parseInt(e.target.value))}
                  className="w-full accent-[#da4e24] cursor-pointer h-1 bg-white/[0.06] rounded-lg"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between font-bold text-[10px]">
                  <span className="text-[#B8BCC8]/70">LOGISTICS FREIGHT</span>
                  <span className="text-[#da4e24] font-mono">₹{freight}</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="120"
                  step="1"
                  value={freight}
                  onChange={(e) => setFreight(parseInt(e.target.value))}
                  className="w-full accent-[#da4e24] cursor-pointer h-1 bg-white/[0.06] rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Length (cm)', val: length, set: setLength, min: 5, max: 100 },
                { label: 'Height (cm)', val: height, set: setHeight, min: 2, max: 80 },
                { label: 'Width (cm)', val: width, set: setWidth, min: 5, max: 100 }
              ].map(d => (
                <div key={d.label} className="space-y-1.5">
                  <div className="flex justify-between font-bold text-[9px] uppercase tracking-wider">
                    <span className="text-[#B8BCC8]/60">{d.label.split(' ')[0]}</span>
                    <span className="text-[#0098f3] font-mono">{d.val}cm</span>
                  </div>
                  <input
                    type="range"
                    min={d.min}
                    max={d.max}
                    value={d.val}
                    onChange={(e) => d.set(parseInt(e.target.value))}
                    className="w-full accent-[#0098f3] cursor-pointer h-1 bg-white/[0.06] rounded-lg"
                  />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex justify-between font-bold text-[10px]">
                  <span className="text-[#B8BCC8]/70">PRODUCT IMAGES</span>
                  <span className="text-[#da4e24] font-mono">{photos} photos</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="12"
                  value={photos}
                  onChange={(e) => setPhotos(parseInt(e.target.value))}
                  className="w-full accent-[#da4e24] cursor-pointer h-1 bg-white/[0.06] rounded-lg"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between font-bold text-[10px]">
                  <span className="text-[#B8BCC8]/70">NAME LENGTH</span>
                  <span className="text-[#da4e24] font-mono">{nameLength} chars</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="60"
                  value={nameLength}
                  onChange={(e) => setNameLength(parseInt(e.target.value))}
                  className="w-full accent-[#da4e24] cursor-pointer h-1 bg-white/[0.06] rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Model Configs */}
          <div className="pt-3.5 border-t border-white/[0.06] space-y-3">
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-[#B8BCC8] cursor-pointer font-semibold">
                <input
                  type="radio"
                  checked={mode === 'best'}
                  onChange={() => setMode('best')}
                  className="bg-white/[0.03] border-white/[0.08] text-[#da4e24] focus:ring-0 w-3.5 h-3.5"
                />
                <span>Champion ML</span>
              </label>
              <label className="flex items-center gap-2 text-[#B8BCC8] cursor-pointer font-semibold">
                <input
                  type="radio"
                  checked={mode === 'single'}
                  onChange={() => setMode('single')}
                  className="bg-white/[0.03] border-white/[0.08] text-[#da4e24] focus:ring-0 w-3.5 h-3.5"
                />
                <span>Custom Regressor</span>
              </label>
            </div>

            {mode === 'single' && (
              <GlassSelect
                value={selectedModel}
                onChange={(val) => setSelectedModel(val)}
                options={[
                  { value: 'Linear Regression', label: 'Linear Regression' },
                  { value: 'Decision Tree', label: 'Decision Tree' },
                  { value: 'Random Forest', label: 'Random Forest' },
                  { value: 'Extra Trees', label: 'Extra Trees' },
                  { value: 'Gradient Boosting', label: 'Gradient Boosting' },
                  { value: 'XGBoost Regressor', label: 'XGBoost Regressor' },
                  { value: 'CatBoost Regressor', label: 'CatBoost Regressor' },
                  { value: 'LightGBM Regressor', label: 'LightGBM Regressor' }
                ]}
                className="w-full animate-slideDown"
              />
            )}
          </div>

          <button
            type="submit"
            disabled={pending}
            className="w-full py-3 rounded-xl bg-gradient-to-tr from-[#da4e24] to-[#0098f3] hover:opacity-95 text-white font-bold text-xs shadow-[0_4px_16px_rgba(124,92,255,0.3)] transition-all flex items-center justify-center gap-2 outline-none disabled:opacity-50 uppercase tracking-wide"
          >
            {pending ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Solving dynamic equations...
              </>
            ) : (
              <>
                <Calculator className="w-3.5 h-3.5" /> Run Predictor
              </>
            )}
          </button>
        </form>

        {/* Right Side: Prediction results panel (7 columns) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Loading Skeletons */}
          {pending && (
            <div className="glass-card p-8 flex flex-col items-center justify-center text-center space-y-4 h-[470px] text-xs rounded-[24px]">
              <div className="w-8 h-8 border-2 border-[#da4e24] border-t-transparent rounded-full animate-spin" />
              <p className="text-[#B8BCC8] font-bold tracking-wide">Evaluating multi-variable dimensions weights...</p>
            </div>
          )}

          {/* Idle Panel */}
          {!pending && !prediction && !error && (
            <div className="glass-card p-8 flex flex-col items-center justify-center text-center space-y-4 h-[470px] text-xs rounded-[24px]">
              <div className="p-4 bg-[#da4e24]/10 text-[#da4e24] border border-[#da4e24]/20 rounded-full animate-pulse shadow-md">
                <Calculator className="w-8 h-8" />
              </div>
              <h3 className="text-sm font-extrabold text-white uppercase tracking-wider font-outfit">Configure Pricing Parameters</h3>
              <p className="text-[#B8BCC8]/75 max-w-xs leading-relaxed font-medium">
                Set parameters on the left to solve optimal retail pricing and evaluate profit margins.
              </p>
            </div>
          )}

          {/* Error Panel */}
          {error && (
            <div className="glass-card p-8 flex flex-col items-center justify-center text-center space-y-4 h-[470px] text-xs bg-[#FF5D73]/5 border-[#FF5D73]/20 rounded-[24px]">
              <div className="p-3 rounded-full bg-[#FF5D73]/10 text-[#FF5D73] border border-[#FF5D73]/20 font-extrabold">!</div>
              <h3 className="text-sm font-extrabold text-white font-outfit uppercase tracking-wider">Simulation Failed</h3>
              <p className="text-[#FF5D73]/90 max-w-xs leading-relaxed font-bold">{error}</p>
            </div>
          )}

          {/* Prediction Result Display */}
          {prediction && !pending && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Core Output Card */}
              <div className="glass-card p-6 space-y-6 rounded-[24px]">
                
                {/* Price and Export Header */}
                <div className="flex items-start justify-between border-b border-white/[0.06] pb-4">
                  <div>
                    <span className="text-[10px] font-bold text-[#B8BCC8]/50 uppercase tracking-widest block font-outfit">Solved Recommended Price</span>
                    <h2 className="text-4xl font-extrabold text-white tracking-tight mt-2 font-outfit">
                      ₹{prediction.recommended_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </h2>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleDownloadReport('pdf')} className="p-2.5 bg-white/[0.03] border border-white/[0.08] hover:border-white/[0.16] hover:bg-white/[0.06] rounded-xl text-[#B8BCC8] hover:text-white transition-all shadow-md" title="Export PDF report summary">
                      <FileDown className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDownloadReport('csv')} className="p-2.5 bg-white/[0.03] border border-white/[0.08] hover:border-white/[0.16] hover:bg-white/[0.06] rounded-xl text-[#B8BCC8] hover:text-white transition-all shadow-md" title="Export CSV report summary">
                      <FileDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Sub KPI breakdown grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-bold">
                  
                  {/* Circular Confidence Meter */}
                  <div className="p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl flex flex-col items-center justify-center text-center space-y-2">
                    <span className="text-[9px] font-bold text-[#B8BCC8]/50 uppercase tracking-widest block font-outfit">Confidence</span>
                    <div className="relative w-12 h-12 flex items-center justify-center">
                      <svg className="absolute w-full h-full transform -rotate-90">
                        <circle cx="24" cy="24" r="20" stroke="rgba(255,255,255,0.06)" strokeWidth="2.5" fill="transparent" />
                        <circle cx="24" cy="24" r="20" stroke="#2ED47A" strokeWidth="2.5" fill="transparent" strokeDasharray="125.6" strokeDashoffset={125.6 - (prediction.confidence / 100) * 125.6} />
                      </svg>
                      <span className="font-mono text-white text-[10px]">{Math.round(prediction.confidence)}%</span>
                    </div>
                  </div>

                  <div className="p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl flex flex-col justify-between">
                    <span className="text-[9px] font-bold text-[#B8BCC8]/50 uppercase tracking-widest block font-outfit">Profit Margin</span>
                    <span className="text-[#2ED47A] text-sm font-extrabold block mt-2">
                      {((prediction.recommended_price - freight - (prediction.recommended_price * 0.15)) / prediction.recommended_price * 100).toFixed(1)}%
                    </span>
                  </div>

                  <div className="p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl flex flex-col justify-between">
                    <span className="text-[9px] font-bold text-[#B8BCC8]/50 uppercase tracking-widest block font-outfit">Expected Profit</span>
                    <span className="text-white text-sm font-extrabold block mt-2 font-mono">
                      ₹{(prediction.recommended_price - freight - (prediction.recommended_price * 0.15)).toFixed(2)}
                    </span>
                  </div>

                  <div className="p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl flex flex-col justify-between">
                    <span className="text-[9px] font-bold text-[#B8BCC8]/50 uppercase tracking-widest block font-outfit">Category Avg</span>
                    <span className="text-[#B8BCC8]/80 text-sm font-extrabold block mt-2 font-mono">
                      ₹{prediction.dataset_average?.toFixed(2) || '0.00'}
                    </span>
                  </div>

                </div>

              </div>

              {/* Tabbed interpretability & strategy interface */}
              <div className="glass-card p-6 space-y-4 rounded-[24px]">
                <div className="flex border-b border-white/[0.06] pb-2 text-[10px] uppercase font-bold tracking-wider gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveResultTab('explanation')}
                    className={`pb-2 border-b-2 transition-all ${activeResultTab === 'explanation' ? 'border-[#da4e24] text-white' : 'border-transparent text-[#B8BCC8] hover:text-white'}`}
                  >
                    AI Explanation
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveResultTab('explainable_ai')}
                    className={`pb-2 border-b-2 transition-all ${activeResultTab === 'explainable_ai' ? 'border-[#da4e24] text-white' : 'border-transparent text-[#B8BCC8] hover:text-white'}`}
                  >
                    Weight Splits
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveResultTab('strategic_insights')}
                    className={`pb-2 border-b-2 transition-all ${activeResultTab === 'strategic_insights' ? 'border-[#da4e24] text-white' : 'border-transparent text-[#B8BCC8] hover:text-white'}`}
                  >
                    Strategic Insights
                  </button>
                </div>

                <div className="pt-2 text-xs font-medium">
                  {activeResultTab === 'explanation' && (
                    <div className="space-y-2">
                      <span className="text-[9px] font-bold text-[#da4e24] uppercase tracking-wider block font-outfit">Dynamic Pricing Rationale</span>
                      {aiPending ? (
                        <div className="py-6 flex flex-col items-center justify-center text-center space-y-2 text-[#B8BCC8]/50">
                          <div className="w-4 h-4 border-2 border-[#da4e24] border-t-transparent rounded-full animate-spin" />
                          <span>Consulting pricing engine...</span>
                        </div>
                      ) : aiError ? (
                        <div className="p-3 bg-[#FF5D73]/10 border border-[#FF5D73]/20 text-[#FF5D73] rounded-xl flex items-center justify-between">
                          <span>{aiError}</span>
                          <button 
                            type="button" 
                            onClick={() => fetchAiExplanation(prediction)}
                            className="px-2.5 py-1 bg-white/5 hover:bg-white/10 rounded font-bold uppercase text-[9px] tracking-wider transition-colors"
                          >
                            Retry
                          </button>
                        </div>
                      ) : (
                        <p className="text-[#B8BCC8]/85 leading-relaxed whitespace-pre-line font-outfit">
                          {aiExplanation || "Generating pricing simulation log..."}
                        </p>
                      )}
                    </div>
                  )}

                  {activeResultTab === 'explainable_ai' && (
                    <div className="space-y-3.5">
                      <span className="text-[9px] font-bold text-[#da4e24] uppercase tracking-wider block font-outfit">Inference Feature Contributions</span>
                      {explainFactors().map((factor, idx) => (
                        <div key={idx} className="space-y-1.5">
                          <div className="flex justify-between font-bold">
                            <span className="text-[#B8BCC8]/85">{factor.name}</span>
                            <span className={factor.positive ? 'text-[#2ED47A]' : 'text-[#da4e24]'}>
                              {factor.positive ? '+' : '-'}{factor.value}%
                            </span>
                          </div>
                          <div className="h-1 bg-white/[0.04] rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${factor.positive ? 'bg-gradient-to-r from-[#2ED47A] to-[#1FB260]' : 'bg-gradient-to-r from-[#da4e24] to-[#0098f3]'}`} 
                              style={{ width: `${factor.value * 3.3}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeResultTab === 'strategic_insights' && (
                    <div className="space-y-3">
                      <span className="text-[9px] font-bold text-[#0098f3] uppercase tracking-wider block font-outfit">Strategic Retail Recommendations</span>
                      <ul className="space-y-2.5 text-[#B8BCC8]/85">
                        {strategicInsights().map((ins, idx) => (
                          <li key={idx} className="flex gap-2 items-start leading-relaxed font-semibold">
                            <span className="text-[#da4e24] select-none font-bold">•</span>
                            <span>{ins}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* Competitive Price Analysis Card */}
          {prediction && !pending && (compPending || compAnalysis || compError) && (
            <div className="mt-6">
              {compPending && (
                <div className="glass-card p-6 space-y-4 rounded-[24px] animate-pulse">
                  <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3 mb-2">
                    <TrendingUp className="w-4 h-4 text-[#da4e24] animate-bounce" />
                    <div>
                      <h3 className="text-xs font-bold text-white uppercase tracking-widest font-outfit">Market Position & Competitive Intelligence</h3>
                      <p className="text-[10px] text-[#B8BCC8]/60 mt-0.5 font-medium">Evaluating market position...</p>
                    </div>
                  </div>
                  <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
                    <div className="w-6 h-6 border-2 border-[#da4e24] border-t-transparent rounded-full animate-spin" />
                    <p className="text-[#B8BCC8] text-xs font-bold tracking-wide">Evaluating market position...</p>
                  </div>
                </div>
              )}

              {compError && !compPending && (
                <div className="glass-card p-6 rounded-[24px] bg-[#FF5D73]/5 border border-[#FF5D73]/20 flex flex-col items-center justify-center text-center space-y-3 py-8">
                  <AlertTriangle className="w-6 h-6 text-[#FF5D73]" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-widest font-outfit">Market Benchmark Unavailable</h3>
                  <p className="text-[#FF5D73]/90 text-[11px] font-bold max-w-md">
                    Price prediction remains available. Competitive analysis will be shown when sufficient benchmark data is available.
                  </p>
                </div>
              )}

              {compAnalysis && !compPending && !compError && (() => {
                const minVal = compAnalysis.minimum_price;
                const maxVal = compAnalysis.maximum_price;
                const avgVal = compAnalysis.market_average;
                const medVal = compAnalysis.category_median;
                const spreadVal = maxVal - minVal;
                const recPrice = compAnalysis.recommended_price;
                const gapVal = compAnalysis.price_gap;
                const gapPct = compAnalysis.price_gap_percentage;
                const score = compAnalysis.market_position_score;
                const position = compAnalysis.competitive_position;
                const decision = compAnalysis.pricing_decision;

                const getPercent = (val) => {
                  if (spreadVal <= 0) return 50;
                  const pct = ((val - minVal) / spreadVal) * 100;
                  return Math.min(100, Math.max(0, pct));
                };

                const aiBinIndex = compAnalysis.bins.findIndex(
                  b => recPrice >= b.min_val && recPrice <= b.max_val
                );

                const isCheaper = gapVal < 0;
                const gapSign = gapVal > 0 ? '+' : '';
                const gapColor = isCheaper ? 'text-[#2ED47A]' : 'text-[#FF5D73]';

                let scoreColor = 'text-[#2ED47A] border-[#2ED47A]/20 bg-[#2ED47A]/5';
                if (score < 50) scoreColor = 'text-[#FF5D73] border-[#FF5D73]/20 bg-[#FF5D73]/5';
                else if (score < 80) scoreColor = 'text-[#da4e24] border-[#da4e24]/20 bg-[#da4e24]/5';

                let positionBadgeColor = 'text-[#0098f3] bg-[#0098f3]/10 border-[#0098f3]/20';
                if (position === 'VALUE LEADER' || position === 'HIGHLY COMPETITIVE') positionBadgeColor = 'text-[#2ED47A] bg-[#2ED47A]/10 border-[#2ED47A]/20';
                if (position === 'PREMIUM POSITION') positionBadgeColor = 'text-[#da4e24] bg-[#da4e24]/10 border-[#da4e24]/20';
                if (position === 'OVERPRICED RISK') positionBadgeColor = 'text-[#FF5D73] bg-[#FF5D73]/10 border-[#FF5D73]/20';

                return (
                  <div className="glass-card p-6 space-y-8 rounded-[24px] animate-fadeIn">
                    
                    {/* Header Banner */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
                      <div>
                        <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2 font-outfit">
                          <TrendingUp className="w-4 h-4 text-[#da4e24]" /> MARKET POSITION & COMPETITIVE INTELLIGENCE
                        </h3>
                        <p className="text-[10px] text-[#B8BCC8]/60 mt-0.5 font-medium">
                          Evaluate the recommended price against category-level market benchmarks and competitive pricing signals.
                        </p>
                      </div>
                      <div>
                        <span className="px-2.5 py-1 bg-white/[0.03] border border-white/[0.08] rounded-full text-[9px] text-[#B8BCC8]/75 font-mono font-bold tracking-wider">
                          Benchmark Source: Category-level historical pricing data
                        </span>
                      </div>
                    </div>

                    {/* 4 Top KPI Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 font-semibold">
                      
                      {/* Score Card */}
                      <div className={`p-4 border rounded-2xl flex flex-col justify-between ${scoreColor}`}>
                        <span className="text-[8px] uppercase tracking-widest font-extrabold font-outfit text-inherit opacity-60">Market Position Score</span>
                        <div className="mt-3 flex items-baseline justify-between">
                          <span className="text-xl font-extrabold font-mono">{score} <span className="text-[10px] font-bold opacity-50">/100</span></span>
                          <span className="text-[9px] font-extrabold uppercase tracking-wide px-1.5 py-0.5 rounded bg-white/10">{position}</span>
                        </div>
                      </div>

                      {/* Gap Card */}
                      <div className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-2xl flex flex-col justify-between">
                        <span className="text-[8px] text-[#B8BCC8]/50 uppercase tracking-widest font-extrabold font-outfit">Market Gap</span>
                        <div className="mt-3 flex items-baseline justify-between">
                          <span className={`text-xl font-extrabold font-mono ${gapColor}`}>
                            {gapSign}₹{gapVal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                          <span className={`text-[10px] font-extrabold font-mono ${gapColor}`}>
                            ({gapSign}{gapPct.toFixed(1)}%)
                          </span>
                        </div>
                      </div>

                      {/* Market Average Card */}
                      <div className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-2xl flex flex-col justify-between">
                        <span className="text-[8px] text-[#B8BCC8]/50 uppercase tracking-widest font-extrabold font-outfit">Market Average</span>
                        <div className="mt-3">
                          <span className="text-xl font-extrabold font-mono text-white">
                            ₹{avgVal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>

                      {/* Range Card */}
                      <div className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-2xl flex flex-col justify-between">
                        <span className="text-[8px] text-[#B8BCC8]/50 uppercase tracking-widest font-extrabold font-outfit">Competitive Range</span>
                        <div className="mt-3">
                          <span className="text-sm font-extrabold font-mono text-white">
                            ₹{minVal.toLocaleString(undefined, { minimumFractionDigits: 2 })} — ₹{maxVal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>

                    </div>

                    {/* Price Landscape Visualization */}
                    <div className="p-5 bg-white/[0.01] border border-white/[0.04] rounded-2xl space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-extrabold text-[#da4e24] uppercase tracking-wider block font-outfit">Price Landscape</span>
                        <span className="text-[9px] font-mono text-[#B8BCC8]/60">Range: ₹{minVal.toFixed(2)} — ₹{maxVal.toFixed(2)}</span>
                      </div>
                      
                      {(() => {
                        // Prepare bottom markers and calculate non-overlapping vertical staggering
                        const bottomItems = [
                          { id: 'lowest', label: 'Lowest', value: minVal, color: '#2ED47A', dotBg: 'bg-[#2ED47A]', rawPct: 0 },
                          { id: 'avg', label: 'Market Avg', value: avgVal, color: '#0098f3', dotBg: 'bg-[#0098f3]', rawPct: getPercent(avgVal) }
                        ];

                        if (compAnalysis.our_current_price !== undefined && compAnalysis.our_current_price !== null) {
                          bottomItems.push({
                            id: 'current',
                            label: 'Current',
                            value: compAnalysis.our_current_price,
                            color: '#B8BCC8',
                            dotBg: 'bg-[#B8BCC8]',
                            rawPct: getPercent(compAnalysis.our_current_price)
                          });
                        }

                        bottomItems.push({
                          id: 'highest', label: 'Highest', value: maxVal, color: '#FF5D73', dotBg: 'bg-[#FF5D73]', rawPct: 100
                        });

                        // Sort bottom items by rawPct
                        bottomItems.sort((a, b) => a.rawPct - b.rawPct);

                        // Assign vertical staggering levels (0 or 1) when horizontal gap is small (< 14%)
                        let levelAcc = 0;
                        for (let i = 0; i < bottomItems.length; i++) {
                          if (i > 0) {
                            const diff = bottomItems[i].rawPct - bottomItems[i - 1].rawPct;
                            if (diff < 14) {
                              levelAcc = (bottomItems[i - 1].level === 0) ? 1 : 0;
                            } else {
                              levelAcc = 0;
                            }
                          }
                          bottomItems[i].level = levelAcc;
                        }

                        return (
                          <div className="relative h-1 bg-white/[0.08] rounded-full my-16 mx-4">
                            {/* Highlighted track */}
                            <div className="absolute top-0 bottom-0 left-0 right-0 bg-gradient-to-r from-[#2ED47A]/20 via-[#0098f3]/25 to-[#FF5D73]/20 rounded-full" />
                            
                            {/* Render Bottom Markers (Lowest, Market Avg, Current, Highest) with Staggering */}
                            {bottomItems.map((item) => (
                              <div 
                                key={item.id} 
                                className="absolute flex flex-col items-center -translate-x-1/2" 
                                style={{ left: `${item.rawPct}%` }}
                              >
                                <div className={`w-2.5 h-2.5 rounded-full ${item.dotBg} border border-[#09090b] relative -top-0.5 z-0`} />
                                {item.level === 0 ? (
                                  <div className="flex flex-col items-center mt-2.5 whitespace-nowrap">
                                    <span className="text-[8px] text-[#B8BCC8]/50 uppercase tracking-wider font-bold font-outfit">{item.label}</span>
                                    <span className="text-[10px] text-[#B8BCC8] font-mono font-bold">₹{item.value.toFixed(2)}</span>
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-center mt-1.5 whitespace-nowrap">
                                    <div className="w-[1px] h-3 bg-white/30 mb-0.5" />
                                    <span className="text-[8px] uppercase tracking-wider font-bold font-outfit" style={{ color: item.color }}>{item.label}</span>
                                    <span className="text-[10px] text-white font-mono font-bold">₹{item.value.toFixed(2)}</span>
                                  </div>
                                )}
                              </div>
                            ))}

                            {/* AI RECOMMENDED Marker (Top glowing pulse marker) */}
                            <div className="absolute flex flex-col items-center -translate-x-1/2 -top-[52px] z-10" style={{ left: `${getPercent(recPrice)}%` }}>
                              <span className="text-[10px] text-[#da4e24] font-mono font-extrabold bg-[#da4e24]/10 px-2 py-0.5 rounded-full border border-[#da4e24]/30 shadow-lg shadow-[#da4e24]/10 mb-1 whitespace-nowrap">
                                ₹{recPrice.toFixed(2)}
                              </span>
                              <div className="w-3.5 h-3.5 rounded-full bg-[#da4e24] border-2 border-white flex items-center justify-center shadow-lg shadow-[#da4e24]/30 animate-pulse relative -bottom-0.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-white" />
                              </div>
                              <span className="text-[8px] text-[#da4e24] uppercase tracking-widest mt-1 font-extrabold font-outfit whitespace-nowrap">AI Price</span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Split Panel: Signals vs Decision */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 font-semibold">
                      
                      {/* Left: Market Signals & Price Distribution */}
                      <div className="space-y-6">
                        
                        <div className="p-5 bg-white/[0.01] border border-white/[0.04] rounded-2xl space-y-4">
                          <span className="text-[9px] font-extrabold text-[#0098f3] uppercase tracking-wider block font-outfit">Market Signals</span>
                          
                          <div className="grid grid-cols-2 gap-4 text-xs">
                            <div className="space-y-0.5 border-b border-white/[0.04] pb-2">
                              <span className="text-[#B8BCC8]/50 font-bold block text-[10px]">Market Average</span>
                              <span className="text-white font-mono font-bold">₹{avgVal.toFixed(2)}</span>
                            </div>
                            <div className="space-y-0.5 border-b border-white/[0.04] pb-2">
                              <span className="text-[#B8BCC8]/50 font-bold block text-[10px]">Category Median</span>
                              <span className="text-white font-mono font-bold">₹{medVal.toFixed(2)}</span>
                            </div>
                            <div className="space-y-0.5 border-b border-white/[0.04] pb-2">
                              <span className="text-[#B8BCC8]/50 font-bold block text-[10px]">Lowest Benchmark</span>
                              <span className="text-white font-mono font-bold">₹{minVal.toFixed(2)}</span>
                            </div>
                            <div className="space-y-0.5 border-b border-white/[0.04] pb-2">
                              <span className="text-[#B8BCC8]/50 font-bold block text-[10px]">Highest Benchmark</span>
                              <span className="text-white font-mono font-bold">₹{maxVal.toFixed(2)}</span>
                            </div>
                            <div className="space-y-0.5">
                              <span className="text-[#B8BCC8]/50 font-bold block text-[10px]">Price Spread</span>
                              <span className="text-white font-mono font-bold">₹{spreadVal.toFixed(2)}</span>
                            </div>
                            <div className="space-y-0.5">
                              <span className="text-[#B8BCC8]/50 font-bold block text-[10px]">Number of Benchmarks</span>
                              <span className="text-white font-mono font-bold">{compAnalysis.benchmark_count}</span>
                            </div>
                          </div>
                        </div>

                        {/* Price Frequency Distribution Chart */}
                        <div className="p-5 bg-white/[0.01] border border-white/[0.04] rounded-2xl space-y-3">
                          <span className="text-[9px] font-extrabold text-[#B8BCC8]/50 uppercase tracking-wider block font-outfit">Price Distribution</span>
                          
                          <div className="flex items-center justify-between text-[9px] text-[#B8BCC8]/60 font-bold mb-1">
                            <span>Competitor price frequency count in category range bins</span>
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-sm bg-[#da4e24]" /> AI Bin
                            </span>
                          </div>

                          <div className="h-44 w-full flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={compAnalysis.bins} margin={{ top: 15, right: 10, left: -25, bottom: 5 }}>
                                <XAxis dataKey="bin_label" stroke="rgba(255,255,255,0.3)" style={{ fontSize: '9px' }} />
                                <YAxis stroke="rgba(255,255,255,0.3)" style={{ fontSize: '9px' }} allowDecimals={false} />
                                <Tooltip
                                  contentStyle={{ 
                                    backgroundColor: '#0d0d0d', 
                                    borderColor: 'rgba(255,255,255,0.08)', 
                                    borderRadius: '8px', 
                                    color: '#fff', 
                                    fontSize: '10px' 
                                  }}
                                  formatter={(value) => [value, 'Benchmarks']}
                                />
                                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                  {compAnalysis.bins.map((entry, idx) => (
                                    <Cell 
                                      key={`cell-${idx}`} 
                                      fill={idx === aiBinIndex ? '#da4e24' : 'rgba(0, 152, 243, 0.4)'} 
                                      stroke={idx === aiBinIndex ? '#da4e24' : 'transparent'}
                                      strokeWidth={1}
                                    />
                                  ))}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                      </div>

                      {/* Right: Pricing Decision Panel */}
                      <div className="space-y-6">
                        
                        <div className="p-5 bg-white/[0.01] border border-white/[0.04] rounded-2xl space-y-4">
                          <span className="text-[9px] font-extrabold text-[#da4e24] uppercase tracking-wider block font-outfit">Pricing Decision</span>
                          
                          <div className="space-y-4">
                            {/* Action badge & target price */}
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="text-[#B8BCC8]/50 text-[10px] font-bold block">Recommended Action</span>
                                <span className={`px-2.5 py-1.5 rounded-lg border text-xs font-extrabold uppercase tracking-wider inline-block mt-1 ${positionBadgeColor}`}>
                                  {decision === 'MAINTAIN' ? 'MAINTAIN PRICE' : decision}
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="text-[#B8BCC8]/50 text-[10px] font-bold block">Target Price</span>
                                <span className="text-xl font-extrabold font-mono text-[#da4e24] mt-1 block">
                                  ₹{recPrice.toFixed(2)}
                                </span>
                              </div>
                            </div>

                            {/* Core business reason text */}
                            <div className="p-3.5 bg-white/[0.02] border border-white/[0.04] rounded-xl text-xs text-white leading-relaxed">
                              {(() => {
                                if (decision === 'MAINTAIN') {
                                  return 'The predicted price is closely aligned with the market average and remains within the competitive price range.';
                                }
                                if (decision === 'PREMIUM JUSTIFIED') {
                                  return 'Product operates in a high-demand market sector, justifying a price point above the category average.';
                                }
                                if (decision === 'CONSIDER LOWER PRICE') {
                                  return 'AI Price is above competitor benchmarks under low-to-medium demand. Suggest testing a narrower pricing corridor.';
                                }
                                if (decision === 'REVIEW PRICE') {
                                  return 'Recommended price is substantially above the competitor threshold, posing a significant loss-of-sales risk.';
                                }
                                return 'No anomalies detected. Safe to apply solver target.';
                              })()}
                            </div>

                            {/* Expandable "Why this position?" */}
                            <div className="border-t border-white/[0.06] pt-3.5">
                              <button
                                type="button"
                                onClick={() => setWhyExpanded(!whyExpanded)}
                                className="flex items-center justify-between w-full text-left text-xs font-bold text-white hover:text-[#da4e24] transition-colors"
                              >
                                <span className="uppercase tracking-widest text-[9px] font-extrabold flex items-center gap-1.5">
                                  <HelpCircle className="w-3.5 h-3.5 text-[#0098f3]" /> Why This Position?
                                </span>
                                {whyExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>

                              {whyExpanded && (
                                <ul className="mt-3 space-y-2 text-[#B8BCC8]/85 text-[11px] leading-relaxed animate-fadeIn">
                                  {compAnalysis.reasons.map((rsn, idx) => (
                                    <li key={idx} className="flex gap-2 items-start font-semibold">
                                      <CheckCircle className="w-3.5 h-3.5 text-[#2ED47A] shrink-0 mt-0.5" />
                                      <span>{rsn}</span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* AI Gemini Insight */}
                        {compAnalysis.ai_insight && (
                          <div className="p-4 bg-gradient-to-r from-white/[0.01] to-[#0098f3]/5 border border-[#0098f3]/10 rounded-2xl flex items-start gap-3">
                            <Sparkles className="w-4 h-4 text-[#0098f3] shrink-0 mt-0.5" />
                            <div className="space-y-1">
                              <span className="text-[9px] font-bold text-[#0098f3] uppercase tracking-wider block font-outfit">AI Strategic Insight</span>
                              <p className="text-[#B8BCC8]/85 text-[11px] leading-relaxed italic font-medium">
                                &ldquo;{compAnalysis.ai_insight.replace(/### AI Competitive Insight\n\n|### AI Competitive Insight/g, '').trim()}&rdquo;
                              </p>
                            </div>
                          </div>
                        )}

                      </div>

                    </div>

                    {/* Collapsible Benchmark Details table */}
                    <div className="border-t border-white/[0.06] pt-5">
                      <button
                        type="button"
                        onClick={() => setShowBenchmarkDetails(!showBenchmarkDetails)}
                        className="flex items-center justify-between w-full text-left text-xs font-bold text-[#B8BCC8] hover:text-white transition-colors"
                      >
                        <span className="uppercase tracking-widest text-[9px] font-extrabold font-outfit">
                          {showBenchmarkDetails ? 'Hide Market Benchmark Details' : 'View Market Benchmark Details'}
                        </span>
                        {showBenchmarkDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>

                      {showBenchmarkDetails && (
                        <div className="mt-4 overflow-x-auto bg-white/[0.01] border border-white/[0.04] rounded-2xl animate-fadeIn">
                          <table className="w-full text-left border-collapse text-[11px]">
                            <thead>
                              <tr className="border-b border-white/[0.06] text-[#B8BCC8]/50 uppercase tracking-wider font-bold">
                                <th className="py-2.5 px-4">Benchmark Name</th>
                                <th className="py-2.5 px-4 text-right">Price</th>
                                <th className="py-2.5 px-4 text-right">Difference vs AI Price</th>
                                <th className="py-2.5 px-4 text-center">Relative Position</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.04] text-[#B8BCC8]/85 font-semibold">
                              {compAnalysis.competitors.map((comp, idx) => {
                                const diff = comp.competitor_price - recPrice;
                                const isHigher = diff > 0;
                                const isLower = diff < 0;
                                const diffText = diff === 0 ? '₹0.00' : `${isHigher ? '+' : ''}₹${diff.toFixed(2)}`;
                                const positionText = isHigher ? 'Higher' : isLower ? 'Lower' : 'Equal';
                                const diffColor = isHigher ? 'text-[#da4e24]' : isLower ? 'text-[#2ED47A]' : 'text-[#B8BCC8]';
                                return (
                                  <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                                    <td className="py-2.5 px-4 font-mono">{comp.competitor_name}</td>
                                    <td className="py-2.5 px-4 font-mono text-right">₹{comp.competitor_price.toFixed(2)}</td>
                                    <td className={`py-2.5 px-4 font-mono text-right ${diffColor}`}>{diffText}</td>
                                    <td className="py-2.5 px-4 text-center">
                                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${isHigher ? 'bg-[#da4e24]/10 text-[#da4e24]' : isLower ? 'bg-[#2ED47A]/10 text-[#2ED47A]' : 'bg-white/10 text-white'}`}>
                                        {positionText}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                  </div>
                );
              })()}
            </div>
          )}

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

export default Predictor;
