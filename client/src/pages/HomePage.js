import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { useAuth } from '../contexts/AuthContext';

function HomePage() {
  const { isAuthenticated } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAssignments: 0,
    activeAssignments: 0,
    mySubmissions: 0,
    totalStudents: 0
  });

  // Function to sanitize HTML content safely
  const sanitizeContent = (content) => {
    if (!content) return content;
    
    // Use DOMPurify if available
    if (typeof DOMPurify !== 'undefined' && DOMPurify.sanitize) {
      const clean = DOMPurify.sanitize(content, {
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: []
      });
      return clean;
    }
    
    // Fallback: Remove HTML tags using regex
    return content.replace(/<[^>]*>/g, '');
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [assignmentsRes, submissionsRes, studentsRes] = await Promise.all([
        axios.get('/api/assignments'),
        isAuthenticated ? axios.get('/api/submissions') : Promise.resolve({ data: { data: [] } }),
        axios.get('/api/students')
      ]);

      if (assignmentsRes.data.success) {
        const currentYear = new Date().getFullYear();
        const allAssignments = assignmentsRes.data.data.filter(
          assignment => assignment.year === currentYear
        );
        const activeAssignments = allAssignments.filter(
          assignment => assignment.status === 'active'
        );
        
        setAssignments(activeAssignments);
        setStats({
          totalAssignments: allAssignments.length,
          activeAssignments: activeAssignments.length,
          mySubmissions: submissionsRes.data.data?.length || 0,
          totalStudents: studentsRes.data.data?.length || 0
        });
      }
    } catch (err) {
      console.error('获取数据失败:', err);
      // 即使出现错误也确保统计数据被设置为默认值
      setStats({
        totalAssignments: 0,
        activeAssignments: 0,
        mySubmissions: 0,
        totalStudents: 0
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-xl">
      {/* Hero Section - 大标题区域 */}
      <div className="row g-10 align-items-center py-5">
        <div className="col-lg-6 text-center text-lg-start">
          <div className="mb-3">
            <span className="badge bg-primary-lt">
              <svg xmlns="http://www.w3.org/2000/svg" className="icon me-1" width="16" height="16" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                <path d="M5 12l5 5l10 -10" />
              </svg>
              3D建模课程管理系统
            </span>
          </div>
          <h1 className="hero-title mb-3">
            探索3D设计的<br/>
            <span className="text-primary">无限可能</span>
          </h1>
          <p className="hero-description lead text-secondary mb-5">
            专为小学3D建模课程设计的管理平台，让学生轻松提交作品，教师高效管理作业，创造更好的学习体验。
          </p>
          <div className="d-flex gap-2 justify-content-center justify-content-lg-start">
            <Link to="/submit" className="btn btn-lg btn-primary">
              <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" />
                <path d="M7 11l5 5l5 -5" />
                <path d="M12 4l0 12" />
              </svg>
              开始提交作品
            </Link>
            {isAuthenticated ? (
              <Link to="/dashboard" className="btn btn-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                  <path d="M5 12l5 5l10 -10" />
                </svg>
                进入教师面板
              </Link>
            ) : (
              <Link to="/student-view" className="btn btn-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                  <path d="M9 11l3 3l3 -3" />
                  <path d="M9 12l3 3l3 -3" />
                </svg>
                查看作品
              </Link>
            )}
          </div>
        </div>
        <div className="col-lg-6 mt-5 mt-lg-0">
          {/* 统计卡片网格 */}
          <div className="row row-cards">
            <div className="col-sm-6 col-md-3 col-lg-6">
              <div className="card card-sm card-hoverable h-100">
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div className="me-3">
                      <span className="avatar bg-primary text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                          <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                          <path d="M14 3v4a1 1 0 0 0 1 1h4" />
                          <path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" />
                        </svg>
                      </span>
                    </div>
                    <div>
                      <div className="h3 mb-0">{stats.totalAssignments}</div>
                      <div className="text-muted small">总计作业数</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-sm-6 col-md-3 col-lg-6">
              <div className="card card-sm card-hoverable h-100">
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div className="me-3">
                      <span className="avatar bg-green text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                          <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                          <path d="M4 7a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12z" />
                          <path d="M9 11l3 3l3 -3" />
                        </svg>
                      </span>
                    </div>
                    <div>
                      <div className="h3 mb-0">{stats.activeAssignments}</div>
                      <div className="text-muted small">开放中</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-sm-6 col-md-3 col-lg-6">
              <div className="card card-sm card-hoverable h-100">
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div className="me-3">
                      <span className="avatar bg-info text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                          <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                          <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
                          <path d="M12 10m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" />
                          <path d="M12 15l0 .01" />
                        </svg>
                      </span>
                    </div>
                    <div>
                      <div className="h3 mb-0">{stats.totalStudents}</div>
                      <div className="text-muted small">学生数</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-sm-6 col-md-3 col-lg-6">
              <div className="card card-sm card-hoverable h-100">
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div className="me-3">
                      <span className="avatar bg-warning text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                          <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                          <path d="M14 3v4a1 1 0 0 0 1 1h4" />
                          <path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" />
                        </svg>
                      </span>
                    </div>
                    <div>
                      <div className="h3 mb-0">{stats.mySubmissions}</div>
                      <div className="text-muted small">已提交</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 当前开放的作业 */}
      <div className="row mt-5">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                <svg xmlns="http://www.w3.org/2000/svg" className="icon text-primary me-2" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                  <path d="M14 3v4a1 1 0 0 0 1 1h4" />
                  <path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" />
                </svg>
                当前开放的作业
              </h3>
              <div className="card-actions">
                <Link to="/student-view" className="btn btn-outline-primary">
                  查看所有
                </Link>
              </div>
            </div>
            <div className="card-body p-0">
              {loading ? (
                <div className="empty">
                  <div className="empty-spinner">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">加载中...</span>
                    </div>
                  </div>
                  <p className="empty-title h3">加载数据中...</p>
                  <p className="empty-subtitle text-muted">
                    请稍等片刻，我们正在获取最新的作业信息
                  </p>
                </div>
              ) : assignments.length === 0 ? (
                <div className="empty">
                  <div className="empty-img">
                    <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="128" height="128" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                      <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                      <path d="M12 3h7a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-10a2 2 0 0 1 2 -2h7" />
                    </svg>
                  </div>
                  <p className="empty-title h3">暂无开放作业</p>
                  <p className="empty-subtitle text-muted">
                    请等待老师发布新的作业
                  </p>
                </div>
              ) : (
                <div className="list-group list-group-flush list-group-hoverable">
                  {assignments.map((assignment, index) => (
                    <div key={assignment.id} className="list-group-item">
                      <div className="row align-items-center">
                        <div className="col-auto">
                          <span className="badge bg-primary fs-4">
                            {index + 1}
                          </span>
                        </div>
                        <div className="col text-truncate">
                          <Link to={`/assignments/${assignment.id}`} className="text-reset d-block">
                            <div className="text-truncate fw-bold fs-4">
                              {sanitizeContent(assignment.name)}
                            </div>
                            <div className="text-muted text-truncate mt-1">
                              {assignment.description ? sanitizeContent(assignment.description) : '暂无描述'}
                            </div>
                          </Link>
                          <div className="d-flex gap-2 mt-2">
                            <span className="badge bg-blue-lt">
                              <svg xmlns="http://www.w3.org/2000/svg" className="icon me-1" width="14" height="14" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                                <path d="M14 3v4a1 1 0 0 0 1 1h4" />
                                <path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" />
                              </svg>
                              {Array.isArray(assignment.upload_types) 
                                ? assignment.upload_types.map(t => t.toUpperCase()).join(', ')
                                : JSON.parse(assignment.upload_types || '[]').map(t => t.toUpperCase()).join(', ')
                              }
                            </span>
                          </div>
                        </div>
                        <div className="col-auto">
                          <Link 
                            to="/submit" 
                            state={{ assignmentId: assignment.id }}
                            className="btn btn-primary"
                          >
                            立即提交
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 功能特点 */}
      <div className="row mt-5">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">功能特点</h3>
            </div>
            <div className="card-body">
              <div className="row g-4">
                <div className="col-md-6 col-lg-4">
                  <div className="card border-0 bg-transparent">
                    <div className="card-body">
                      <div className="mb-3">
                        <span className="avatar bg-primary text-white avatar-lg">
                          <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="32" height="32" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                            <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                            <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" />
                            <path d="M7 11l5 5l5 -5" />
                            <path d="M12 4l0 12" />
                          </svg>
                        </span>
                      </div>
                      <h4 className="h3 mb-2">简单易用</h4>
                      <p className="text-secondary">直观的界面设计，让作品提交变得简单快捷，无需复杂操作。</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-6 col-lg-4">
                  <div className="card border-0 bg-transparent">
                    <div className="card-body">
                      <div className="mb-3">
                        <span className="avatar bg-green text-white avatar-lg">
                          <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="32" height="32" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                            <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                            <path d="M12 3h7a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-10a2 2 0 0 1 2 -2h7" />
                          </svg>
                        </span>
                      </div>
                      <h4 className="h3 mb-2">实时预览</h4>
                      <p className="text-secondary">3D模型自动生成缩略图，支持在线预览，随时查看作品效果。</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-6 col-lg-4">
                  <div className="card border-0 bg-transparent">
                    <div className="card-body">
                      <div className="mb-3">
                        <span className="avatar bg-info text-white avatar-lg">
                          <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="32" height="32" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                            <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                            <path d="M5 5h14a2 2 0 0 1 2 2v8a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-8a2 2 0 0 1 2 -2" />
                            <path d="M9 9h6v6h-6z" />
                            <path d="M3 13h2" />
                            <path d="M3 9h2" />
                            <path d="M3 5h2" />
                            <path d="M14 15h2" />
                            <path d="M14 11h2" />
                          </svg>
                        </span>
                      </div>
                      <h4 className="h3 mb-2">高效管理</h4>
                      <p className="text-secondary">教师可以轻松管理作业、查看作品、批量导出，提高教学效率。</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;