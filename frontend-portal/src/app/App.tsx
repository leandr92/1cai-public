/**
 * Main App Component
 * Wrapped with Error Boundary
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from '../shared/components/ErrorBoundary/ErrorBoundary';
import { OwnerDashboardConnected } from '../features/simple-owner/OwnerDashboardConnected';
import { LoginPage } from '../features/auth/LoginPage';
import { ExecutiveDashboard } from '../features/executive/ExecutiveDashboard';
import { PMDashboard } from '../features/pm/PMDashboard';
import { DeveloperConsole } from '../features/developer/DeveloperConsole';

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/owner" element={<OwnerDashboardConnected />} />
          <Route path="/executive" element={<ExecutiveDashboard />} />
          <Route path="/pm" element={<PMDashboard />} />
          <Route path="/developer" element={<DeveloperConsole />} />
          <Route path="/" element={<Navigate to="/owner" replace />} />
          
          {/* Placeholder routes (will be implemented) */}
          <Route path="/customers" element={<div className="p-8"><h1 className="text-4xl">Customers (Coming Soon)</h1></div>} />
          <Route path="/reports" element={<div className="p-8"><h1 className="text-4xl">Reports (Coming Soon)</h1></div>} />
          <Route path="/billing" element={<div className="p-8"><h1 className="text-4xl">Billing (Coming Soon)</h1></div>} />
          <Route path="/support" element={<div className="p-8"><h1 className="text-4xl">Support (Coming Soon)</h1></div>} />
          <Route path="/help" element={<div className="p-8"><h1 className="text-4xl">Help (Coming Soon)</h1></div>} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
