import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertOctagon, RefreshCw, Home, ArrowLeft } from 'lucide-react';

const ServerErrorPage = ({ message = 'Internal Server Error (500)', onRetry }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full rounded-[18px] bg-[#111827] border border-rose-500/30 p-8 text-center space-y-5 shadow-2xl animate-in fade-in duration-300">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto shadow-inner">
          <AlertOctagon className="w-8 h-8" />
        </div>

        <div className="space-y-1.5">
          <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-mono font-bold border border-rose-500/30">
            HTTP 500
          </span>
          <h2 className="text-xl font-extrabold text-white pt-2">Server Error Encountered</h2>
          <p className="text-xs text-slate-400 leading-relaxed">{message}</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
          <button
            onClick={() => onRetry ? onRetry() : window.location.reload()}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg transition flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Retry Request
          </button>

          <button
            onClick={() => navigate('/dashboard')}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-[#1F2937] transition flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" /> Return to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServerErrorPage;
