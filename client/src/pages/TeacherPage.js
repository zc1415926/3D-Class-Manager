import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function TeacherPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/access-denied', { replace: true });
      return;
    }
    fetchSubmissions();
  }, [isAuthenticated, navigate]);

  const fetchSubmissions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get('/api/submissions');
      if (response.data.success) {
        setSubmissions(response.data.data);
      } else {
        setError('获取作品列表失败');
      }
    } catch (err) {
      console.error('获取作品列表错误:', err);
      setError('获取作品列表失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('确定要删除这个作品吗？')) {
      return;
    }

    try {
      await axios.delete(`/api/submissions/${id}`);
      setSubmissions(submissions.filter(sub => sub.id !== id));
    } catch (err) {
      console.error('删除失败:', err);
      alert('删除失败，请稍后重试');
    }
  };

  const handleDownload = async (filename) => {
    try {
      const response = await axios.get(`/api/download/${filename}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();

      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('下载失败:', error);
      alert('下载失败，请重试');
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="mb-1">作品管理</h3>
          <div className="text-muted">查看和管理所有学生提交的3D作品</div>
        </div>
        <button
          className="btn btn-primary"
          onClick={fetchSubmissions}
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              刷新中...
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="icon me-2" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
                <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
              </svg>
              刷新列表
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {error}
          <button type="button" className="btn-close" onClick={() => setError(null)}></button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">加载中...</span>
          </div>
          <p className="mt-3 text-muted">加载作品列表中...</p>
        </div>
      ) : submissions.length === 0 ? (
        <div className="card">
          <div className="empty py-5">
            <div className="empty-img">
              <svg xmlns="http://www.w3.org/2000/svg" className="icon text-muted" width="64" height="64" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
                <path d="M9 12l2 2l4 -4" />
              </svg>
            </div>
            <p className="empty-title">暂无作品提交</p>
            <p className="empty-subtitle text-muted">等待学生提交作品...</p>
          </div>
        </div>
      ) : (
        <div className="row row-cards">
          {submissions.map((submission) => (
            <div key={submission.id} className="col-md-6 col-lg-4">
              <div className="card">
                {submission.thumbnailPath ? (
                  <div className="card-img-top position-relative" style={{ aspectRatio: '16/10', overflow: 'hidden' }}>
                    <img
                      src={submission.thumbnailPath}
                      alt={submission.workName}
                      className="w-100 h-100 object-fit-contain bg-light"
                    />
                  </div>
                ) : (
                  <div className="card-img-top bg-light d-flex align-items-center justify-content-center" style={{ aspectRatio: '16/10' }}>
                    <div className="text-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="icon text-muted mb-2" width="48" height="48" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                        <path d="M15 8h.01" />
                        <path d="M3 6a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v12a3 3 0 0 1 -3 3h-12a3 3 0 0 1 -3 -3v-12z" />
                        <path d="M3 16l5 -5c.928 -.893 2.072 -.893 3 0l5 5" />
                        <path d="M14 14l1 -1c.928 -.893 2.072 -.893 3 0l3 3" />
                      </svg>
                      <div className="text-muted">暂无缩略图</div>
                    </div>
                  </div>
                )}
                <div className="card-body">
                  <h3 className="card-title">{submission.workName}</h3>
                  {submission.description && (
                    <p className="card-text text-muted">{submission.description}</p>
                  )}
                  <div className="d-flex align-items-center mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="icon text-muted me-2" width="20" height="20" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                      <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                      <path d="M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0" />
                      <path d="M6 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" />
                    </svg>
                    <span className="text-muted">{submission.studentName}</span>
                    <span className="badge bg-info text-dark ms-2">{submission.studentYear}</span>
                  </div>
                  <div className="d-flex align-items-center text-muted">
                    <svg xmlns="http://www.w3.org/2000/svg" className="icon me-2" width="16" height="16" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                      <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                      <path d="M4 7a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12z" />
                      <path d="M16 3v4" />
                      <path d="M8 3v4" />
                      <path d="M4 11h16" />
                      <path d="M15 11v6" />
                      <path d="M15 15h.01" />
                    </svg>
                    <span>{new Date(submission.createdAt).toLocaleString('zh-CN')}</span>
                  </div>
                </div>
                <div className="card-footer">
                  <div className="d-flex gap-2">
                    <Link
                      to={`/viewer/${submission.id}`}
                      state={{ from: location.pathname }}
                      className="btn btn-primary flex-fill"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="20" height="20" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                        <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
                        <path d="M10 12a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" />
                        <path d="M21 12c-2.4 4 -5.4 6 -9 6c-3.6 0 -6.6 -2 -9 -6c2.4 -4 5.4 -6 9 -6c3.6 0 6.6 2 9 6" />
                      </svg>
                      查看
                    </Link>
                    <button
                      onClick={() => handleDownload(submission.filename)}
                      className="btn btn-success flex-fill"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="20" height="20" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                        <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" />
                        <path d="M7 11l5 5l5 -5" />
                        <path d="M12 4l0 12" />
                      </svg>
                      下载
                    </button>
                    <button
                      className="btn btn-outline-danger"
                      onClick={() => handleDelete(submission.id)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="20" height="20" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                        <path d="M4 7l16 0" />
                        <path d="M10 11l0 6" />
                        <path d="M14 11l0 6" />
                        <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" />
                        <path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" />
                      </svg>
                      删除
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TeacherPage;