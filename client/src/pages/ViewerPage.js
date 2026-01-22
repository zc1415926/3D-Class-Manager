import React, { useEffect, useRef, useState, useCallback } from 'react';
import axios from 'axios';
import { useParams, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '@babylonjs/viewer';

function ViewerPage() {
  const { id } = useParams();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const viewerRef = useRef(null);
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSubmission = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`/api/submissions/${id}`);
      if (response.data.success) {
        setSubmission(response.data.data);
      } else {
        setError('获取作品信息失败');
      }
    } catch (err) {
      console.error('获取作品信息错误:', err);
      setError('获取作品信息失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSubmission();
  }, [fetchSubmission]);

  // 获取返回路径
  const getBackPath = () => {
    const from = location.state?.from;
    if (from === '/works' || from === '/student-management') {
      return from;
    }
    return '/student-view';
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">加载中...</span>
        </div>
        <p className="mt-3">加载作品信息中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-5">
        <div className="display-1 mb-3">❌</div>
        <h4>{error}</h4>
        <Link to="/teacher" className="btn btn-primary mt-3">
          返回教师页面
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <Link to={getBackPath()} className="btn btn-outline-secondary me-2">
            ← 返回
          </Link>
          <h2 className="d-inline-block align-middle mb-0">
            🎨 作品详情
          </h2>
        </div>
        <button
          className="btn btn-info text-white"
          onClick={() => window.location.reload()}
        >
          🔄 重新加载
        </button>
      </div>

      <div className="row">
        <div className="col-lg-8">
          <div className="card">
            <div className="card-body p-0">
              {/* Babylon Viewer */}
              <div style={{ height: '600px', width: '100%' }}>
                <babylon-viewer
                  ref={viewerRef}
                  source={submission.filePath}
                  style={{ width: '100%', height: '100%' }}
                ></babylon-viewer>
              </div>
            </div>
          </div>

          {/* 操作说明 */}
          <div className="card mt-3">
            <div className="card-body">
              <h5 className="card-title">🎮 操作说明</h5>
              <ul className="mb-0">
                <li>鼠标左键拖拽：旋转模型</li>
                <li>鼠标滚轮：缩放模型</li>
                <li>鼠标右键拖拽：平移模型</li>
                <li>使用工具栏切换视图模式</li>
                <li>支持全屏查看</li>
                <li>自动适应模型大小</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">📋 作品信息</h5>
            </div>
            <div className="card-body">
              <table className="table table-borderless">
                <tbody>
                  <tr>
                    <td className="fw-bold">作品名称:</td>
                    <td>{submission.workName}</td>
                  </tr>
                  <tr>
                    <td className="fw-bold">学生姓名:</td>
                    <td>{submission.studentName}</td>
                  </tr>
                  {submission.description && (
                    <tr>
                      <td className="fw-bold">作品说明:</td>
                      <td>{submission.description}</td>
                    </tr>
                  )}
                  <tr>
                    <td className="fw-bold">文件名:</td>
                    <td>{submission.filename}</td>
                  </tr>
                  <tr>
                    <td className="fw-bold">提交时间:</td>
                    <td>
                      {new Date(submission.createdAt).toLocaleString('zh-CN')}
                    </td>
                  </tr>
                </tbody>
              </table>

              {submission.thumbnailPath && (
                <div className="mt-3">
                  <h6 className="fw-bold">缩略图:</h6>
                  <img
                    src={submission.thumbnailPath}
                    alt="缩略图"
                    className="img-fluid rounded"
                    style={{ maxHeight: '200px' }}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="card mt-3">
            <div className="card-body">
              {isAuthenticated ? (
                <a
                  href={submission.filePath}
                  download={submission.filename}
                  className="btn btn-success w-100"
                >
                  📥 下载STL文件
                </a>
              ) : (
                <div>
                  <div className="alert alert-info mb-0 text-center">
                    <small>
                      👁️ 3D模型已在线预览<br />
                      <span className="text-muted">登录教师账号以下载文件</span>
                    </small>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ViewerPage;