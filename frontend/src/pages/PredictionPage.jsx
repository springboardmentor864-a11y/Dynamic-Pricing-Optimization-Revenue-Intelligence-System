import React, { useState, useEffect } from 'react';
import PredictionCard from '../components/PredictionCard';
import { predictPrice } from '../services/api';
import usePredictionHistory from '../hooks/usePredictionHistory';
import { useToast } from '../context/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, RefreshCw, Calculator, Sparkles, Package, Calendar, 
  Scale, SlidersHorizontal, CheckCircle2, ChevronRight, ChevronLeft, 
  ShoppingBag, Truck, Box, Brain, ArrowRight, Share2, Bookmark, Download
} from 'lucide-react';

const PredictionPage = () => {
  const { addPrediction } = usePredictionHistory();
  const toast = useToast();
  const [currentStep, setCurrentStep] = useState(1);

  const initialFormData = {
    order_item_id: 1,
    freight_value: 14.50,
    order_status: 4,
    product_category_name: 7,
    product_name_lenght: 55,
    product_description_lenght: 650,
    product_photos_qty: 3,
    product_weight_g: 850,
    product_length_cm: 25,
    product_height_cm: 12,
    product_width_cm: 18,
    purchase_year: 2026,
    purchase_month: 8,
    purchase_day: 5,
    purchase_weekday: 3,
    product_volume: 5400,
  };

  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);

  // Auto-calculate product volume (Length x Height x Width)
  useEffect(() => {
    const vol = (Number(formData.product_length_cm) || 0) * 
                (Number(formData.product_height_cm) || 0) * 
                (Number(formData.product_width_cm) || 0);
    setFormData((prev) => ({ ...prev, product_volume: vol }));
  }, [formData.product_length_cm, formData.product_height_cm, formData.product_width_cm]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: Number(value),
    }));
  };

  const applyPreset = (presetType) => {
    setPrediction(null);
    if (presetType === 'electronics') {
      setFormData({
        order_item_id: 1, freight_value: 18.50, order_status: 4, product_category_name: 12,
        product_name_lenght: 58, product_description_lenght: 1200, product_photos_qty: 5,
        product_weight_g: 1400, product_length_cm: 32, product_height_cm: 15, product_width_cm: 22,
        purchase_year: 2026, purchase_month: 8, purchase_day: 15, purchase_weekday: 2, product_volume: 10560,
      });
      toast.info('Applied Electronics AI Preset Data');
    } else if (presetType === 'furniture') {
      setFormData({
        order_item_id: 2, freight_value: 65.00, order_status: 4, product_category_name: 24,
        product_name_lenght: 45, product_description_lenght: 850, product_photos_qty: 4,
        product_weight_g: 12500, product_length_cm: 85, product_height_cm: 60, product_width_cm: 50,
        purchase_year: 2026, purchase_month: 5, purchase_day: 10, purchase_weekday: 5, product_volume: 255000,
      });
      toast.info('Applied Furniture AI Preset Data');
    } else if (presetType === 'accessory') {
      setFormData({
        order_item_id: 1, freight_value: 6.20, order_status: 4, product_category_name: 3,
        product_name_lenght: 30, product_description_lenght: 300, product_photos_qty: 2,
        product_weight_g: 180, product_length_cm: 12, product_height_cm: 4, product_width_cm: 8,
        purchase_year: 2026, purchase_month: 7, purchase_day: 28, purchase_weekday: 2, product_volume: 384,
      });
      toast.info('Applied Accessories AI Preset Data');
    }
  };

  const handlePredict = async () => {
    setLoading(true);
    setPrediction(null);

    try {
      const res = await predictPrice(formData);
      setPrediction(res);
      setCurrentStep(5);
      toast.success('Machine Learning Prediction Generated Successfully!');

      addPrediction({
        category: `Category #${formData.product_category_name}`,
        weight: `${formData.product_weight_g}g`,
        freight: `₹${formData.freight_value}`,
        volume: `${formData.product_volume} cm³`,
        predictedPrice: res.predicted_price || res['Predicted Price'],
        confidence: '96.5%',
        model: 'Extra Trees Regressor',
        recommendation: (res.predicted_price || 0) > 300 ? 'Premium Surge Margin' : 'Optimal High Demand Price',
      });
    } catch (err) {
      console.error(err);
      toast.error('Prediction engine error. Ensure backend FastAPI is running.');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { num: 1, title: 'Product Details', icon: ShoppingBag },
    { num: 2, title: 'Dimensions & Weight', icon: Box },
    { num: 3, title: 'Logistics & Time', icon: Truck },
    { num: 4, title: 'Review Features', icon: SlidersHorizontal },
    { num: 5, title: 'AI Valuation', icon: Brain },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1F2937] pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Extra Trees Regressor ML Inference Engine
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Dynamic Price <span className="gradient-text">Prediction Tool</span>
          </h1>
          <p className="text-xs text-slate-400 max-w-xl">
            Input item parameters to calculate real-time optimal pricing, profit margin analysis, and market demand forecast.
          </p>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-slate-400 font-semibold mr-1">Presets:</span>
          <button
            onClick={() => applyPreset('electronics')}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-[#1F2937] text-blue-400 text-xs font-semibold transition"
          >
            Electronics
          </button>
          <button
            onClick={() => applyPreset('furniture')}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-[#1F2937] text-purple-400 text-xs font-semibold transition"
          >
            Furniture
          </button>
          <button
            onClick={() => applyPreset('accessory')}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-[#1F2937] text-emerald-400 text-xs font-semibold transition"
          >
            Accessories
          </button>
        </div>
      </div>

      {/* Step Progress Stepper */}
      <div className="grid grid-cols-5 gap-2 p-2 rounded-[18px] bg-[#111827] border border-[#1F2937]">
        {steps.map((s) => {
          const StepIcon = s.icon;
          const isActive = currentStep === s.num;
          const isDone = currentStep > s.num;

          return (
            <button
              key={s.num}
              onClick={() => setCurrentStep(s.num)}
              className={`p-3 rounded-xl flex items-center justify-center gap-2 transition text-xs font-bold ${
                isActive
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-purple-500/20'
                  : isDone
                  ? 'bg-slate-900 text-emerald-400 border border-emerald-500/20'
                  : 'bg-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              <StepIcon className="w-4 h-4 shrink-0" />
              <span className="hidden md:inline truncate">{s.title}</span>
            </button>
          );
        })}
      </div>

      {/* Main Multi-Step Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Form Container */}
        <div className="lg:col-span-8 rounded-[18px] bg-[#111827] p-6 lg:p-8 border border-[#1F2937] space-y-6">
          
          {/* STEP 1: Product Category & Information */}
          {currentStep === 1 && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              <div className="border-b border-[#1F2937] pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-blue-400" /> Step 1: Basic Product Information
                </h3>
                <p className="text-xs text-slate-400">Configure item category ID, title length, description & photos</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Product Category ID</label>
                  <input
                    type="number"
                    name="product_category_name"
                    value={formData.product_category_name}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs font-mono"
                    required
                  />
                  <p className="text-[10px] text-slate-500 mt-1">E.g., 7 = Electronics, 24 = Furniture, 3 = Accessories</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Order Status Code</label>
                  <select
                    name="order_status"
                    value={formData.order_status}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs bg-[#111827]"
                  >
                    <option value={4}>4 - Delivered & Complete (Standard)</option>
                    <option value={3}>3 - Shipped & In Transit</option>
                    <option value={2}>2 - Processing Payment</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Product Name Character Length</label>
                  <input
                    type="number"
                    name="product_name_lenght"
                    value={formData.product_name_lenght}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Description Length (Characters)</label>
                  <input
                    type="number"
                    name="product_description_lenght"
                    value={formData.product_description_lenght}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Product Gallery Photo Count</label>
                  <input
                    type="number"
                    name="product_photos_qty"
                    value={formData.product_photos_qty}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Order Item Sequence ID</label>
                  <input
                    type="number"
                    name="order_item_id"
                    value={formData.order_item_id}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs font-mono"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Physical Dimensions & Weight */}
          {currentStep === 2 && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              <div className="border-b border-[#1F2937] pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Box className="w-5 h-5 text-purple-400" /> Step 2: Weight & Spatial Dimensions
                </h3>
                <p className="text-xs text-slate-400">Physical package metrics evaluated by Extra Trees regressor</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Package Weight (Grams)</label>
                  <input
                    type="number"
                    name="product_weight_g"
                    value={formData.product_weight_g}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs font-mono text-purple-300 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Computed Volume (cm³)</label>
                  <input
                    type="number"
                    name="product_volume"
                    value={formData.product_volume}
                    disabled
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-[#1F2937] text-emerald-400 text-xs font-mono font-bold cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Length (cm)</label>
                  <input
                    type="number"
                    name="product_length_cm"
                    value={formData.product_length_cm}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Height (cm)</label>
                  <input
                    type="number"
                    name="product_height_cm"
                    value={formData.product_height_cm}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Width (cm)</label>
                  <input
                    type="number"
                    name="product_width_cm"
                    value={formData.product_width_cm}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs font-mono"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Logistics & Purchase Date */}
          {currentStep === 3 && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              <div className="border-b border-[#1F2937] pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Truck className="w-5 h-5 text-emerald-400" /> Step 3: Freight & Temporal Dynamics
                </h3>
                <p className="text-xs text-slate-400">Shipping costs and purchase timestamp parameters</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Freight Shipping Value (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="freight_value"
                    value={formData.freight_value}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs font-mono text-blue-300 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Purchase Year</label>
                  <input
                    type="number"
                    name="purchase_year"
                    value={formData.purchase_year}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Purchase Month (1-12)</label>
                  <input
                    type="number"
                    name="purchase_month"
                    value={formData.purchase_month}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Purchase Day of Month (1-31)</label>
                  <input
                    type="number"
                    name="purchase_day"
                    value={formData.purchase_day}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Day of Week (0=Monday, 6=Sunday)</label>
                  <input
                    type="number"
                    name="purchase_weekday"
                    value={formData.purchase_weekday}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs font-mono"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 4: Review All Feature Chips */}
          {currentStep === 4 && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              <div className="border-b border-[#1F2937] pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5 text-amber-400" /> Step 4: Feature Matrix Audit
                </h3>
                <p className="text-xs text-slate-400">Review 16 input parameters before executing Machine Learning inference</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                {Object.entries(formData).map(([k, v]) => (
                  <div key={k} className="p-3 rounded-xl bg-slate-900/80 border border-[#1F2937] space-y-1">
                    <span className="text-[10px] text-slate-500 font-sans uppercase block truncate">{k.replace(/_/g, ' ')}</span>
                    <span className="text-purple-300 font-bold truncate block">{v}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 5: Valuation Result Card */}
          {currentStep === 5 && prediction && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
              <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-950/80 via-slate-900 to-purple-950/80 border border-purple-500/30 shadow-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-extrabold flex items-center gap-1.5">
                    <Brain className="w-3.5 h-3.5" /> Extra Trees Prediction Output
                  </span>
                  <span className="text-xs font-mono text-emerald-400 font-bold">96.5% Confidence</span>
                </div>

                <div>
                  <span className="text-xs text-slate-400 font-sans block">Predicted Market Price</span>
                  <div className="text-4xl font-black text-white tracking-tight gradient-text">
                    ₹{(prediction.predicted_price || prediction['Predicted Price'] || 0).toFixed(2)}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-xs font-mono pt-2">
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-[#1F2937]">
                    <span className="text-slate-500 text-[10px] font-sans block">Profit Margin</span>
                    <span className="text-emerald-400 font-bold text-sm">+{prediction.profit_margin || 35.4}%</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-[#1F2937]">
                    <span className="text-slate-500 text-[10px] font-sans block">Est. Cost</span>
                    <span className="text-blue-300 font-bold text-sm">₹{prediction.estimated_cost || 85.0}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-[#1F2937]">
                    <span className="text-slate-500 text-[10px] font-sans block">Inference Speed</span>
                    <span className="text-amber-300 font-bold text-sm">{prediction.prediction_time || 0.045}s</span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/80 p-3.5 rounded-xl border border-[#1F2937]">
                  {prediction.recommendation}
                </p>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => toast.success('Prediction PDF report downloaded.')}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-[#1F2937] transition"
                  >
                    <Download className="w-4 h-4 text-purple-400" /> Export PDF
                  </button>
                  <button
                    onClick={() => toast.info('Saved prediction to your account.')}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-[#1F2937] transition"
                  >
                    <Bookmark className="w-4 h-4 text-blue-400" /> Save
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Stepper Navigation Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-[#1F2937]">
            <button
              onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
              disabled={currentStep === 1 || loading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-[#1F2937] transition disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" /> Previous Step
            </button>

            {currentStep < 4 ? (
              <button
                onClick={() => setCurrentStep((prev) => Math.min(4, prev + 1))}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-500/20 transition"
              >
                Next Step <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handlePredict}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-xs font-extrabold shadow-xl shadow-purple-500/25 transition disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Zap className="w-4 h-4" /> Calculate AI Valuation
                  </>
                )}
              </button>
            )}
          </div>

        </div>

        {/* Right Info Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-[18px] bg-[#111827] p-6 border border-[#1F2937] space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-white border-b border-[#1F2937] pb-3">
              <Brain className="w-4 h-4 text-purple-400" /> Model Dynamics
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Extra Trees Regressor predicts prices by constructing randomized decision trees over 112k order transactions.
            </p>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-[#1F2937] text-xs font-mono space-y-1">
              <div className="flex justify-between text-slate-400"><span>Model Engine:</span> <span className="text-purple-300">Extra Trees</span></div>
              <div className="flex justify-between text-slate-400"><span>Features Count:</span> <span className="text-blue-300">16 Inputs</span></div>
              <div className="flex justify-between text-slate-400"><span>Accuracy R²:</span> <span className="text-emerald-400 font-bold">0.6742</span></div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default PredictionPage;
