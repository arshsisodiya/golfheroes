import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import './styles/global.css';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CharityDetailPage from './pages/CharityDetailPage';
import DashboardPage from './pages/DashboardPage';
import ScoresPage from './pages/ScoresPage';
import DrawsPage from './pages/DrawsPage';
import CharitiesPage from './pages/CharitiesPage';
import WinningsPage from './pages/WinningsPage';
import SettingsPage from './pages/SettingsPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminDraws from './pages/admin/AdminDraws';
import AdminCharities from './pages/admin/AdminCharities';
import AdminWinners from './pages/admin/AdminWinners';
import AppShell from './components/layout/AppShell';
import AdminShell from './components/layout/AdminShell';
import SubscribePage from './pages/SubscribePage';

function PrivateRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}><div className="spinner" style={{ width: 32, height: 32 }} /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  return children;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/charities" element={<CharitiesPage />} />
            <Route path="/charities/:id" element={<CharityDetailPage />} />
            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
            <Route path="/subscribe" element={<PrivateRoute><SubscribePage /></PrivateRoute>} />

            {/* User app */}
            <Route path="/" element={<PrivateRoute><AppShell /></PrivateRoute>}>
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="scores" element={<ScoresPage />} />
              <Route path="draws" element={<DrawsPage />} />
              <Route path="winnings" element={<WinningsPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            {/* Admin app */}
            <Route path="/admin" element={<PrivateRoute adminOnly><AdminShell /></PrivateRoute>}>
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="draws" element={<AdminDraws />} />
              <Route path="charities" element={<AdminCharities />} />
              <Route path="winners" element={<AdminWinners />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
