import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function AssignmentViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAssignment = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`/api/assignments/${id}`);
      if (response.data.success) {
        setAssignment(response.data.data);
      } else {
        setError('获取作业信息失败');
      }
    } catch (err) {
      console.error('获取作业信息错误:', err);
      setError('获取作业信息失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAssignment();
  }, [fetchAssignment]);

  const getStatusBadge = (status) => {
    return status === 'active' 
      ? '<span class="badge bg-success">进行中</span>'
      : '<span class="badge bg-secondary">已归档</span>';
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">加载中...</span>
        </div>
        <p className="mt-3 text-muted">加载作业详情中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="empty py-5">
          <div className="empty-img">
            <svg xmlns="http://www.w3.org/2000/svg" className="icon text-muted" width="64" height="64" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
              <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
              <path d="M10 10l2 2l4 -4" />
            </svg>
          </div>
          <p className="empty-title">{error}</p>
          <p className="empty-subtitle text-muted">请稍后重试或联系管理员</p>
          <div className="empty-action">
            <button onClick={fetchAssignment} className="btn btn-primary">
              重新加载
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="card">
        <div className="empty py-5">
          <p className="empty-title">作业不存在</p>
          <div className="empty-action">
            <Link to="/assignments" className="btn btn-primary">
              返回作业列表
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <Link to="/assignments" className="btn btn-outline-secondary">
            <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
              <path d="M15 6l-6 6l6 6" />
            </svg>
            返回
          </Link>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-8">
          <div className="card">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start mb-4">
                <div>
                  <h3 className="card-title mb-2">{assignment.name}</h3>
                  <div className="text-muted">
                    <span className="badge bg-secondary me-2">{assignment.year}</span>
                    <span dangerouslySetInnerHTML={{ __html: getStatusBadge(assignment.status) }} />
                  </div>
                </div>
                {isAuthenticated && (
                  <div className="btn-list">
                    <Link 
                      to={`/assignments/${assignment.id}/edit`} 
                      className="btn btn-sm btn-primary"
                    >
                      编辑
                    </Link>
                    <Link 
                      to={`/assignments/${assignment.id}/submissions`}
                      className="btn btn-sm btn-info"
                    >
                      查看作品 ({assignment.submission_count || 0})
                    </Link>
                  </div>
                )}
              </div>

              <div className="mb-4">
                <h6 className="text-muted text-uppercase mb-2">作业类型</h6>
                <div>
                  {assignment.upload_types.map((type, index) => (
                    <span key={index} className="badge bg-info text-dark me-1">
                      {type.toUpperCase()}
                    </span>
                  ))}
                </div>
              </div>


              <div className="mb-4">
                <h6 className="text-muted text-uppercase mb-2">详细描述</h6>
                <div className="border rounded p-3">
                  <div 
                    dangerouslySetInnerHTML={{ __html: assignment.description || '<em class="text-muted">暂无描述</em>' }}
                  />
                </div>
              </div>

              <div className="mb-4">
                <h6 className="text-muted text-uppercase mb-2">创建时间</h6>
                <div className="text-muted">
                  {new Date(assignment.created_at).toLocaleString('zh-CN')}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card">
            <div className="card-body">
              <h3 className="card-title">
                <svg xmlns="http://www.w3.org/2000/svg" className="icon text-primary me-2" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                  <path d="M4 7a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12z" />
                  <path d="M16 3v4" />
                  <path d="M8 3v4" />
                  <path d="M4 11h16" />
                  <path d="M15 11v6" />
                  <path d="M15 15h.01" />
                </svg>
                作业统计
              </h3>
              <div className="list-group list-group-flush">
                <div className="list-group-item">
                  <div className="row align-items-center">
                    <div className="col-auto">
                      <span className="text-muted">提交数量</span>
                    </div>
                    <div className="col text-end">
                      <span className="badge bg-primary">{assignment.submission_count || 0}</span>
                    </div>
                  </div>
                </div>
                <div className="list-group-item">
                  <div className="row align-items-center">
                    <div className="col-auto">
                      <span className="text-muted">作业类型</span>
                    </div>
                    <div className="col text-end">
                      <span className="badge bg-info text-dark">{assignment.upload_types.length}</span>
                    </div>
                  </div>
                </div>
                <div className="list-group-item">
                  <div className="row align-items-center">
                    <div className="col-auto">
                      <span className="text-muted">状态</span>
                    </div>
                    <div className="col text-end">
                      <span dangerouslySetInnerHTML={{ __html: getStatusBadge(assignment.status) }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {isAuthenticated && (
            <div className="card mt-3">
              <div className="card-body">
                <h3 className="card-title">
                  <svg xmlns="http://www.w3.org/2000/svg" className="icon text-yellow me-2" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                    <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
                    <path d="M9 12l2 2l4 -4" />
                  </svg>
                  快捷操作
                </h3>
                <div className="d-grid gap-2">
                  <Link 
                    to={`/assignments/${assignment.id}/submissions`}
                    className="btn btn-outline-primary"
                  >
                    查看所有提交作品
                  </Link>
                  <Link 
                    to={`/assignments/${assignment.id}/edit`}
                    className="btn btn-outline-secondary"
                  >
                    编辑作业信息
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AssignmentViewPage;