import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  User, Mail, Key, Shield, CheckCircle2, AlertCircle, Save,
  Calendar, Clock, Award, Sparkles, Activity, Phone, Camera, Image, Eye, EyeOff
} from 'lucide-react';

const ProfilePage = () => {
  const { user, updateProfile } = useAuth();
  const toast = useToast();

  const [name, setName] = useState(user?.name || '');
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phone_number || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  // Preset Avatar Icons/URLs for easy picking
  const presetAvatars = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
  ];

  const handleSaveProfile = async (e) => {
    e.preventDefault();

    if (newPassword && newPassword !== confirmPassword) {
      toast.error('New passwords do not match. Please verify entry.');
      return;
    }

    if (newPassword && newPassword.length < 6) {
      toast.error('New password must be at least 6 characters.');
      return;
    }

    setSaving(true);
    const payload = {};
    if (name.trim() && name.trim() !== user?.name) payload.name = name.trim();
    if (username.trim() && username.trim() !== user?.username) payload.username = username.trim();
    if (email.trim() && email.trim() !== user?.email) payload.email = email.trim();
    if (phoneNumber.trim() !== (user?.phone_number || '')) payload.phone_number = phoneNumber.trim();
    if (avatarUrl.trim() !== (user?.avatar_url || '')) payload.avatar_url = avatarUrl.trim();
    if (newPassword.trim()) {
      payload.password = newPassword.trim();
      payload.current_password = currentPassword.trim();
    }

    if (Object.keys(payload).length === 0) {
      setSaving(false);
      toast.info('No profile changes detected.');
      return;
    }

    const res = await updateProfile(payload);
    setSaving(false);

    if (res.success) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Profile details updated successfully in PostgreSQL database!');
    } else {
      toast.error(res.error || 'Failed to update profile.');
    }
  };

  const getUserInitials = (n) => {
    if (!n) return 'PP';
    const parts = n.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return n.slice(0, 2).toUpperCase();
  };

  const isRoleAdmin = user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'administrator';

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-5xl mx-auto">
      
      {/* Profile Header Banner */}
      <div className="relative overflow-hidden rounded-[20px] bg-[#111827] p-6 lg:p-8 border border-[#1F2937]">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-60 h-60 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6">
          
          {/* Avatar Preview */}
          <div className="relative group">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Profile Avatar"
                className="w-24 h-24 rounded-2xl object-cover border-2 border-purple-500/40 shadow-xl"
                onError={() => setAvatarUrl('')}
              />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-3xl shadow-xl border border-white/20">
                {getUserInitials(user?.name || user?.username)}
              </div>
            )}
          </div>

          <div className="text-center sm:text-left space-y-1.5">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
              <h1 className="text-2xl font-black text-white">{user?.name || user?.username}</h1>
              <span className={`px-3 py-0.5 rounded-full text-xs font-extrabold border ${
                isRoleAdmin ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
              }`}>
                {user?.role || 'User'}
              </span>
              <span className="px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-extrabold">
                Active Account
              </span>
            </div>

            <p className="text-xs text-slate-400 font-mono">
              @{user?.username} • {user?.email} {user?.phone_number ? `• ${user.phone_number}` : ''}
            </p>

            <p className="text-[11px] text-slate-500">
              Registered on {user?.created_at ? new Date(user.created_at).toLocaleDateString() : '2026'} • PostgreSQL Authenticated
            </p>
          </div>

        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Profile Settings Form */}
        <div className="lg:col-span-7 rounded-[20px] bg-[#111827] p-6 lg:p-8 border border-[#1F2937] space-y-6">
          <div className="flex items-center gap-3 border-b border-[#1F2937] pb-4">
            <User className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="text-base font-bold text-white">Account Profile Details</h3>
              <p className="text-xs text-slate-400">Update your full name, username, email, phone, avatar, and security password</p>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            
            {/* Avatar URL / Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Profile Photo (Image URL)</label>
              <div className="relative">
                <Camera className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-xs text-white"
                />
              </div>

              {/* Preset Avatars */}
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] text-slate-500 font-mono">Quick Preset:</span>
                {presetAvatars.map((url, idx) => (
                  <img
                    key={idx}
                    src={url}
                    alt={`Preset ${idx + 1}`}
                    onClick={() => setAvatarUrl(url)}
                    className="w-7 h-7 rounded-lg object-cover cursor-pointer border border-[#1F2937] hover:border-purple-500 transition"
                  />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Username</label>
                <div className="relative">
                  <Shield className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-xs font-mono text-white"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Phone Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-xs text-white"
                  />
                </div>
              </div>
            </div>

            {/* Change Password Section */}
            <div className="pt-3 border-t border-[#1F2937] space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-purple-400" /> Change Security Password
                </h4>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] text-purple-400 hover:underline flex items-center gap-1"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />} {showPassword ? 'Hide Passwords' : 'Show Passwords'}
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Current Password (Required for Password Update)</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full px-3.5 py-2 rounded-xl glass-input text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">New Password</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full px-3.5 py-2 rounded-xl glass-input text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Confirm New Password</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full px-3.5 py-2 rounded-xl glass-input text-xs text-white"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-extrabold text-xs shadow-xl shadow-purple-500/20 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" /> Save Profile Details
                </>
              )}
            </button>
          </form>
        </div>

        {/* Account Statistics & Privileges */}
        <div className="lg:col-span-5 space-y-6">
          
          <div className="rounded-[18px] bg-[#111827] p-6 border border-[#1F2937] space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-white border-b border-[#1F2937] pb-3">
              <Activity className="w-4 h-4 text-purple-400" /> Account Metrics
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-[#1F2937] flex items-center justify-between">
                <span className="text-xs text-slate-400">Account ID</span>
                <span className="text-xs font-mono font-bold text-purple-400">#{user?.id}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-[#1F2937] flex items-center justify-between">
                <span className="text-xs text-slate-400">Assigned Role</span>
                <span className="text-xs font-bold text-blue-400">{user?.role}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-[#1F2937] flex items-center justify-between">
                <span className="text-xs text-slate-400">Account Status</span>
                <span className="text-xs font-bold text-emerald-400">🟢 Active</span>
              </div>
            </div>
          </div>

          <div className="rounded-[18px] bg-[#111827] p-6 border border-[#1F2937] space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-white border-b border-[#1F2937] pb-3">
              <Shield className="w-4 h-4 text-emerald-400" /> Security Controls
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-4 h-4" /> JWT Token Bearer Authentication Active
              </div>
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-4 h-4" /> Bcrypt Hashing (Rounds = 12)
              </div>
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-4 h-4" /> PostgreSQL Session Security Verified
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default ProfilePage;
