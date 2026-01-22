import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import 'bootstrap/dist/js/bootstrap.bundle.min';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import TablerLayout from './components/TablerLayout';
import StudentPage from './pages/StudentPage';
import TeacherPage from './pages/TeacherPage';
import ViewerPage from './pages/ViewerPage';
import StudentManagementPage from './pages/StudentManagementPage';
import StudentViewPage from './pages/StudentViewPage';
import LoginPage from './pages/LoginPage';
import TeacherDashboard from './pages/TeacherDashboard';
import AccessDeniedPage from './pages/AccessDeniedPage';

function AppContent() {
  const { isAuthenticated } = useAuth();

  return (
    <TablerLayout>
      <Routes>
        <Route path="/" element={<StudentPage />} />
        <Route path="/student" element={<StudentPage />} />
        <Route path="/works" element={<TeacherPage />} />
        <Route path="/student-management" element={<StudentManagementPage />} />
        <Route path="/student-view" element={<StudentViewPage />} />
        <Route path="/viewer/:id" element={<ViewerPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<TeacherDashboard />} />
        <Route path="/access-denied" element={<AccessDeniedPage />} />
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