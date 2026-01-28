import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AssignmentDeleteModal from '../components/AssignmentDeleteModal';

function AssignmentManagementPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);

  const fetchAssignments = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get('/api/assignments');
      if (response.data.success) {
        setAssignments(response.data.data);
      } else {
        setError('获取作业列表失败');
      }
    } catch (err) {
      console.error('获取作业列表错误:', err);
      setError('获取作业列表失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchAssignments();
  }, [isAuthenticated, navigate, fetchAssignments]);

  const handleDelete = async (id, name) => {
    // 先检查作业是否有作品
    try {
      const response = await axios.get(`/api/assignments/${id}`);
      if (response.data.success) {
        const assignment = response.data.data;
        // 始终显示模态框
        setSelectedAssignment(assignment);
        setShowDeleteModal(true);
      }
    } catch (err) {
      console.error('检查作业失败:', err);
      alert(`检查作业失败：${err.response?.data?.error || err.message || '请稍后重试'}`);
    }
  };

  const handleModalClose = () => {
    setShowDeleteModal(false);
    setSelectedAssignment(null);
  };

  const handleModalDelete = () => {
    fetchAssignments();
  };

    const getStatusBadge = (status) => {
      return status === 'active'
        ? '<span class="badge bg-success-lt">进行中</span>'
        : '<span class="badge bg-secondary-lt">已归档</span>';
    };
  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">加载中...</span>
        </div>
        <p className="mt-3 text-muted">加载作业列表中...</p>
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
            <button onClick={fetchAssignments} className="btn btn-primary">
              重新加载
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="mb-1">课时管理</h3>
          <div className="text-muted">管理所有课时</div>
        </div>
        <div>
          <Link to="/assignments/new" className="btn btn-primary">
            <svg xmlns="http://www.w3.org/2000/svg" className="icon me-2" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
              <path d="M12 5l0 14" />
              <path d="M5 12l14 0" />
            </svg>
            添加作业
          </Link>
        </div>
      </div>

      {assignments.length === 0 ? (
        <div className="card">
          <div className="empty py-5">
            <div className="empty-img">
              <svg xmlns="http://www.w3.org/2000/svg" className="icon text-muted" width="64" height="64" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                <path d="M4 7a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12z" />
                <path d="M16 3v4" />
                <path d="M8 3v4" />
                <path d="M4 11h16" />
                <path d="M15 11v6" />
                <path d="M15 15h.01" />
              </svg>
            </div>
            <p className="empty-title">暂无作业</p>
            <p className="empty-subtitle text-muted">还没有创建任何作业</p>
            <div className="empty-action">
              <Link to="/assignments/new" className="btn btn-primary">
                创建第一个作业
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-vcenter card-table">
                <thead>
                  <tr>
                    <th>年份</th>
                    <th>作业名称</th>
                    <th>作业类型</th>
                    <th>状态</th>
                    <th>提交数</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((assignment) => (
                    <tr key={assignment.id}>
                      <td>{assignment.year}</td>
                      <td>
                        <Link to={`/assignments/${assignment.id}/edit`} className="text-reset">
                          {assignment.name}
                        </Link>
                      </td>
                      <td>
                        {assignment.upload_types.map((type, index) => (
                          <span key={index} className="badge bg-info-lt me-1">
                            {type.toUpperCase()}
                          </span>
                        ))}
                      </td>
                      <td>
                        <span dangerouslySetInnerHTML={{ __html: getStatusBadge(assignment.status) }} />
                      </td>
                      <td>
                        <Link to={`/assignments/${assignment.id}/submissions`} className="badge badge-outline text-primary">
                          {assignment.submission_count || 0}
                        </Link>
                      </td>
                      <td>
                        <div className="btn-list flex-nowrap">
                          <Link 
                            to={`/assignments/${assignment.id}`}
                            className="btn btn-sm btn-outline-secondary"
                          >
                            查看
                          </Link>
                          <Link 
                            to={`/assignments/${assignment.id}/edit`} 
                            className="btn btn-sm btn-outline-primary"
                          >
                            编辑
                          </Link>
                          <Link 
                            to={`/assignments/${assignment.id}/submissions`}
                            className="btn btn-sm btn-outline-info"
                          >
                            查看作品
                          </Link>
                          <button
                            onClick={() => handleDelete(assignment.id, assignment.name)}
                            className="btn btn-sm btn-outline-danger"
                          >
                            删除
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认模态框 */}
      <AssignmentDeleteModal
        show={showDeleteModal}
        assignment={selectedAssignment}
        onClose={handleModalClose}
        onDelete={handleModalDelete}
      />
    </div>
  );
}

export default AssignmentManagementPage;
