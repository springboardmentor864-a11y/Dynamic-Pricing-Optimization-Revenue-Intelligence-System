import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Navigation, Settings, Play, Database, Trash2, ShieldAlert, Cpu, User, Package, History } from 'lucide-react';
import { useSystem } from '../context/SystemContext';
import { getApiUrl } from '../config';

const CommandPalette = () => {
  const { commandOpen, setCommandOpen, showToast, fetchNotifications } = useSystem();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        setCommandOpen(!commandOpen);
      }
      if (e.key === 'Escape') {
        setCommandOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [commandOpen, setCommandOpen]);

  // Focus input on open
  useEffect(() => {
    if (commandOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setSearch('');
      setSearchResults(null);
    }
  }, [commandOpen]);

  // Global search fetch with debounce
  useEffect(() => {
    if (!search.trim()) {
      setSearchResults(null);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(getApiUrl(`/api/settings/search/global?q=${encodeURIComponent(search)}`));
        if (res.ok) {
          const data = await res.json();
          const parsed = data.success !== undefined ? data.data : data;
          setSearchResults(parsed);
        }
      } catch (e) {
        console.error("Global search failed:", e);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [search]);

  const items = [
    // Navigation
    { type: 'navigation', label: 'Go to Command Center Dashboard', path: '/dashboard', icon: Navigation },
    { type: 'navigation', label: 'Go to Price Predictor Simulator', path: '/predictor', icon: Navigation },
    { type: 'navigation', label: 'Go to Demand Forecast Center', path: '/forecasting', icon: Navigation },
    { type: 'navigation', label: 'Go to Dataset Explorer', path: '/explorer', icon: Navigation },
    { type: 'navigation', label: 'Go to Model Comparison Benchmarks', path: '/comparison', icon: Navigation },
    { type: 'navigation', label: 'Go to Prediction Audit Logs', path: '/history', icon: Navigation },
    { type: 'navigation', label: 'Go to User Accounts Manager', path: '/users', icon: Navigation },
    { type: 'navigation', label: 'Go to System settings', path: '/settings', icon: Settings },
    
    // Actions
    { 
      type: 'action', 
      label: 'Trigger ML Training Pipeline Check', 
      icon: Play,
      action: async () => {
        showToast('info', 'Contacting cached training resources...');
        try {
          const res = await fetch(getApiUrl('/train'), { method: 'POST' });
          if (res.ok) {
            showToast('success', 'Trained pipelines verified from local caching!');
          } else {
            showToast('error', 'Training pipeline check failed.');
          }
        } catch (e) {
          showToast('error', 'Failed to connect to training worker.');
        }
      }
    },
    { 
      type: 'action', 
      label: 'Test Current PostgreSQL Connection', 
      icon: Database,
      action: async () => {
        showToast('info', 'Testing database connection active pool...');
        try {
          const settingsRes = await fetch(getApiUrl('/api/settings/db'));
          if (settingsRes.ok) {
            const config = await settingsRes.json();
            const res = await fetch(getApiUrl('/api/settings/db/test'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(config)
            });
            const data = await res.json();
            if (data.status === 'success') {
              showToast('success', data.message);
            } else {
              showToast('error', data.message);
            }
          }
        } catch (e) {
          showToast('error', 'Settings request failed.');
        }
      }
    },
    { 
      type: 'action', 
      label: 'Purge Prediction History Logs', 
      icon: Trash2,
      action: async () => {
        if (window.confirm('Wipe prediction history logs?')) {
          try {
            const res = await fetch(getApiUrl('/api/predictions/clear'), { method: 'POST' });
            if (res.ok) {
              showToast('success', 'Prediction logs deleted successfully.');
            }
          } catch (e) {
            showToast('error', 'Deletion failed.');
          }
        }
      }
    },
    { 
      type: 'action', 
      label: 'Wipe System Alerts List', 
      icon: ShieldAlert,
      action: async () => {
        try {
          const res = await fetch(getApiUrl('/api/notifications/clear'), { method: 'POST' });
          if (res.ok) {
            fetchNotifications();
            showToast('success', 'Wiped alerts list.');
          }
        } catch (e) {
          showToast('error', 'Clear request failed.');
        }
      }
    }
  ];

  const filteredItems = items.filter(item => 
    item.label.toLowerCase().includes(search.toLowerCase())
  );

  const handleItemSelect = async (item) => {
    setCommandOpen(false);
    if (item.type === 'navigation') {
      navigate(item.path);
    } else if (item.type === 'action') {
      await item.action();
    }
  };

  const hasSearchHits = searchResults && (
    (searchResults.products?.length > 0) ||
    (searchResults.predictions?.length > 0) ||
    (searchResults.users?.length > 0) ||
    (searchResults.categories?.length > 0) ||
    (searchResults.models?.length > 0) ||
    (searchResults.forecasts?.length > 0)
  );

  return (
    <AnimatePresence>
      {commandOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto p-4 pt-[15vh]">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCommandOpen(false)}
            className="fixed inset-0 bg-black/75 backdrop-blur-[15px] transition-opacity"
          />

          {/* Palette Frame */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative mx-auto max-w-xl bg-[#0d0d0d]/90 border border-white/[0.08] backdrop-blur-[35px] rounded-2xl shadow-2xl overflow-hidden divide-y divide-white/[0.06] text-white"
          >
            {/* Search Input */}
            <div className="flex items-center gap-3 px-4 py-3.5 bg-white/[0.01]">
              <Search className="w-4 h-4 text-[#0098f3] shrink-0" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search products, predictions, categories, users, models..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent outline-none text-sm placeholder-[#B8BCC8]/40 text-white font-outfit"
              />
              <kbd className="px-1.5 py-0.5 bg-white/[0.04] border border-white/[0.08] rounded-md text-[9px] font-mono text-[#B8BCC8]/60 pointer-events-none select-none">
                esc
              </kbd>
            </div>

            {/* Results Panel */}
            <div className="max-h-[350px] overflow-y-auto p-2 space-y-3">
              {loading ? (
                <div className="py-8 text-center text-xs text-[#B8BCC8]/45 flex flex-col items-center justify-center gap-2 font-semibold">
                  <div className="w-4 h-4 border-2 border-[#da4e24] border-t-transparent rounded-full animate-spin" />
                  <span>Searching databases...</span>
                </div>
              ) : searchResults ? (
                hasSearchHits ? (
                  <div className="space-y-3 animate-fadeIn">
                    {/* Products */}
                    {searchResults.products?.length > 0 && (
                      <div>
                        <div className="text-[9px] font-extrabold text-[#da4e24] uppercase tracking-wider px-3 mb-1 font-outfit">Products</div>
                        {searchResults.products.map(p => (
                          <button
                            key={p.id}
                            onClick={() => { setCommandOpen(false); navigate('/predictor'); }}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left hover:bg-white/5 text-xs text-[#B8BCC8] hover:text-white transition-all font-semibold"
                          >
                            <Package className="w-3.5 h-3.5 text-[#0098f3] shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="text-white font-medium truncate">{p.name || 'Unnamed Product'}</div>
                              <div className="text-[9px] text-[#B8BCC8]/50 truncate">{p.product_id} • {p.category}</div>
                            </div>
                            <span className="text-[10px] font-mono text-[#2ED47A]">₹{p.current_price?.toFixed(2)}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Predictions */}
                    {searchResults.predictions?.length > 0 && (
                      <div>
                        <div className="text-[9px] font-extrabold text-[#da4e24] uppercase tracking-wider px-3 mb-1 font-outfit">Predictions</div>
                        {searchResults.predictions.map(p => (
                          <button
                            key={p.id}
                            onClick={() => { setCommandOpen(false); navigate('/history'); }}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left hover:bg-white/5 text-xs text-[#B8BCC8] hover:text-white transition-all font-semibold"
                          >
                            <History className="w-3.5 h-3.5 text-[#da4e24] shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="text-white font-medium truncate">{p.product_name || 'Legacy Simulation'}</div>
                              <div className="text-[9px] text-[#B8BCC8]/50 truncate">{p.category} • {p.model_used?.replace(' Regressor', '')}</div>
                            </div>
                            <span className="text-[10px] font-mono text-[#2ED47A]">₹{p.predicted_price?.toFixed(2)}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Users */}
                    {searchResults.users?.length > 0 && (
                      <div>
                        <div className="text-[9px] font-extrabold text-[#da4e24] uppercase tracking-wider px-3 mb-1 font-outfit">Users</div>
                        {searchResults.users.map(u => (
                          <button
                            key={u.id}
                            onClick={() => { setCommandOpen(false); navigate('/users'); }}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left hover:bg-white/5 text-xs text-[#B8BCC8] hover:text-white transition-all font-semibold"
                          >
                            <User className="w-3.5 h-3.5 text-[#2ED47A] shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="text-white font-medium truncate">{u.full_name}</div>
                              <div className="text-[9px] text-[#B8BCC8]/50 truncate">{u.email} • {u.role} ({u.department})</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Categories */}
                    {searchResults.categories?.length > 0 && (
                      <div>
                        <div className="text-[9px] font-extrabold text-[#da4e24] uppercase tracking-wider px-3 mb-1 font-outfit">Categories</div>
                        {searchResults.categories.map((c, i) => (
                          <button
                            key={i}
                            onClick={() => { setCommandOpen(false); navigate('/predictor'); }}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left hover:bg-white/5 text-xs text-[#B8BCC8] hover:text-white transition-all font-semibold"
                          >
                            <Navigation className="w-3.5 h-3.5 text-[#0098f3] shrink-0" />
                            <span className="flex-1 text-white truncate capitalize">{c.name?.replace(/_/g, ' ')}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Models */}
                    {searchResults.models?.length > 0 && (
                      <div>
                        <div className="text-[9px] font-extrabold text-[#da4e24] uppercase tracking-wider px-3 mb-1 font-outfit">ML Models</div>
                        {searchResults.models.map(m => (
                          <button
                            key={m.id}
                            onClick={() => { setCommandOpen(false); navigate('/comparison'); }}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left hover:bg-white/5 text-xs text-[#B8BCC8] hover:text-white transition-all font-semibold"
                          >
                            <Cpu className="w-3.5 h-3.5 text-[#da4e24] shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="text-white font-medium truncate">{m.model_name?.replace(' Regressor', '')}</div>
                              <div className="text-[9px] text-[#B8BCC8]/50">Validation R²: {m.r2?.toFixed(5)} • MAE: ₹{m.mae?.toFixed(2)}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-[#B8BCC8]/45">
                    No active records found matching "{search}"
                  </div>
                )
              ) : (
                /* Default List */
                <div className="space-y-1">
                  {filteredItems.length > 0 ? (
                    filteredItems.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleItemSelect(item)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-white/5 text-xs text-[#B8BCC8] hover:text-white transition-all font-semibold"
                      >
                        <item.icon className="w-4 h-4 text-[#B8BCC8]/50 shrink-0" />
                        <span className="flex-1 font-medium">{item.label}</span>
                        <span className="text-[9px] uppercase font-bold text-[#B8BCC8]/50 tracking-wider px-1.5 py-0.5 bg-white/[0.04] rounded-md">
                          {item.type}
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="py-8 text-center text-xs text-[#B8BCC8]/45 font-medium">
                      No actions match search context.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer tips */}
            <div className="px-4 py-2.5 bg-white/[0.01] text-[10px] text-[#B8BCC8]/40 flex justify-between select-none font-medium">
              <span>Use Ctrl + K to toggle lookup</span>
              <span>Press ESC to close</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CommandPalette;
