import { Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { useAuth } from './contexts/AuthContext';
import LoadingScreen from './components/common/LoadingScreen';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Lazy-loaded components
const AdminLogin = lazy(() => import('./pages/auth/AdminLogin'));
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const InvestorProfile = lazy(() => import('./pages/admin/InvestorProfile'));
const InvestorsListPage = lazy(() => import('./pages/admin/InvestorsList'));
const WithdrawalsPage = lazy(() => import('./pages/admin/WithdrawalsPage'));
const AnalyticsPage = lazy(() => import('./pages/admin/AnalyticsPage'));
const SettingsPage = lazy(() => import('./pages/admin/SettingsPage'));
const CommissionsPage = lazy(() => import('./pages/admin/CommissionsPage'));
const TransactionsPage = lazy(() => import('./pages/admin/TransactionsPage'));
const PerformanceReportsPage = lazy(() => import('./pages/admin/PerformanceReportsPage'));
const NotFound = lazy(() => import('./pages/NotFound'));

function App() {
  const { user } = useAuth();

  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        {/* Public routes - Admin login only */}
        <Route path="/admin-login" element={<AdminLogin />} />
        
        {/* Protected admin routes */}
        <Route path="/admin" element={
          <ProtectedRoute role="admin">
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin/investors" element={
          <ProtectedRoute role="admin">
            <InvestorsListPage />
          </ProtectedRoute>
        } />
        <Route path="/admin/investor/:id" element={
          <ProtectedRoute role="admin">
            <InvestorProfile />
          </ProtectedRoute>
        } />
        <Route path="/admin/withdrawals" element={
          <ProtectedRoute role="admin">
            <WithdrawalsPage />
          </ProtectedRoute>
        } />
        <Route path="/admin/commissions" element={
          <ProtectedRoute role="admin">
            <CommissionsPage />
          </ProtectedRoute>
        } />
        <Route path="/admin/transactions" element={
          <ProtectedRoute role="admin">
            <TransactionsPage />
          </ProtectedRoute>
        } />
        <Route path="/admin/analytics" element={
          <ProtectedRoute role="admin">
            <AnalyticsPage />
          </ProtectedRoute>
        } />
        <Route path="/admin/performance-reports" element={
          <ProtectedRoute role="admin">
            <PerformanceReportsPage />
          </ProtectedRoute>
        } />
        <Route path="/admin/settings" element={
          <ProtectedRoute role="admin">
            <SettingsPage />
          </ProtectedRoute>
        } />
        
        {/* Redirect based on authentication status - Admin only */}
        <Route path="/" element={
          user ? (
            user.role === 'admin' ? <Navigate to="/admin" replace /> : <Navigate to="/admin-login" replace />
          ) : (
            <Navigate to="/admin-login" replace />
          )
        } />
        
        {/* Redirect any investor routes to admin login */}
        <Route path="/investor-login" element={<Navigate to="/admin-login" replace />} />
        <Route path="/investor" element={<Navigate to="/admin-login" replace />} />
        <Route path="/investor/*" element={<Navigate to="/admin-login" replace />} />
        
        {/* Catch-all route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

export default App;