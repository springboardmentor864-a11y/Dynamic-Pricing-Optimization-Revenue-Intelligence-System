import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plane, Bell, Calendar, Clock, User, Menu, X, CheckCircle2,
  TrendingUp, Cpu, Sparkles, Wifi, WifiOff, LogOut, ShieldCheck,
  Search, Settings, HelpCircle, Sun, Moon, Lock
} from 'lucide-react';
import { useClock } from '../hooks/useClock';
import { useAuth } from '../context/AuthContext';

const Header = ({ isMobileMenuOpen, setIsMobileMenuOpen, isBackendConnected }) => {
  const { user, logout, theme, toggleTheme } = useAuth();
  const { formattedTime, formattedDate } = useClock();
  const navigate = useNavigate();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Helper to color-code user roles dynamically
  const getRoleBadgeStyle = (role) => {
    const r = role?.toLowerCase() || '';
    if (r === 'admin' || r === 'administrator') {
      return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
    }
    return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
  };

  const notifications = [
    {
      id: 1,
      title: 'Extra Trees Model Active',
      desc: 'Achieved top R² score of 0.6742 across 112k dataset samples.',
      time: '10m ago',
      unread: true,
      icon: Sparkles,
      color: 'text-purple-400',
    },
    {
      id: 2,
      title: 'New High Price Forecast',
      desc: 'Predicted optimal pricing for Luxury Electronics item (₹6,735.00).',
      time: '1h ago',
      unread: true,
      icon: TrendingUp,
      color: 'text-blue-400',
    },
    {
      id: 3,
      title: 'PostgreSQL Health Normal',
      desc: 'PostgreSQL database connected & operational.',
      time: '3h ago',
      unread: false,
      icon: Cpu,
      color: 'text-emerald-400',
    },
  ];

  const unreadCount = notifications.filter((n) => n.unread).length;

  const getUserInitials = (name) => {
    if (!name) return 'PP';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const isLight = theme === 'light';

  return (
    <header className="sticky top-0 z-30 w-full glass-card border-b border-[#1F2937] px-4 lg:px-8 py-3 backdrop-blur-xl transition-colors duration-300">
      <div className="flex items-center justify-between gap-4">

        {/* Left Section: Mobile Menu Toggle & Brand Logo */}
        <div className="flex items-center gap-3 lg:gap-4">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-xl transition"
            aria-label="Toggle Menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          <div 
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-3 group cursor-pointer"
          >
            <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-all duration-300 border border-white/20">
              <Plane className="w-5 h-5 text-white transform -rotate-45" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight text-white font-sans">
                  Price<span className="gradient-text">Pilot AI</span>
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <Sparkles className="w-2.5 h-2.5" /> v2.0
                </span>
              </div>
              <p className="hidden md:block text-[11px] text-slate-400 font-medium">
                Enterprise Dynamic Pricing Platform
              </p>
            </div>
          </div>
        </div>

        {/* Middle Section: Global Search Bar */}
        <div className="hidden md:flex items-center max-w-md w-full relative">
          <Search className="w-4 h-4 absolute left-3.5 text-slate-500 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search predictions, products, features... (Ctrl+K)"
            className="w-full pl-10 pr-4 py-2 rounded-xl text-xs glass-input focus:ring-1 focus:ring-purple-500 text-slate-200 placeholder-slate-500"
          />
        </div>

        {/* Right Section: Time, Notifications, Connection & User Profile */}
        <div className="flex items-center gap-3 lg:gap-4">

          {/* Backend Connection Indicator */}
          <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-[#1F2937] text-xs">
            {isBackendConnected !== false ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-slate-300 font-mono text-[11px]">FastAPI Live</span>
              </>
            ) : (
              <>
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-slate-400 font-mono text-[11px]">Connecting...</span>
              </>
            )}
          </div>

          {/* Date & Time Widget */}
          <div className="hidden lg:flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-slate-900/80 border border-[#1F2937] text-xs font-mono text-slate-300">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              <span>{formattedDate}</span>
            </div>
            <div className="h-3 w-px bg-slate-700" />
            <div className="flex items-center gap-1.5 text-purple-300 font-semibold">
              <Clock className="w-3.5 h-3.5 text-purple-400" />
              <span>{formattedTime}</span>
            </div>
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-[#1F2937] transition"
            title="Toggle Light / Dark Mode"
          >
            {isLight ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-400" />}
          </button>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowProfileMenu(false);
              }}
              className="relative p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-[#1F2937] transition"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500" />
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-[18px] bg-[#111827] border border-[#1F2937] shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-center justify-between pb-3 border-b border-[#1F2937]">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-purple-400" />
                    <h4 className="font-bold text-sm text-white">Notifications</h4>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  <button className="text-xs text-purple-400 hover:text-purple-300 font-semibold transition">
                    Mark all read
                  </button>
                </div>

                <div className="mt-3 space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {notifications.map((n) => {
                    const IconComp = n.icon;
                    return (
                      <div
                        key={n.id}
                        className={`p-3 rounded-xl border transition ${n.unread
                          ? 'bg-slate-800/80 border-purple-500/30'
                          : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-800/50'
                          }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg bg-slate-900 ${n.color}`}>
                            <IconComp className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h5 className="text-xs font-semibold text-slate-200">{n.title}</h5>
                              <span className="text-[10px] text-slate-500 font-mono">{n.time}</span>
                            </div>
                            <p className="text-xs text-slate-400 mt-1 leading-relaxed">{n.desc}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* User Profile & Role Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowProfileMenu(!showProfileMenu);
                setShowNotifications(false);
              }}
              className="flex items-center gap-3 p-1.5 pl-2.5 rounded-2xl bg-slate-800/60 hover:bg-slate-800 border border-[#1F2937] transition duration-200"
            >
              <div className="hidden sm:block text-right">
                <div className="text-xs font-bold text-white leading-tight">
                  {user?.name || user?.username || 'Infosys User'}
                </div>
                <div className="flex items-center justify-end gap-1 mt-0.5">
                  <span className={`text-[10px] font-extrabold px-2 py-0.2 rounded-full border ${getRoleBadgeStyle(user?.role)}`}>
                    {user?.role || 'User'}
                  </span>
                </div>
              </div>
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-600 flex items-center justify-center text-white font-extrabold text-xs shadow-md border border-white/20">
                  {getUserInitials(user?.name || user?.username)}
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#070b14]" />
              </div>
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-3 w-56 rounded-[18px] bg-[#111827] border border-[#1F2937] shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-3 border-b border-[#1F2937]">
                  <p className="text-xs font-bold text-white truncate">
                    {user?.name || user?.username || 'PricePilot User'}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate">{user?.email || 'user@pricepilot.ai'}</p>
                </div>

                <div className="py-1 space-y-0.5">
                  <button
                    onClick={() => { setShowProfileMenu(false); navigate('/profile'); }}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 rounded-xl transition flex items-center gap-2"
                  >
                    <User className="w-4 h-4 text-blue-400" /> My Profile
                  </button>

                  <button
                    onClick={() => { setShowProfileMenu(false); navigate('/settings'); }}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 rounded-xl transition flex items-center gap-2"
                  >
                    <Settings className="w-4 h-4 text-purple-400" /> Settings
                  </button>

                  <button
                    onClick={() => { setShowProfileMenu(false); navigate('/about'); }}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 rounded-xl transition flex items-center gap-2"
                  >
                    <HelpCircle className="w-4 h-4 text-emerald-400" /> Help & Info
                  </button>

                  <div className="my-1 border-t border-[#1F2937]" />

                  {logout && (
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        logout();
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-bold text-rose-400 hover:bg-rose-500/10 rounded-xl transition flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" /> Log Out
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};

export default Header;