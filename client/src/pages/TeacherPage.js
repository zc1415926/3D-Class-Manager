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
        <h2>📚 作品管理页面</h2>
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
            '🔄 刷新列表'
          )}
        </button>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">加载中...</span>
          </div>
          <p className="mt-3">加载作品列表中...</p>
        </div>
      ) : submissions.length === 0 ? (
        <div className="text-center py-5">
          <div className="display-1 mb-3">📭</div>
          <h4>暂无作品提交</h4>
          <p className="text-muted">等待学生提交作品...</p>
        </div>
      ) : (
        <div className="row">
          {submissions.map((submission) => (
            <div key={submission.id} className="col-md-6 col-lg-4 mb-4">
              <div className="card h-100">
                {submission.thumbnailPath ? (
                  <div style={{ position: 'relative', width: '100%', paddingTop: '62.5%' }}>
                    <img
                      src={submission.thumbnailPath}
                      alt={submission.workName}
                      className="card-img-top"
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  </div>
                ) : (
                  <div className="card-img-top thumbnail-placeholder" style={{ aspectRatio: '16/10', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span>📷 暂无缩略图</span>
                  </div>
                )}
                <div className="card-body">
                  <h5 className="card-title mb-2" style={{ fontSize: '1.25rem', fontWeight: '600' }}>
                    {submission.workName}
                  </h5>
                  {submission.description && (
                    <p className="card-text text-muted small mb-3" style={{ fontSize: '0.9rem', lineHeight: '1.4' }}>
                      {submission.description}
                    </p>
                  )}
                  <p className="card-text mb-2" style={{ fontSize: '0.95rem' }}>
                    <span className="me-2">👤</span>
                    <strong>{submission.studentName}</strong>
                    <span className="badge bg-info text-dark ms-2">{submission.studentYear}</span>
                  </p>
                  <p className="card-text text-muted small mb-0" style={{ fontSize: '0.85rem' }}>
                    📅 {new Date(submission.createdAt).toLocaleString('zh-CN')}
                  </p>
                </div>
                <div className="card-footer bg-white border-top-0">
                  <div className="row g-2">
                    <div className="col-4">
                      <Link
                        to={`/viewer/${submission.id}`}
                        state={{ from: location.pathname }}
                        className="btn btn-primary w-100"
                        style={{ borderRadius: '8px', padding: '0.5rem 0.25rem', fontSize: '0.85rem' }}
                      >
                        👁️ 查看
                      </Link>
                    </div>
                    <div className="col-4">
                      <button
                        onClick={() => handleDownload(submission.filename)}
                        className="btn btn-success w-100"
                        style={{ borderRadius: '8px', padding: '0.5rem 0.25rem', fontSize: '0.85rem' }}
                      >
                        📥 下载
                      </button>
                    </div>
                    <div className="col-4">
                      <button
                        className="btn btn-outline-danger w-100"
                        onClick={() => handleDelete(submission.id)}
                        style={{ borderRadius: '8px', padding: '0.5rem 0.25rem', fontSize: '0.85rem' }}
                      >
                        🗑️ 删除
                      </button>
                    </div>
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