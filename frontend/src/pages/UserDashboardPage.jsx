import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  User, Mail, Shield, Key, CheckCircle2, AlertCircle,
  Zap, History, Sparkles, Clock, ArrowRight, Save
} from 'lucide-react';

const UserDashboardPage = ({ setActiveTab }) => {
  const { user, updateProfile } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  const handleUpdateProfile = async (e) => {
    e.preventDefault();

    if (password && password !== confirmPassword) {
      setMsg({ text: 'Passwords do not match.', type: 'error' });
      return;
    }

    setSaving(true);
    setMsg({ text: '', type: '' });

    const payload = {};
    if (name.trim() && name.trim() !== user?.name) payload.name = name.trim();
    if (email.trim() && email.trim() !== user?.email) payload.email = email.trim();
    if (password.trim()) payload.password = password.trim();

    if (Object.keys(payload).length === 0) {
      setSaving(false);
      setMsg({ text: 'No changes detected.', type: 'info' });
      return;
    }

    const res = await updateProfile(payload);
    setSaving(false);

    if (res.success) {
      setPassword('');
      setConfirmPassword('');
      setMsg({ text: 'Profile updated successfully!', type: 'success' });
      setTimeout(() => setMsg({ text: '', type: '' }), 4000);
    } else {
      setMsg({ text: res.error || 'Failed to update profile.', type: 'error' });
    }
  };

  const personalActivities = [
    { id: 1, action: 'Logged in to User Portal', time: 'Just now' },
    { id: 2, action: 'Ran Extra Trees Price Prediction for Electronics', time: '2 hours ago' },
    { id: 3, action: 'Exported Prediction History Report (PDF)', time: 'Yesterday' }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Welcome Card */}
      <div className="relative overflow-hidden rounded-3xl glass-card p-6 lg:p-8 border border-blue-500/30 bg-gradient-to-r from-slate-900 via-indigo-950/60 to-purple-950/40">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" /> User Portal Dashboard
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Welcome Back, <span className="gradient-text">{user?.name || user?.username}</span>
            </h1>
            <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
              View your personalized pricing predictions, manage your account profile credentials, and access machine learning pricing tools.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setActiveTab && setActiveTab('prediction')}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-xl shadow-blue-500/20 transition hover:scale-105"
            >
              <Zap className="w-4 h-4" /> Run New Prediction
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Profile Card & Edit Form */}
        <div className="lg:col-span-7 rounded-3xl glass-card p-6 lg:p-8 border border-slate-800 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Personal Profile Details</h3>
                <p className="text-xs text-slate-400">Edit your display name, email, and password</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-mono font-semibold border border-slate-700">
              Role: {user?.role || 'User'}
            </span>
          </div>

          {msg.text && (
            <div className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 border ${
              msg.type === 'success'
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                : msg.type === 'info'
                ? 'bg-blue-500/15 border-blue-500/30 text-blue-300'
                : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
            }`}>
              {msg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{msg.text}</span>
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Username (Read-Only)</label>
              <div className="relative">
                <Shield className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                <input
                  type="text"
                  value={user?.username || ''}
                  disabled
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-400 text-xs font-mono cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-xs text-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-xs text-white"
                  required
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">New Password (Optional)</label>
                <div className="relative">
                  <Key className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Leave blank to keep current"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Confirm New Password</label>
                <div className="relative">
                  <Key className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-xs text-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-500/20 transition disabled:opacity-50"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4" /> Save Profile Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Personal Activity & Account Overview */}
        <div className="lg:col-span-5 space-y-6">
          
          <div className="rounded-3xl glass-card p-6 border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-white border-b border-slate-800 pb-3">
              <History className="w-4 h-4 text-purple-400" /> Personal Recent Activities
            </div>

            <div className="space-y-3">
              {personalActivities.map((act) => (
                <div key={act.id} className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-purple-400" />
                    <span className="text-slate-200 font-medium">{act.action}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">{act.time}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl glass-card p-6 border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-white border-b border-slate-800 pb-3">
              <Shield className="w-4 h-4 text-emerald-400" /> Access Privileges
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-4 h-4" /> Access Price Prediction Tool
              </div>
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-4 h-4" /> View Personal Dashboard & History
              </div>
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-4 h-4" /> Update Personal Credentials
              </div>
              <div className="flex items-center gap-2 text-slate-500 line-through">
                <AlertCircle className="w-4 h-4" /> Admin Console & User Management (Restricted)
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default UserDashboardPage;
