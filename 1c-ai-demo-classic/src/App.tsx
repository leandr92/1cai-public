import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import HomePageV2 from './pages/HomePageV2';
import LoginPage from './pages/LoginPage';
import DashboardPageV2 from './pages/DashboardPageV2';
import DemoPage from './pages/DemoPage';
import CasesPage from './pages/CasesPage';
import HelpPage from './pages/HelpPage';
import AuthCallback from './pages/AuthCallback';
import './styles/dark-theme.css';

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Public Route Component (redirect to dashboard if logged in)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  // Allow access to home page even if logged in
  return <>{children}</>;
}

function AppContent() {
  return (
    <div className="App">
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={
          <PublicRoute>
            <HomePageV2 />
          </PublicRoute>
        } />
        
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* Protected Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardPageV2 />
          </ProtectedRoute>
        } />

        {/* Public pages */}
        <Route path="/demo" element={<DemoPage />} />
        <Route path="/cases" element={<CasesPage />} />
        <Route path="/help" element={<HelpPage />} />
        <Route path="/tasks" element={
          <ProtectedRoute>
            <DashboardPageV2 />
          </ProtectedRoute>
        } />
        <Route path="/results" element={
          <ProtectedRoute>
            <DashboardPageV2 />
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute>
            <DashboardPageV2 />
          </ProtectedRoute>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
          <AppContent />
        </NotificationProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
