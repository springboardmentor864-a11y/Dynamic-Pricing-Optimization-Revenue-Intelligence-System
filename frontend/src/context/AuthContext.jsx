import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('pricepilot_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('pricepilot_token') || null;
  });

  const [refreshToken, setRefreshToken] = useState(() => {
    return localStorage.getItem('pricepilot_refresh_token') || null;
  });

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('pricepilot_theme') || 'dark';
  });

  const [loading, setLoading] = useState(false);

  // Sync theme class to document entity
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    if (theme === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
      body.classList.remove('dark');
      body.classList.add('light');
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
      body.classList.remove('light');
      body.classList.add('dark');
    }
    localStorage.setItem('pricepilot_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Sync tokens to localStorage and API client
  useEffect(() => {
    if (token) {
      localStorage.setItem('pricepilot_token', token);
    } else {
      localStorage.removeItem('pricepilot_token');
    }
  }, [token]);

  useEffect(() => {
    if (refreshToken) {
      localStorage.setItem('pricepilot_refresh_token', refreshToken);
    } else {
      localStorage.removeItem('pricepilot_refresh_token');
    }
  }, [refreshToken]);

  // Sync user object to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem('pricepilot_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('pricepilot_user');
    }
  }, [user]);

  const login = async (username, password) => {
    setLoading(true);
    try {
      const response = await api.post('/api/auth/login', { username, password });
      const { access_token, refresh_token: rToken, user: userData } = response.data;

      setToken(access_token);
      if (rToken) setRefreshToken(rToken);
      setUser(userData);
      setLoading(false);

      return { success: true, user: userData };
    } catch (error) {
      setLoading(false);
      const detail = error.response?.data?.detail || 'Authentication failed. Invalid credentials or database connection issue.';
      return { success: false, error: detail };
    }
  };

  const register = async (nameOrObj, email, username, password) => {
    setLoading(true);
    try {
      let payload;
      if (typeof nameOrObj === 'object' && nameOrObj !== null) {
        payload = nameOrObj;
      } else {
        payload = { name: nameOrObj, email, username, password };
      }

      const response = await api.post('/api/auth/register', payload);
      setLoading(false);

      // If backend issued tokens (e.g. first admin user auto-approved)
      if (response.data.access_token && response.data.user) {
        setToken(response.data.access_token);
        if (response.data.refresh_token) setRefreshToken(response.data.refresh_token);
        setUser(response.data.user);
      }

      return {
        success: true,
        message: response.data.message || 'Registration successful! Awaiting admin approval.',
        user: response.data.user
      };
    } catch (error) {
      setLoading(false);
      const detail = error.response?.data?.detail || 'Registration failed. Please verify input fields.';
      return { success: false, error: detail };
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await api.put('/api/auth/profile', profileData);
      const updatedUser = response.data;
      setUser((prev) => ({ ...prev, ...updatedUser }));
      return { success: true, user: updatedUser };
    } catch (error) {
      const detail = error.response?.data?.detail || 'Failed to update profile details.';
      return { success: false, error: detail };
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await api.post('/api/auth/logout');
      }
    } catch (err) {
      console.warn('Logout API notification:', err);
    } finally {
      setToken(null);
      setRefreshToken(null);
      setUser(null);
      localStorage.removeItem('pricepilot_token');
      localStorage.removeItem('pricepilot_refresh_token');
      localStorage.removeItem('pricepilot_user');
    }
  };

  const normalizedRole = user?.role?.toLowerCase() || '';
  const isAdmin = ['admin', 'administrator'].includes(normalizedRole);
  const isUser = ['user', 'viewer', 'team member'].includes(normalizedRole);

  const hasRole = (allowedRoles) => {
    if (!user || !user.role) return false;
    const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    const rolesLower = rolesArray.map((r) => r.toLowerCase());

    if (isAdmin && (rolesLower.includes('admin') || rolesLower.includes('administrator'))) {
      return true;
    }
    if (isUser && (rolesLower.includes('user') || rolesLower.includes('viewer') || rolesLower.includes('team member'))) {
      return true;
    }
    return rolesLower.includes(normalizedRole);
  };

  const value = {
    user,
    setUser,
    token,
    refreshToken,
    isAuthenticated: !!token && !!user,
    isAdmin,
    isUser,
    loading,
    theme,
    toggleTheme,
    login,
    register,
    updateProfile,
    logout,
    hasRole
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;