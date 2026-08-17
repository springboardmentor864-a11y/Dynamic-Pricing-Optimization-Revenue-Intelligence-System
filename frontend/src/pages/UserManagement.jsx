import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, UserPlus, Trash2, X, AlertCircle, Edit, ToggleLeft, ToggleRight, Terminal, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { getApiUrl } from '../config';
import { useSystem } from '../context/SystemContext';
import GlassSelect from '../components/GlassSelect';

const UserManagement = () => {
  const queryClient = useQueryClient();
  const { showToast } = useSystem();
  
  // Filters and pagination states
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Add Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Viewer');
  const [department, setDepartment] = useState('Operations');
  const [phone, setPhone] = useState('');
  const [formError, setFormError] = useState('');
  const [showActivityModal, setShowActivityModal] = useState(false);

  // Edit Modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [editFullName, setEditFullName] = useState('');
  const [editRole, setEditRole] = useState('Viewer');
  const [editDepartment, setEditDepartment] = useState('Operations');
  const [editPhone, setEditPhone] = useState('');
  const [editStatus, setEditStatus] = useState('Active');
  const [editFormError, setEditFormError] = useState('');

  const roleOptions = [
    { value: '', label: 'All Roles' },
    { value: 'Admin', label: 'Admin' },
    { value: 'Manager', label: 'Manager' },
    { value: 'Viewer', label: 'Viewer' }
  ];

  const modalRoleOptions = [
    { value: 'Admin', label: 'Admin' },
    { value: 'Manager', label: 'Manager' },
    { value: 'Viewer', label: 'Viewer' }
  ];

  const statusOptions = [
    { value: 'Active', label: 'Active' },
    { value: 'Suspended', label: 'Suspended' }
  ];
  
  // Fetch Users List
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['usersList'],
    queryFn: async () => {
      const token = localStorage.getItem('pricepilot_token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const res = await fetch(getApiUrl('/api/users'), { headers });
      if (!res.ok) throw new Error('Failed to load user accounts.');
      const json = await res.json();
      return json.success !== undefined ? json.data : json;
    }
  });

  // Fetch Activity Logs for Audit Timeline
  const { data: auditLogs = [], isLoading: logsLoading } = useQuery({
    queryKey: ['adminAuditLogs'],
    queryFn: async () => {
      const token = localStorage.getItem('pricepilot_token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const res = await fetch(getApiUrl('/api/settings/logs?limit=40'), { headers });
      if (!res.ok) throw new Error('Failed to load audit logs.');
      const json = await res.json();
      return json.success !== undefined ? json.data : json;
    }
  });

  // Create User Mutation
  const createUserMutation = useMutation({
    mutationFn: async (newUser) => {
      const token = localStorage.getItem('pricepilot_token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };
      const res = await fetch(getApiUrl('/api/users'), {
        method: 'POST',
        headers,
        body: JSON.stringify(newUser)
      });
      if (!res.ok) {
        let errMsg = 'Failed to create user account.';
        try {
          const data = await res.json();
          errMsg = data.message || data.detail || (data.error ? String(data.error) : errMsg);
        } catch (e) {}
        throw new Error(errMsg);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usersList'] });
      queryClient.invalidateQueries({ queryKey: ['adminAuditLogs'] });
      setShowAddModal(false);
      showToast('success', 'Enterprise account created successfully.');
      resetForm();
    },
    onError: (err) => {
      setFormError(err.message);
    }
  });

  // Update User Mutation (Edit profile & Toggle Status)
  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, payload }) => {
      const token = localStorage.getItem('pricepilot_token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };
      const res = await fetch(getApiUrl(`/api/users/${userId}`), {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        let errMsg = 'Failed to update user account.';
        try {
          const data = await res.json();
          errMsg = data.message || data.detail || (data.error ? String(data.error) : errMsg);
        } catch (e) {}
        throw new Error(errMsg);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usersList'] });
      queryClient.invalidateQueries({ queryKey: ['adminAuditLogs'] });
      setShowEditModal(false);
      showToast('success', 'User profile updated successfully.');
    },
    onError: (err) => {
      setEditFormError(err.message);
      showToast('error', err.message);
    }
  });

  // Delete User Mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId) => {
      const token = localStorage.getItem('pricepilot_token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const res = await fetch(getApiUrl(`/api/users/${userId}`), {
        method: 'DELETE',
        headers
      });
      if (!res.ok) {
        let errMsg = 'Failed to delete account.';
        try {
          const data = await res.json();
          errMsg = data.message || data.detail || (data.error ? String(data.error) : errMsg);
        } catch (e) {}
        throw new Error(errMsg);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usersList'] });
      queryClient.invalidateQueries({ queryKey: ['adminAuditLogs'] });
      showToast('success', 'User account successfully removed.');
    },
    onError: (err) => {
      showToast('error', err.message);
    }
  });

  const resetForm = () => {
    setFullName('');
    setEmail('');
    setPassword('');
    setRole('Viewer');
    setDepartment('Operations');
    setPhone('');
    setFormError('');
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setFormError('Please fill out all required fields.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setFormError('Invalid email address format.');
      return;
    }
    if (password.length < 6) {
      setFormError('Password must be at least 6 characters long.');
      return;
    }
    const allowedRoles = ['Admin', 'Manager', 'Viewer'];
    if (!allowedRoles.includes(role)) {
      setFormError('Invalid user role selected.');
      return;
    }
    if (!department.trim()) {
      setFormError('Department assignment is required.');
      return;
    }
    if (phone && !/^[+0-9\s\-()]{5,20}$/.test(phone.trim())) {
      setFormError('Invalid phone number format.');
      return;
    }
    setFormError('');
    createUserMutation.mutate({
      full_name: fullName.trim(),
      email: email.trim(),
      password,
      role,
      department: department.trim(),
      phone: phone.trim() || null
    });
  };

  const handleOpenEdit = (user) => {
    setEditingUserId(user.id);
    setEditFullName(user.full_name || '');
    setEditRole(user.role || 'Viewer');
    setEditDepartment(user.department || '');
    setEditPhone(user.phone || '');
    setEditStatus(user.status || 'Active');
    setEditFormError('');
    setShowEditModal(true);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editFullName.trim()) {
      setEditFormError('Name is a required field.');
      return;
    }
    const allowedRoles = ['Admin', 'Manager', 'Viewer'];
    if (!allowedRoles.includes(editRole)) {
      setEditFormError('Invalid user role selected.');
      return;
    }
    if (!editDepartment.trim()) {
      setEditFormError('Department assignment is required.');
      return;
    }
    if (editPhone && !/^[+0-9\s\-()]{5,20}$/.test(editPhone.trim())) {
      setEditFormError('Invalid phone number format.');
      return;
    }
    setEditFormError('');
    updateUserMutation.mutate({
      userId: editingUserId,
      payload: {
        full_name: editFullName.trim(),
        role: editRole,
        department: editDepartment.trim(),
        phone: editPhone.trim() || null,
        status: editStatus
      }
    });
  };

  const handleToggleStatus = (u) => {
    if (u.email === 'admin@pricepilot.ai') {
      showToast('error', 'The system administrator status cannot be modified.');
      return;
    }
    const nextStatus = u.status === 'Active' ? 'Suspended' : 'Active';
    if (window.confirm(`Are you sure you want to change user status for ${u.full_name} to ${nextStatus}?`)) {
      updateUserMutation.mutate({
        userId: u.id,
        payload: { status: nextStatus }
      });
    }
  };

  const handleDelete = (id, mail) => {
    if (mail === 'admin@pricepilot.ai') {
      showToast('error', 'The system administrator cannot be deleted.');
      return;
    }
    if (window.confirm(`Warning: Are you sure you want to permanently revoke credentials for user: ${mail}?`)) {
      deleteUserMutation.mutate(id);
    }
  };

  // Filter & Search Logic
  const usersList = Array.isArray(users) ? users : [];
  const filteredUsers = usersList.filter(user => {
    const matchesSearch = (user.full_name || '').toLowerCase().includes(search.toLowerCase()) || 
                          (user.email || '').toLowerCase().includes(search.toLowerCase()) ||
                          (user.department || '').toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === '' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Pagination bounds calculation
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / itemsPerPage));
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [search, roleFilter]);

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto pb-12 select-none">
      
      {/* Page Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight font-outfit">User Administration</h1>
          <p className="text-xs text-[#B8BCC8] mt-1.5 font-medium">Audit, provision, edit, or toggle access credentials for enterprise staff.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            type="button"
            onClick={() => setShowActivityModal(true)}
            className="px-3.5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 uppercase tracking-wider text-[10px] font-outfit"
          >
            <Terminal className="w-3.5 h-3.5 text-[#da4e24]" /> View Activity Logs
          </button>
          <button 
            type="button"
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center gap-2 self-start sm:self-center uppercase font-bold tracking-wider text-[10px]"
          >
            <UserPlus className="w-4 h-4" /> Provision Account
          </button>
        </div>
      </div>

      {/* Filters & Quick Search row */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 bg-white/[0.02] border border-white/[0.06] p-4 rounded-2xl backdrop-blur-xl">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#B8BCC8]/50 absolute left-3 top-3.5" />
          <input
            type="text"
            placeholder="Search by name, email, or department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white/[0.03] border border-white/[0.08] focus:border-[#da4e24] text-white rounded-xl text-xs outline-none transition-all placeholder-[#B8BCC8]/40 focus:bg-white/[0.06]"
          />
        </div>
        <GlassSelect
          value={roleFilter}
          onChange={(val) => setRoleFilter(val)}
          options={roleOptions}
          className="w-full sm:w-44"
        />
      </div>

      {/* Main Users Table Card */}
      <div className="glass-card overflow-hidden shadow-lg rounded-[24px]">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-[#B8BCC8]/40 font-semibold animate-pulse">
            Loading user list sheets...
          </div>
        ) : (
          <div className="p-4 space-y-4">
            <div className="overflow-x-auto">
              <table className="glass-table min-w-[900px]">
                <thead>
                  <tr>
                    <th className="glass-table-header">Identity</th>
                    <th className="glass-table-header">Department</th>
                    <th className="glass-table-header">Role</th>
                    <th className="glass-table-header">Status</th>
                    <th className="glass-table-header">Created</th>
                    <th className="glass-table-header">Last Login</th>
                    <th className="glass-table-header text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.02]">
                  {currentUsers.length > 0 ? (
                    currentUsers.map((u) => (
                      <tr key={u.id} className="glass-table-row">
                        <td className="glass-table-cell">
                          <div className="flex items-center gap-3">
                            <img 
                              src={u.profile_image || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80"} 
                              alt={u.full_name}
                              className="w-8 h-8 rounded-full object-cover border border-white/[0.08]"
                            />
                            <div>
                              <span className="block font-bold text-white font-outfit">{u.full_name}</span>
                              <span className="block text-[11px] text-[#B8BCC8]/60 font-semibold mt-0.5">{u.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="glass-table-cell font-semibold text-[#B8BCC8]">{u.department || 'N/A'}</td>
                        <td className="glass-table-cell">
                          <span className="px-2.5 py-1 rounded-lg bg-white/[0.04] text-[#B8BCC8] border border-white/[0.08] text-[9px] font-bold uppercase tracking-wider font-outfit">
                            {u.role}
                          </span>
                        </td>
                        <td className="glass-table-cell">
                          <button
                            onClick={() => handleToggleStatus(u)}
                            className="focus:outline-none"
                            title="Click to toggle account access status"
                          >
                            <span className={u.status === 'Active' ? 'badge-active' : 'badge-suspended'}>
                              {u.status || 'Active'}
                            </span>
                          </button>
                        </td>
                        <td className="glass-table-cell text-xs text-[#B8BCC8]/50 font-bold">
                          {u.created_date ? new Date(u.created_date).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="glass-table-cell text-xs text-[#B8BCC8]/50 font-bold">
                          {u.last_login ? new Date(u.last_login).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Never'}
                        </td>
                        <td className="glass-table-cell text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleToggleStatus(u)}
                              className={`p-2 rounded-xl bg-white/[0.02] border border-white/[0.08] transition-all duration-200 hover:text-white ${u.status === 'Active' ? 'text-white/60 hover:border-white/20' : 'text-[#FF5D73]/60 border-[#FF5D73]/10 hover:border-[#FF5D73]/30'}`}
                              title={u.status === 'Active' ? "Suspend account access" : "Activate account access"}
                              disabled={u.email === 'admin@pricepilot.ai'}
                            >
                              {u.status === 'Active' ? <ToggleRight className="w-4 h-4 text-[#2ED47A]" /> : <ToggleLeft className="w-4 h-4 text-[#B8BCC8]" />}
                            </button>
                            <button 
                              onClick={() => handleOpenEdit(u)}
                              className="p-2 rounded-xl bg-white/[0.02] hover:bg-white/5 border border-white/[0.08] hover:border-white/[0.14] text-[#B8BCC8]/60 hover:text-white transition-all duration-200"
                              title="Edit user profile"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDelete(u.id, u.email)}
                              className="p-2 rounded-xl bg-white/[0.02] hover:bg-white/5 border border-white/[0.08] hover:border-white/[0.14] text-[#B8BCC8]/60 hover:text-[#FF5D73] transition-all duration-200"
                              title="Delete user account"
                              disabled={u.email === 'admin@pricepilot.ai'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-xs text-[#B8BCC8]/40 font-bold">
                        No active users matching criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-white/[0.04]">
                <span className="text-[10px] text-[#B8BCC8]/50 font-bold uppercase tracking-wider">
                  Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredUsers.length)} of {filteredUsers.length} Users
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg bg-white/[0.02] hover:bg-white/5 border border-white/[0.08] text-[#B8BCC8] disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => handlePageChange(i + 1)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-bold font-mono transition-all ${currentPage === i + 1 ? 'bg-gradient-to-tr from-[#da4e24] to-[#0098f3] text-white border-transparent' : 'bg-white/[0.02] hover:bg-white/5 text-[#B8BCC8] border-white/[0.08]'}`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg bg-white/[0.02] hover:bg-white/5 border border-white/[0.08] text-[#B8BCC8] disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>



      {/* PROVISION USER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto p-4 pt-[10vh]">
          <div onClick={() => setShowAddModal(false)} className="fixed inset-0 bg-black/75 backdrop-blur-[15px]" />
          
          <div className="relative mx-auto max-w-lg bg-[#0d0d0d]/95 border border-white/[0.08] backdrop-blur-[35px] rounded-2xl shadow-2xl overflow-hidden p-6 text-xs animate-slideUp">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-4 mb-5">
              <h3 className="text-sm font-extrabold text-white uppercase tracking-wider font-outfit">Provision Enterprise Credentials</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg hover:bg-white/5 text-[#B8BCC8] hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 mb-4 bg-[#FF5D73]/10 border border-[#FF5D73]/20 text-[#FF5D73] rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="font-bold">{formError}</span>
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[#B8BCC8]/60 uppercase tracking-widest block font-outfit">Full Name *</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Sarah Jenkins"
                    className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/[0.08] focus:border-[#da4e24] text-white rounded-xl outline-none placeholder-[#B8BCC8]/40 transition-all focus:bg-white/[0.06]"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[#B8BCC8]/60 uppercase tracking-widest block font-outfit">Email Address *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="sarah.j@company.com"
                    className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/[0.08] focus:border-[#da4e24] text-white rounded-xl outline-none placeholder-[#B8BCC8]/40 transition-all focus:bg-white/[0.06]"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#B8BCC8]/60 uppercase tracking-widest block font-outfit">Temporary Password *</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/[0.08] focus:border-[#da4e24] text-white rounded-xl outline-none placeholder-[#B8BCC8]/40 transition-all focus:bg-white/[0.06]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[#B8BCC8]/60 uppercase tracking-widest block font-outfit">Enterprise Role *</label>
                  <GlassSelect
                    value={role}
                    onChange={(val) => setRole(val)}
                    options={modalRoleOptions}
                    className="w-full"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[#B8BCC8]/60 uppercase tracking-widest block font-outfit">Department *</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="Sales Planning"
                    className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/[0.08] focus:border-[#da4e24] text-white rounded-xl outline-none placeholder-[#B8BCC8]/40 transition-all focus:bg-white/[0.06]"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#B8BCC8]/60 uppercase tracking-widest block font-outfit">Contact Phone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 012-3456"
                  className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/[0.08] focus:border-[#da4e24] text-white rounded-xl outline-none placeholder-[#B8BCC8]/40 transition-all focus:bg-white/[0.06]"
                />
              </div>

              <div className="pt-4 border-t border-white/[0.06] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-secondary uppercase font-bold tracking-wider text-[10px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createUserMutation.isPending}
                  className="btn-primary uppercase font-bold tracking-wider text-[10px]"
                >
                  {createUserMutation.isPending ? 'Provisioning...' : 'Provision User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto p-4 pt-[10vh]">
          <div onClick={() => setShowEditModal(false)} className="fixed inset-0 bg-black/75 backdrop-blur-[15px]" />
          
          <div className="relative mx-auto max-w-lg bg-[#0d0d0d]/95 border border-white/[0.08] backdrop-blur-[35px] rounded-2xl shadow-2xl overflow-hidden p-6 text-xs animate-slideUp">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-4 mb-5">
              <h3 className="text-sm font-extrabold text-white uppercase tracking-wider font-outfit">Edit User Settings</h3>
              <button 
                onClick={() => setShowEditModal(false)}
                className="p-1 rounded-lg hover:bg-white/5 text-[#B8BCC8] hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {editFormError && (
              <div className="p-3 mb-4 bg-[#FF5D73]/10 border border-[#FF5D73]/20 text-[#FF5D73] rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="font-bold">{editFormError}</span>
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#B8BCC8]/60 uppercase tracking-widest block font-outfit">Full Name *</label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/[0.08] focus:border-[#da4e24] text-white rounded-xl outline-none placeholder-[#B8BCC8]/40 transition-all focus:bg-white/[0.06]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[#B8BCC8]/60 uppercase tracking-widest block font-outfit">Enterprise Role *</label>
                  <GlassSelect
                    value={editRole}
                    onChange={(val) => setEditRole(val)}
                    options={modalRoleOptions}
                    className="w-full"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[#B8BCC8]/60 uppercase tracking-widest block font-outfit">Department *</label>
                  <input
                    type="text"
                    value={editDepartment}
                    onChange={(e) => setEditDepartment(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/[0.08] focus:border-[#da4e24] text-white rounded-xl outline-none placeholder-[#B8BCC8]/40 transition-all focus:bg-white/[0.06]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[#B8BCC8]/60 uppercase tracking-widest block font-outfit">Contact Phone</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="+1 (555) 012-3456"
                    className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/[0.08] focus:border-[#da4e24] text-white rounded-xl outline-none placeholder-[#B8BCC8]/40 transition-all focus:bg-white/[0.06]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[#B8BCC8]/60 uppercase tracking-widest block font-outfit">Account Status *</label>
                  <GlassSelect
                    value={editStatus}
                    onChange={(val) => setEditStatus(val)}
                    options={statusOptions}
                    className="w-full"
                    disabled={editingUserId === 'usr-admin'} // prevent self lock
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-white/[0.06] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="btn-secondary uppercase font-bold tracking-wider text-[10px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateUserMutation.isPending}
                  className="btn-primary uppercase font-bold tracking-wider text-[10px]"
                >
                  {updateUserMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ACTIVITY LOGS MODAL / SIDE DRAWER */}
      {showActivityModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto p-4 pt-[10vh]">
          <div onClick={() => setShowActivityModal(false)} className="fixed inset-0 bg-black/75 backdrop-blur-[15px]" />
          
          <div className="relative mx-auto max-w-2xl bg-[#0d0d0d]/95 border border-white/[0.08] backdrop-blur-[35px] rounded-2xl shadow-2xl overflow-hidden p-6 text-xs animate-slideUp">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-4 mb-5">
              <h3 className="text-sm font-extrabold text-white uppercase tracking-wider font-outfit flex items-center gap-2">
                <Terminal className="w-5 h-5 text-[#da4e24]" /> Platform Activity Audit Trail
              </h3>
              <button 
                onClick={() => setShowActivityModal(false)}
                className="p-1 rounded-lg hover:bg-white/5 text-[#B8BCC8] hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-[400px] overflow-y-auto divide-y divide-white/[0.03] pr-1">
              {logsLoading ? (
                <div className="py-8 text-center text-xs text-[#B8BCC8]/30 font-semibold animate-pulse">Loading system log indexes...</div>
              ) : auditLogs.length > 0 ? (
                auditLogs.map((log, idx) => (
                  <div key={log.id || idx} className="p-3 text-[11px] flex justify-between items-start gap-4 hover:bg-white/[0.01] transition-colors rounded-xl font-semibold font-outfit">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-white">{log.action || 'Event Log'}</span>
                        <span className="px-1.5 py-0.5 rounded bg-white/[0.04] text-[8px] uppercase tracking-wider font-bold text-[#B8BCC8]/50 border border-white/[0.06]">
                          {log.module || 'General'}
                        </span>
                      </div>
                      <p className="text-[#B8BCC8]/75 text-[10px] leading-relaxed">{log.description || log.details}</p>
                      <span className="block text-[9px] text-[#B8BCC8]/40 font-mono italic">Triggered by: {log.user_email || 'System daemon'}</span>
                    </div>
                    <span className="text-[9px] text-[#B8BCC8]/45 font-mono shrink-0 pt-0.5">
                      {log.timestamp ? new Date(log.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : ''}
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-[#B8BCC8]/40 text-xs font-semibold">No operational activities recorded on this workspace.</div>
              )}
            </div>

            <div className="pt-4 border-t border-white/[0.06] flex justify-end">
              <button
                type="button"
                onClick={() => setShowActivityModal(false)}
                className="btn-secondary uppercase font-bold tracking-wider text-[10px]"
              >
                Close Audit Trail
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default UserManagement;
