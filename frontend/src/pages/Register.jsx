import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Cpu, Mail, Lock, ShieldCheck, AlertCircle, User } from 'lucide-react';
import { motion } from 'framer-motion';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password || !fullName) {
      setError('Please provide all registration details.');
      return;
    }

    setLoading(true);
    setError(null);

    // Dynamic processing delay for enterprise security feel
    await new Promise(resolve => setTimeout(resolve, 1000));

    const result = await register(email, password, fullName);
    setLoading(false);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error || 'Registration failed. Please check parameters.');
    }
  };

  return (
    <div className="min-h-screen w-screen bg-[#000000] flex items-center justify-center relative overflow-hidden p-8 select-none font-sans">
      {/* Background Lights */}
      <div className="glow-blob-1 w-[55vw] h-[55vw] -top-[15%] -left-[15%] opacity-35 animate-fluidGlow1" />
      <div className="glow-blob-2 w-[50vw] h-[50vw] -bottom-[20%] -right-[20%] opacity-25 animate-fluidGlow2" />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-lg rounded-[24px] border border-white/[0.06] bg-[#0d0d0d]/70 backdrop-blur-[30px] shadow-[0_24px_64px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.06)] overflow-hidden z-10 p-10 md:p-12 space-y-6"
      >
        {/* Header Logo */}
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
          <h2 className="text-[28px] font-black text-white tracking-tight font-outfit leading-tight font-semibold">Self-Registration</h2>
          <p className="text-[12px] text-[#B8BCC8]/70 leading-relaxed font-semibold">Create your secure user account to access price optimization telemetry.</p>
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

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-[#B8BCC8]/60 uppercase tracking-widest block font-outfit">Full Name</label>
            <div className="relative">
              <User className="w-4.5 h-4.5 text-[#B8BCC8]/40 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white/[0.03] border border-white/[0.08] focus:border-[#da4e24] text-white rounded-xl text-xs outline-none transition-all focus:bg-white/[0.06] placeholder-[#B8BCC8]/30 font-medium"
                required
              />
            </div>
          </div>

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
            <label className="text-[10px] font-bold text-[#B8BCC8]/60 uppercase tracking-widest block font-outfit">Security Password</label>
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

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-tr from-[#da4e24] to-[#0098f3] hover:opacity-95 text-white font-extrabold text-xs transition-all shadow-[0_4px_20px_rgba(124,92,255,0.35)] flex items-center justify-center gap-2.5 outline-none disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest font-outfit"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Creating profile...</span>
              </>
            ) : (
              <span>Register Account</span>
            )}
          </button>
        </form>

        <div className="pt-5 border-t border-white/[0.06] space-y-4 text-center">
          <div className="text-[11px] text-[#B8BCC8]/50 font-bold uppercase tracking-wider">
            Already have an account? <button type="button" onClick={() => navigate('/login')} className="text-[#da4e24] hover:underline font-extrabold">Sign In</button>
          </div>
          <div className="flex items-center justify-center gap-2 text-[10px] text-[#B8BCC8]/50 font-bold uppercase tracking-widest pt-2 border-t border-white/[0.04]">
            <ShieldCheck className="w-4 h-4 text-[#2ED47A]" />
            <span>SOC-2 Certified Registration Pipeline</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
