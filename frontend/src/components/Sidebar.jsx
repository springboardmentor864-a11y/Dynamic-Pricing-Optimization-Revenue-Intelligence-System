import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Database, Cpu, TrendingUp, DollarSign, 
  BarChart2, History, Settings, Users, LogOut, 
  ChevronLeft, ChevronRight, Briefcase, Info, HelpCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSystem } from '../context/SystemContext';

const Sidebar = ({ collapsed, toggleCollapse }) => {
  const { user, logout } = useAuth();
  const { unreadCount, workspace, setWorkspace } = useSystem();
  const navigate = useNavigate();
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);

  const workspaces = [
    'PricePilot AI',
    'Logistics Optimization',
    'Finance Intelligence'
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navGroups = [
    {
      title: 'Analytics & Models',
      items: [
        { path: '/dashboard', label: 'Command Center', icon: LayoutDashboard },
        { path: '/predictor', label: 'Price Predictor', icon: DollarSign },
        { path: '/forecasting', label: 'Demand Forecast', icon: TrendingUp },
        { path: '/explorer', label: 'Dataset Explorer', icon: Database },
      ]
    },
    {
      title: 'Pipelines & Performance',
      items: [
        { path: '/training', label: 'Train Models', icon: Cpu },
        { path: '/comparison', label: 'Model Benchmarks', icon: BarChart2 },
        { path: '/analytics', label: 'System Trends', icon: TrendingUp },
      ]
    },
    {
      title: 'Management',
      items: [
        { path: '/history', label: 'Prediction Audit', icon: History },
        { path: '/users', label: 'User Admin', icon: Users },
        { path: '/settings', label: 'System Settings', icon: Settings },
      ]
    },
    {
      title: 'Support & Info',
      items: [
        { path: '/about', label: 'About Project', icon: Info },
        { path: '/help', label: 'Help Center', icon: HelpCircle },
      ]
    }
  ];

  return (
    <motion.aside 
      animate={{ width: collapsed ? 80 : 270 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="h-[calc(100vh-2rem)] my-4 ml-4 bg-white/[0.03] backdrop-blur-[30px] border border-white/[0.08] shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] rounded-2xl flex flex-col justify-between z-30 shrink-0 select-none relative"
    >
      {/* Header */}
      <div>
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/[0.06]">
          <AnimatePresence mode="wait">
            {!collapsed ? (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-2.5"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#da4e24] to-[#0098f3] flex items-center justify-center text-white font-extrabold text-sm shadow-[0_0_12px_rgba(124,92,255,0.4)]">
                  P
                </div>
                <div>
                  <span className="font-extrabold text-[11px] tracking-wider text-white block font-outfit">PRICEPILOT AI</span>
                  <span className="text-[9px] text-[#B8BCC8] font-semibold block">Dynamic Pricing Platform</span>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#da4e24] to-[#0098f3] flex items-center justify-center text-white font-extrabold text-sm shadow-[0_0_12px_rgba(124,92,255,0.4)] mx-auto"
              >
                P
              </motion.div>
            )}
          </AnimatePresence>

          <button 
            onClick={toggleCollapse}
            className="p-1.5 rounded-lg hover:bg-white/5 text-[#B8BCC8] hover:text-white transition-all duration-200"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Workspace Selector */}
        {!collapsed && (
          <div className="p-3 border-b border-white/[0.06] relative">
            <button 
              onClick={() => setShowWorkspaceMenu(!showWorkspaceMenu)}
              className="w-full flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.06] text-xs text-[#B8BCC8] font-medium transition-colors text-left"
            >
              <span className="flex items-center gap-2 truncate">
                <Briefcase className="w-3.5 h-3.5 text-[#0098f3] shrink-0" />
                <span className="truncate">{workspace}</span>
              </span>
              <span className="text-[10px] text-[#B8BCC8]/60">▼</span>
            </button>
            
            <AnimatePresence>
              {showWorkspaceMenu && (
                <motion.div 
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-3 right-3 mt-1 bg-[#0d0d0d] border border-white/[0.08] backdrop-blur-[20px] rounded-lg shadow-2xl z-50 p-1"
                >
                  {workspaces.map(w => (
                    <button
                      key={w}
                      onClick={() => {
                        setWorkspace(w);
                        setShowWorkspaceMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-[11px] rounded-md hover:bg-white/5 transition-colors truncate block ${w === workspace ? 'text-[#da4e24] font-semibold' : 'text-[#B8BCC8]'}`}
                    >
                      {w}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Navigation Group Items */}
        <nav className="p-3 space-y-4 max-h-[calc(100vh-16rem)] overflow-y-auto">
          {navGroups.map((group, idx) => (
            <div key={idx} className="space-y-1">
              {!collapsed && (
                <h4 className="px-3 text-[9px] font-bold text-[#B8BCC8]/40 uppercase tracking-widest mb-1.5 font-outfit">
                  {group.title}
                </h4>
              )}
              {group.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => 
                    `flex items-center rounded-xl px-3 py-2.5 text-xs font-semibold transition-all duration-300 border ${
                      isActive 
                        ? 'bg-gradient-to-r from-[#da4e24]/15 to-[#0098f3]/15 text-white border-[#da4e24]/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06),0_0_12px_rgba(124,92,255,0.15)]' 
                        : 'text-[#B8BCC8] hover:text-white hover:bg-white/[0.04] border-transparent'
                    } ${collapsed ? 'justify-center' : 'gap-3'}`
                  }
                  title={collapsed ? item.label : undefined}
                >
                  <item.icon className="w-4 h-4 shrink-0 transition-transform duration-300" />
                  {!collapsed && (
                    <span className="truncate flex-1 tracking-wide">{item.label}</span>
                  )}
                  {!collapsed && item.path === '/history' && unreadCount > 0 && (
                    <span className="bg-[#da4e24] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-[0_0_8px_rgba(124,92,255,0.4)] animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
      </div>

      {/* Footer Profile */}
      <div className="p-3 border-t border-white/[0.06] bg-white/[0.01]">
        <div className={`flex items-center ${collapsed ? 'flex-col gap-3 justify-center' : 'justify-between'} gap-2`}>
          {!collapsed && user && (
            <div onClick={() => navigate('/profile')} className="flex items-center gap-2.5 overflow-hidden cursor-pointer group">
              <div className="relative shrink-0 transition-transform group-hover:scale-105">
                <img 
                  src={user.profile_image} 
                  alt={user.full_name}
                  className="w-8 h-8 rounded-full object-cover border border-white/[0.12] shadow-md"
                />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#2ED47A] border-2 border-[#0d0d0d] rounded-full" />
              </div>
              <div className="overflow-hidden">
                <span className="block text-xs font-bold text-white truncate font-outfit group-hover:text-[#da4e24] transition-colors">{user.full_name}</span>
                <span className="block text-[9px] text-[#B8BCC8]/60 truncate font-semibold uppercase tracking-wider">{user.role}</span>
              </div>
            </div>
          )}
          
          {collapsed && user && (
            <div onClick={() => navigate('/profile')} className="relative shrink-0 mb-1 cursor-pointer hover:scale-105 transition-transform">
              <img 
                src={user.profile_image} 
                alt={user.full_name}
                className="w-8 h-8 rounded-full object-cover border border-white/[0.12] shadow-md"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#2ED47A] border-2 border-[#0d0d0d] rounded-full" />
            </div>
          )}

          <button 
            onClick={handleLogout}
            className={`p-2 rounded-xl hover:bg-white/5 text-[#B8BCC8] hover:text-[#FF5D73] transition-all duration-200 flex items-center justify-center ${collapsed ? 'w-full' : ''}`}
            title="Log Out Session"
          >
            <LogOut className="w-4 h-4 shrink-0" />
          </button>
        </div>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
