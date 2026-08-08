import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getDatabaseStatus, requestOTP, verifyOTP, resetPasswordWithOTP } from '../services/api';
import {
  Plane, Eye, EyeOff, Lock, User, Mail, Sparkles, CheckCircle2,
  AlertCircle, ShieldCheck, Database, Cpu, ArrowRight, Sun, Moon,
  UserPlus, LogIn, Key, RefreshCw, X, Phone, Clock, Send, ShieldAlert
} from 'lucide-react';

const LoginPage = () => {
  const { login, register, theme, toggleTheme } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('login'); // 'login' or 'register'

  // Login Form States
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // Register Form States
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  // Status & Notification Banners
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [typingText, setTypingText] = useState('');

  // Forgot Password & OTP States
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [otpStep, setOtpStep] = useState(1); // 1: Request, 2: Verify, 3: Reset, 4: Success
  const [otpIdentifier, setOtpIdentifier] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpNewPassword, setOtpNewPassword] = useState('');
  const [otpConfirmPassword, setOtpConfirmPassword] = useState('');
  const [otpTimer, setOtpTimer] = useState(300); // 5 mins in seconds
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');

  // PostgreSQL Status Card State
  const [dbMetrics, setDbMetrics] = useState({
    connected: true,
    status: 'Operational',
    database_name: 'pricepilot',
    host: 'localhost',
    port: 5432,
    pool_status: 'Connection Pool Active',
    active_connections: 1
  });
  const [checkingDb, setCheckingDb] = useState(false);

  const fullText = "Enterprise AI Powered Dynamic Pricing & Demand Intelligence";

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      setTypingText(fullText.substring(0, index));
      index++;
      if (index > fullText.length) clearInterval(interval);
    }, 35);
    return () => clearInterval(interval);
  }, []);

  // OTP Countdown Timer
  useEffect(() => {
    let timerId;
    if (showForgotModal && otpStep === 2 && otpTimer > 0) {
      timerId = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timerId);
  }, [showForgotModal, otpStep, otpTimer]);

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const checkPostgresHealth = async () => {
    setCheckingDb(true);
    const data = await getDatabaseStatus();
    if (data) setDbMetrics(data);
    setCheckingDb(false);
  };

  useEffect(() => {
    checkPostgresHealth();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMsg('Please enter both username/email and password.');
      return;
    }

    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    const result = await login(username, password);
    setLoading(false);

    if (result.success) {
      toast.success(`Welcome back, ${result.user?.name || result.user?.username || 'User'}!`);
      navigate('/dashboard');
    } else {
      setErrorMsg(result.error || 'Invalid credentials or account pending admin approval.');
      toast.error(result.error || 'Login failed.');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!regName.trim() || !regUsername.trim() || !regEmail.trim() || !regPassword.trim()) {
      setErrorMsg('Please fill in all required registration fields.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMsg('Passwords do not match. Please re-enter your password.');
      return;
    }

    if (regPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    const result = await register({
      name: regName,
      email: regEmail,
      username: regUsername,
      password: regPassword,
      phone_number: regPhone,
    });

    setLoading(false);

    if (result.success) {
      if (result.user && result.user.role === 'Admin') {
        toast.success('Admin account created! Redirecting to dashboard...');
        navigate('/dashboard');
      } else {
        toast.success(result.message || 'Registration submitted! Awaiting administrator approval.');
        setSuccessMsg(result.message || 'Account registered successfully! Awaiting administrator approval before your first login.');
        setRegName('');
        setRegEmail('');
        setRegUsername('');
        setRegPhone('');
        setRegPassword('');
        setRegConfirmPassword('');
        setActiveTab('login');
      }
    } else {
      setErrorMsg(result.error || 'Registration failed. Username or email may already be taken.');
      toast.error(result.error || 'Registration failed.');
    }
  };

  // Forgot Password Handlers
  const handleRequestOTP = async (e) => {
    e.preventDefault();
    if (!otpIdentifier.trim()) {
      setOtpError('Please enter your registered Email Address or Phone Number.');
      return;
    }

    setOtpError('');
    setOtpLoading(true);

    try {
      const res = await requestOTP(otpIdentifier.trim());
      setOtpLoading(false);
      setOtpStep(2);
      setOtpTimer(300);
      toast.success(res.message || `Verification code sent to ${otpIdentifier.trim()}! Please check your inbox/SMS.`);
    } catch (err) {
      setOtpLoading(false);
      const errorMsg = err.response?.data?.detail || 'Failed to send OTP. Please verify email/phone or server service configuration.';
      setOtpError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otpCode.trim() || otpCode.trim().length !== 6) {
      setOtpError('Please enter the 6-digit OTP code.');
      return;
    }

    setOtpError('');
    setOtpLoading(true);

    try {
      await verifyOTP(otpIdentifier.trim(), otpCode.trim());
      setOtpLoading(false);
      setOtpStep(3);
      toast.success('OTP code verified successfully!');
    } catch (err) {
      setOtpLoading(false);
      setOtpError(err.response?.data?.detail || 'Invalid or expired OTP code.');
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!otpNewPassword || otpNewPassword.length < 6) {
      setOtpError('New password must be at least 6 characters long.');
      return;
    }

    if (otpNewPassword !== otpConfirmPassword) {
      setOtpError('New passwords do not match.');
      return;
    }

    setOtpError('');
    setOtpLoading(true);

    try {
      await resetPasswordWithOTP(otpIdentifier.trim(), otpCode.trim(), otpNewPassword);
      setOtpLoading(false);
      setOtpStep(4);
      toast.success('Password updated successfully! You can now log in.');
      setTimeout(() => {
        setShowForgotModal(false);
        setOtpStep(1);
        setOtpIdentifier('');
        setOtpCode('');
        setOtpNewPassword('');
        setOtpConfirmPassword('');
        setUsername(otpIdentifier);
        setPassword(otpNewPassword);
        setActiveTab('login');
      }, 2000);
    } catch (err) {
      setOtpLoading(false);
      setOtpError(err.response?.data?.detail || 'Failed to reset password.');
    }
  };

  const fillDemoCredentials = (roleType) => {
    setErrorMsg('');
    setSuccessMsg('');
    if (roleType === 'admin') {
      setUsername('admin');
      setPassword('admin123');
      toast.info('Autofilled Administrator Credentials (admin / admin123)');
    } else {
      setUsername('viewer');
      setPassword('viewer123');
      toast.info('Autofilled Standard User Credentials (viewer / viewer123)');
    }
    setActiveTab('login');
  };

  return (
    <div className="min-h-screen w-full bg-[#070B14] text-slate-100 flex items-center justify-center p-4 lg:p-8 relative overflow-hidden font-sans">
      
      {/* Ambient Particle Background Glows */}
      <div className="absolute top-1/4 left-1/4 -mt-32 -ml-32 w-96 h-96 bg-gradient-to-br from-blue-600/15 via-indigo-600/10 to-purple-600/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 -mb-32 -mr-32 w-96 h-96 bg-gradient-to-tr from-purple-600/15 via-pink-600/10 to-blue-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container Grid */}
      <div className="relative z-10 w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left Column: Branding, Product Highlights & PostgreSQL Live Monitor */}
        <div className="lg:col-span-7 space-y-6 text-left">
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-xl border border-white/20">
              <Plane className="w-6 h-6 transform -rotate-45" />
            </div>
            <div>
              <span className="text-3xl font-black tracking-tight text-white">
                Price<span className="gradient-text">Pilot AI</span>
              </span>
              <span className="ml-2 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Enterprise v2.0
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight leading-tight">
              Predictive Pricing & AI Demand Intelligence Engine
            </h1>
            <p className="text-xs text-purple-300 font-mono h-6 flex items-center">
              {typingText}<span className="animate-pulse">|</span>
            </p>
          </div>

          {/* Quick Feature Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-[#111827]/80 border border-[#1F2937] space-y-1">
              <Cpu className="w-4 h-4 text-purple-400" />
              <p className="text-xs font-bold text-white">Extra Trees Regressor</p>
              <p className="text-[10px] text-slate-400 font-mono">R² Score: 0.6742</p>
            </div>
            <div className="p-3 rounded-xl bg-[#111827]/80 border border-[#1F2937] space-y-1">
              <Database className="w-4 h-4 text-blue-400" />
              <p className="text-xs font-bold text-white">PostgreSQL Storage</p>
              <p className="text-[10px] text-slate-400 font-mono">112K Training Rows</p>
            </div>
            <div className="p-3 rounded-xl bg-[#111827]/80 border border-[#1F2937] space-y-1 col-span-2 sm:col-span-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <p className="text-xs font-bold text-white">Role Security & OTP</p>
              <p className="text-[10px] text-slate-400 font-mono">JWT + Bcrypt Auth</p>
            </div>
          </div>

          {/* PostgreSQL Database Health Monitor Card */}
          <div className="p-4 rounded-[18px] glass-card space-y-3">
            <div className="flex items-center justify-between border-b border-[#1F2937] pb-2">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <Database className="w-4 h-4 text-blue-400" /> PostgreSQL Infrastructure Monitor
              </div>
              <button
                onClick={checkPostgresHealth}
                disabled={checkingDb}
                className="text-[11px] font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${checkingDb ? 'animate-spin' : ''}`} /> Refresh
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[11px]">
              <div className="p-2 rounded-xl bg-slate-900/60 border border-[#1F2937]">
                <p className="text-slate-500 text-[9px] uppercase font-mono">Status</p>
                <p className="font-bold text-emerald-400 flex items-center justify-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> {dbMetrics.status}
                </p>
              </div>
              <div className="p-2 rounded-xl bg-slate-900/60 border border-[#1F2937]">
                <p className="text-slate-500 text-[9px] uppercase font-mono">Database</p>
                <p className="font-bold text-white font-mono">{dbMetrics.database_name}</p>
              </div>
              <div className="p-2 rounded-xl bg-slate-900/60 border border-[#1F2937]">
                <p className="text-slate-500 text-[9px] uppercase font-mono">Host:Port</p>
                <p className="font-bold text-slate-300 font-mono">{dbMetrics.host}:{dbMetrics.port}</p>
              </div>
              <div className="p-2 rounded-xl bg-slate-900/60 border border-[#1F2937]">
                <p className="text-slate-500 text-[9px] uppercase font-mono">Pool Connections</p>
                <p className="font-bold text-purple-300 font-mono">Active: {dbMetrics.active_connections}</p>
              </div>
            </div>
          </div>

          {/* Quick Demo Credential Buttons */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold text-slate-400">Quick Demo Login:</span>
            <button
              onClick={() => fillDemoCredentials('admin')}
              className="px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold transition flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5" /> Admin (admin)
            </button>
            <button
              onClick={() => fillDemoCredentials('user')}
              className="px-3 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-bold transition flex items-center gap-1.5"
            >
              <User className="w-3.5 h-3.5" /> Standard User (viewer)
            </button>
          </div>

        </div>

        {/* Right Column: Authentication Card (Login / Register Tabs) */}
        <div className="lg:col-span-5 w-full">
          <div className="glass-card rounded-[22px] p-6 lg:p-8 space-y-6 shadow-2xl border border-[#1F2937] relative">
            
            {/* Header Theme Toggle & Tab Switcher */}
            <div className="flex items-center justify-between pb-3 border-b border-[#1F2937]">
              <div className="flex items-center gap-2 bg-slate-900/80 p-1 rounded-xl border border-[#1F2937]">
                <button
                  onClick={() => { setActiveTab('login'); setErrorMsg(''); setSuccessMsg(''); }}
                  className={`px-4 py-1.5 rounded-lg text-xs font-extrabold transition ${
                    activeTab === 'login'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => { setActiveTab('register'); setErrorMsg(''); setSuccessMsg(''); }}
                  className={`px-4 py-1.5 rounded-lg text-xs font-extrabold transition ${
                    activeTab === 'register'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Register
                </button>
              </div>

              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl bg-slate-900/80 text-slate-400 hover:text-white border border-[#1F2937] transition"
                title="Toggle Theme"
              >
                {theme === 'light' ? <Moon className="w-4 h-4 text-purple-400" /> : <Sun className="w-4 h-4 text-amber-400" />}
              </button>
            </div>

            {/* Error Message Banner */}
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-medium flex items-start gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Success Message Banner */}
            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium flex items-start gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* LOGIN FORM */}
            {activeTab === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-4 text-left">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Username or Email</label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="admin or user@pricepilot.ai"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-xs text-white"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-300">Password</label>
                    <button
                      type="button"
                      onClick={() => { setShowForgotModal(true); setOtpStep(1); setOtpError(''); }}
                      className="text-xs text-purple-400 hover:text-purple-300 font-semibold"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl glass-input text-xs text-white"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded bg-slate-900 border-[#1F2937] text-purple-600 focus:ring-purple-500"
                    />
                    <span>Remember this session</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-extrabold text-xs shadow-xl shadow-purple-500/25 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" /> Sign In to PricePilot AI
                    </>
                  )}
                </button>
              </form>
            ) : (

              /* REGISTER FORM */
              <form onSubmit={handleRegister} className="space-y-3.5 text-left">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full px-3.5 py-2 rounded-xl glass-input text-xs text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="user@pricepilot.ai"
                    className="w-full px-3.5 py-2 rounded-xl glass-input text-xs text-white"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Username</label>
                    <input
                      type="text"
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      placeholder="username"
                      className="w-full px-3.5 py-2 rounded-xl glass-input text-xs font-mono text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number (Optional)</label>
                    <input
                      type="text"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="w-full px-3.5 py-2 rounded-xl glass-input text-xs text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
                    <input
                      type="password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2 rounded-xl glass-input text-xs text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Confirm Password</label>
                    <input
                      type="password"
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2 rounded-xl glass-input text-xs text-white"
                      required
                    />
                  </div>
                </div>

                <p className="text-[10px] text-slate-400">
                  <ShieldAlert className="w-3 h-3 inline text-amber-400 mr-1" />
                  New account registrations require Administrator Approval before access is granted.
                </p>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-extrabold text-xs shadow-xl shadow-purple-500/25 transition disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" /> Register New Account
                    </>
                  )}
                </button>
              </form>
            )}

          </div>
        </div>

      </div>

      {/* FORGOT PASSWORD & OTP RECOVERY MODAL */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-[#070b14]/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-[#1F2937] rounded-[20px] p-6 max-w-md w-full shadow-2xl space-y-5 text-xs text-left relative animate-in fade-in">
            
            <div className="flex items-center justify-between border-b border-[#1F2937] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Account Password Recovery</h4>
                  <p className="text-[10px] text-slate-400">Step {otpStep} of 3 • Secure OTP Verification</p>
                </div>
              </div>
              <button onClick={() => setShowForgotModal(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {otpError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" /> {otpError}
              </div>
            )}

            {/* STEP 1: Enter Email or Phone */}
            {otpStep === 1 && (
              <form onSubmit={handleRequestOTP} className="space-y-4">
                <p className="text-slate-300 leading-relaxed">
                  Enter your registered <strong className="text-white">Email Address</strong> or <strong className="text-white">Phone Number</strong>. We will generate and send a 6-digit OTP code.
                </p>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email or Phone Number</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                    <input
                      type="text"
                      value={otpIdentifier}
                      onChange={(e) => setOtpIdentifier(e.target.value)}
                      placeholder="admin@pricepilot.ai or +1 (555) 000-0000"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-xs text-white"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={otpLoading}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-extrabold text-xs shadow-lg transition flex items-center justify-center gap-2"
                >
                  {otpLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Send className="w-4 h-4" /> Generate & Send OTP Code</>}
                </button>
              </form>
            )}

            {/* STEP 2: Verify 6-Digit OTP */}
            {otpStep === 2 && (
              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span>Enter OTP sent to <strong className="text-white">{otpIdentifier}</strong>:</span>
                  <span className="font-mono text-purple-400 font-bold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Expires: {formatTimer(otpTimer)}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">6-Digit Verification Code</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 6-digit code"
                    className="w-full px-4 py-3 rounded-xl glass-input text-center text-lg font-mono tracking-widest text-white"
                    required
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={handleRequestOTP}
                    disabled={otpTimer > 240}
                    className="text-xs text-purple-400 hover:text-purple-300 font-semibold disabled:opacity-50"
                  >
                    Resend OTP Code
                  </button>
                  <button
                    type="submit"
                    disabled={otpLoading || otpCode.length !== 6}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-extrabold text-xs shadow-lg transition flex items-center gap-2"
                  >
                    {otpLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Verify Code'}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: Reset Password */}
            {otpStep === 3 && (
              <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                <p className="text-slate-300">Enter your new password below for account <strong className="text-white">{otpIdentifier}</strong>:</p>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">New Password</label>
                  <input
                    type="password"
                    value={otpNewPassword}
                    onChange={(e) => setOtpNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Confirm New Password</label>
                  <input
                    type="password"
                    value={otpConfirmPassword}
                    onChange={(e) => setOtpConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-white"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={otpLoading}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-extrabold text-xs shadow-lg transition flex items-center justify-center gap-2"
                >
                  {otpLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><CheckCircle2 className="w-4 h-4" /> Reset Password Now</>}
                </button>
              </form>
            )}

            {/* STEP 4: Success Animation */}
            {otpStep === 4 && (
              <div className="py-6 text-center space-y-3 animate-in zoom-in-95">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
                  <CheckCircle2 className="w-8 h-8 animate-bounce" />
                </div>
                <h4 className="text-base font-bold text-white">Password Updated Successfully!</h4>
                <p className="text-xs text-slate-300">Redirecting to Login screen...</p>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};

export default LoginPage;
