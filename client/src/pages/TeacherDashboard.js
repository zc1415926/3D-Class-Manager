import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function TeacherDashboard() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="container mt-4">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card shadow">
            <div className="card-body p-5">
              <div className="text-center mb-5">
                <div className="display-1 mb-3">👨‍🏫</div>
                <h2 className="mb-2">教师主页</h2>
                <p className="text-muted">欢迎回来，教师</p>
              </div>

              <div className="row g-3 mb-5">
                <div className="col-md-6">
                  <button
                    className="btn btn-outline-primary w-100 p-3"
                    onClick={() => navigate('/works')}
                  >
                    <div className="display-6 mb-2">📚</div>
                    <div>作品管理</div>
                  </button>
                </div>
                <div className="col-md-6">
                  <button
                    className="btn btn-outline-success w-100 p-3"
                    onClick={() => navigate('/student-management')}
                  >
                    <div className="display-6 mb-2">👥</div>
                    <div>学生管理</div>
                  </button>
                </div>
              </div>

              <div className="card bg-light">
                <div className="card-body">
                  <h5 className="card-title mb-3">📋 快捷操作</h5>
                  <div className="d-grid gap-2">
                    <button
                      className="btn btn-outline-secondary text-start"
                      onClick={() => navigate('/student-view')}
                    >
                      👁️ 查看所有作品
                    </button>
                    <button
                      className="btn btn-outline-secondary text-start"
                      onClick={() => navigate('/submit')}
                    >
                      📤 前往作品提交页面
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-5 text-center">
                <button
                  className="btn btn-danger btn-lg"
                  onClick={handleLogout}
                >
                  🚪 退出登录
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TeacherDashboard;