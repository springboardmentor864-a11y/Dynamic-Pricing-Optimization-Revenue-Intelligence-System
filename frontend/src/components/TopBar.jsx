import React, { useState } from 'react';
import { Search, Bell, Database, CheckCircle2, AlertCircle, ChevronDown, User, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSystem } from '../context/SystemContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const TopBar = () => {
  const { user, logout } = useAuth();
  const { 
    notifications, 
    unreadCount, 
    setCommandOpen, 
    dbStatus, 
    backendOnline, 
    markNotificationAsRead, 
    clearAllNotifications 
  } = useSystem();
  
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const navigate = useNavigate();

  const handleProfileClick = (path) => {
    navigate(path);
    setShowProfileMenu(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-16 m-4 mb-0 bg-white/[0.03] backdrop-blur-[30px] border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.15),inset_0_1px_1px_rgba(255,255,255,0.06)] rounded-2xl flex items-center justify-between px-6 z-20 relative">
      {/* Search Input Palette Trigger */}
      <div className="w-80">
        <button 
          onClick={() => setCommandOpen(true)}
          className="w-full flex items-center gap-2.5 px-3 py-2 bg-white/[0.03] border border-white/[0.08] hover:border-white/[0.16] rounded-xl text-xs text-[#B8BCC8]/70 hover:text-[#FFFFFF] transition-all duration-300 text-left"
        >
          <Search className="w-3.5 h-3.5 text-[#0098f3]" />
          <span className="flex-1">Search pages, datasets, actions...</span>
          <kbd className="px-1.5 py-0.5 bg-white/[0.04] border border-white/[0.08] rounded-md text-[9px] font-mono text-[#B8BCC8]/60 pointer-events-none select-none">
            Ctrl + K
          </kbd>
        </button>
      </div>

      {/* Control Actions */}
      <div className="flex items-center gap-4">
        {/* DB Connection Status Badge */}
        <div 
          onClick={() => navigate('/settings')}
          className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-[10px] font-semibold text-[#B8BCC8] cursor-pointer hover:bg-white/[0.06] hover:border-white/[0.14] transition-all duration-300"
          title="Click to manage database connection configuration"
        >
          <Database className="w-3.5 h-3.5 text-[#0098f3]" />
          <span className="capitalize">{dbStatus.active_engine || 'postgresql'} Active</span>
          {backendOnline ? (
            <span className="w-1.5 h-1.5 rounded-full bg-[#2ED47A] shadow-[0_0_8px_#2ED47A] animate-pulse" />
          ) : (
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF5D73] shadow-[0_0_8px_#FF5D73] animate-pulse" />
          )}
        </div>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button 
            onClick={() => {
              setShowNotifMenu(!showNotifMenu);
              setShowProfileMenu(false);
            }}
            className="p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] text-[#B8BCC8] hover:text-white transition-all duration-300 relative"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-[#da4e24] text-white font-bold text-[8px] px-1.5 py-0.5 rounded-full shadow-[0_0_8px_rgba(124,92,255,0.4)]">
                {unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {showNotifMenu && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="absolute right-0 mt-3 w-80 bg-[#0d0d0d]/95 backdrop-blur-[35px] border border-white/[0.08] rounded-2xl shadow-2xl z-50 overflow-hidden text-xs"
              >
                <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between font-bold text-[#FFFFFF]">
                  <span>Alert Logs</span>
                  {unreadCount > 0 && (
                    <button 
                      onClick={() => markNotificationAsRead()}
                      className="text-[#da4e24] hover:text-[#0098f3] text-[10px] font-semibold"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-white/[0.04]">
                  {notifications.length > 0 ? (
                    notifications.map(n => (
                      <div 
                        key={n.id} 
                        onClick={() => markNotificationAsRead(n.id)}
                        className={`p-3 hover:bg-white/[0.02] cursor-pointer transition-colors ${n.status === 'unread' ? 'bg-[#da4e24]/5' : ''}`}
                      >
                        <div className="flex gap-2.5 items-start">
                          {n.type === 'prediction' ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#2ED47A] shrink-0 mt-0.5" />
                          ) : (
                            <AlertCircle className="w-3.5 h-3.5 text-[#da4e24] shrink-0 mt-0.5" />
                          )}
                          <div>
                            <p className="text-[#FFFFFF] leading-snug font-medium">{n.message}</p>
                            <span className="text-[9px] text-[#B8BCC8]/60 mt-1 block">
                              {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-[#B8BCC8]/50">
                      No recent event alerts.
                    </div>
                  )}
                </div>
                {notifications.length > 0 && (
                  <button 
                    onClick={clearAllNotifications}
                    className="w-full py-2.5 bg-white/[0.02] hover:bg-white/[0.04] border-t border-white/[0.06] text-center font-bold text-xs text-[#B8BCC8] hover:text-white transition-colors block"
                  >
                    Clear alerts
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile Dropdown */}
        <div className="relative">
          <button 
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifMenu(false);
            }}
            className="flex items-center gap-2 p-1 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.08] hover:border-white/[0.14] transition-all text-xs font-semibold text-[#FFFFFF] text-left"
          >
            {user && (
              <>
                <img 
                  src={user.profile_image} 
                  alt={user.full_name}
                  className="w-6 h-6 rounded-full object-cover border border-white/[0.08]"
                />
                <span className="hidden sm:inline max-w-28 truncate font-outfit">{user.full_name.split(' ')[0]}</span>
                <ChevronDown className="w-3 h-3 text-[#B8BCC8]" />
              </>
            )}
          </button>

          <AnimatePresence>
            {showProfileMenu && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="absolute right-0 mt-3 w-48 bg-[#0d0d0d]/95 backdrop-blur-[35px] border border-white/[0.08] rounded-2xl shadow-2xl z-50 overflow-hidden text-xs py-1"
              >
                <div className="px-4 py-2.5 border-b border-white/[0.06] mb-1.5">
                  <span className="block text-[#FFFFFF] font-extrabold truncate font-outfit text-[13px]">{user?.full_name}</span>
                  <span className="inline-block px-1.5 py-0.5 rounded bg-[#da4e24]/15 text-[#da4e24] text-[8px] font-bold uppercase tracking-wider font-outfit mt-1 mb-1.5">{user?.role || 'Current User'}</span>
                  <span className="block text-[10px] text-[#B8BCC8]/60 truncate font-semibold">{user?.email}</span>
                </div>
                
                <button 
                  onClick={() => handleProfileClick('/profile')}
                  className="w-full text-left px-4 py-2.5 text-[#B8BCC8] hover:text-white hover:bg-white/[0.04] transition-colors flex items-center gap-2 font-semibold"
                >
                  <User className="w-3.5 h-3.5 text-[#0098f3]" /> User Profile
                </button>
                
                <button 
                  onClick={() => handleProfileClick('/settings')}
                  className="w-full text-left px-4 py-2.5 text-[#B8BCC8] hover:text-white hover:bg-white/[0.04] transition-colors flex items-center gap-2 font-semibold"
                >
                  <Settings className="w-3.5 h-3.5 text-[#da4e24]" /> Preferences
                </button>
                
                <hr className="border-white/[0.06] my-1" />
                
                <button 
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2.5 text-[#FF5D73] hover:bg-white/[0.04] transition-colors flex items-center gap-2 font-bold"
                >
                  <LogOut className="w-3.5 h-3.5" /> Log Out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
