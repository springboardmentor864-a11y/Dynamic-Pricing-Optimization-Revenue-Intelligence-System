import React from 'react';
import { WifiOff, RefreshCw, Home } from 'lucide-react';

const OfflinePage = ({ onRetry }) => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full rounded-[18px] bg-[#111827] border border-amber-500/30 p-8 text-center space-y-5 shadow-2xl animate-in fade-in duration-300">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
          <WifiOff className="w-8 h-8" />
        </div>

        <div className="space-y-1.5">
          <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-mono font-bold border border-amber-500/30">
            FastAPI Disconnected
          </span>
          <h2 className="text-xl font-extrabold text-white pt-2">Connection Offline</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Unable to communicate with the local FastAPI backend server at <code className="font-mono text-purple-300">http://localhost:8000</code>.
          </p>
        </div>

        <div className="flex justify-center pt-2">
          <button
            onClick={() => onRetry ? onRetry() : window.location.reload()}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-500/20 transition flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Reconnect FastAPI
          </button>
        </div>
      </div>
    </div>
  );
};

export default OfflinePage;
