import React from 'react';
import { Heart, Sparkles } from 'lucide-react';

const Footer = ({ setActiveTab }) => {
  return (
    <footer className="mt-16 border-t border-slate-800/80 bg-slate-950/40 backdrop-blur-md py-8 px-4 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Left copyright notice as specified */}
        <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
          <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
          <span>© 2026 PricePilot AI | Infosys Springboard Project</span>
        </div>

        {/* Quick Nav Links */}
        <div className="flex items-center gap-6 text-xs text-slate-400">
          <button onClick={() => setActiveTab('dashboard')} className="hover:text-purple-400 transition">
            Dashboard
          </button>
          <button onClick={() => setActiveTab('prediction')} className="hover:text-purple-400 transition">
            Predict Price
          </button>
          <button onClick={() => setActiveTab('model-performance')} className="hover:text-purple-400 transition">
            Model Performance
          </button>
          <button onClick={() => setActiveTab('about')} className="hover:text-purple-400 transition">
            Developer Team
          </button>
        </div>

        {/* Right Developer team tag */}
        <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
          <span>Developed with</span>
          <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
          <span>by Narendar Reddy & Team</span>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
