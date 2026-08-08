import React from 'react';
import { useNavigate } from 'react-router-dom';
import { HelpCircle, LayoutDashboard, ArrowLeft } from 'lucide-react';

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6 relative overflow-hidden font-sans">
      
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 bg-slate-900/80 backdrop-blur-2xl border border-slate-800 rounded-3xl p-8 lg:p-12 max-w-lg text-center shadow-2xl space-y-6">
        
        <div className="w-20 h-20 bg-purple-500/10 rounded-2xl border border-purple-500/30 flex items-center justify-center mx-auto text-purple-400 text-3xl shadow-xl">
          <HelpCircle className="w-10 h-10 text-purple-400" />
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-mono font-bold tracking-widest uppercase">
            404 Not Found
          </span>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Page Not Found
          </h1>
          <p className="text-xs text-slate-300 leading-relaxed">
            The route or resource you requested does not exist on PricePilot AI Enterprise Platform.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-500/20 transition flex items-center justify-center gap-2"
          >
            <LayoutDashboard className="w-4 h-4" /> Go to Dashboard
          </button>
          <button
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Go Back
          </button>
        </div>

      </div>

    </div>
  );
};

export default NotFoundPage;
