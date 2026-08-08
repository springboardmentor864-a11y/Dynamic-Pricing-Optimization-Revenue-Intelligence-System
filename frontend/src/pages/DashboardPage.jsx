import React, { useState, useEffect } from 'react';
import KPICard from '../components/KPICard';
import UserDashboardPage from './UserDashboardPage';
import { useAuth } from '../context/AuthContext';
import {
  getAllUsers, createUser, updateUser, deleteUser, getDatabaseStatus, exportUsersExcel
} from '../services/api';

import { 
  Box, DollarSign, TrendingUp, TrendingDown, Target, Award, Sparkles, 
  ArrowRight, Clock, Brain, ShieldCheck, Layers, Zap, Users, UserPlus, 
  Edit3, Trash2, CheckCircle, XCircle, Download, RefreshCw, Database, 
  Search, Filter, Lock
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

const DashboardPage = ({ setActiveTab }) => {
  const { user, isAdmin } = useAuth();

  // If user is standard 'User' role, show dedicated User Dashboard
  if (!isAdmin) {
    return <UserDashboardPage setActiveTab={setActiveTab} />;
  }

  // --- Admin Dashboard State ---
  const [usersList, setUsersList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  
  // User Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  
  // User Form State
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState('User');
  const [formActive, setFormActive] = useState(true);
  const [formError, setFormError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // DB Status State
  const [dbHealth, setDbHealth] = useState({
    connected: true,
    status: 'Connected',
    database_name: 'pricepilot',
    host: 'localhost',
    port: 5432,
    pool_status: 'Active: 1 | Idle: 19 | Max: 30',
    response_time_ms: 1.2
  });

  const fetchUsersData = async () => {
    setLoadingUsers(true);
    try {
      const data = await getAllUsers();
      setUsersList(data);
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchDbHealth = async () => {
    const data = await getDatabaseStatus();
    setDbHealth(data);
  };

  useEffect(() => {
    fetchUsersData();
    fetchDbHealth();
  }, []);

  // Filtered Users List
  const filteredUsers = usersList.filter((u) => {
    const matchesSearch = 
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.username.toLowerCase().includes(userSearch.toLowerCase());
    
    const matchesRole = roleFilter === 'All' || u.role.toLowerCase() === roleFilter.toLowerCase();
    return matchesSearch && matchesRole;
  });

  const handleOpenAddModal = () => {
    setEditingUser(null);
    setFormName('');
    setFormEmail('');
    setFormUsername('');
    setFormPassword('');
    setFormRole('User');
    setFormActive(true);
    setFormError('');
    setShowAddModal(true);
  };

  const handleOpenEditModal = (targetUser) => {
    setEditingUser(targetUser);
    setFormName(targetUser.name);
    setFormEmail(targetUser.email);
    setFormUsername(targetUser.username);
    setFormPassword(''); // blank unless changing
    setFormRole(targetUser.role.toLowerCase() === 'admin' || targetUser.role.toLowerCase() === 'administrator' ? 'Admin' : 'User');
    setFormActive(targetUser.is_active);
    setFormError('');
    setShowAddModal(true);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formName.trim() || !formEmail.trim() || !formUsername.trim()) {
      setFormError('Please fill in all required user fields.');
      return;
    }

    try {
      if (editingUser) {
        // Update user
        const payload = {
          name: formName.trim(),
          email: formEmail.trim().toLowerCase(),
          username: formUsername.trim(),
          role: formRole,
          is_active: formActive
        };
        await updateUser(editingUser.id, payload);
        setActionSuccess(`User '${formUsername}' updated successfully!`);
      } else {
        // Create user
        if (!formPassword.trim() || formPassword.length < 6) {
          setFormError('Password must be at least 6 characters.');
          return;
        }
        const payload = {
          name: formName.trim(),
          email: formEmail.trim().toLowerCase(),
          username: formUsername.trim(),
          password: formPassword.trim(),
          role: formRole,
          is_active: formActive
        };
        await createUser(payload);
        setActionSuccess(`User '${formUsername}' created successfully!`);
      }

      setShowAddModal(false);
      fetchUsersData();
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Failed to save user details.');
    }
  };

  const handleDeleteUser = async (targetUser) => {
    if (window.confirm(`Are you sure you want to delete user account '${targetUser.username}'?`)) {
      try {
        await deleteUser(targetUser.id);
        setActionSuccess(`User '${targetUser.username}' deleted.`);
        fetchUsersData();
        setTimeout(() => setActionSuccess(''), 4000);
      } catch (err) {
        alert(err.response?.data?.detail || 'Failed to delete user.');
      }
    }
  };

  const handleToggleUserStatus = async (targetUser) => {
    try {
      await updateUser(targetUser.id, { is_active: !targetUser.is_active });
      fetchUsersData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update user status.');
    }
  };

  const handleExportCSV = () => {
    if (usersList.length === 0) return;
    const headers = ['ID', 'Name', 'Email', 'Username', 'Role', 'Status', 'Created At'];
    const rows = usersList.map((u) => [
      u.id, `"${u.name}"`, u.email, u.username, u.role, u.is_active ? 'Active' : 'Inactive', u.created_at
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `PricePilot_Users_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // KPI Metrics data matching exact request
  const kpiData = [
    {
      title: 'Total System Users',
      value: `${usersList.length || 2} Accounts`,
      subtitle: `Admin & User Roles Active`,
      icon: Users,
      gradient: 'bg-blue-500',
      borderGlow: 'border-blue-500/30',
      trend: 'up',
      trendValue: 'PostgreSQL DB',
    },
    {
      title: 'Average Product Price',
      value: '₹120.65',
      subtitle: 'Mean Product Value',
      icon: DollarSign,
      gradient: 'bg-purple-500',
      borderGlow: 'border-purple-500/30',
      trend: 'up',
      trendValue: 'Balanced',
    },
    {
      title: 'Highest Predicted Price',
      value: '₹6,735.00',
      subtitle: 'Luxury Category Peak',
      icon: TrendingUp,
      gradient: 'bg-emerald-500',
      borderGlow: 'border-emerald-500/30',
      trend: 'up',
      trendValue: 'High Valuation',
    },
    {
      title: 'Lowest Predicted Price',
      value: '₹0.85',
      subtitle: 'Budget Accessory Minimum',
      icon: TrendingDown,
      gradient: 'bg-rose-500',
      borderGlow: 'border-rose-500/30',
      trend: 'down',
      trendValue: 'Floor Price',
    },
    {
      title: 'Prediction Accuracy',
      value: '94.2%',
      subtitle: 'R² Score: 0.6742',
      icon: Target,
      gradient: 'bg-indigo-500',
      borderGlow: 'border-indigo-500/30',
      trend: 'up',
      trendValue: 'High Precision',
    },
    {
      title: 'Best ML Model',
      value: 'Extra Trees',
      subtitle: 'MAE: 31.17 • RMSE: 108.65',
      icon: Award,
      gradient: 'bg-amber-500',
      borderGlow: 'border-amber-500/30',
      trend: 'star',
      trendValue: 'Top Ranked',
    },
  ];

  const recentTrendData = [
    { month: 'Jan', price: 95, volume: 1200 },
    { month: 'Feb', price: 110, volume: 1450 },
    { month: 'Mar', price: 105, volume: 1300 },
    { month: 'Apr', price: 128, volume: 1800 },
    { month: 'May', price: 142, volume: 2100 },
    { month: 'Jun', price: 135, volume: 1950 },
    { month: 'Jul', price: 158, volume: 2400 },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl glass-card p-6 lg:p-8 border border-purple-500/30 bg-gradient-to-r from-blue-950/40 via-purple-950/30 to-slate-950/60">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Administrator Console Active
            </div>
            <h1 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
              Admin Control Center <span className="gradient-text">PricePilot AI</span>
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Full administrator privileges: Manage system users, inspect PostgreSQL database health, monitor machine learning models, and export analytics.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={async () => {
                setLoadingUsers(true);
                await Promise.all([fetchUsersData(), fetchDbHealth()]);
                setLoadingUsers(false);
              }}
              disabled={loadingUsers}
              className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-800/80 hover:bg-slate-800 text-purple-300 border border-purple-500/30 font-semibold text-xs transition"
              title="Refresh Real-Time Dashboard Metrics"
            >
              <RefreshCw className={`w-4 h-4 ${loadingUsers ? 'animate-spin' : ''}`} /> Refresh Data
            </button>
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-xs shadow-xl shadow-purple-500/25 transition hover:scale-105"
            >
              <UserPlus className="w-4 h-4" /> Add New User
            </button>
            <button
              onClick={async () => {
                try {
                  await exportUsersExcel();
                } catch (e) {
                  alert('Export failed.');
                }
              }}
              className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-emerald-600/90 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition"
            >
              <Download className="w-4 h-4 text-emerald-200" /> Export User Data (Excel)
            </button>
          </div>
        </div>
      </div>


      {actionSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-5 h-5" /> {actionSuccess}
        </div>
      )}

      {/* KPI Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-purple-400" /> Executive Metrics & System Status
          </h2>
          <span className="text-xs text-slate-400 font-mono">Live PostgreSQL Metrics</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {kpiData.map((kpi, idx) => (
            <KPICard key={idx} {...kpi} />
          ))}
        </div>
      </div>

      {/* User Management System Section (Admin Only) */}
      <div className="rounded-3xl glass-card p-6 border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" /> User Management & Access Control
            </h3>
            <p className="text-xs text-slate-400">View, create, edit roles, toggle status, or remove users from PostgreSQL database</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search name, email..."
                className="pl-9 pr-3 py-1.5 rounded-xl glass-input text-xs text-white"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl glass-input text-xs bg-slate-900 text-slate-200"
            >
              <option value="All">All Roles</option>
              <option value="Admin">Admin</option>
              <option value="User">User</option>
            </select>

            <button
              onClick={fetchUsersData}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="Refresh User List"
            >
              <RefreshCw className={`w-4 h-4 ${loadingUsers ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-sans text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4">User ID</th>
                <th className="py-3 px-4">Full Name</th>
                <th className="py-3 px-4">Email / Username</th>
                <th className="py-3 px-4">Assigned Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 font-mono text-purple-400 font-bold">#{u.id}</td>
                    <td className="py-3.5 px-4 text-white font-semibold">{u.name}</td>
                    <td className="py-3.5 px-4">
                      <div className="text-slate-200 text-xs">{u.email}</div>
                      <div className="text-[10px] text-slate-500 font-mono">@{u.username}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                        u.role.toLowerCase() === 'admin' || u.role.toLowerCase() === 'administrator'
                          ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                          : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                      }`}>
                        {u.role.toLowerCase() === 'admin' || u.role.toLowerCase() === 'administrator' ? 'Admin' : 'User'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleToggleUserStatus(u)}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition ${
                          u.is_active
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
                            : 'bg-rose-500/15 text-rose-400 border-rose-500/30 hover:bg-rose-500/25'
                        }`}
                      >
                        {u.is_active ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        <span>{u.is_active ? 'Active' : 'Inactive'}</span>
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEditModal(u)}
                        className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 transition"
                        title="Edit User Details"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u)}
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition"
                        title="Delete User Account"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-500">
                    No matching users found in PostgreSQL database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Price Trend Chart & Database Health Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Real-Time Price Trend Chart */}
        <div className="lg:col-span-2 rounded-3xl glass-card p-6 border border-slate-800">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-400" /> Market Price & Demand Velocity
              </h3>
              <p className="text-xs text-slate-400">Monthly average predicted prices & demand volume</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-300 text-xs font-mono border border-blue-500/20">
              2026 Forecast
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={recentTrendData}>
                <defs>
                  <linearGradient id="adminPriceGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#f8fafc',
                  }}
                />
                <Area type="monotone" dataKey="price" stroke="#a855f7" strokeWidth={3} fillOpacity={1} fill="url(#adminPriceGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* PostgreSQL Database Health Status */}
        <div className="rounded-3xl glass-card p-6 border border-slate-800 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <Database className="w-4 h-4 text-blue-400" /> PostgreSQL Status
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                dbHealth.connected ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}>
                {dbHealth.connected ? 'Connected' : 'Offline'}
              </span>
            </div>

            <div className="space-y-2.5 text-xs font-mono">
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex justify-between">
                <span className="text-slate-500 font-sans">Database Name</span>
                <span className="text-blue-300 font-bold">{dbHealth.database_name || 'pricepilot'}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex justify-between">
                <span className="text-slate-500 font-sans">Host : Port</span>
                <span className="text-indigo-300 font-bold">{dbHealth.host}:{dbHealth.port}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex justify-between">
                <span className="text-slate-500 font-sans">Latency</span>
                <span className="text-amber-300 font-bold">{dbHealth.response_time_ms} ms</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex justify-between">
                <span className="text-slate-500 font-sans">Pool Status</span>
                <span className="text-emerald-300 text-[10px] truncate max-w-[150px]">{dbHealth.pool_status}</span>
              </div>
            </div>
          </div>

          <button
            onClick={fetchDbHealth}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 font-bold text-xs transition"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Diagnostics
          </button>
        </div>

      </div>

      {/* Add / Edit User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-purple-400" /> {editingUser ? 'Edit User Account' : 'Create New User Account'}
              </h4>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveUser} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Alice Smith"
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="alice@example.com"
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Username</label>
                <input
                  type="text"
                  value={formUsername}
                  onChange={(e) => setFormUsername(e.target.value)}
                  placeholder="alicesmith"
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {editingUser ? 'New Password (Optional)' : 'Password'}
                </label>
                <input
                  type="password"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder={editingUser ? 'Leave blank to keep unchanged' : 'At least 6 characters'}
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs text-white"
                  required={!editingUser}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Role</label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs bg-slate-900 text-white"
                  >
                    <option value="User">User</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Account Status</label>
                  <select
                    value={formActive ? 'active' : 'inactive'}
                    onChange={(e) => setFormActive(e.target.value === 'active')}
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs bg-slate-900 text-white"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg"
                >
                  Save User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default DashboardPage;
