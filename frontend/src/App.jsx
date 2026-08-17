import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SystemProvider, useSystem } from './context/SystemContext';

// Existing Pages
import Dashboard from './pages/Dashboard';
import DatasetExplorer from './pages/DatasetExplorer';
import TrainModels from './pages/TrainModels';
import Predictor from './pages/Predictor';
import DemandForecast from './pages/DemandForecast';
import ModelComparison from './pages/ModelComparison';
import Insights from './pages/Insights';

// New Redesigned Pages
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Profile from './pages/Profile';
import Analytics from './pages/Analytics';
import UserManagement from './pages/UserManagement';
import PredictionHistory from './pages/PredictionHistory';
import Settings from './pages/Settings';
import Landing from './pages/Landing';
import About from './pages/About';
import Help from './pages/Help';

// Core Layout Frame
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';

// Create a React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000,
    },
  },
});

// Route Guard for authenticated pages
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen bg-[#09090b] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Route Guard for unauthenticated pages (like Login)
const GuestRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen bg-[#09090b] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Main App Router Config wrapper
const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Showcase Landing Page */}
      <Route path="/" element={<Landing />} />

      {/* Guest Route Auth Pages */}
      <Route 
        path="/login" 
        element={
          <GuestRoute>
            <Login />
          </GuestRoute>
        } 
      />
      <Route 
        path="/register" 
        element={
          <GuestRoute>
            <Register />
          </GuestRoute>
        } 
      />
      <Route 
        path="/forgot-password" 
        element={
          <GuestRoute>
            <ForgotPassword />
          </GuestRoute>
        } 
      />

      {/* Main SaaS Platform Application Area */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        {/* Core SaaS Pages */}
        <Route path="dashboard" element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
        <Route path="predictor" element={<ErrorBoundary><Predictor /></ErrorBoundary>} />
        <Route path="forecasting" element={<ErrorBoundary><DemandForecast /></ErrorBoundary>} />
        <Route path="explorer" element={<ErrorBoundary><DatasetExplorer /></ErrorBoundary>} />
        <Route path="training" element={<ErrorBoundary><TrainModels /></ErrorBoundary>} />
        <Route path="comparison" element={<ErrorBoundary><ModelComparison /></ErrorBoundary>} />
        <Route path="insights" element={<ErrorBoundary><Insights /></ErrorBoundary>} />
        <Route path="analytics" element={<ErrorBoundary><Analytics /></ErrorBoundary>} />
        <Route path="users" element={<ErrorBoundary><UserManagement /></ErrorBoundary>} />
        <Route path="history" element={<ErrorBoundary><PredictionHistory /></ErrorBoundary>} />
        <Route path="settings" element={<ErrorBoundary><Settings /></ErrorBoundary>} />
        <Route path="profile" element={<ErrorBoundary><Profile /></ErrorBoundary>} />
        <Route path="about" element={<ErrorBoundary><About /></ErrorBoundary>} />
        <Route path="help" element={<ErrorBoundary><Help /></ErrorBoundary>} />
      </Route>

      {/* Fallback routes */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

import { DashboardDataProvider } from './context/DashboardDataContext';

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <SystemProvider>
            <DashboardDataProvider>
              {/* Global toast notification system */}
              <ToastContainer />
              
              {/* Platform routes */}
              <AppRoutes />
            </DashboardDataProvider>
          </SystemProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

// Global Floating Toast Container Component
const ToastContainer = () => {
  const { toast } = useSystem();

  if (!toast) return null;

  const bgStyles = {
    success: 'bg-[#18181b] border-emerald-500/20 text-emerald-400',
    error: 'bg-[#18181b] border-rose-500/20 text-rose-400',
    info: 'bg-[#18181b] border-indigo-500/20 text-indigo-400'
  };

  return (
    <div className="fixed bottom-6 left-6 z-50 animate-fadeIn max-w-sm rounded-xl border p-4 shadow-xl flex items-center gap-3 bg-[#18181b] transition-all duration-300">
      <div className={`w-2 h-2 rounded-full ${toast.type === 'success' ? 'bg-emerald-400' : toast.type === 'error' ? 'bg-rose-400' : 'bg-indigo-400 animate-pulse'}`} />
      <div>
        <h5 className="text-[10px] font-bold uppercase tracking-wider text-white">
          {toast.type === 'success' ? 'Task Completed' : toast.type === 'error' ? 'Error Alert' : 'System Event'}
        </h5>
        <p className="text-xs text-[#a1a1aa] mt-0.5 leading-relaxed">{toast.message}</p>
      </div>
    </div>
  );
};

export default App;
