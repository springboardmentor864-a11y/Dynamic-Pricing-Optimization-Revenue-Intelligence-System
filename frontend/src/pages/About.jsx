import React from 'react';
import { Layers, Cpu, AlertCircle, CheckCircle, Database, Sparkles } from 'lucide-react';

const About = () => {
  return (
    <div className="space-y-6 animate-fadeIn max-w-5xl mx-auto pb-12 select-none">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-white font-outfit uppercase">About PricePilot AI</h1>
        <p className="desc-text mt-1 text-xs">Discover the problem statement, ML models, system architecture, and tech stack details.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Problem Statement */}
        <div className="glass-card p-5 space-y-3 rounded-[24px] flex flex-col justify-between h-48">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[#da4e24] font-bold uppercase tracking-wider text-[10px] font-outfit">
              <AlertCircle className="w-4.5 h-4.5" /> Problem Statement
            </div>
            <p className="text-xs text-[#B8BCC8]/85 leading-relaxed font-semibold">
              E-commerce platforms experience high pricing friction due to dynamic logistics. Static base prices fail to capture maximum margins.
            </p>
          </div>
          <span className="text-[9px] text-[#B8BCC8]/40 font-bold uppercase tracking-widest font-mono">Retail Challenge</span>
        </div>

        {/* Card 2: The Solution */}
        <div className="glass-card p-5 space-y-3 rounded-[24px] flex flex-col justify-between h-48">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[#0098f3] font-bold uppercase tracking-wider text-[10px] font-outfit">
              <CheckCircle className="w-4.5 h-4.5" /> The Solution
            </div>
            <p className="text-xs text-[#B8BCC8]/85 leading-relaxed font-semibold">
              Deploy a machine learning regressor engine that matches historical Brazil Olist transaction specs to predict optimal price metrics.
            </p>
          </div>
          <span className="text-[9px] text-[#B8BCC8]/40 font-bold uppercase tracking-widest font-mono">ML Optimization</span>
        </div>

        {/* Card 3: System Architecture */}
        <div className="glass-card p-5 space-y-3 rounded-[24px] flex flex-col justify-between h-48">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[#2ED47A] font-bold uppercase tracking-wider text-[10px] font-outfit">
              <Layers className="w-4.5 h-4.5" /> System Architecture
            </div>
            <p className="text-xs text-[#B8BCC8]/85 leading-relaxed font-semibold">
              SOC-2 compliant workspace structure built with a python FastAPI backend and asynchronous Uvicorn routing servers.
            </p>
          </div>
          <span className="text-[9px] text-[#B8BCC8]/40 font-bold uppercase tracking-widest font-mono">SOC-2 Shield</span>
        </div>

        {/* Card 4: Active ML Models */}
        <div className="glass-card p-5 space-y-3 rounded-[24px] flex flex-col justify-between h-48">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[#FFB300] font-bold uppercase tracking-wider text-[10px] font-outfit">
              <Cpu className="w-4.5 h-4.5" /> Active ML Models
            </div>
            <p className="text-xs text-[#B8BCC8]/85 leading-relaxed font-semibold">
              XGBoost and Random Forest algorithms are compiled to solve regression coefficients weights and safety stocking limits.
            </p>
          </div>
          <span className="text-[9px] text-[#B8BCC8]/40 font-bold uppercase tracking-widest font-mono">Champion Regressors</span>
        </div>

        {/* Card 5: Database Stack */}
        <div className="glass-card p-5 space-y-3 rounded-[24px] flex flex-col justify-between h-48">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[#da4e24] font-bold uppercase tracking-wider text-[10px] font-outfit">
              <Database className="w-4.5 h-4.5" /> Database Stack
            </div>
            <p className="text-xs text-[#B8BCC8]/85 leading-relaxed font-semibold">
              PostgreSQL failover database coupled with an embedded SQLite demo database driver to manage catalog records.
            </p>
          </div>
          <span className="text-[9px] text-[#B8BCC8]/40 font-bold uppercase tracking-widest font-mono">Storage Layer</span>
        </div>

        {/* Card 6: Gemini AI Engine */}
        <div className="glass-card p-5 space-y-3 rounded-[24px] flex flex-col justify-between h-48">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[#0098f3] font-bold uppercase tracking-wider text-[10px] font-outfit">
              <Sparkles className="w-4.5 h-4.5" /> Gemini AI Engine
            </div>
            <p className="text-xs text-[#B8BCC8]/85 leading-relaxed font-semibold">
              Direct integration with Google Gemini AI models to synthesize BI dashboards, strategy reports, and market recommendations.
            </p>
          </div>
          <span className="text-[9px] text-[#B8BCC8]/40 font-bold uppercase tracking-widest font-mono">Cognitive API</span>
        </div>

      </div>

    </div>
  );
};

export default About;
