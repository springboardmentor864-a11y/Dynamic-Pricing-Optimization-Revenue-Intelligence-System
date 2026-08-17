import React, { createContext, useContext, useState, useEffect } from 'react';
import { getApiUrl } from '../config';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage on startup
  useEffect(() => {
    const savedUser = localStorage.getItem('pricepilot_user');
    if (savedUser) {
      try {
        const parsed = jsonParseSafely(savedUser);
        if (parsed) {
          setUser(parsed);
          refreshProfileFromUser(parsed);
        } else {
          setLoading(false);
        }
      } catch (e) {
        localStorage.removeItem('pricepilot_user');
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const refreshProfileFromUser = async (u) => {
    if (!u || u.is_guest) {
      setLoading(false);
      return;
    }
    try {
      const token = localStorage.getItem('pricepilot_token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const res = await fetch(getApiUrl(`/api/auth/profile?email=${u.email}`), { headers });
      if (res.ok) {
        const profile = await res.json();
        const profileData = (profile.success !== undefined && profile.data !== undefined) ? profile.data : profile;
        if (profileData.status && profileData.status !== 'Active') {
          logout();
          setLoading(false);
          return;
        }
        const updated = { 
          ...u, 
          id: profileData.id,
          full_name: profileData.name || profileData.full_name,
          email: profileData.email,
          role: profileData.role,
          department: profileData.department || u.department || 'Executive Suite',
          status: profileData.status || 'Active',
          profile_image: profileData.profile_image || u.profile_image,
          created_date: profileData.created_date || profileData.created_at || u.created_date,
          last_login: profileData.last_login || u.last_login
        };
        setUser(updated);
        localStorage.setItem('pricepilot_user', JSON.stringify(updated));
      } else if (res.status === 401 || res.status === 404) {
        logout();
      }
    } catch (e) {
      console.error('Failed to refresh user profile:', e);
    } finally {
      setLoading(false);
    }
  };

  const jsonParseSafely = (str) => {
    try {
      return JSON.parse(str);
    } catch (e) {
      return null;
    }
  };

  /**
   * Legacy email/password authentication (Falls back to hashed credential logic in backend).
   */
  const login = async (email, password) => {
    try {
      const res = await fetch(getApiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || errData.detail || 'Authentication failed.');
      }

      const data = await res.json();
      const rawData = (data.success !== undefined && data.data !== undefined) ? data.data : data;

      if (rawData.success && rawData.user) {
        const userData = {
          id: rawData.user.id,
          full_name: rawData.user.name || rawData.user.full_name || 'Current User',
          email: rawData.user.email,
          role: rawData.user.role || 'Admin',
          department: rawData.user.role === 'Viewer' || rawData.user.email?.includes('guest') ? 'Operations Management' : 'Executive Suite',
          status: 'Active',
          profile_image: rawData.user.profile_image || (rawData.user.role === 'Viewer' || rawData.user.email?.includes('guest')
            ? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
            : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'),
          created_date: rawData.user.created_at || new Date().toISOString(),
          last_login: rawData.user.last_login || new Date().toISOString()
        };
        setUser(userData);
        localStorage.setItem('pricepilot_user', JSON.stringify(userData));
        if (rawData.token) {
          localStorage.setItem('pricepilot_token', rawData.token);
        }
        return { success: true };
      }
      throw new Error(rawData.message || 'Malformed server response.');
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  /**
   * Standard Guest login bypass.
   */
  const loginAsGuest = () => {
    const guestUser = {
      id: 'usr-guest-002',
      full_name: 'Guest User',
      email: 'guest@pricepilot.ai',
      role: 'Viewer',
      department: 'Operations Management',
      phone: '+1-555-0100',
      status: 'Active',
      profile_image: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      created_date: new Date().toISOString(),
      last_login: new Date().toISOString(),
      is_guest: true
    };
    setUser(guestUser);
    localStorage.setItem('pricepilot_user', JSON.stringify(guestUser));
    // Set a matching mock token
    localStorage.setItem('pricepilot_token', `mock-token-usr-guest-002-${Date.now()}`);
    return { success: true };
  };

  const logout = async () => {
    setUser(null);
    localStorage.removeItem('pricepilot_user');
    localStorage.removeItem('pricepilot_token');
  };

  /**
   * Registers a new user via local database.
   */
  const register = async (email, password, fullName) => {
    try {
      const res = await fetch(getApiUrl('/api/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, full_name: fullName, role: 'User', department: 'Operations' })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || errData.detail || 'Local database registration sync failed.');
      }

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Self-registration backend response failed.');
      }

      return await login(email, password);
    } catch (err) {
      console.error("Self-registration failed: ", err);
      return { success: false, error: err.message };
    }
  };

  /**
   * Triggers Password Reset flow.
   */
  const sendPasswordReset = async (email) => {
    try {
      console.log("Mocking password reset email dispatch for:", email);
      return { success: true };
    } catch (err) {
      console.error("Password reset dispatch failed: ", err);
      return { success: false, error: err.message };
    }
  };

  const refreshProfile = async () => {
    if (!user || user.is_guest) return;
    try {
      const res = await fetch(getApiUrl(`/api/auth/profile?email=${user.email}`));
      if (res.ok) {
        const profile = await res.json();
        const profileData = (profile.success !== undefined && profile.data !== undefined) ? profile.data : profile;
        const updated = { ...user, ...profileData };
        setUser(updated);
        localStorage.setItem('pricepilot_user', JSON.stringify(updated));
      }
    } catch (e) {
      console.error('Failed to refresh user profile:', e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, loginAsGuest, logout, refreshProfile, register, sendPasswordReset }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return context;
};
