import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import 'bootstrap/dist/js/bootstrap.bundle.min';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import StudentPage from './pages/StudentPage';
import TeacherPage from './pages/TeacherPage';
import ViewerPage from './pages/ViewerPage';
import StudentManagementPage from './pages/StudentManagementPage';
import StudentViewPage from './pages/StudentViewPage';
import LoginPage from './pages/LoginPage';
import TeacherDashboard from './pages/TeacherDashboard';
import AccessDeniedPage from './pages/AccessDeniedPage';

function AppContent() {
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  return (
    <div className="App">
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary mb-4">
        <div className="container-fluid">
          <Link className="navbar-brand" to="/">
            🎨 3D作品管理系统
          </Link>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto">
              <li className="nav-item">
                <Link
                  className={`nav-link ${location.pathname === '/student' ? 'active' : ''}`}
                  to="/student"
                >
                  作品提交
                </Link>
              </li>
              <li className="nav-item">
                <Link
                  className={`nav-link ${location.pathname === '/student-view' ? 'active' : ''}`}
                  to="/student-view"
                >
                  查看作品
                </Link>
              </li>
              {isAuthenticated && (
                <>
                  <li className="nav-item">
                    <Link
                      className={`nav-link ${location.pathname === '/works' ? 'active' : ''}`}
                      to="/works"
                    >
                      作品管理
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link
                      className={`nav-link ${location.pathname === '/student-management' ? 'active' : ''}`}
                      to="/student-management"
                    >
                      学生管理
                    </Link>
                  </li>
                </>
              )}
              <li className="nav-item">
                {isAuthenticated ? (
                  <Link
                    className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
                    to="/dashboard"
                  >
                    👨‍🏫 教师主页
                  </Link>
                ) : (
                  <Link
                    className={`nav-link ${location.pathname === '/login' ? 'active' : ''}`}
                    to="/login"
                  >
                    🔐 教师登录
                  </Link>
                )}
              </li>
            </ul>
          </div>
        </div>
      </nav>

      <div className="container-fluid">
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
      </div>
    </div>
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