import { Navigate, Route, Routes } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, getDashboardPath, useAuth } from '@/lib/auth';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AuthLayout } from '@/components/layout/AuthLayout';

import LandingPage from '@/pages/public/LandingPage';
import LoginPage from '@/pages/public/LoginPage';
import SignupPage from '@/pages/public/SignupPage';
import OtpVerificationPage from '@/pages/public/OtpVerificationPage';
import ForgotPasswordPage from '@/pages/public/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/public/ResetPasswordPage';

import AdminDashboard from '@/pages/dashboards/AdminDashboard';
import InspectorDashboard from '@/pages/dashboards/TechnicianDashboard';
import UserDashboard from '@/pages/dashboards/CustomerDashboard';

import AssetsPage from '@/pages/management/AssetsPage';
import NotificationsPage from '@/pages/management/NotificationsPage';
import ReportsPage from '@/pages/management/ReportsPage';
import ServiceRequestsPage from '@/pages/management/ServiceRequestsPage';
import UsersPage from '@/pages/management/UsersPage';
import ProfilePage from '@/pages/management/ProfilePage';

import MyExtinguishersPage from '@/pages/customer/MyExtinguishersPage';
import CustomerNotificationsPage from '@/pages/customer/CustomerNotificationsPage';

function RootRedirect() {
  const { isAuthenticated, isLoading, role } = useAuth();
  if (isLoading) return null;
  if (isAuthenticated && role) return <Navigate to={getDashboardPath(role)} replace />;
  return <LandingPage />;
}

function AdminRoutes() {
  return (
    <Routes>
      <Route path="dashboard" element={<AdminDashboard />} />
      <Route path="users" element={<UsersPage />} />
      <Route path="assets" element={<AssetsPage />} />
      <Route path="service-requests" element={<ServiceRequestsPage mode="admin" />} />
      <Route path="notifications" element={<NotificationsPage />} />
      <Route path="reports" element={<ReportsPage />} />
      <Route path="profile" element={<ProfilePage />} />
      <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
    </Routes>
  );
}

function InspectorRoutes() {
  return (
    <Routes>
      <Route path="dashboard" element={<InspectorDashboard />} />
      <Route path="service-requests" element={<ServiceRequestsPage mode="Inspector" />} />
      <Route path="assets" element={<AssetsPage />} />
      <Route path="reports" element={<ReportsPage />} />
      <Route path="profile" element={<ProfilePage />} />
      <Route path="*" element={<Navigate to="/inspector/dashboard" replace />} />
    </Routes>
  );
}

function UserRoutes() {
  return (
    <Routes>
      <Route path="dashboard" element={<UserDashboard />} />
      <Route path="extinguishers" element={<MyExtinguishersPage />} />
      <Route path="service-requests" element={<ServiceRequestsPage mode="User" />} />
      <Route path="reports" element={<ReportsPage />} />
      <Route path="notifications" element={<CustomerNotificationsPage />} />
      <Route path="profile" element={<ProfilePage />} />
      <Route path="*" element={<Navigate to="/user/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
  const routes = (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<RootRedirect />} />

        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/verify-otp" element={<OtpVerificationPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/admin/*" element={<AdminRoutes />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['Inspector']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/inspector/*" element={<InspectorRoutes />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['User']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/user/*" element={<UserRoutes />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );

  if (!googleClientId) {
    return routes;
  }

  return <GoogleOAuthProvider clientId={googleClientId}>{routes}</GoogleOAuthProvider>;
}
