import React, { useState, useEffect, useMemo } from 'react';
import { 
  getAllUsers, createUser, updateUser, deleteUser,
  approveUser, rejectUser, suspendUser, changeUserRole, adminResetPassword,
  exportUsersExcel, bulkUpdateUserStatus, bulkDeleteUsers
} from '../services/api';
import { useToast } from '../context/ToastContext';
import SkeletonLoader from '../components/SkeletonLoader';
import EmptyState from '../components/EmptyState';
import { 
  Users, UserPlus, Search, Shield, UserCheck, Trash2, Edit3, 
  CheckCircle2, XCircle, ChevronLeft, ChevronRight, Lock, Mail, User,
  Clock, ShieldAlert, ArrowUpRight, ArrowDownRight, Key, Filter, Phone, RefreshCw,
  FileSpreadsheet, Download, Eye, CheckSquare, Square, ArrowUpDown, ChevronUp, ChevronDown
} from 'lucide-react';

const UsersPage = () => {
  const toast = useToast();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortField, setSortField] = useState('id');
  const [sortDirection, setSortDirection] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Selection & Bulk Actions
  const [selectedUserIds, setSelectedUserIds] = useState([]);

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [adminResetPwd, setAdminResetPwd] = useState('');

  // Form Fields
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    phone_number: '',
    password: '',
    role: 'User',
    is_active: true,
    is_approved: true,
    status: 'approved'
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await getAllUsers();
      if (Array.isArray(data)) {
        setUsers(data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load user list from PostgreSQL.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleExportExcel = async (specificIds = null) => {
    setExporting(true);
    try {
      const idsParam = specificIds ? specificIds.join(',') : (selectedUserIds.length > 0 ? selectedUserIds.join(',') : null);
      await exportUsersExcel(idsParam);
      toast.success('Users_Report.xlsx exported successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate Excel user report.');
    } finally {
      setExporting(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await createUser(formData);
      toast.success(`User '${formData.username}' created successfully!`);
      setShowAddModal(false);
      setFormData({ name: '', username: '', email: '', phone_number: '', password: '', role: 'User', is_active: true, is_approved: true, status: 'approved' });
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create user account.');
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      await updateUser(selectedUser.id, formData);
      toast.success(`Updated user '${selectedUser.username}'!`);
      setShowEditModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update user.');
    }
  };

  const handleApprove = async (userId, username) => {
    try {
      await approveUser(userId);
      toast.success(`User account '${username}' approved successfully!`);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to approve user.');
    }
  };

  const handleReject = async (userId, username) => {
    if (window.confirm(`Reject registration request for '${username}'?`)) {
      try {
        await rejectUser(userId);
        toast.info(`Registration for '${username}' rejected.`);
        fetchUsers();
      } catch (err) {
        toast.error('Failed to reject user registration.');
      }
    }
  };

  const handleSuspend = async (userId, username) => {
    if (window.confirm(`Suspend account access for '${username}'?`)) {
      try {
        await suspendUser(userId);
        toast.warning(`Account '${username}' has been suspended.`);
        fetchUsers();
      } catch (err) {
        toast.error('Failed to suspend user.');
      }
    }
  };

  const handleToggleRole = async (userId, username, currentRole) => {
    const newRole = currentRole?.toLowerCase() === 'admin' ? 'User' : 'Admin';
    const actionLabel = newRole === 'Admin' ? 'Promote to Admin' : 'Demote to User';
    if (window.confirm(`${actionLabel} for user '${username}'?`)) {
      try {
        await changeUserRole(userId, newRole);
        toast.success(`Changed role of '${username}' to ${newRole}.`);
        fetchUsers();
      } catch (err) {
        toast.error(err.response?.data?.detail || 'Failed to update user role.');
      }
    }
  };

  const handleAdminResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUser || !adminResetPwd.trim()) return;
    try {
      await adminResetPassword(selectedUser.id, adminResetPwd.trim());
      toast.success(`Reset password for '${selectedUser.username}' successfully!`);
      setShowResetModal(false);
      setSelectedUser(null);
      setAdminResetPwd('');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to reset password.');
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (window.confirm(`Are you sure you want to PERMANENTLY delete user account '${username}'?`)) {
      try {
        await deleteUser(userId);
        toast.info(`Deleted user account '${username}'.`);
        fetchUsers();
        setSelectedUserIds((prev) => prev.filter((id) => id !== userId));
      } catch (err) {
        toast.error(err.response?.data?.detail || 'Failed to delete user.');
      }
    }
  };

  // Bulk Handlers
  const handleBulkStatusChange = async (targetStatus) => {
    if (selectedUserIds.length === 0) return;
    if (window.confirm(`Set status '${targetStatus}' for ${selectedUserIds.length} selected users?`)) {
      try {
        await bulkUpdateUserStatus(selectedUserIds, targetStatus);
        toast.success(`Updated status of ${selectedUserIds.length} users to ${targetStatus}.`);
        fetchUsers();
        setSelectedUserIds([]);
      } catch (err) {
        toast.error('Failed bulk status update.');
      }
    }
  };

  const handleBulkDeleteSubmit = async () => {
    if (selectedUserIds.length === 0) return;
    if (window.confirm(`PERMANENTLY delete ${selectedUserIds.length} selected accounts? This action cannot be undone.`)) {
      try {
        await bulkDeleteUsers(selectedUserIds);
        toast.info(`Deleted ${selectedUserIds.length} user accounts.`);
        fetchUsers();
        setSelectedUserIds([]);
      } catch (err) {
        toast.error('Failed bulk delete operation.');
      }
    }
  };

  const openViewModal = (userObj) => {
    setSelectedUser(userObj);
    setShowViewModal(true);
  };

  const openEditModal = (userObj) => {
    setSelectedUser(userObj);
    setFormData({
      name: userObj.name || '',
      username: userObj.username || '',
      email: userObj.email || '',
      phone_number: userObj.phone_number || '',
      password: '',
      role: userObj.role || 'User',
      is_active: userObj.is_active ?? true,
      is_approved: userObj.is_approved ?? true,
      status: userObj.status || 'approved'
    });
    setShowEditModal(true);
  };

  const openResetModal = (userObj) => {
    setSelectedUser(userObj);
    setAdminResetPwd('');
    setShowResetModal(true);
  };

  const pendingUsers = users.filter((u) => u.status === 'pending' || !u.is_approved);
  const pendingCount = pendingUsers.length;

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesTab = activeTab === 'ALL' || (activeTab === 'PENDING' && (u.status === 'pending' || !u.is_approved));

      const matchesSearch =
        (u.name && u.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (u.username && u.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (u.phone_number && u.phone_number.includes(searchTerm));

      const matchesRole =
        roleFilter === 'ALL' ||
        (roleFilter === 'ADMIN' && (u.role?.toLowerCase() === 'admin' || u.role?.toLowerCase() === 'administrator')) ||
        (roleFilter === 'USER' && (u.role?.toLowerCase() === 'user' || u.role?.toLowerCase() === 'viewer'));

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'APPROVED' && u.status === 'approved') ||
        (statusFilter === 'PENDING' && u.status === 'pending') ||
        (statusFilter === 'SUSPENDED' && u.status === 'suspended') ||
        (statusFilter === 'DEACTIVATED' && !u.is_active);

      return matchesTab && matchesSearch && matchesRole && matchesStatus;
    }).sort((a, b) => {
      let valA = a[sortField] ?? '';
      let valB = b[sortField] ?? '';
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [users, activeTab, searchTerm, roleFilter, statusFilter, sortField, sortDirection]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  const totalAdminCount = users.filter((u) => u.role?.toLowerCase() === 'admin' || u.role?.toLowerCase() === 'administrator').length;
  const totalActiveCount = users.filter((u) => u.is_active && u.is_approved).length;

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedUserIds(paginatedUsers.map((u) => u.id));
    } else {
      setSelectedUserIds([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedUserIds((prev) => 
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getStatusBadge = (userObj) => {
    if (!userObj.is_active) {
      return <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-[#1F2937] text-[10px] font-bold">Deactivated</span>;
    }
    if (userObj.status === 'pending' || !userObj.is_approved) {
      return <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1"><Clock className="w-3 h-3" /> Pending Approval</span>;
    }
    if (userObj.status === 'suspended') {
      return <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold">Suspended</span>;
    }
    return <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Active</span>;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#1F2937]">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold mb-2">
            <Users className="w-3.5 h-3.5 text-purple-400" /> PostgreSQL Account Registry & Security Console
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white">
            User <span className="gradient-text">Management Console</span>
          </h1>
          <p className="text-xs text-slate-400">
            Admin privileges: Export Excel reports, approve new registrations, promote/demote roles, reset passwords, and bulk manage accounts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Excel Export Button */}
          <button
            onClick={() => handleExportExcel()}
            disabled={exporting}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2"
            title="Download Users_Report.xlsx using openpyxl"
          >
            {exporting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Exporting Excel...
              </>
            ) : (
              <>
                <FileSpreadsheet className="w-4 h-4 text-emerald-200" /> Export User Data (Excel)
              </>
            )}
          </button>

          <button
            onClick={() => {
              setFormData({ name: '', username: '', email: '', phone_number: '', password: '', role: 'User', is_active: true, is_approved: true, status: 'approved' });
              setShowAddModal(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-extrabold text-xs shadow-lg shadow-purple-500/20 transition flex items-center justify-center gap-2"
          >
            <UserPlus className="w-4 h-4" /> Add User Account
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-[18px] bg-[#111827] border border-[#1F2937] space-y-1">
          <p className="text-[10px] uppercase font-bold text-slate-400">Total Registered</p>
          <p className="text-2xl font-black text-white">{users.length}</p>
          <p className="text-[10px] text-slate-500">Stored in PostgreSQL</p>
        </div>

        <div className="p-4 rounded-[18px] bg-[#111827] border border-amber-500/30 space-y-1 relative overflow-hidden">
          {pendingCount > 0 && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-400 animate-ping" />}
          <p className="text-[10px] uppercase font-bold text-amber-400">Pending Approval</p>
          <p className="text-2xl font-black text-amber-300">{pendingCount}</p>
          <p className="text-[10px] text-slate-400">Requires Admin Action</p>
        </div>

        <div className="p-4 rounded-[18px] bg-[#111827] border border-emerald-500/30 space-y-1">
          <p className="text-[10px] uppercase font-bold text-emerald-400">Active Approved</p>
          <p className="text-2xl font-black text-emerald-300">{totalActiveCount}</p>
          <p className="text-[10px] text-slate-500">Authorized Accounts</p>
        </div>

        <div className="p-4 rounded-[18px] bg-[#111827] border border-purple-500/30 space-y-1">
          <p className="text-[10px] uppercase font-bold text-purple-400">Administrators</p>
          <p className="text-2xl font-black text-purple-300">{totalAdminCount}</p>
          <p className="text-[10px] text-slate-500">Full System Rights</p>
        </div>
      </div>

      {/* Tabs & Search Filter Bar */}
      <div className="p-4 rounded-[18px] bg-[#111827] border border-[#1F2937] space-y-4">
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-[#1F2937] pb-3">
          
          <div className="flex items-center gap-2 bg-slate-900/80 p-1 rounded-xl border border-[#1F2937] w-full md:w-auto">
            <button
              onClick={() => { setActiveTab('ALL'); setCurrentPage(1); }}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                activeTab === 'ALL'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" /> All Users ({users.length})
            </button>
            <button
              onClick={() => { setActiveTab('PENDING'); setCurrentPage(1); }}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 relative ${
                activeTab === 'PENDING'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-amber-300" /> Pending Approvals
              {pendingCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 font-black text-[9px]">
                  {pendingCount}
                </span>
              )}
            </button>
          </div>

          <button
            onClick={fetchUsers}
            className="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1.5 self-end md:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Registry
          </button>

        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              placeholder="Search name, email, username, phone..."
              className="w-full pl-10 pr-4 py-2 rounded-xl glass-input text-xs text-white"
            />
          </div>

          <div className="relative">
            <Filter className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
            <select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2 rounded-xl glass-input text-xs text-white appearance-none cursor-pointer"
            >
              <option value="ALL">All Roles (Admin & User)</option>
              <option value="ADMIN">Administrators Only</option>
              <option value="USER">Standard Users Only</option>
            </select>
          </div>

          <div className="relative">
            <Shield className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2 rounded-xl glass-input text-xs text-white appearance-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="APPROVED">Approved Accounts</option>
              <option value="PENDING">Pending Approval</option>
              <option value="SUSPENDED">Suspended Accounts</option>
              <option value="DEACTIVATED">Deactivated Accounts</option>
            </select>
          </div>

        </div>

      </div>

      {/* Bulk Operations Bar */}
      {selectedUserIds.length > 0 && (
        <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-500/30 flex flex-wrap items-center justify-between gap-3 text-xs text-purple-200 animate-in fade-in">
          <div className="flex items-center gap-2 font-bold">
            <CheckSquare className="w-4 h-4 text-purple-400" />
            <span>{selectedUserIds.length} user(s) selected</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleExportExcel(selectedUserIds)}
              className="px-3 py-1.5 rounded-lg bg-emerald-600/80 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" /> Export Selected (Excel)
            </button>
            <button
              onClick={() => handleBulkStatusChange('approved')}
              className="px-3 py-1.5 rounded-lg bg-blue-600/80 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Bulk Approve
            </button>
            <button
              onClick={() => handleBulkStatusChange('suspended')}
              className="px-3 py-1.5 rounded-lg bg-amber-600/80 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1.5 transition"
            >
              <Clock className="w-3.5 h-3.5" /> Bulk Suspend
            </button>
            <button
              onClick={handleBulkDeleteSubmit}
              className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 transition"
            >
              <Trash2 className="w-3.5 h-3.5" /> Bulk Delete
            </button>
          </div>
        </div>
      )}

      {/* Users Table Container */}
      <div className="rounded-[18px] bg-[#111827] border border-[#1F2937] overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-8">
            <SkeletonLoader lines={6} />
          </div>
        ) : paginatedUsers.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={Users}
              title="No Matching Accounts Found"
              description="No user accounts match your active search and status filters in the PostgreSQL database."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#1F2937] bg-slate-900/60 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                  <th className="p-4 w-10">
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={paginatedUsers.length > 0 && paginatedUsers.every((u) => selectedUserIds.includes(u.id))}
                      className="rounded border-[#1F2937] bg-slate-800 text-purple-600 focus:ring-0 cursor-pointer"
                    />
                  </th>
                  <th className="p-4 cursor-pointer hover:text-white transition" onClick={() => handleSort('name')}>
                    <div className="flex items-center gap-1">
                      User Info <ArrowUpDown className="w-3 h-3 text-slate-500" />
                    </div>
                  </th>
                  <th className="p-4 cursor-pointer hover:text-white transition" onClick={() => handleSort('role')}>
                    <div className="flex items-center gap-1">
                      Role <ArrowUpDown className="w-3 h-3 text-slate-500" />
                    </div>
                  </th>
                  <th className="p-4 cursor-pointer hover:text-white transition" onClick={() => handleSort('status')}>
                    <div className="flex items-center gap-1">
                      Status <ArrowUpDown className="w-3 h-3 text-slate-500" />
                    </div>
                  </th>
                  <th className="p-4">Last Login</th>
                  <th className="p-4 cursor-pointer hover:text-white transition" onClick={() => handleSort('created_at')}>
                    <div className="flex items-center gap-1">
                      Registered Date <ArrowUpDown className="w-3 h-3 text-slate-500" />
                    </div>
                  </th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F2937] text-xs">
                {paginatedUsers.map((userObj) => {
                  const isAdminRole = userObj.role?.toLowerCase() === 'admin' || userObj.role?.toLowerCase() === 'administrator';
                  const isPending = userObj.status === 'pending' || !userObj.is_approved;
                  const isSelected = selectedUserIds.includes(userObj.id);

                  return (
                    <tr key={userObj.id} className={`hover:bg-slate-800/40 transition ${isSelected ? 'bg-purple-950/20' : ''}`}>
                      
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectOne(userObj.id)}
                          className="rounded border-[#1F2937] bg-slate-800 text-purple-600 focus:ring-0 cursor-pointer"
                        />
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div 
                            onClick={() => openViewModal(userObj)}
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shadow cursor-pointer transition transform hover:scale-105 ${
                              isAdminRole
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            }`}
                          >
                            {userObj.name ? userObj.name.substring(0, 2).toUpperCase() : userObj.username.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p 
                              onClick={() => openViewModal(userObj)}
                              className="font-bold text-white flex items-center gap-1.5 hover:text-purple-300 cursor-pointer transition"
                            >
                              {userObj.name}
                              {userObj.username && <span className="text-[10px] text-slate-500 font-mono">(@{userObj.username})</span>}
                            </p>
                            <p className="text-[11px] text-slate-400 font-mono flex items-center gap-2">
                              <span>{userObj.email}</span>
                              {userObj.phone_number && <span className="text-slate-500">• {userObj.phone_number}</span>}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 font-mono">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          isAdminRole
                            ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                            : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                        }`}>
                          {userObj.role}
                        </span>
                      </td>

                      <td className="p-4">
                        {getStatusBadge(userObj)}
                      </td>

                      <td className="p-4 text-slate-400 font-mono text-[11px]">
                        {userObj.last_login ? new Date(userObj.last_login).toLocaleString() : 'Never logged in'}
                      </td>

                      <td className="p-4 text-slate-400 font-mono text-[11px]">
                        {userObj.created_at ? new Date(userObj.created_at).toLocaleDateString() : 'N/A'}
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          
                          <button
                            onClick={() => openViewModal(userObj)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400 border border-[#1F2937] transition"
                            title="View User Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {isPending && (
                            <>
                              <button
                                onClick={() => handleApprove(userObj.id, userObj.username)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold transition flex items-center gap-1"
                                title="Approve Registration"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                              </button>

                              <button
                                onClick={() => handleReject(userObj.id, userObj.username)}
                                className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-[11px] font-bold transition flex items-center gap-1"
                                title="Reject Registration"
                              >
                                <XCircle className="w-3.5 h-3.5" /> Reject
                              </button>
                            </>
                          )}

                          <button
                            onClick={() => handleToggleRole(userObj.id, userObj.username, userObj.role)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-400 border border-[#1F2937] transition"
                            title={isAdminRole ? 'Demote to User' : 'Promote to Admin'}
                          >
                            {isAdminRole ? <ArrowDownRight className="w-3.5 h-3.5 text-blue-400" /> : <ArrowUpRight className="w-3.5 h-3.5 text-purple-400" />}
                          </button>

                          <button
                            onClick={() => openResetModal(userObj)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 border border-[#1F2937] transition"
                            title="Reset User Password"
                          >
                            <Key className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => openEditModal(userObj)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-[#1F2937] transition"
                            title="Edit User Details"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteUser(userObj.id, userObj.username)}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition"
                            title="Delete User Account"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {filteredUsers.length > 0 && (
          <div className="p-4 border-t border-[#1F2937] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 bg-slate-900/40">
            <p>
              Showing <span className="font-bold text-white">{startIndex + 1}</span> to{' '}
              <span className="font-bold text-white">{Math.min(startIndex + itemsPerPage, filteredUsers.length)}</span> of{' '}
              <span className="font-bold text-white">{filteredUsers.length}</span> entries
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                className="px-3 py-1.5 rounded-lg bg-slate-800 disabled:opacity-40 text-slate-300 hover:bg-slate-700 font-semibold transition"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-slate-300 font-mono">
                {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                className="px-3 py-1.5 rounded-lg bg-slate-800 disabled:opacity-40 text-slate-300 hover:bg-slate-700 font-semibold transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* View User Details Modal */}
      {showViewModal && selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-[#1F2937] rounded-2xl max-w-md w-full p-6 space-y-5 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1F2937] pb-3">
              <div className="flex items-center gap-2 font-bold text-lg">
                <UserCheck className="w-5 h-5 text-purple-400" /> User Account Details
              </div>
              <button onClick={() => setShowViewModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-[#1F2937] flex items-center justify-between">
                <span className="text-slate-400">User ID:</span>
                <span className="font-mono font-bold text-purple-300">#{selectedUser.id}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-900/60 border border-[#1F2937]">
                  <p className="text-slate-400 mb-1">Full Name</p>
                  <p className="font-bold text-white">{selectedUser.name}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/60 border border-[#1F2937]">
                  <p className="text-slate-400 mb-1">Username</p>
                  <p className="font-bold text-purple-300">@{selectedUser.username}</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-[#1F2937]">
                <p className="text-slate-400 mb-1">Email Address</p>
                <p className="font-mono text-white">{selectedUser.email}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-900/60 border border-[#1F2937]">
                  <p className="text-slate-400 mb-1">Role</p>
                  <p className="font-bold text-blue-300">{selectedUser.role}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/60 border border-[#1F2937]">
                  <p className="text-slate-400 mb-1">Account Status</p>
                  <div>{getStatusBadge(selectedUser)}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-900/60 border border-[#1F2937]">
                  <p className="text-slate-400 mb-1">Phone Number</p>
                  <p className="font-mono text-white">{selectedUser.phone_number || 'N/A'}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/60 border border-[#1F2937]">
                  <p className="text-slate-400 mb-1">Registered On</p>
                  <p className="font-mono text-white">{selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleDateString() : 'N/A'}</p>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-[#1F2937] rounded-2xl max-w-lg w-full p-6 space-y-4 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1F2937] pb-3">
              <div className="flex items-center gap-2 font-bold text-lg">
                <UserPlus className="w-5 h-5 text-purple-400" /> Add New User Account
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. John Doe"
                  className="w-full p-2.5 rounded-xl glass-input text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Username</label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="johndoe"
                    className="w-full p-2.5 rounded-xl glass-input text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@example.com"
                    className="w-full p-2.5 rounded-xl glass-input text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    placeholder="+1 555-0199"
                    className="w-full p-2.5 rounded-xl glass-input text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full p-2.5 rounded-xl glass-input text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full p-2.5 rounded-xl glass-input text-white bg-slate-900"
                >
                  <option value="User">Standard User</option>
                  <option value="Admin">Administrator</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition shadow-lg shadow-purple-600/30"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-[#1F2937] rounded-2xl max-w-lg w-full p-6 space-y-4 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1F2937] pb-3">
              <div className="flex items-center gap-2 font-bold text-lg">
                <Edit3 className="w-5 h-5 text-purple-400" /> Edit User #{selectedUser.id} ({selectedUser.username})
              </div>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl glass-input text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Username</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full p-2.5 rounded-xl glass-input text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-2.5 rounded-xl glass-input text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full p-2.5 rounded-xl glass-input text-white bg-slate-900"
                  >
                    <option value="User">User</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full p-2.5 rounded-xl glass-input text-white bg-slate-900"
                  >
                    <option value="approved">Approved</option>
                    <option value="pending">Pending</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition shadow-lg shadow-purple-600/30"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Password Reset Modal */}
      {showResetModal && selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-[#1F2937] rounded-2xl max-w-md w-full p-6 space-y-4 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1F2937] pb-3">
              <div className="flex items-center gap-2 font-bold text-lg">
                <Key className="w-5 h-5 text-amber-400" /> Admin Reset Password
              </div>
              <button onClick={() => setShowResetModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <p className="text-xs text-slate-400">
              Set a new password for account <span className="font-bold text-white">@{selectedUser.username}</span> ({selectedUser.email}).
            </p>

            <form onSubmit={handleAdminResetPasswordSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">New Password (min 6 chars)</label>
                <input
                  type="password"
                  required
                  value={adminResetPwd}
                  onChange={(e) => setAdminResetPwd(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full p-2.5 rounded-xl glass-input text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold transition shadow-lg shadow-amber-600/30"
                >
                  Reset Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default UsersPage;
