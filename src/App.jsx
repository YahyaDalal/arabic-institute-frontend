import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import ResetPasswordConfirmPage from './pages/auth/ResetPasswordConfirmPage';

import StudentDashboard from './pages/student/StudentDashboard';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';

import ProfilePage from './pages/profile/ProfilePage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/reset-password/confirm" element={<ResetPasswordConfirmPage />} />

          <Route path="/student" element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentDashboard />
            </ProtectedRoute>
          } />

          <Route path="/teacher" element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <TeacherDashboard />
            </ProtectedRoute>
          } />

          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />

          <Route path="/profile" element={
            <ProtectedRoute>
                <ProfilePage />
            </ProtectedRoute>
          } />

          <Route path="/unauthorized" element={<h1>Access Denied</h1>} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}