import React from 'react';
import { Routes, Route } from 'react-router-dom';
import 'bootstrap/dist/js/bootstrap.bundle.min';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import TablerLayout from './components/TablerLayout';
import HomePage from './pages/HomePage';
import StudentPage from './pages/StudentPage';
import SubmissionPage from './pages/SubmissionPage';
import TeacherPage from './pages/TeacherPage';
import ViewerPage from './pages/ViewerPage';
import StudentManagementPage from './pages/StudentManagementPage';
import StudentViewPage from './pages/StudentViewPage';
import LoginPage from './pages/LoginPage';
import TeacherDashboard from './pages/TeacherDashboard';
import AccessDeniedPage from './pages/AccessDeniedPage';
import AssignmentManagementPage from './pages/AssignmentManagementPage';
import AssignmentNewPage from './pages/AssignmentNewPage';
import AssignmentEditPage from './pages/AssignmentEditPage';
import AssignmentViewPage from './pages/AssignmentViewPage';
import AssignmentSubmissionsPage from './pages/AssignmentSubmissionsPage';
import UploadTypesPage from './pages/UploadTypesPage';

function AppContent() {
  const { isAuthenticated } = useAuth();

  return (
    <TablerLayout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/submit" element={<SubmissionPage />} />
        <Route path="/works" element={<TeacherPage />} />
        <Route path="/student-management" element={<StudentManagementPage />} />
        <Route path="/student-view" element={<StudentViewPage />} />
        <Route path="/viewer/:id" element={<ViewerPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<TeacherDashboard />} />
        <Route path="/access-denied" element={<AccessDeniedPage />} />
        <Route path="/assignments" element={<AssignmentManagementPage />} />
        <Route path="/assignments/new" element={<AssignmentNewPage />} />
        <Route path="/assignments/:id" element={<AssignmentViewPage />} />
        <Route path="/assignments/:id/edit" element={<AssignmentEditPage />} />
        <Route path="/assignments/:id/submissions" element={<AssignmentSubmissionsPage />} />
        <Route path="/upload-types" element={<UploadTypesPage />} />
      </Routes>
    </TablerLayout>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;