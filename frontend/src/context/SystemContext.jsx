import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getApiUrl } from '../config';
import { useAuth } from './AuthContext';

const SystemContext = createContext(null);

export const SystemProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [workspace, setWorkspace] = useState('PricePilot AI');
  const [commandOpen, setCommandOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [dbStatus, setDbStatus] = useState({ active_engine: 'postgresql' });
  const [backendOnline, setBackendOnline] = useState(false);

  const showToast = useCallback((type, message) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 5000);
  }, []);

  const checkBackendStatus = useCallback(async () => {
    try {
      const res = await fetch(getApiUrl('/'));
      if (res.ok) {
        setBackendOnline(true);
      } else {
        setBackendOnline(false);
      }
    } catch (e) {
      setBackendOnline(false);
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(getApiUrl('/api/notifications'));
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.success !== undefined && data.data !== undefined ? data.data : data || []);
      }
      
      const countRes = await fetch(getApiUrl('/api/notifications/unread-count'));
      if (countRes.ok) {
        const data = await countRes.json();
        const parsedData = (data.success !== undefined && data.data !== undefined) ? data.data : data;
        setUnreadCount(parsedData?.count || 0);
      }
    } catch (e) {
      console.error('Failed to fetch notifications:', e);
    }
  }, [user]);

  const markNotificationAsRead = async (id = null) => {
    try {
      const url = id 
        ? getApiUrl(`/api/notifications/read?notif_id=${id}`) 
        : getApiUrl('/api/notifications/read');
      const res = await fetch(url, { method: 'POST' });
      if (res.ok) {
        fetchNotifications();
      }
    } catch (e) {
      console.error('Failed to mark notifications as read:', e);
    }
  };

  const clearAllNotifications = async () => {
    try {
      const res = await fetch(getApiUrl('/api/notifications/clear'), { method: 'POST' });
      if (res.ok) {
        fetchNotifications();
        showToast('success', 'Cleared all notifications.');
      }
    } catch (e) {
      console.error('Failed to clear notifications:', e);
    }
  };

  const fetchDbSettings = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(getApiUrl('/api/settings/db'));
      if (res.ok) {
        const data = await res.json();
        setDbStatus(data.success !== undefined && data.data !== undefined ? data.data : data || { active_engine: 'postgresql' });
      }
    } catch (e) {
      console.error('Failed to fetch DB configurations:', e);
    }
  }, [user]);

  // Boot up sequences
  useEffect(() => {
    checkBackendStatus();
    const interval = setInterval(checkBackendStatus, 15000);
    return () => clearInterval(interval);
  }, [checkBackendStatus]);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      fetchDbSettings();
      // Poll notifications every 10 seconds for real-time dashboard feeling
      const interval = setInterval(fetchNotifications, 10000);
      return () => clearInterval(interval);
    }
  }, [user, fetchNotifications, fetchDbSettings]);

  return (
    <SystemContext.Provider value={{
      notifications,
      unreadCount,
      workspace,
      setWorkspace,
      commandOpen,
      setCommandOpen,
      toast,
      showToast,
      dbStatus,
      setDbStatus,
      backendOnline,
      checkBackendStatus,
      fetchNotifications,
      fetchDbSettings,
      markNotificationAsRead,
      clearAllNotifications
    }}>
      {children}
    </SystemContext.Provider>
  );
};

export const useSystem = () => {
  const context = useContext(SystemContext);
  if (!context) {
    throw new Error('useSystem must be used inside a SystemProvider');
  }
  return context;
};
