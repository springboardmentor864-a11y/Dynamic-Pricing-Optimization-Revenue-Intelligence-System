import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to requests automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('pricepilot_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle response errors globally (Auto-logout on expired 401 tokens)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('pricepilot_token');
      localStorage.removeItem('pricepilot_refresh_token');
      localStorage.removeItem('pricepilot_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Health check endpoint
export const checkBackendHealth = async () => {
  try {
    const res = await api.get('/api/health');
    return { online: true, data: res.data };
  } catch (err) {
    try {
      const resRoot = await api.get('/');
      return { online: true, data: resRoot.data };
    } catch (e) {
      return { online: false, error: err.message };
    }
  }
};

// PostgreSQL status & metrics endpoint
export const getDatabaseStatus = async () => {
  try {
    const response = await api.get('/api/db-status');
    return response.data;
  } catch (err) {
    return {
      connected: false,
      status: 'Disconnected',
      database_name: 'pricepilot',
      host: 'localhost',
      port: 5432,
      pool_status: 'Unavailable',
      response_time_ms: 0,
      active_connections: 0,
      error: err.message || 'Database connection error'
    };
  }
};

// Dashboard analytics endpoint
export const getDashboardStats = async () => {
  const response = await api.get('/api/dashboard/stats');
  return response.data;
};

// Machine Learning price prediction endpoint
export const predictPrice = async (payload) => {
  const response = await api.post('/api/predict', payload);
  return response.data;
};

// Historical predictions endpoint
export const getPredictions = async () => {
  const response = await api.get('/api/predictions');
  return response.data;
};

// Admin User Management APIs
export const getAllUsers = async (statusFilter = null) => {
  const url = statusFilter ? `/api/users?status_filter=${statusFilter}` : '/api/users';
  const response = await api.get(url);
  return response.data;
};

export const createUser = async (payload) => {
  const response = await api.post('/api/users', payload);
  return response.data;
};

export const updateUser = async (userId, payload) => {
  const response = await api.put(`/api/users/${userId}`, payload);
  return response.data;
};

export const deleteUser = async (userId) => {
  const response = await api.delete(`/api/users/${userId}`);
  return response.data;
};

export const approveUser = async (userId) => {
  const response = await api.put(`/api/users/${userId}/approve`);
  return response.data;
};

export const rejectUser = async (userId) => {
  const response = await api.put(`/api/users/${userId}/reject`);
  return response.data;
};

export const suspendUser = async (userId) => {
  const response = await api.put(`/api/users/${userId}/suspend`);
  return response.data;
};

export const changeUserRole = async (userId, newRole) => {
  const response = await api.put(`/api/users/${userId}/role?new_role=${newRole}`);
  return response.data;
};

export const adminResetPassword = async (userId, newPassword) => {
  const response = await api.put(`/api/users/${userId}/reset-password?new_password=${encodeURIComponent(newPassword)}`);
  return response.data;
};

// Forgot Password & OTP APIs
export const requestOTP = async (identifier) => {
  const response = await api.post('/api/auth/forgot-password/request-otp', { identifier });
  return response.data;
};

export const verifyOTP = async (identifier, otp_code) => {
  const response = await api.post('/api/auth/forgot-password/verify-otp', { identifier, otp_code });
  return response.data;
};

export const resetPasswordWithOTP = async (identifier, otp_code, new_password) => {
  const response = await api.post('/api/auth/forgot-password/reset-password', { identifier, otp_code, new_password });
  return response.data;
};

// User Profile Update API
export const updateUserProfile = async (payload) => {
  const response = await api.put('/api/auth/profile', payload);
  return response.data;
};

// Excel Export API (Downloads Users_Report.xlsx via openpyxl)
export const exportUsersExcel = async (userIds = null) => {
  const url = userIds ? `/api/admin/export-users?user_ids=${userIds}` : '/api/admin/export-users';
  const response = await api.get(url, {
    responseType: 'blob'
  });
  
  const blob = new Blob([response.data], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.download = 'Users_Report.xlsx';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(link.href);
  return true;
};

// Bulk User Operations
export const bulkUpdateUserStatus = async (userIds, status) => {
  const response = await api.post('/api/users/bulk-status', { user_ids: userIds, status });
  return response.data;
};

export const bulkDeleteUsers = async (userIds) => {
  const response = await api.post('/api/users/bulk-delete', { user_ids: userIds });
  return response.data;
};

// Project Documents APIs
export const getProjectDocuments = async () => {
  const response = await api.get('/api/docs');
  return response.data;
};

export const getDocumentDetails = async (docId) => {
  const response = await api.get(`/api/docs/${docId}`);
  return response.data;
};

export const downloadProjectDocument = async (docId, filename) => {
  const response = await api.get(`/api/docs/download/${docId}`, {
    responseType: 'blob'
  });
  
  const blob = new Blob([response.data], { type: 'application/octet-stream' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.download = filename || `${docId}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(link.href);
  return true;
};

export default api;