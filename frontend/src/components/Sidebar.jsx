import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, DollarSign, LineChart, BarChart2, History,
  Database, FileText, Settings, CircleHelp, ChevronLeft, ChevronRight,
  Sparkles, Plane, User, Users, LogOut, ShieldAlert, Cpu
} from 'lucide-react';

const Sidebar = ({
  activeTab,
  setActiveTab,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  isCollapsed,
  setIsCollapsed
}) => {
  const { isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  // User Sidebar Navigation Items (Standard User - Non-Admin)
  const userMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { id: 'prediction', label: 'AI Price Predictor', icon: DollarSign, badge: 'ML', path: '/predict' },
    { id: 'history', label: 'Prediction History', icon: History, path: '/history' },
    { id: 'analytics', label: 'Analytics', icon: LineChart, path: '/analytics' },
    { id: 'models', label: 'ML Benchmarks', icon: BarChart2, path: '/models' },
    { id: 'profile', label: 'My Profile', icon: User, path: '/profile' },
    { id: 'about', label: 'Help & Docs', icon: CircleHelp, path: '/docs' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
  ];

  // Admin Sidebar Navigation Items (Administrator Privilege)
  const adminMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { id: 'user-management', label: 'User Management', icon: Users, badge: 'Approval', path: '/users' },
    { id: 'prediction', label: 'Pricing Engine', icon: DollarSign, badge: 'AI', path: '/predict' },
    { id: 'history', label: 'Prediction History', icon: History, path: '/history' },
    { id: 'analytics', label: 'System Analytics', icon: LineChart, path: '/analytics' },
    { id: 'models', label: 'ML Benchmarks', icon: BarChart2, badge: 'Extra Trees', path: '/models' },
    { id: 'dataset', label: 'Dataset Overview', icon: Database, badge: '112K', path: '/dataset' },
    { id: 'about', label: 'Help & Docs', icon: CircleHelp, path: '/docs' },
    { id: 'settings', label: 'Settings & DB', icon: Settings, path: '/settings' },
  ];

  const menuItems = isAdmin ? adminMenuItems : userMenuItems;

  const handleSelect = (item) => {
    if (setActiveTab) setActiveTab(item.id);
    if (item.path) navigate(item.path);
    if (isMobileMenuOpen) setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-[#070b14]/80 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:static top-0 left-0 bottom-0 z-40 bg-[#111827] border-r border-[#1F2937] flex flex-col justify-between transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-20' : 'w-64'
        } ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="p-4 space-y-6">

          {/* Logo & Sidebar Collapse Toggle */}
          <div className="flex items-center justify-between pb-2 border-b border-[#1F2937]">
            {!isCollapsed && (
              <div 
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2.5 cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md border border-white/20">
                  <Plane className="w-4 h-4 transform -rotate-45" />
                </div>
                <span className="font-extrabold text-sm text-white tracking-tight">
                  Price<span className="gradient-text">Pilot AI</span>
                </span>
              </div>
            )}

            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:flex p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-[#1F2937] transition mx-auto"
              title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Role Status Card (When expanded) */}
          {!isCollapsed && (
            <div className={`p-3 rounded-[14px] border transition ${
              isAdmin
                ? 'bg-gradient-to-r from-purple-900/30 to-indigo-900/30 border-purple-500/25'
                : 'bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border-blue-500/25'
            }`}>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-200 mb-1">
                <Sparkles className={`w-3.5 h-3.5 ${isAdmin ? 'text-purple-400' : 'text-blue-400'}`} /> 
                {isAdmin ? 'Admin Console' : 'User Portal'}
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                Model: <span className="text-emerald-400 font-bold">Extra Trees R² 0.6742</span>
              </p>
            </div>
          )}

          {/* Navigation Menu List */}
          <nav className="space-y-1.5">
            {!isCollapsed && (
              <p className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-2">
                {isAdmin ? 'Admin Menu' : 'User Menu'}
              </p>
            )}

            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  title={isCollapsed ? item.label : undefined}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-[12px] font-medium text-xs transition-all duration-200 group ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-lg shadow-purple-500/20 font-bold scale-[1.01]'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  } ${isCollapsed ? 'justify-center px-0' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-purple-400'}`} />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </div>

                  {!isCollapsed && item.badge && (
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                        isActive
                          ? 'bg-white/20 text-white border-white/30'
                          : item.badge === 'Admin'
                          ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                          : 'bg-slate-800 text-slate-400 border-[#1F2937]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer Info & Logout Button */}
        <div className="p-4 border-t border-[#1F2937] space-y-2">
          {!isCollapsed ? (
            <div className="space-y-2">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-[#1F2937] text-center">
                <p className="text-[11px] font-bold text-slate-300">Infosys Springboard 7.0</p>
                <p className="text-[10px] text-slate-500 mt-0.5">PostgreSQL • FastAPI • React</p>
              </div>

              {logout && (
                <button
                  onClick={logout}
                  className="w-full py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-bold transition flex items-center justify-center gap-2"
                >
                  <LogOut className="w-3.5 h-3.5" /> Logout
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={logout}
              className="w-8 h-8 mx-auto rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 flex items-center justify-center transition"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;