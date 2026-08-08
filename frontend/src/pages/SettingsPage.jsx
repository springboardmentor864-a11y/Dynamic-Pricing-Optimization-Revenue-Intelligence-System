import React, { useState } from 'react';
import { useToast } from '../context/ToastContext';
import { Settings, Server, Globe, Save, CheckCircle2, ShieldAlert, Cpu, Lock } from 'lucide-react';

const SettingsPage = () => {
  const toast = useToast();

  const [apiUrl, setApiUrl] = useState('http://localhost:8000');
  const [selectedModel, setSelectedModel] = useState('Extra Trees');
  const [defaultCurrency, setDefaultCurrency] = useState('INR');
  const [autoVolume, setAutoVolume] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleSave = (e) => {
    e.preventDefault();
    toast.success('System settings & configuration saved successfully!');
  };

  const handleResetCache = () => {
    if (window.confirm('Are you sure you want to clear system cache?')) {
      localStorage.removeItem('pricepilot_history');
      toast.info('System cache & local history cleared.');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="pb-4 border-b border-[#1F2937]">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold mb-2">
          <Settings className="w-3.5 h-3.5 text-purple-400" /> System Preferences
        </div>
        <h1 className="text-2xl lg:text-3xl font-extrabold text-white">
          Dashboard <span className="gradient-text">Settings & Configuration</span>
        </h1>
        <p className="text-xs text-slate-400">
          Manage backend connection URLs, ML model parameters, currency formatting, and security policies.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Backend API Configuration */}
        <div className="rounded-[18px] bg-[#111827] p-6 lg:p-8 border border-[#1F2937] space-y-4">
          <div className="flex items-center gap-2 text-base font-bold text-white border-b border-[#1F2937] pb-3">
            <Server className="w-5 h-5 text-purple-400" /> FastAPI Backend Connection
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">FastAPI Server URL</label>
              <input
                type="url"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs font-mono"
              />
              <p className="text-[11px] text-slate-500 mt-1">Default local REST endpoint: http://localhost:8000</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Preferred Machine Learning Model</label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs bg-[#111827] text-white"
              >
                <option value="Extra Trees">Extra Trees Regressor (Recommended - R² 0.6742)</option>
                <option value="Random Forest">Random Forest Regressor (R² 0.6312)</option>
                <option value="CatBoost">CatBoost Regressor (R² 0.5925)</option>
                <option value="XGBoost">XGBoost Regressor (R² 0.5857)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Display & Calculation Preferences */}
        <div className="rounded-[18px] bg-[#111827] p-6 lg:p-8 border border-[#1F2937] space-y-4">
          <div className="flex items-center gap-2 text-base font-bold text-white border-b border-[#1F2937] pb-3">
            <Globe className="w-5 h-5 text-blue-400" /> Valuation & Display Options
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Default Currency Format</label>
              <select
                value={defaultCurrency}
                onChange={(e) => setDefaultCurrency(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs bg-[#111827] text-white font-mono"
              >
                <option value="INR">₹ Indian Rupee (INR)</option>
                <option value="USD">$ US Dollar (USD)</option>
              </select>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/60 border border-[#1F2937]">
              <div>
                <p className="text-xs font-bold text-slate-200">Auto-Calculate Product Volume</p>
                <p className="text-[11px] text-slate-500">Length × Height × Width cm³</p>
              </div>
              <button
                type="button"
                onClick={() => setAutoVolume(!autoVolume)}
                className={`w-12 h-6 rounded-full transition-colors p-1 ${autoVolume ? 'bg-purple-600' : 'bg-slate-700'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${autoVolume ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-xs shadow-xl shadow-purple-500/20 transition"
          >
            <Save className="w-4 h-4" /> Save Configuration
          </button>
        </div>

      </form>

      {/* Danger Zone */}
      <div className="rounded-[18px] bg-[#111827] p-6 border border-rose-500/30 space-y-4">
        <div className="flex items-center gap-2 text-base font-bold text-rose-400 border-b border-[#1F2937] pb-3">
          <ShieldAlert className="w-5 h-5 text-rose-500" /> Danger Zone
        </div>
        <p className="text-xs text-slate-400">
          Actions here perform administrative cache resets.
        </p>
        <button
          onClick={handleResetCache}
          className="px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold transition"
        >
          Clear Local Application Cache
        </button>
      </div>

    </div>
  );
};

export default SettingsPage;
