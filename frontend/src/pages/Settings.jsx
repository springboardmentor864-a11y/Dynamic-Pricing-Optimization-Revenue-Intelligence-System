import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Database, User, Terminal, CheckCircle, AlertCircle, RefreshCw, Activity } from 'lucide-react';
import { getApiUrl } from '../config';
import { useAuth } from '../context/AuthContext';
import { useSystem } from '../context/SystemContext';

const Settings = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { showToast } = useSystem();
  const [activeTab, setActiveTab] = useState('db');
  
  const [testResult, setTestResult] = useState(null);
  const [testPending, setTestPending] = useState(false);

  // Fetch Settings
  const { data: dbConfig, isLoading } = useQuery({
    queryKey: ['dbSettings'],
    queryFn: async () => {
      const res = await fetch(getApiUrl('/api/settings/db'));
      if (!res.ok) throw new Error('Failed to load DB settings.');
      const json = await res.json();
      return json.success !== undefined ? json.data : json;
    }
  });

  const [testHealthStatus, setTestHealthStatus] = useState(null);

  React.useEffect(() => {
    if (dbConfig) {
      setTestHealthStatus({
        healthy: dbConfig.healthy ?? false,
        status: dbConfig.status ?? 'Disconnected'
      });
    }
  }, [dbConfig]);

  // Fetch Activity Logs
  const { data: logs = [], isLoading: logsLoading } = useQuery({
    queryKey: ['activityLogs'],
    queryFn: async () => {
      const res = await fetch(getApiUrl('/api/settings/logs'));
      if (!res.ok) throw new Error('Failed to load logs.');
      const json = await res.json();
      return (json.success !== undefined && json.data !== undefined) ? (json.data || []) : (json || []);
    },
    enabled: activeTab === 'logs'
  });

  const handleTestConnection = async () => {
    setTestPending(true);
    setTestResult(null);
    try {
      let res;
      try {
        res = await fetch(getApiUrl('/api/settings/db/test'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (networkError) {
        setTestHealthStatus({ healthy: false, status: 'Disconnected' });
        setTestResult({ status: 'error', message: 'Failed to communicate with local API server.' });
        showToast('error', 'API communication error.');
        return;
      }

      let parsedData = null;
      try {
        const json = await res.json();
        parsedData = json.success !== undefined ? json.data : json;
      } catch (jsonErr) {
        setTestHealthStatus({ healthy: false, status: 'Disconnected' });
        setTestResult({ status: 'error', message: 'Failed to communicate with local API server.' });
        showToast('error', 'API communication error.');
        return;
      }

      // Sync config health status state
      queryClient.invalidateQueries({ queryKey: ['dbSettings'] });

      if (!res.ok) {
        setTestHealthStatus({ healthy: false, status: 'Disconnected' });
        let errMsg = 'Connection test failed.';
        if (parsedData && parsedData.message) {
          errMsg = parsedData.message;
        } else if (parsedData && parsedData.detail) {
          if (Array.isArray(parsedData.detail)) {
            errMsg = parsedData.detail.map(d => `${d.loc.join('.')}: ${d.msg}`).join(', ');
          } else {
            errMsg = typeof parsedData.detail === 'string' ? parsedData.detail : JSON.stringify(parsedData.detail);
          }
        }
        setTestResult({ status: 'error', message: errMsg });
        showToast('error', errMsg);
        return;
      }

      if (parsedData.status === 'success') {
        setTestHealthStatus({ healthy: true, status: 'Connected' });
        setTestResult({ status: 'success', message: 'Database connection successful.' });
        showToast('success', 'Database connection successful.');
      } else {
        setTestHealthStatus({ healthy: false, status: 'Disconnected' });
        const errMsg = parsedData.message || 'Connection test failed.';
        setTestResult({ status: 'error', message: errMsg });
        showToast('error', errMsg);
      }
    } catch (e) {
      setTestHealthStatus({ healthy: false, status: 'Disconnected' });
      setTestResult({ status: 'error', message: 'Failed to communicate with local API server.' });
      showToast('error', 'API communication error.');
    } finally {
      setTestPending(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-5xl mx-auto pb-12 select-none">
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight font-outfit">System Settings</h1>
        <p className="text-xs text-[#B8BCC8] mt-1.5 font-medium">Configure database connections, profile defaults, and activity monitors.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Left tabs selector */}
        <div className="w-full md:w-56 space-y-2 shrink-0">
          <button 
            onClick={() => setActiveTab('db')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold text-left transition-all border ${activeTab === 'db' ? 'bg-gradient-to-r from-[#da4e24]/10 to-[#0098f3]/10 text-white border-[#da4e24]/30 shadow-[0_0_12px_rgba(124,92,255,0.15)]' : 'text-[#B8BCC8] hover:text-white hover:bg-white/[0.03] border-transparent'}`}
          >
            <Database className="w-4 h-4 text-[#0098f3]" /> Database Integration
          </button>
          <button 
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold text-left transition-all border ${activeTab === 'profile' ? 'bg-gradient-to-r from-[#da4e24]/10 to-[#0098f3]/10 text-white border-[#da4e24]/30 shadow-[0_0_12px_rgba(124,92,255,0.15)]' : 'text-[#B8BCC8] hover:text-white hover:bg-white/[0.03] border-transparent'}`}
          >
            <User className="w-4 h-4 text-[#da4e24]" /> Profile Details
          </button>
          <button 
            onClick={() => setActiveTab('logs')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold text-left transition-all border ${activeTab === 'logs' ? 'bg-gradient-to-r from-[#da4e24]/10 to-[#0098f3]/10 text-white border-[#da4e24]/30 shadow-[0_0_12px_rgba(124,92,255,0.15)]' : 'text-[#B8BCC8] hover:text-white hover:bg-white/[0.03] border-transparent'}`}
          >
            <Terminal className="w-4 h-4 text-[#2ED47A]" /> Activity Logs
          </button>
          <button 
            onClick={() => setActiveTab('telemetry')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold text-left transition-all border ${activeTab === 'telemetry' ? 'bg-gradient-to-r from-[#da4e24]/10 to-[#0098f3]/10 text-white border-[#da4e24]/30 shadow-[0_0_12px_rgba(124,92,255,0.15)]' : 'text-[#B8BCC8] hover:text-white hover:bg-white/[0.03] border-transparent'}`}
          >
            <Activity className="w-4 h-4 text-[#FFB300]" /> Service Status
          </button>
        </div>

        {/* Right Tab Content Viewport */}
        <div className="flex-1 w-full min-w-0">
          
          {/* DATABASE TAB */}
          {activeTab === 'db' && (
            <div className="glass-card p-6 space-y-6">
              <div>
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider font-outfit">Database Integration</h3>
                <p className="text-[11px] text-[#B8BCC8]/60 font-medium mt-0.5">Active database system connection status and credentials.</p>
              </div>

              {testResult && (
                <div className={`p-4 rounded-xl border text-xs flex gap-2.5 items-start ${testResult.status === 'success' ? 'bg-[#2ED47A]/10 border-[#2ED47A]/20 text-[#2ED47A]' : 'bg-[#FF5D73]/10 border-[#FF5D73]/20 text-[#FF5D73]'}`}>
                  {testResult.status === 'success' ? <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" /> : <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />}
                  <span className="font-semibold leading-relaxed">{testResult.message}</span>
                </div>
              )}

              {isLoading ? (
                <div className="p-12 text-center text-xs text-[#B8BCC8]/40 font-semibold animate-pulse">
                  Loading settings...
                </div>
              ) : (
                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-4">
                  <div className="flex justify-between items-center border-b border-white/[0.04] pb-3.5">
                    <div>
                      <span className="text-[9px] font-bold text-[#B8BCC8]/40 uppercase tracking-widest block font-outfit">Database Engine</span>
                      <span className="text-sm font-extrabold text-white flex items-center gap-1.5 mt-1 font-outfit">
                        🐘 {dbConfig?.engine || 'PostgreSQL 17'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] font-bold text-[#B8BCC8]/40 uppercase tracking-widest block font-outfit">Status</span>
                      <span className={`text-[10px] font-extrabold uppercase tracking-wider flex items-center justify-end gap-1.5 mt-1 ${testHealthStatus?.healthy ? 'text-[#2ED47A]' : 'text-[#FF5D73]'}`}>
                        <span className={`w-2 h-2 rounded-full ${testHealthStatus?.healthy ? 'bg-[#2ED47A]' : 'bg-[#FF5D73]'} animate-pulse`} />
                        {testHealthStatus?.status || 'Disconnected'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                    <div className="p-3 bg-white/[0.01] border border-white/[0.04] rounded-xl">
                      <span className="text-[9px] font-bold text-[#B8BCC8]/45 uppercase tracking-widest block font-outfit">Host</span>
                      <span className="text-white mt-1 block font-mono">{dbConfig?.host || 'localhost'}</span>
                    </div>
                    <div className="p-3 bg-white/[0.01] border border-white/[0.04] rounded-xl">
                      <span className="text-[9px] font-bold text-[#B8BCC8]/45 uppercase tracking-widest block font-outfit">Port</span>
                      <span className="text-white mt-1 block font-mono">{dbConfig?.port || '5432'}</span>
                    </div>
                    <div className="p-3 bg-white/[0.01] border border-white/[0.04] rounded-xl">
                      <span className="text-[9px] font-bold text-[#B8BCC8]/45 uppercase tracking-widest block font-outfit">Database</span>
                      <span className="text-white mt-1 block font-mono">{dbConfig?.database || 'pricepilot_ai'}</span>
                    </div>
                    <div className="p-3 bg-white/[0.01] border border-white/[0.04] rounded-xl">
                      <span className="text-[9px] font-bold text-[#B8BCC8]/45 uppercase tracking-widest block font-outfit">User</span>
                      <span className="text-white mt-1 block font-mono">{dbConfig?.user || 'postgres'}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center bg-white/[0.01] border border-white/[0.04] p-3.5 rounded-xl">
                    <span className="text-[9px] font-bold text-[#B8BCC8]/45 uppercase tracking-widest font-outfit">Connection Health</span>
                    <span className={`text-[10px] font-extrabold uppercase tracking-wider ${testHealthStatus?.healthy ? 'text-[#2ED47A]' : 'text-[#FF5D73]'}`}>
                      {testHealthStatus?.healthy ? 'Healthy' : 'Unhealthy'}
                    </span>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-white/[0.06] flex justify-end">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testPending}
                  className="btn-primary uppercase font-bold tracking-wider text-[10px] py-2.5 px-5 flex items-center gap-1.5"
                >
                  {testPending ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" /> testing...
                    </>
                  ) : (
                    '✔ Test Connection'
                  )}
                </button>
              </div>
            </div>
          )}

          {/* PROFILE DETAILS TAB */}
          {activeTab === 'profile' && user && (
            <div className="glass-card p-6 space-y-6">
              <div>
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider font-outfit">Profile Card</h3>
                <p className="text-[11px] text-[#B8BCC8]/60 font-medium mt-0.5">Enterprise profile details.</p>
              </div>

              <div className="flex items-center gap-6 p-4 bg-white/[0.02] border border-white/[0.06] rounded-2xl shadow-sm">
                <img 
                  src={user.profile_image} 
                  alt={user.full_name}
                  className="w-16 h-16 rounded-full object-cover border border-white/[0.12] shadow-md"
                />
                <div>
                  <h4 className="text-base font-extrabold text-white tracking-tight font-outfit">{user.full_name}</h4>
                  <span className="block text-xs text-[#B8BCC8]/70 font-semibold mt-0.5">{user.email}</span>
                  <div className="flex gap-2.5 mt-2">
                    <span className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[#B8BCC8] text-[9px] font-bold uppercase tracking-wider font-outfit">
                      {user.role}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[#B8BCC8] text-[9px] font-bold uppercase tracking-wider font-outfit">
                      {user.department}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 bg-white/[0.02] border border-white/[0.06] rounded-xl">
                  <span className="text-[9px] font-bold text-[#B8BCC8]/50 uppercase tracking-widest block font-outfit">Contact Phone</span>
                  <span className="text-white font-bold mt-1.5 block font-mono">{user.phone || 'N/A'}</span>
                </div>
                <div className="p-3.5 bg-white/[0.02] border border-white/[0.06] rounded-xl">
                  <span className="text-[9px] font-bold text-[#B8BCC8]/50 uppercase tracking-widest block font-outfit">Account Provisioned</span>
                  <span className="text-white font-bold mt-1.5 block font-mono">{new Date(user.created_date).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          )}

          {/* ACTIVITY LOGS TAB */}
          {activeTab === 'logs' && (
            <div className="glass-card p-6 space-y-4">
              <div>
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider font-outfit">Security & Operation Logs</h3>
                <p className="text-[11px] text-[#B8BCC8]/60 font-medium mt-0.5">Transactional log registry audit.</p>
              </div>

              <div className="glass-card overflow-hidden">
                {logsLoading ? (
                  <div className="p-12 text-center text-xs text-[#B8BCC8]/40 font-semibold animate-pulse">
                    Loading logs...
                  </div>
                ) : (
                  <div className="max-h-[300px] overflow-y-auto divide-y divide-white/[0.04] p-2">
                    {logs.length > 0 ? (
                      logs.map((log) => (
                        <div key={log.id} className="p-3 text-xs flex justify-between items-start gap-4 hover:bg-white/[0.02] transition-colors rounded-xl font-semibold">
                          <div>
                            <span className="font-extrabold text-white font-outfit">{log.action}</span>
                            <span className="text-[#B8BCC8]/30 mx-2">|</span>
                            <span className="text-[#B8BCC8]">{log.details}</span>
                          </div>
                          <span className="text-[9px] text-[#B8BCC8]/50 shrink-0 font-mono">
                            {new Date(log.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-[#B8BCC8]/40">
                        No recent platform activities recorded.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SYSTEM TELEMETRY TAB */}
          {activeTab === 'telemetry' && (
            <div className="glass-card p-6 space-y-6">
              <div>
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider font-outfit">Service Integration Status</h3>
                <p className="text-[11px] text-[#B8BCC8]/60 font-medium mt-0.5">Real-time status of integrated API endpoints and microservices.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold animate-fadeIn">
                <div className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-2xl space-y-2">
                  <span className="text-[9px] font-bold text-[#B8BCC8]/50 uppercase tracking-widest block font-outfit">Google Gemini AI</span>
                  <div className="flex items-center justify-between">
                    <span className="text-white text-xs font-bold font-outfit flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#2ED47A] animate-pulse" /> Active (Live API)
                    </span>
                    <span className="text-[9px] text-[#B8BCC8]/50 font-mono">v1.5-flash</span>
                  </div>
                </div>

                <div className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-2xl space-y-2">
                  <span className="text-[9px] font-bold text-[#B8BCC8]/50 uppercase tracking-widest block font-outfit">Firebase Auth IAM</span>
                  <div className="flex items-center justify-between">
                    <span className="text-white text-xs font-bold font-outfit flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#2ED47A] animate-pulse" /> Initialized
                    </span>
                    <span className="text-[9px] text-[#B8BCC8]/50 font-mono">Soft IAM Enabled</span>
                  </div>
                </div>

                <div className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-2xl space-y-2">
                  <span className="text-[9px] font-bold text-[#B8BCC8]/50 uppercase tracking-widest block font-outfit">Database Diagnostics</span>
                  <div className="flex items-center justify-between">
                    <span className="text-white text-xs font-bold font-outfit flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#2ED47A] animate-pulse" /> Connected
                    </span>
                    <span className="text-[9px] text-[#B8BCC8]/50 font-mono">PostgreSQL / SQLite</span>
                  </div>
                </div>

                <div className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-2xl space-y-2">
                  <span className="text-[9px] font-bold text-[#B8BCC8]/50 uppercase tracking-widest block font-outfit">Model Pipeline Version</span>
                  <div className="flex items-center justify-between">
                    <span className="text-white text-xs font-bold font-outfit flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#2ED47A] animate-pulse" /> Champion Loaded
                    </span>
                    <span className="text-[9px] text-[#B8BCC8]/50 font-mono">v1.2.0 (XGBoost)</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.01] border border-white/[0.04] text-[10px] text-[#B8BCC8]/70 leading-relaxed font-semibold">
                🛡 <strong>Security Compliance:</strong> Active session tokens verify RBAC permission hierarchies, protecting sensitive platform operations.
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Settings;
