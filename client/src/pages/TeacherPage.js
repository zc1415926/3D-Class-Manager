import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function TeacherPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isTeacher, isLoading } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // 等待认证信息加载完成后再做判断
    if (!isLoading) {
      if (!isAuthenticated || !isTeacher) {
        navigate('/access-denied', { replace: true });
        return;
      }
      fetchAssignments();
    }
  }, [isAuthenticated, isTeacher, isLoading, navigate]);

  const fetchAssignments = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 获取所有作业
      const assignmentsRes = await axios.get('/api/assignments');
      if (assignmentsRes.data.success) {
        const assignmentsData = assignmentsRes.data.data;
        
        // 获取每个作业的提交数量和作业要求
        const assignmentsWithStats = await Promise.all(
          assignmentsData.map(async (assignment) => {
            try {
              // 获取提交数量
              const submissionsRes = await axios.get(`/api/assignments/${assignment.id}/submissions`);
              let submissionCount = 0;
              let gradedCount = 0;
              const submissions = submissionsRes.data.success ? submissionsRes.data.data : [];
              
              if (submissions.length > 0) {
                submissionCount = submissions.length;
                gradedCount = submissions.filter(sub => sub.grade).length;
              }
              
              // 获取作业要求
              const requirementsRes = await axios.get(`/api/assignments/${assignment.id}/upload-requirements`);
              let requirements = [];
              
              if (requirementsRes.data.success && requirementsRes.data.data.length > 0) {
                // 为每个要求计算提交数量和评分进度
                requirements = await Promise.all(
                  requirementsRes.data.data.map(async (req) => {
                    let reqSubmissionCount = 0;
                    let reqGradedCount = 0;
                    
                    if (submissions.length > 0) {
                      // 遍历所有提交，检查是否有文件属于该要求
                      for (const sub of submissions) {
                        try {
                          const detailRes = await axios.get(`/api/submissions/${sub.id}`);
                          if (detailRes.data.success && detailRes.data.data.files) {
                            const filesForRequirement = detailRes.data.data.files.filter(
                              file => file.requirement_id === req.id
                            );
                            if (filesForRequirement.length > 0) {
                              reqSubmissionCount++;
                              // 检查该要求的所有文件是否都已评分
                              const allGraded = filesForRequirement.every(file => file.grade);
                              if (allGraded) {
                                reqGradedCount++;
                              }
                            }
                          }
                        } catch (err) {
                          console.error(`获取提交详情失败: ${sub.id}`, err);
                        }
                      }
                    }
                    
                    return {
                      ...req,
                      submissionCount: reqSubmissionCount,
                      gradedCount: reqGradedCount
                    };
                  })
                );
              }
              
              return {
                ...assignment,
                submissionCount: submissionCount,
                gradedCount: gradedCount,
                requirements: requirements
              };
            } catch (err) {
              console.error(`获取作业 ${assignment.id} 的信息失败:`, err);
            }
            return {
              ...assignment,
              submissionCount: 0,
              gradedCount: 0,
              requirements: []
            };
          })
        );
        
        setAssignments(assignmentsWithStats);
      } else {
        setError('获取作业列表失败');
      }
    } catch (err) {
      console.error('获取作业列表错误:', err);
      setError('获取作业列表失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleStartGrading = (assignmentId, requirementId) => {
    navigate(`/grading/${assignmentId}/${requirementId}`);
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
          onClick={fetchAssignments}
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
          <p className="mt-3 text-muted">加载作业列表中...</p>
        </div>
      ) : assignments.length === 0 ? (
        <div className="card">
          <div className="empty py-5">
            <div className="empty-img">
              <svg xmlns="http://www.w3.org/2000/svg" className="icon text-muted" width="64" height="64" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                <path d="M9 5h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-12a2 2 0 0 0 -2 -2h-2" />
                <path d="M9 3m0 2a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v0a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2v0a2 2 0 0 1 2 -2" />
                <path d="M9 14h6" />
                <path d="M9 18h6" />
              </svg>
            </div>
            <p className="empty-title">暂无课时</p>
            <p className="empty-subtitle text-muted">请先创建课时，然后学生才能提交作品</p>
          </div>
        </div>
      ) : (
        <div className="row">
          {assignments.map((assignment) => (
            <div key={assignment.id} className="col-12 mb-4">
              <div className="card">
                <div className="card-header">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h3 className="card-title">{assignment.name}</h3>
                      <div className="card-subtitle">
                        {assignment.year}年度 | 提交: {assignment.submissionCount} | 已评分: {assignment.gradedCount}
                      </div>
                    </div>
                  </div>
                </div>
                {assignment.submissionCount > 0 && (
                  <div className="card-body">
                    <div className="row">
                      {assignment.upload_types && assignment.upload_types.length > 0 && (
                        <div className="col-md-6">
                          <div className="mb-3">
                            <div className="text-muted">作业类型:</div>
                            <div>
                              {assignment.upload_types.map((type, index) => (
                                <span key={index} className="badge bg-secondary me-1">
                                  {type}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="col-md-6">
                        <div className="mb-3">
                          <div className="text-muted">评分进度:</div>
                          <div className="progress progress-sm">
                            <div 
                              className="progress-bar bg-primary" 
                              style={{ width: `${assignment.submissionCount > 0 ? (assignment.gradedCount / assignment.submissionCount) * 100 : 0}%` }}
                            ></div>
                          </div>
                          <small className="text-muted">
                            {assignment.gradedCount} / {assignment.submissionCount} 已评分
                          </small>
                        </div>
                      </div>
                    </div>
                    
                    {/* 作业要求列表 */}
                    {assignment.requirements && assignment.requirements.length > 0 && (
                      <div className="mt-3">
                        <div className="text-muted mb-2">作业要求:</div>
                        <div className="list list-group list-group-flush">
                          {assignment.requirements.map((req, index) => (
                            <div key={req.id || index} className="list-group-item p-3 border-0 bg-light mb-2 rounded">
                              <div className="d-flex justify-content-between align-items-center">
                                <div className="flex-grow-1">
                                  <div className="font-weight-medium">{req.name}</div>
                                  <small className="text-muted">类型: {req.upload_type}</small>
                                  {req.is_required && <span className="badge bg-danger ms-2">必填</span>}
                                </div>
                                <div className="d-flex gap-2">
                                  <Link
                                    to={`/assignments/${assignment.id}/submissions?requirement=${req.id}`}
                                    className="btn btn-sm btn-outline-primary"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="16" height="16" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                      <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                                      <path d="M10 12a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" />
                                      <path d="M21 12c-2.4 4 -5.4 6 -9 6c-3.6 0 -6.6 -2 -9 -6c2.4 -4 5.4 -6 9 -6c3.6 0 6.6 2 9 6" />
                                    </svg>
                                    查看作品 ({req.submissionCount || 0})
                                  </Link>
                                  <button
                                    className="btn btn-sm btn-primary"
                                    onClick={() => handleStartGrading(assignment.id, req.id)}
                                    disabled={!req.submissionCount}
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="16" height="16" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                      <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                                      <path d="M12 17l-2 2l2 2m-2 -2h9" />
                                      <path d="M10 21h-2a1 1 0 0 1 -1 -1v-2a1 1 0 0 1 1 -1h2" />
                                      <path d="M7 7v-1a2 2 0 0 1 2 -2h4a2 2 0 0 1 2 2v1" />
                                      <path d="M7 7h10" />
                                    </svg>
                                    {req.submissionCount === 0 ? '暂无作品' : 
                                     `开始打分 (${req.gradedCount || 0}/${req.submissionCount})`}
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TeacherPage;