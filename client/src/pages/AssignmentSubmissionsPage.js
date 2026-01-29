import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import GradeSubmissionModal from '../components/GradeSubmissionModal';

function AssignmentSubmissionsPage() {
  const { id } = useParams();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [assignment, setAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [gradingSubmission, setGradingSubmission] = useState(null);
  const [requirementId, setRequirementId] = useState(null);
  const [requirementName, setRequirementName] = useState('');

  useEffect(() => {
    // 从URL参数中获取requirementId
    const searchParams = new URLSearchParams(location.search);
    const reqId = searchParams.get('requirement');
    setRequirementId(reqId);
    fetchData(reqId);
  }, [id, location.search]);

  const fetchData = async (reqId) => {
    setLoading(true);
    setError(null);

    try {
      // 获取作业信息
      const assignmentRes = await axios.get(`/api/assignments/${id}`);
      if (assignmentRes.data.success) {
        // 处理作业信息，确保upload_types是数组
        const assignmentData = assignmentRes.data.data;
        if (typeof assignmentData.upload_types === 'string') {
          assignmentData.upload_types = JSON.parse(assignmentData.upload_types);
        }
        setAssignment(assignmentData);
        
        // 如果指定了requirementId，获取要求名称
        if (reqId) {
          const reqRes = await axios.get(`/api/assignments/${id}/upload-requirements`);
          if (reqRes.data.success) {
            const requirement = reqRes.data.data.find(req => req.id === parseInt(reqId));
            if (requirement) {
              setRequirementName(requirement.name);
            }
          }
        }
      }

      // 获取该作业的所有提交
      const submissionsRes = await axios.get(`/api/assignments/${id}/submissions`);
      if (submissionsRes.data.success) {
        // 处理数据，转换字段名
        const processedSubmissions = submissionsRes.data.data.map(sub => ({
          ...sub,
          studentName: sub.student_name,
          studentYear: sub.student_year,
          workName: sub.work_name,
          description: sub.description,
          filename: sub.filename,
          filePath: sub.filePath || null,
          thumbnailPath: sub.thumbnail_path || null,
          createdAt: sub.created_at,
          assignmentId: sub.assignment_id
        }));
        
        setSubmissions(processedSubmissions);
        
        // 如果指定了requirementId，过滤只显示该要求的提交
        if (reqId && processedSubmissions.length > 0) {
          // 过滤逻辑：获取每个提交的详情，检查是否有文件属于该requirement
          const filtered = [];
          for (const sub of processedSubmissions) {
            try {
              const detailRes = await axios.get(`/api/submissions/${sub.id}`);
              if (detailRes.data.success && detailRes.data.data.files) {
                // 找到匹配requirement的文件
                const matchedFiles = detailRes.data.data.files.filter(
                  file => file.requirement_id === parseInt(reqId)
                );
                if (matchedFiles.length > 0) {
                  // 使用匹配的文件信息更新submission对象
                  const primaryFile = matchedFiles[0];
                  filtered.push({
                    ...sub,
                    filename: primaryFile.filename,
                    filePath: primaryFile.filepath,
                    thumbnailPath: primaryFile.thumbnail_path,
                    // 保存所有匹配的文件信息供后续使用
                    matchedFiles: matchedFiles
                  });
                }
              }
            } catch (err) {
              console.error(`获取提交详情失败: ${sub.id}`, err);
            }
          }
          setFilteredSubmissions(filtered);
        } else {
          setFilteredSubmissions(processedSubmissions);
        }
      }
    } catch (err) {
      console.error('获取数据失败:', err);
      setError('获取数据失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (submissionId) => {
    if (!window.confirm('确定要删除这个作品吗？')) {
      return;
    }

    try {
      const response = await axios.delete(`/api/submissions/${submissionId}`);
      if (response.data.success) {
        // 重新获取数据
        fetchData();
      } else {
        setError('删除失败：' + response.data.error);
      }
    } catch (err) {
      console.error('删除失败:', err);
      setError('删除失败，请稍后重试');
    }
  };

  // 处理评分
  const handleGrade = (submission) => {
    setGradingSubmission(submission);
    setShowGradeModal(true);
  };

  // 保存评分
  const handleSaveGrade = async (gradeData) => {
    try {
      await axios.put(`/api/submissions/${gradeData.id}/grade`, {
        score: gradeData.score,
        grade: gradeData.grade
      });
      
      // 更新本地状态
      const updatedSubmissions = submissions.map(sub => 
        sub.id === gradeData.id 
          ? { ...sub, score: gradeData.score, grade: gradeData.grade, graded_at: new Date().toISOString() }
          : sub
      );
      setSubmissions(updatedSubmissions);
      
      // 同时更新过滤后的列表
      const updatedFilteredSubmissions = filteredSubmissions.map(sub => 
        sub.id === gradeData.id 
          ? { ...sub, score: gradeData.score, grade: gradeData.grade, graded_at: new Date().toISOString() }
          : sub
      );
      setFilteredSubmissions(updatedFilteredSubmissions);
      
      setShowGradeModal(false);
      setGradingSubmission(null);
    } catch (error) {
      console.error('评分失败:', error);
      throw new Error(error.response?.data?.error || '评分失败');
    }
  };

  // 关闭评分模态框
  const handleCloseGradeModal = () => {
    setShowGradeModal(false);
    setGradingSubmission(null);
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">加载中...</span>
        </div>
        <p className="mt-3">加载中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        <svg xmlns="http://www.w3.org/2000/svg" className="icon alert-icon flex-shrink-0" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
          <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
          <path d="M10 10l4 4m0 -4l-4 4" />
        </svg>
        {error}
      </div>
    );
  }

  return (
    <div>
      {requirementName && (
        <div className="alert alert-info mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="icon alert-icon flex-shrink-0" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
            <path d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
            <path d="M12 9h.01" />
            <path d="M11 12h1v4h1" />
          </svg>
          当前仅显示作业要求: <strong>{requirementName}</strong>
          <Link to={`/assignments/${id}/submissions`} className="btn btn-sm btn-outline-primary ms-3">
            查看全部
          </Link>
        </div>
      )}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <Link to="/assignments" className="btn btn-outline-secondary me-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="icon me-1" width="20" height="20" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
              <path d="M15 6l-6 6l6 6" />
            </svg>
            返回课时管理
          </Link>
          <h2 className="d-inline-block align-middle mb-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="icon text-primary me-2" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
              <path d="M9 11l3 3l8 -8" />
              <path d="M20 12v6a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2h9" />
            </svg>
            {assignment?.name || '作业详情'}
          </h2>
        </div>
        <div className="text-muted">
          共 <strong>{submissions.length}</strong> 个提交
        </div>
      </div>

      {assignment && (
        <div className="card mb-4">
          <div className="card-body">
            <h5 className="card-title">作业信息</h5>
            <table className="table table-borderless">
              <tbody>
                <tr>
                  <td className="fw-bold" style={{ width: '120px' }}>作业名称:</td>
                  <td>{assignment.name}</td>
                </tr>
                <tr>
                  <td className="fw-bold">允许的文件类型:</td>
                  <td>
                    {assignment.upload_types.map((type, index) => (
                      <span key={index} className="badge bg-info-lt me-1">
                        {type.toUpperCase()}
                      </span>
                    ))}
                  </td>
                </tr>
                <tr>
                  <td className="fw-bold">作业描述:</td>
                  <td dangerouslySetInnerHTML={{ __html: assignment.description || '无' }}></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {submissions.length === 0 ? (
        <div className="card">
          <div className="empty py-5">
            <div className="empty-img">
              <svg xmlns="http://www.w3.org/2000/svg" className="icon text-muted" width="64" height="64" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
                <path d="M9 12l2 2l4 -4" />
              </svg>
            </div>
            <p className="empty-title">暂无提交</p>
            <p className="empty-subtitle text-muted">还没有学生提交这个作业</p>
          </div>
        </div>
      ) : (
        <div className="row row-cards">
          {filteredSubmissions.map((submission) => (
            <div key={submission.id} className="col-md-6 col-lg-4">
              <div className="card">
                {submission.thumbnailPath ? (
                  <Link
                    to={`/viewer/${submission.id}`}
                    state={{ from: `/assignments/${id}/submissions` }}
                    className="card-img-top position-relative"
                    style={{ aspectRatio: '16/10', overflow: 'hidden', display: 'block', cursor: 'pointer' }}
                  >
                    <img
                      src={submission.thumbnailPath}
                      alt={submission.workName}
                      className="w-100 h-100 object-fit-contain bg-light"
                      style={{ transition: 'opacity 0.2s' }}
                      onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                      onMouseLeave={(e) => e.target.style.opacity = '1'}
                    />
                  </Link>
                ) : (
                  <Link
                    to={`/viewer/${submission.id}`}
                    state={{ from: `/assignments/${id}/submissions` }}
                    className="card-img-top bg-light d-flex align-items-center justify-content-center"
                    style={{ aspectRatio: '16/10', display: 'block', cursor: 'pointer' }}
                  >
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
                  </Link>
                )}
                <div className="card-body">
                  <h3 className="card-title">
                    {requirementId && requirementName 
                      ? `${assignment?.name} - ${requirementName}`
                      : (assignment?.name || submission.workName)
                    }
                  </h3>
                  <div className="d-flex align-items-center mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="icon text-muted me-2" width="20" height="20" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                      <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                      <path d="M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0" />
                      <path d="M6 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" />
                    </svg>
                    <span className="text-muted">{submission.studentName}</span>
                    <span className="badge bg-info-lt ms-2">{submission.studentYear}</span>
                  </div>
                  {submission.description && (
                    <p className="card-text text-muted">{submission.description}</p>
                  )}
                  <div className="d-flex align-items-center text-muted mb-3">
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
                  <div className="d-flex gap-2">
                    <Link
                      to={`/viewer/${submission.id}`}
                      state={{ from: `/assignments/${id}/submissions` }}
                      className="btn btn-sm btn-outline-primary flex-fill"
                    >
                      查看
                    </Link>
                    <a
                      href={submission.filePath}
                      download={submission.filename}
                      className="btn btn-sm btn-outline-success flex-fill"
                    >
                      下载
                    </a>
                    {isAuthenticated && (
                      <>
                        <button
                          className="btn btn-sm btn-outline-warning"
                          onClick={() => handleGrade(submission)}
                          title="评分"
                        >
                          {submission.grade ? (
                            <span className={`badge ${submission.grade === 'S' ? 'bg-danger' : 
                              submission.grade === 'A' ? 'bg-primary' : 
                              submission.grade === 'B' ? 'bg-info' : 
                              submission.grade === 'C' ? 'bg-secondary' : 'bg-dark'}`}>
                              {submission.grade}
                            </span>
                          ) : (
                            '评分'
                          )}
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDelete(submission.id)}
                        >
                          删除
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {/* 评分模态框 */}
      {showGradeModal && gradingSubmission && (
        <GradeSubmissionModal
          show={showGradeModal}
          submission={gradingSubmission}
          onClose={handleCloseGradeModal}
          onSave={handleSaveGrade}
        />
      )}
    </div>
  );
}

export default AssignmentSubmissionsPage;