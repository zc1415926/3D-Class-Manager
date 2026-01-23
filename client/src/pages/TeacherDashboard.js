import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

function TeacherDashboard() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalSubmissions: 0,
    totalStudents: 0,
    totalYears: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    } else {
      fetchStats();
    }
  }, [isAuthenticated, navigate]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [submissionsRes, studentsRes] = await Promise.all([
        axios.get('/api/submissions'),
        axios.get('/api/students')
      ]);

      if (submissionsRes.data.success && studentsRes.data.success) {
        const submissions = submissionsRes.data.data;
        const students = studentsRes.data.data;
        const years = new Set(students.map(s => s.year));

        setStats({
          totalSubmissions: submissions.length,
          totalStudents: students.length,
          totalYears: years.size
        });
      }
    } catch (err) {
      console.error('获取统计数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div>
      <div className="mb-4">
        <div className="text-muted">欢迎回来，教师</div>
      </div>

      {/* 统计卡片 */}
      <div className="row row-cards mb-4">
        <div className="col-sm-6 col-lg-4">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="subheader">作品总数</div>
              </div>
              <div className="h1 mb-3">{stats.totalSubmissions}</div>
              <div className="d-flex mb-2">
                <div>学生提交的所有3D作品</div>
              </div>
              <div className="progress progress-sm">
                <div className="progress-bar bg-primary" style={{ width: '75%' }} role="progressbar"></div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-sm-6 col-lg-4">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="subheader">学生总数</div>
              </div>
              <div className="h1 mb-3">{stats.totalStudents}</div>
              <div className="d-flex mb-2">
                <div>系统中的所有学生</div>
              </div>
              <div className="progress progress-sm">
                <div className="progress-bar bg-success" style={{ width: '60%' }} role="progressbar"></div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-sm-6 col-lg-4">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="subheader">年份总数</div>
              </div>
              <div className="h1 mb-3">{stats.totalYears}</div>
              <div className="d-flex mb-2">
                <div>涵盖的年级年份</div>
              </div>
              <div className="progress progress-sm">
                <div className="progress-bar bg-info" style={{ width: '45%' }} role="progressbar"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 快捷操作 */}
      <div className="row row-cards mb-4">
        <div className="col-md-6">
          <div className="card card-link" onClick={() => navigate('/works')}>
            <div className="card-body">
              <div className="row align-items-center">
                <div className="col-auto">
                  <span className="bg-primary text-white avatar">
                    <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                      <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                      <path d="M4 19l2 2l4 -4" />
                      <path d="M20 10a4 4 0 1 0 -8 0a4 4 0 0 0 8 0" />
                      <path d="M6.5 17c1.5 2.5 4.5 3.5 7.5 2.5s6 -3 7.5 -5.5" />
                    </svg>
                  </span>
                </div>
                <div className="col">
                  <h3 className="card-title">作品管理</h3>
                  <div className="card-subtitle">查看、下载和管理所有学生作品</div>
                </div>
                <div className="col-auto">
                  <svg xmlns="http://www.w3.org/2000/svg" className="icon text-muted" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                    <path d="M9 6l6 6l-6 6" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card card-link" onClick={() => navigate('/student-management')}>
            <div className="card-body">
              <div className="row align-items-center">
                <div className="col-auto">
                  <span className="bg-success text-white avatar">
                    <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                      <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                      <path d="M9 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" />
                      <path d="M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0z" />
                    </svg>
                  </span>
                </div>
                <div className="col">
                  <h3 className="card-title">学生管理</h3>
                  <div className="card-subtitle">添加、编辑和删除学生信息</div>
                </div>
                <div className="col-auto">
                  <svg xmlns="http://www.w3.org/2000/svg" className="icon text-muted" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                    <path d="M9 6l6 6l-6 6" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 其他操作 */}
      <div className="card mb-4">
        <div className="card-header">
          <h3 className="card-title">快捷操作</h3>
        </div>
        <div className="list-group list-group-flush list-group-hoverable">
          <div className="list-group-item" onClick={() => navigate('/student-view')}>
            <div className="row align-items-center">
              <div className="col-auto">
                <svg xmlns="http://www.w3.org/2000/svg" className="icon text-muted" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                  <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
                  <path d="M10 12a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" />
                  <path d="M21 12c-2.4 4 -5.4 6 -9 6c-3.6 0 -6.6 -2 -9 -6c2.4 -4 5.4 -6 9 -6c3.6 0 6.6 2 9 6" />
                </svg>
              </div>
              <div className="col text-truncate">
                <span className="text-reset d-block">查看所有作品</span>
                <div className="d-block text-muted text-truncate mt-n1">浏览所有学生提交的3D作品</div>
              </div>
              <div className="col-auto">
                <svg xmlns="http://www.w3.org/2000/svg" className="icon text-muted" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                  <path d="M9 6l6 6l-6 6" />
                </svg>
              </div>
            </div>
          </div>
          <div className="list-group-item" onClick={() => navigate('/assignments')}>
            <div className="row align-items-center">
              <div className="col-auto">
                <svg xmlns="http://www.w3.org/2000/svg" className="icon text-muted" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                  <path d="M9 5h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-12a2 2 0 0 0 -2 -2h-2" />
                  <path d="M9 3m0 2a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v0a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2v0a2 2 0 0 1 2 -2" />
                  <path d="M9 14h6" />
                  <path d="M9 10h6" />
                  <path d="M9 18h6" />
                </svg>
              </div>
              <div className="col text-truncate">
                <span className="text-reset d-block">作业管理</span>
                <div className="d-block text-muted text-truncate mt-n1">创建和管理课程作业</div>
              </div>
              <div className="col-auto">
                <svg xmlns="http://www.w3.org/2000/svg" className="icon text-muted" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                  <path d="M9 6l6 6l-6 6" />
                </svg>
              </div>
            </div>
          </div>
          <div className="list-group-item" onClick={() => navigate('/submit')}>
            <div className="row align-items-center">
              <div className="col-auto">
                <svg xmlns="http://www.w3.org/2000/svg" className="icon text-muted" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                  <path d="M7 18a4.6 4.4 0 0 1 0 -9a5 4.5 0 0 1 11 2h1a3.5 3.5 0 0 1 0 7h-12" />
                  <path d="M9 15l2 -2l2 2" />
                  <path d="M12 11v8" />
                </svg>
              </div>
              <div className="col text-truncate">
                <span className="text-reset d-block">前往作品提交页面</span>
                <div className="d-block text-muted text-truncate mt-n1">为学生演示如何提交作品</div>
              </div>
              <div className="col-auto">
                <svg xmlns="http://www.w3.org/2000/svg" className="icon text-muted" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                  <path d="M9 6l6 6l-6 6" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 退出登录 */}
      <div className="card">
        <div className="card-body">
          <button
            className="btn btn-danger w-100"
            onClick={handleLogout}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="icon me-2" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
              <path d="M14 8v-2a2 2 0 0 0 -2 -2h-7a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h7a2 2 0 0 0 2 -2v-2" />
              <path d="M7 12h14l-3 -3m0 6l3 -3" />
            </svg>
            退出登录
          </button>
        </div>
      </div>
    </div>
  );
}

export default TeacherDashboard;