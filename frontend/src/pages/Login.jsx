import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Cpu, Mail, Lock, ShieldCheck, AlertCircle, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Login = () => {
  const { login, loginAsGuest } = useAuth();
  const navigate = useNavigate();

  const [showSplash, setShowSplash] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Show splash screen for 2.2 seconds for visionOS experience feel
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2200);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    setLoading(true);
    setError(null);

    // Dynamic delay for corporate security feeling (1.2 seconds)
    await new Promise(resolve => setTimeout(resolve, 1200));

    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error || 'Invalid credentials or connection error.');
    }
  };

  const handleAdminQuickLogin = async () => {
    setEmail('admin@pricepilot.ai');
    setPassword('admin');
    setLoading(true);
    setError(null);
    await new Promise(resolve => setTimeout(resolve, 800));
    const result = await login('admin@pricepilot.ai', 'admin');
    setLoading(false);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error || 'Admin login failed.');
    }
  };

  const handleDemoQuickLogin = async () => {
    setEmail('demo@pricepilot.ai');
    setPassword('demo');
    setLoading(true);
    setError(null);
    await new Promise(resolve => setTimeout(resolve, 800));
    const result = await login('demo@pricepilot.ai', 'demo');
    setLoading(false);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error || 'Demo login failed.');
    }
  };

  const handleGuestAccess = () => {
    loginAsGuest();
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen w-screen bg-[#000000] flex items-center justify-center relative overflow-hidden p-8 select-none font-sans">
      {/* Background Animated Ambient Lights */}
      <div className="glow-blob-1 w-[55vw] h-[55vw] -top-[15%] -left-[15%] opacity-35 animate-fluidGlow1" />
      <div className="glow-blob-2 w-[50vw] h-[50vw] -bottom-[20%] -right-[20%] opacity-25 animate-fluidGlow2" />
      <div className="absolute top-[30%] left-[25%] w-[30vw] h-[30vw] bg-[#da4e24]/8 blur-[120px] rounded-full pointer-events-none" />

      <AnimatePresence mode="wait">
        {showSplash ? (
          <motion.div
            key="splash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 bg-[#000000] flex flex-col items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center gap-6"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#da4e24] to-[#0098f3] flex items-center justify-center text-white shadow-[0_0_40px_rgba(124,92,255,0.4)]">
                <Cpu className="w-8 h-8 animate-pulse" />
              </div>
              <div className="text-center space-y-2">
                <h1 className="text-2xl font-black tracking-[0.2em] text-white font-outfit uppercase">PRICEPILOT AI</h1>
                <p className="text-[10px] tracking-[0.3em] text-[#B8BCC8]/60 font-bold uppercase font-outfit">REVENUE INTELLIGENCE OPERATING SYSTEM</p>
              </div>
              <div className="mt-8 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#da4e24] animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#0098f3] animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#da4e24] animate-bounce" />
              </div>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="login"
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 rounded-[24px] border border-white/[0.06] bg-[#0d0d0d]/70 backdrop-blur-[30px] shadow-[0_24px_64px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.06)] overflow-hidden z-10"
          >
            {/* Left Form Viewport */}
            <div className="p-10 md:p-12 flex flex-col justify-between space-y-8">
              <div className="space-y-6">
                {/* Logo */}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#da4e24] to-[#0098f3] flex items-center justify-center text-white font-extrabold shadow-[0_0_16px_rgba(124,92,255,0.3)]">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-extrabold tracking-wider text-xs text-white font-outfit block">PRICEPILOT AI</span>
                    <span className="text-[8px] text-[#B8BCC8]/50 block uppercase tracking-widest font-bold font-outfit">SaaS Platform</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h2 className="text-[28px] font-black text-white tracking-tight font-outfit leading-tight font-semibold">Access Command Center</h2>
                  <p className="text-[14px] text-[#B8BCC8]/70 leading-relaxed">Enter secure enterprise credentials to access active models and price optimizations.</p>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-[#FF5D73]/10 border border-[#FF5D73]/20 text-[#FF5D73] text-xs rounded-xl flex items-center gap-2.5 font-semibold"
                  >
                    <AlertCircle className="w-4.5 h-4.5 shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}

                {/* Input Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[#B8BCC8]/60 uppercase tracking-widest block font-outfit">Corporate Email</label>
                    <div className="relative">
                      <Mail className="w-4.5 h-4.5 text-[#B8BCC8]/40 absolute left-3.5 top-3.5" />
                      <input
                        type="email"
                        placeholder="name@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-white/[0.03] border border-white/[0.08] focus:border-[#da4e24] text-white rounded-xl text-xs outline-none transition-all focus:bg-white/[0.06] placeholder-[#B8BCC8]/30 font-medium"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-[#B8BCC8]/60 uppercase tracking-widest block font-outfit">Security Password</label>
                      <button type="button" onClick={() => navigate('/forgot-password')} className="text-[10px] text-[#da4e24] hover:text-[#0098f3] font-bold uppercase tracking-wider transition-colors">Forgot Password?</button>
                    </div>
                    <div className="relative">
                      <Lock className="w-4.5 h-4.5 text-[#B8BCC8]/40 absolute left-3.5 top-3.5" />
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-white/[0.03] border border-white/[0.08] focus:border-[#da4e24] text-white rounded-xl text-xs outline-none transition-all focus:bg-white/[0.06] placeholder-[#B8BCC8]/30 font-medium"
                        required
                      />
                    </div>
                  </div>

                  {/* Remember me */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <label className="flex items-center gap-2.5 text-[#B8BCC8]/90 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded border-white/[0.08] bg-white/[0.03] text-[#da4e24] focus:ring-0 w-4 h-4 transition-colors animate-none"
                      />
                      <span className="font-semibold text-[12px] text-[#B8BCC8]/80">Remember session details</span>
                    </label>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-tr from-[#da4e24] to-[#0098f3] hover:opacity-95 text-white font-extrabold text-xs transition-all shadow-[0_4px_20px_rgba(124,92,255,0.35)] flex items-center justify-center gap-2.5 outline-none disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest font-outfit"
                  >
                    {loading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Validating credentials...</span>
                      </>
                    ) : (
                      <>
                        <span>Sign In Securely</span>
                      </>
                    )}
                  </button>
                </form>
              </div>

              <div className="pt-5 border-t border-white/[0.06] space-y-4">
                {/* Quick Fill Access Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={handleAdminQuickLogin}
                    disabled={loading}
                    className="py-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.08] text-white text-xs font-bold transition-all flex items-center justify-center gap-2 uppercase tracking-wider outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ShieldCheck className="w-4 h-4 text-[#da4e24]" />
                    <span>Admin Login</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDemoQuickLogin}
                    disabled={loading}
                    className="py-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.08] text-white text-xs font-bold transition-all flex items-center justify-center gap-2 uppercase tracking-wider outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Cpu className="w-4.5 h-4.5 text-[#0098f3]" />
                    <span>Demo Login</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleGuestAccess}
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.08] text-[#FFFFFF] text-xs font-bold transition-all flex items-center justify-center gap-2.5 uppercase tracking-wider outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Sparkles className="w-4 h-4 text-[#0098f3]" />
                  <span>Continue as Guest</span>
                </button>

                <div className="flex justify-between text-[10px] text-[#B8BCC8]/50 font-bold uppercase tracking-wider pt-2">
                  <span>Don't have an account? <button type="button" onClick={() => navigate('/register')} className="text-[#da4e24] hover:underline font-extrabold">Register</button></span>
                </div>

                <div className="flex items-center justify-center gap-2 text-[10px] text-[#B8BCC8]/50 font-bold uppercase tracking-widest pt-2 border-t border-white/[0.04]">
                  <ShieldCheck className="w-4.5 h-4.5 text-[#2ED47A]" />
                  <span>AES-256 Cloud Session Protection</span>
                </div>
              </div>
            </div>

            {/* Right Illustration Dashboard Viewport */}
            <div className="hidden md:flex flex-col justify-between p-12 bg-white/[0.01] border-l border-white/[0.06] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-60 h-60 bg-[#da4e24]/10 rounded-full blur-[100px] pointer-events-none" />
              
              <div className="space-y-3 relative z-10">
                <span className="px-2.5 py-1 rounded bg-[#da4e24]/10 border border-[#da4e24]/20 text-[#da4e24] font-extrabold text-[9px] uppercase tracking-widest font-outfit">
                  Enterprise Suite v3.0.0
                </span>
                <h3 className="text-xl font-bold text-white tracking-tight font-outfit pt-1">PricePilot Pricing Intelligence</h3>
                <p className="text-[13px] text-[#B8BCC8]/70 leading-relaxed font-semibold">
                  Provision dynamic pricing models, predictive margin adjustments, 90-day time-series projections, and automatic catalog solvers.
                </p>
              </div>

              {/* Simple Clean Matte Graph Illustration */}
              <div className="my-8 p-5 rounded-2xl bg-[#000000]/65 border border-white/[0.06] space-y-4 relative z-10 shadow-2xl backdrop-blur-md">
                <div className="flex items-center justify-between text-[9px] text-[#B8BCC8]/50 font-bold uppercase tracking-widest font-outfit">
                  <span>Model Leaderboard</span>
                  <span>R² Score</span>
                </div>
                <div className="space-y-3.5">
                  {[
                    { name: 'Extra Trees', val: '82.3%', w: 'w-[82.3%]', color: 'bg-gradient-to-r from-[#da4e24] to-[#0098f3]' },
                    { name: 'Random Forest', val: '78.5%', w: 'w-[78.5%]', color: 'bg-white/[0.05] border border-white/[0.08]' },
                    { name: 'XGBoost', val: '74.6%', w: 'w-[74.6%]', color: 'bg-white/[0.05] border border-white/[0.08]' }
                  ].map((m, i) => (
                    <div key={i} className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <span className="text-[#B8BCC8]">{m.name}</span>
                        <span className="text-white">{m.val}</span>
                      </div>
                      <div className="h-1.5 bg-[#000000] rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${m.color} ${m.w}`} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-[10px] text-[#B8BCC8]/40 leading-relaxed relative z-10 font-bold uppercase tracking-widest">
                SOC-2 Compliant. Access logs registered dynamically inside security auditing databases.
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Login;
