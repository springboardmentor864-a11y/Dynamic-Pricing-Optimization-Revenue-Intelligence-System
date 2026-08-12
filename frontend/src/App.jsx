import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';

import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';

import CompetitorAnalysisPage from './pages/CompetitorAnalysisPage';
const CompetitorAnalyticsPage = CompetitorAnalysisPage;

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import PredictionPage from './pages/PredictionPage';
import HistoryPage from './pages/HistoryPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ReportsPage from './pages/ReportsPage';
import DatasetPage from './pages/DatasetPage';
import MLModelsPage from './pages/MLModelsPage';
import ModelPerformancePage from './pages/ModelPerformancePage';
import SettingsPage from './pages/SettingsPage';
import ProfilePage from './pages/ProfilePage';
import UsersPage from './pages/UsersPage';
import DatabasePage from './pages/DatabasePage';
import AboutPage from './pages/AboutPage';
import DocsPage from './pages/DocsPage';
import ServerErrorPage from './pages/ServerErrorPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import NotFoundPage from './pages/NotFoundPage';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <Router>
            <Routes>

              {/* =========================
                  PUBLIC ROUTES
              ========================= */}

              <Route
                path="/"
                element={<Navigate to="/login" replace />}
              />

              <Route
                path="/login"
                element={<LoginPage />}
              />

              <Route
                path="/unauthorized"
                element={<UnauthorizedPage />}
              />


              {/* =========================
                  DASHBOARD
              ========================= */}

              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['Admin', 'User']}>
                    <Layout
                      activeTab="dashboard"
                      pageTitle="Dashboard"
                    >
                      <DashboardPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />


              {/* =========================
                  PREDICTION
              ========================= */}

              <Route
                path="/predict"
                element={
                  <ProtectedRoute allowedRoles={['Admin', 'User']}>
                    <Layout
                      activeTab="prediction"
                      pageTitle="New AI Prediction"
                    >
                      <PredictionPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />


              {/* =========================
                  HISTORY
              ========================= */}

              <Route
                path="/history"
                element={
                  <ProtectedRoute allowedRoles={['Admin', 'User']}>
                    <Layout
                      activeTab="history"
                      pageTitle="Prediction History"
                    >
                      <HistoryPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />


              {/* =========================
                  ANALYTICS
              ========================= */}

              <Route
                path="/analytics"
                element={
                  <ProtectedRoute allowedRoles={['Admin', 'User']}>
                    <Layout
                      activeTab="analytics"
                      pageTitle="System Analytics"
                    >
                      <AnalyticsPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />


              {/* =========================
                  COMPETITOR PRICE ANALYSIS
              ========================= */}

              <Route
                path="/competitor-analysis"
                element={
                  <ProtectedRoute allowedRoles={['Admin', 'User']}>
                    <Layout
                      activeTab="competitors"
                      pageTitle="Competitor Price Analysis"
                    >
                      <CompetitorAnalysisPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/competitor-analytics"
                element={<Navigate to="/competitor-analysis" replace />}
              />


              {/* =========================
                  PROFILE
              ========================= */}

              <Route
                path="/profile"
                element={
                  <ProtectedRoute allowedRoles={['Admin', 'User']}>
                    <Layout
                      activeTab="profile"
                      pageTitle="My Profile"
                    >
                      <ProfilePage />
                    </Layout>
                  </ProtectedRoute>
                }
              />


              {/* =========================
                  USER MANAGEMENT
                  ADMIN ONLY
              ========================= */}

              <Route
                path="/users"
                element={
                  <ProtectedRoute allowedRoles={['Admin']}>
                    <Layout
                      activeTab="user-management"
                      pageTitle="User Management"
                    >
                      <UsersPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />


              {/* =========================
                  DATABASE
                  ADMIN ONLY
              ========================= */}

              <Route
                path="/database"
                element={
                  <ProtectedRoute allowedRoles={['Admin']}>
                    <Layout
                      activeTab="settings"
                      pageTitle="Database Monitor"
                    >
                      <DatabasePage />
                    </Layout>
                  </ProtectedRoute>
                }
              />


              {/* =========================
                  DATASET
                  ADMIN ONLY
              ========================= */}

              <Route
                path="/dataset"
                element={
                  <ProtectedRoute allowedRoles={['Admin']}>
                    <Layout
                      activeTab="dataset"
                      pageTitle="Dataset Overview"
                    >
                      <DatasetPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />


              {/* =========================
                  ML MODELS
              ========================= */}

              <Route
                path="/models"
                element={
                  <ProtectedRoute allowedRoles={['Admin', 'User']}>
                    <Layout
                      activeTab="models"
                      pageTitle="ML Benchmark"
                    >
                      <MLModelsPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />


              {/* =========================
                  MODEL PERFORMANCE
              ========================= */}

              <Route
                path="/performance"
                element={
                  <ProtectedRoute allowedRoles={['Admin', 'User']}>
                    <Layout
                      activeTab="analytics"
                      pageTitle="Model Performance"
                    >
                      <ModelPerformancePage />
                    </Layout>
                  </ProtectedRoute>
                }
              />


              {/* =========================
                  REPORTS
              ========================= */}

              <Route
                path="/reports"
                element={
                  <ProtectedRoute allowedRoles={['Admin', 'User']}>
                    <Layout
                      activeTab="analytics"
                      pageTitle="Executive Reports"
                    >
                      <ReportsPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />


              {/* =========================
                  SETTINGS
              ========================= */}

              <Route
                path="/settings"
                element={
                  <ProtectedRoute allowedRoles={['Admin', 'User']}>
                    <Layout
                      activeTab="settings"
                      pageTitle="Settings"
                    >
                      <SettingsPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />


              {/* =========================
                  DOCUMENTATION
              ========================= */}

              <Route
                path="/docs"
                element={
                  <ProtectedRoute allowedRoles={['Admin', 'User']}>
                    <Layout
                      activeTab="about"
                      pageTitle="Help & Documentation"
                    >
                      <DocsPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />


              {/* =========================
                  ABOUT
              ========================= */}

              <Route
                path="/about"
                element={
                  <ProtectedRoute allowedRoles={['Admin', 'User']}>
                    <Layout
                      activeTab="about"
                      pageTitle="Help & Info"
                    >
                      <AboutPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />


              {/* =========================
                  ERROR ROUTES
              ========================= */}

              <Route
                path="/500"
                element={<ServerErrorPage />}
              />

              <Route
                path="/404"
                element={<NotFoundPage />}
              />


              {/* =========================
                  CATCH-ALL
              ========================= */}

              <Route
                path="*"
                element={<Navigate to="/dashboard" replace />}
              />

            </Routes>
          </Router>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;