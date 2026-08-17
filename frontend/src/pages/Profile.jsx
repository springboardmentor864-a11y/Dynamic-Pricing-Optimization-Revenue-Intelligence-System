import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Mail, Briefcase, Calendar, Clock, User, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';

const Profile = () => {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <div className="space-y-8 animate-fadeIn max-w-4xl mx-auto p-4">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white font-outfit uppercase">User Profile</h1>
          <p className="desc-text mt-1">Manage active enterprise security parameters, session persistence logs, and RBAC tiers.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">
        
        {/* Left Column: Avatar & Main Identity Card */}
        <div className="md:col-span-4 glass-card p-6 flex flex-col items-center justify-between text-center relative overflow-hidden">
          <div className="absolute -right-12 -top-12 w-24 h-24 bg-[#da4e24]/15 blur-2xl rounded-full pointer-events-none" />
          
          <div className="space-y-4 flex flex-col items-center">
            <div className="relative w-28 h-28 rounded-full p-1 bg-gradient-to-tr from-[#da4e24] to-[#0098f3] shrink-0 shadow-lg">
              <img
                src={user.profile_image || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80"}
                alt={user.full_name}
                className="w-full h-full rounded-full object-cover border-2 border-[#0d0d0d]"
              />
            </div>
            
            <div className="space-y-1">
              <h2 className="text-lg font-black text-white font-outfit leading-tight">{user.full_name}</h2>
              <span className="px-2.5 py-0.5 rounded bg-[#da4e24]/10 border border-[#da4e24]/20 text-[#da4e24] font-extrabold text-[9px] uppercase tracking-widest font-outfit inline-block">
                {user.role || 'User'}
              </span>
            </div>
          </div>

          <div className="w-full pt-6 mt-6 border-t border-white/[0.06]">
            <button
              onClick={logout}
              className="w-full py-3 rounded-xl bg-[#FF5D73]/10 hover:bg-[#FF5D73]/15 border border-[#FF5D73]/20 text-[#FF5D73] text-xs font-bold transition-all flex items-center justify-center gap-2 uppercase tracking-wider font-outfit"
            >
              <LogOut className="w-4 h-4" />
              <span>Secure Sign Out</span>
            </button>
          </div>
        </div>

        {/* Right Column: Detailed parameters */}
        <div className="md:col-span-8 glass-card p-6 space-y-6">
          <h3 className="text-xs font-bold text-white uppercase tracking-widest block font-outfit border-b border-white/[0.06] pb-2 w-full flex items-center gap-2">
            <ShieldCheck className="w-4.5 h-4.5 text-[#2ED47A]" /> Corporate IAM Attributes
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-[#B8BCC8]">
                <User className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-[#B8BCC8]/40 uppercase tracking-widest block font-outfit">Display Name</span>
                <span className="text-xs font-bold text-white font-outfit">{user.full_name}</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-[#B8BCC8]">
                <Mail className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-[#B8BCC8]/40 uppercase tracking-widest block font-outfit">Corporate Email</span>
                <span className="text-xs font-bold text-white font-outfit">{user.email}</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-[#B8BCC8]">
                <Briefcase className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-[#B8BCC8]/40 uppercase tracking-widest block font-outfit">Department Assignment</span>
                <span className="text-xs font-bold text-white font-outfit">{user.department || 'Operations Management'}</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-[#B8BCC8]">
                <Calendar className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-[#B8BCC8]/40 uppercase tracking-widest block font-outfit">Provisioning Date</span>
                <span className="text-xs font-bold text-white font-outfit">
                  {user.created_date ? new Date(user.created_date).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 md:col-span-2">
              <div className="p-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-[#B8BCC8]">
                <Clock className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-[#B8BCC8]/40 uppercase tracking-widest block font-outfit">Last Authenticated Session Timestamp</span>
                <span className="text-xs font-bold text-white font-outfit">
                  {user.last_login ? new Date(user.last_login).toLocaleString() : 'N/A'}
                </span>
              </div>
            </div>

          </div>

          <div className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl text-[10px] font-semibold text-[#B8BCC8]/60 leading-relaxed font-outfit">
            ℹ️ Security Notice: Your user account is bound to **Role-Based Access Control (RBAC)** filters. Attempting to request admin operations (e.g. system user mutations or database updates) without credentials will trigger automated threat block logs.
          </div>
        </div>

      </div>
    </div>
  );
};

export default Profile;
