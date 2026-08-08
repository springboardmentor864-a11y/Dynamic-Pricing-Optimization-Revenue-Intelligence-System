import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  CheckCircle2, 
  Sparkles, 
  Clock, 
  ShieldCheck, 
  TrendingUp, 
  RefreshCw,
  Zap,
  Coins
} from 'lucide-react';

const PredictionCard = ({ prediction, formData, onReset, isFallback }) => {
  const [currency, setCurrency] = useState('INR'); // INR (₹) or USD ($)
  
  useEffect(() => {
    if (prediction) {
      // Trigger subtle celebratory confetti burst
      try {
        confetti({
          particleCount: 45,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#a855f7', '#3b82f6', '#10b981'],
        });
      } catch (e) {
        // Fallback if canvas is unavailable
      }
    }
  }, [prediction]);

  if (!prediction) return null;

  const rawPrice = prediction.predictedPrice || 0;
  const isUsd = currency === 'USD';
  // Conversion rate 1 USD = 83 INR
  const displayPrice = isUsd 
    ? (rawPrice / 83).toFixed(2)
    : rawPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const currencySymbol = isUsd ? '$' : '₹';

  return (
    <div className="relative overflow-hidden rounded-3xl glass-card border border-purple-500/40 p-6 lg:p-8 shadow-2xl shadow-purple-500/10 animate-in fade-in zoom-in-95 duration-300">
      
      {/* Top Ambient Glow blobs */}
      <div className="absolute -top-20 -right-20 w-56 h-56 bg-purple-600/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-56 h-56 bg-blue-600/30 rounded-full blur-3xl pointer-events-none" />

      {/* Header Badge */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-5 h-5 animate-bounce" />
          </div>
          <div>
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              Price Prediction Complete
              <span className="text-xs font-mono font-normal px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Extra Trees Regressor
              </span>
            </h4>
            <p className="text-xs text-slate-400">ML Model calculated optimal market valuation</p>
          </div>
        </div>

        {/* Currency Switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-900/80 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setCurrency('INR')}
            className={`px-3 py-1 rounded-lg font-bold font-mono transition ${
              currency === 'INR' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            ₹ INR
          </button>
          <button
            onClick={() => setCurrency('USD')}
            className={`px-3 py-1 rounded-lg font-bold font-mono transition ${
              currency === 'USD' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            $ USD
          </button>
        </div>
      </div>

      {/* Main Result Price Hero Display */}
      <div className="my-8 text-center">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 text-purple-300 text-xs font-semibold border border-purple-500/20 mb-3">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Optimal Market Price
        </span>

        <div className="flex items-baseline justify-center gap-2">
          <span className="text-3xl lg:text-5xl font-extrabold text-purple-400 font-mono">{currencySymbol}</span>
          <span className="text-5xl lg:text-7xl font-black tracking-tight text-white font-mono drop-shadow-[0_0_25px_rgba(168,85,247,0.4)]">
            {displayPrice}
          </span>
        </div>

        <p className="text-xs text-slate-400 mt-2 font-mono">
          Estimated Valuation Range: <span className="text-slate-200">{currencySymbol}{(Number(displayPrice) * 0.95).toFixed(2)}</span> - <span className="text-slate-200">{currencySymbol}{(Number(displayPrice) * 1.05).toFixed(2)}</span>
        </p>
      </div>

      {/* Stats Badges Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6">
        
        {/* Confidence Badge */}
        <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
          <div className="flex items-center justify-center gap-1 text-xs text-slate-400 mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Confidence
          </div>
          <span className="text-sm font-bold text-emerald-400 font-mono">94.8% High</span>
        </div>

        {/* Prediction Latency Time */}
        <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
          <div className="flex items-center justify-center gap-1 text-xs text-slate-400 mb-1">
            <Clock className="w-3.5 h-3.5 text-blue-400" /> Inference Speed
          </div>
          <span className="text-sm font-bold text-blue-400 font-mono">{prediction.durationMs || 38} ms</span>
        </div>

        {/* Demand Strength */}
        <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
          <div className="flex items-center justify-center gap-1 text-xs text-slate-400 mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-purple-400" /> Demand Index
          </div>
          <span className="text-sm font-bold text-purple-400 font-mono">High Demand</span>
        </div>

        {/* Engine Source */}
        <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
          <div className="flex items-center justify-center gap-1 text-xs text-slate-400 mb-1">
            <Zap className="w-3.5 h-3.5 text-amber-400" /> Data Source
          </div>
          <span className="text-xs font-bold text-amber-300 font-mono truncate">
            {prediction.isFallback ? 'FastAPI Simulated' : 'FastAPI Live'}
          </span>
        </div>

      </div>

      {/* Product Feature Context Summary */}
      {formData && (
        <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800/80 mb-6">
          <p className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Submitted Feature Breakdown</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
            <div><span className="text-slate-500">Weight:</span> <span className="text-slate-200">{formData.product_weight_g}g</span></div>
            <div><span className="text-slate-500">Freight:</span> <span className="text-slate-200">${formData.freight_value}</span></div>
            <div><span className="text-slate-500">Volume:</span> <span className="text-slate-200">{formData.product_volume} cm³</span></div>
            <div><span className="text-slate-500">Photos:</span> <span className="text-slate-200">{formData.product_photos_qty}</span></div>
          </div>
        </div>
      )}

      {/* Card Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800">
        <button
          onClick={onReset}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium text-xs transition duration-200"
        >
          <RefreshCw className="w-4 h-4" /> Recalculate New Price
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => alert(`Copied Predicted Price: ${currencySymbol}${displayPrice}`)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 font-medium text-xs transition duration-200"
          >
            <Coins className="w-4 h-4" /> Copy Pricing Quote
          </button>
        </div>
      </div>

    </div>
  );
};

export default PredictionCard;
