import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Cpu, ShieldCheck, Zap, Layers, BarChart3, HelpCircle, Info, LogIn } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const Landing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleLaunch = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen w-screen bg-[#000000] text-white overflow-y-auto selection:bg-[#da4e24]/30 select-none font-sans relative pb-16">
      {/* Immersive background ambient elements */}
      <div className="glow-blob-1 w-[60vw] h-[60vw] -top-[20%] -left-[15%] opacity-35 animate-fluidGlow1" />
      <div className="glow-blob-2 w-[55vw] h-[55vw] bottom-0 -right-[15%] opacity-20 animate-fluidGlow2" />
      
      {/* Top Navigation Header */}
      <header className="max-w-7xl mx-auto h-20 px-6 flex items-center justify-between border-b border-white/[0.06] relative z-20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#da4e24] to-[#0098f3] flex items-center justify-center text-white font-extrabold shadow-[0_0_16px_rgba(124,92,255,0.3)]">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold tracking-wider text-xs text-white font-outfit block">PRICEPILOT AI</span>
            <span className="text-[8px] text-[#B8BCC8]/50 block uppercase tracking-widest font-bold font-outfit">SaaS Platform</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <button 
            onClick={handleLaunch}
            className="px-4.5 py-2 bg-gradient-to-tr from-[#da4e24] to-[#0098f3] hover:opacity-95 text-white font-bold text-xs rounded-xl shadow-[0_4px_16px_rgba(124,92,255,0.3)] transition-all flex items-center gap-2 outline-none uppercase tracking-wider font-outfit"
          >
            <LogIn className="w-3.5 h-3.5" /> Launch Console
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-16 md:pt-24 text-center space-y-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-4"
        >
          <span className="px-3 py-1 rounded bg-[#da4e24]/10 border border-[#da4e24]/20 text-[#da4e24] font-extrabold text-[10px] uppercase tracking-widest font-outfit inline-block">
            PricePilot AI
          </span>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight text-white font-outfit max-w-4xl mx-auto uppercase">
            Dynamic Pricing & Revenue Intelligence operating system
          </h1>
          <p className="text-sm md:text-base text-[#B8BCC8]/75 max-w-2xl mx-auto leading-relaxed font-semibold">
            Deploy machine learning regressors, automate target inventory safety buffers, and evaluate predictive margins in real-time.
          </p>
        </motion.div>

        <div className="pt-4 flex items-center justify-center gap-4">
          <button
            onClick={handleLaunch}
            className="px-6 py-3.5 bg-gradient-to-tr from-[#da4e24] to-[#0098f3] hover:opacity-95 text-white font-black text-xs rounded-xl shadow-[0_4px_24px_rgba(124,92,255,0.4)] transition-all flex items-center gap-2 outline-none uppercase tracking-widest font-outfit"
          >
            Launch Command Center
          </button>
        </div>
      </section>

      {/* Key Features Grid */}
      <section className="max-w-7xl mx-auto px-6 pt-24 grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
        <div className="glass-card p-6 space-y-3">
          <div className="p-3 bg-[#da4e24]/10 border border-[#da4e24]/20 text-[#da4e24] w-fit rounded-xl">
            <Zap className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white uppercase tracking-widest font-outfit">Predictive Regressors</h3>
          <p className="text-xs text-[#B8BCC8]/70 leading-relaxed font-semibold">
            Fits XGBoost, Random Forest, Decision Tree, and Linear Regression models to historical transactions under constraints.
          </p>
        </div>

        <div className="glass-card p-6 space-y-3">
          <div className="p-3 bg-[#0098f3]/10 border border-[#0098f3]/20 text-[#0098f3] w-fit rounded-xl">
            <BarChart3 className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white uppercase tracking-widest font-outfit">Time-Series Forecast</h3>
          <p className="text-xs text-[#B8BCC8]/70 leading-relaxed font-semibold">
            Calculates 90-day demand trajectories and suggests safety stock inventory sizes to minimize stockouts.
          </p>
        </div>

        <div className="glass-card p-6 space-y-3">
          <div className="p-3 bg-[#2ED47A]/10 border border-[#2ED47A]/20 text-[#2ED47A] w-fit rounded-xl">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white uppercase tracking-widest font-outfit">Enterprise Security</h3>
          <p className="text-xs text-[#B8BCC8]/70 leading-relaxed font-semibold">
            Secures endpoint access via local authorization, password hashing pipelines, and role-based policies (RBAC).
          </p>
        </div>
      </section>

      {/* Technology Stack */}
      <section className="max-w-7xl mx-auto px-6 pt-24 space-y-8 relative z-10">
        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold uppercase tracking-widest text-white font-outfit">Advanced Technology Stack</h2>
          <p className="text-xs text-[#B8BCC8]/60 font-bold uppercase tracking-widest">Enterprise engineering tools aligned for scaling</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: 'FastAPI (Python)', desc: 'High-performance API endpoints, asynchronous middleware log pipelines.' },
            { label: 'React (JS/Vite)', desc: 'Tailwind CSS, dynamic glassmorphic card layouts, responsive gauges.' },
            { label: 'PostgreSQL & SQLite', desc: 'Secure parameterization, transactional rollbacks, automatic local fallback.' },
            { label: 'Google Gemini', desc: 'Synthesizes financial data dashboard metrics, logs strategies.' }
          ].map((tech, idx) => (
            <div key={idx} className="p-5 bg-white/[0.01] border border-white/[0.06] rounded-2xl text-center space-y-2">
              <span className="text-xs font-bold text-white block font-outfit uppercase">{tech.label}</span>
              <p className="text-[11px] text-[#B8BCC8]/70 leading-relaxed font-semibold">{tech.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Corporate Certification SOC-2 */}
      <footer className="max-w-7xl mx-auto px-6 pt-24 text-center text-[10px] text-[#B8BCC8]/40 uppercase tracking-widest relative z-10 flex items-center justify-center gap-2">
        <ShieldCheck className="w-4 h-4 text-[#2ED47A]" />
        <span>PricePilot AI. All rights reserved.</span>
      </footer>
    </div>
  );
};

export default Landing;
