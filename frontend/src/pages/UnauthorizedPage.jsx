import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, ArrowLeft, LayoutDashboard, Lock } from 'lucide-react';

const UnauthorizedPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6 relative overflow-hidden font-sans">
      
      {/* Glow background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 bg-slate-900/80 backdrop-blur-2xl border border-red-500/30 rounded-3xl p-8 lg:p-12 max-w-lg text-center shadow-2xl space-y-6">
        
        <div className="w-20 h-20 bg-red-500/10 rounded-2xl border border-red-500/30 flex items-center justify-center mx-auto text-red-400 text-3xl shadow-xl">
          <ShieldAlert className="w-10 h-10 text-red-500 animate-pulse" />
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono font-bold tracking-widest uppercase">
            403 Access Denied
          </span>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Restricted Authorization
          </h1>
          <p className="text-xs text-slate-300 leading-relaxed">
            Your current account role (<span className="text-red-400 font-mono font-bold">{user?.role || 'User'}</span>) does not possess permission to access this module or administrative API.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs text-slate-400 text-left space-y-1.5 font-mono">
          <p><span className="text-slate-500">Required Role:</span> <span className="text-emerald-400 font-bold">Admin</span></p>
          <p><span className="text-slate-500">Your Account:</span> <span className="text-blue-300 font-bold">{user?.username || 'Guest'}</span> ({user?.role || 'User'})</p>
          <p><span className="text-slate-500">Security Policy:</span> <span className="text-slate-300">RBAC Token Enforcement</span></p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-600/20 transition flex items-center justify-center gap-2"
          >
            <LayoutDashboard className="w-4 h-4" /> Return to Dashboard
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

export default UnauthorizedPage;
