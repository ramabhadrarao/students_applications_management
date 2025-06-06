// File: src/App.tsx
// Purpose: Main app component with all routes including new features

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './stores/authStore';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ApplicationsPage from './pages/ApplicationsPage';
import ApplicationDetailsPage from './pages/ApplicationDetailsPage';
import ApplicationFormPage from './pages/ApplicationFormPage';
import ApplicationDocumentsPage from './pages/ApplicationDocumentsPage';
import DocumentVerificationPage from './pages/DocumentVerificationPage';
import ProgramsPage from './pages/ProgramsPage';
import ProgramFormPage from './pages/ProgramFormPage';
import ProgramCertificateRequirementsPage from './pages/ProgramCertificateRequirementsPage';
import CertificateTypesPage from './pages/CertificateTypesPage';
import CertificateTypeFormPage from './pages/CertificateTypeFormPage';
import FilesPage from './pages/FilesPage';
import FileUploadPage from './pages/FileUploadPage';
import NotificationsPage from './pages/NotificationsPage';
import NotificationFormPage from './pages/NotificationFormPage';
import UsersPage from './pages/UsersPage';
import UserFormPage from './pages/UserFormPage';
import ProfilePage from './pages/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';

// Auth guards
const PrivateRoute = ({ children, allowedRoles = [] }: { children: React.ReactNode, allowedRoles?: string[] }) => {
  const { user } = useAuthStore();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        {/* Protected routes */}
        <Route path="/" element={
          <PrivateRoute>
            <DashboardLayout />
          </PrivateRoute>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          
          {/* Applications */}
          <Route path="applications" element={<ApplicationsPage />} />
          <Route path="applications/new" element={<ApplicationFormPage />} />
          <Route path="applications/:id" element={<ApplicationDetailsPage />} />
          <Route path="applications/:id/edit" element={<ApplicationFormPage />} />
          <Route path="applications/:applicationId/documents" element={<ApplicationDocumentsPage />} />
          <Route path="applications/:applicationId/documents/verify" element={
            <PrivateRoute allowedRoles={['admin', 'program_admin']}>
              <DocumentVerificationPage />
            </PrivateRoute>
          } />
          
          {/* Programs - Admin only */}
          <Route path="programs" element={
            <PrivateRoute allowedRoles={['admin']}>
              <ProgramsPage />
            </PrivateRoute>
          } />
          <Route path="programs/new" element={
            <PrivateRoute allowedRoles={['admin']}>
              <ProgramFormPage />
            </PrivateRoute>
          } />
          <Route path="programs/:id/edit" element={
            <PrivateRoute allowedRoles={['admin']}>
              <ProgramFormPage />
            </PrivateRoute>
          } />
          <Route path="programs/:programId/certificates" element={
            <PrivateRoute allowedRoles={['admin']}>
              <ProgramCertificateRequirementsPage />
            </PrivateRoute>
          } />
          
          {/* Certificate Types - Admin only */}
          <Route path="certificate-types" element={
            <PrivateRoute allowedRoles={['admin']}>
              <CertificateTypesPage />
            </PrivateRoute>
          } />
          <Route path="certificate-types/new" element={
            <PrivateRoute allowedRoles={['admin']}>
              <CertificateTypeFormPage />
            </PrivateRoute>
          } />
          <Route path="certificate-types/:id/edit" element={
            <PrivateRoute allowedRoles={['admin']}>
              <CertificateTypeFormPage />
            </PrivateRoute>
          } />
          
          {/* File Management */}
          <Route path="files" element={<FilesPage />} />
          <Route path="files/upload" element={<FileUploadPage />} />
          
          {/* Notifications */}
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="notifications/new" element={
            <PrivateRoute allowedRoles={['admin']}>
              <NotificationFormPage />
            </PrivateRoute>
          } />
          
          {/* Users - Admin only */}
          <Route path="users" element={
            <PrivateRoute allowedRoles={['admin']}>
              <UsersPage />
            </PrivateRoute>
          } />
          <Route path="users/new" element={
            <PrivateRoute allowedRoles={['admin']}>
              <UserFormPage />
            </PrivateRoute>
          } />
          <Route path="users/:id/edit" element={
            <PrivateRoute allowedRoles={['admin']}>
              <UserFormPage />
            </PrivateRoute>
          } />
          
          {/* Profile - All authenticated users */}
          <Route path="profile" element={<ProfilePage />} />
          
          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;