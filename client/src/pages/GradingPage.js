import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

function GradingPage() {
  const { assignmentId, requirementId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const viewerRef = useRef(null);
  
  console.log('GradingPage渲染，isAuthenticated:', isAuthenticated);
  console.log('axios默认请求头:', axios.defaults.headers.common);
  
  const [submissions, setSubmissions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentSubmission, setCurrentSubmission] = useState(null);
  const [assignmentName, setAssignmentName] = useState('');
  const [requirementName, setRequirementName] = useState('');
  
  // 评分状态
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/access-denied', { replace: true });
      return;
    }
    loadSubmissions(assignmentId, requirementId);
  }, [isAuthenticated, navigate, assignmentId, requirementId]);

  // 初始化Babylon.js查看器
  useEffect(() => {
    console.log('useEffect触发，currentSubmission:', currentSubmission);
    console.log('currentSubmission.filePath:', currentSubmission?.filePath);
    console.log('viewerRef.current:', viewerRef.current);
    
    if (currentSubmission && currentSubmission.filePath && viewerRef.current) {
      console.log('条件满足，开始等待Babylon Viewer加载');
      // 等待Babylon Viewer加载
      const checkViewer = setInterval(() => {
        console.log('检查Babylon Viewer...');
        if (window.BabylonViewer) {
          console.log('Babylon Viewer已加载，调用initializeViewer');
          clearInterval(checkViewer);
          initializeViewer();
        }
      }, 100);

      return () => clearInterval(checkViewer);
    } else {
      console.log('条件不满足，跳过初始化');
    }
  }, [currentSubmission]);

  const initializeViewer = () => {
    console.log('initializeViewer被调用');
    console.log('currentSubmission:', currentSubmission);
    console.log('filePath:', currentSubmission?.filePath);
    
    if (!currentSubmission?.filePath) {
      console.error('filePath不存在');
      return;
    }
    
    const fileUrl = `http://localhost:5000${currentSubmission.filePath}`;
    console.log('完整的文件URL:', fileUrl);
    
    // 使用babylon-viewer标签时，React会自动处理
    // 这里只需要添加一些调试日志
    console.log('Babylon Viewer组件应该会自动加载模型');
  };

  const loadSubmissions = async (aid, rid) => {
    setLoading(true);
    setError(null);
    
    try {
      // 获取作业信息
      const assignmentRes = await axios.get(`/api/assignments/${aid}`);
      if (assignmentRes.data.success) {
        setAssignmentName(assignmentRes.data.data.name);
      }

      // 获取所有提交基本信息
      const submissionsRes = await axios.get(`/api/assignments/${aid}/submissions`);
      if (submissionsRes.data.success) {
        let submissions = submissionsRes.data.data;
        
        // 如果指定了requirementId，需要过滤只显示该要求的文件
        if (rid) {
          // 获取要求名称
          try {
            const reqRes = await axios.get(`/api/assignments/${aid}/upload-requirements`);
            if (reqRes.data.success) {
              const requirement = reqRes.data.data.find(req => req.id === parseInt(rid));
              if (requirement) {
                setRequirementName(requirement.name);
              }
            }
          } catch (err) {
            console.error('获取作业要求失败:', err);
          }
          
          // 过滤逻辑：将 submission 拆分为文件级别的数据
          const fileLevelData = [];
          for (const sub of submissions) {
            try {
              const detailRes = await axios.get(`/api/submissions/${sub.id}`);
              if (detailRes.data.success && detailRes.data.data.files) {
                // 找到所有匹配该 requirement 的文件
                const matchedFiles = detailRes.data.data.files.filter(
                  file => file.requirement_id === parseInt(rid)
                );
                
                // 为每个匹配的文件创建一个独立的条目
                matchedFiles.forEach(file => {
                  fileLevelData.push({
                    submission_id: sub.id,
                    file_id: file.id,
                    student_name: sub.student_name,
                    student_year: sub.student_year,
                    work_name: sub.work_name,
                    description: sub.description,
                    created_at: sub.created_at,
                    score: file.score,
                    grade: file.grade,
                    grader_id: file.grader_id,
                    graded_at: file.graded_at,
                    filename: file.filename,
                    filePath: file.filepath,
                    thumbnailPath: file.thumbnail_path,
                    file_type: file.file_type,
                    requirement_id: file.requirement_id
                  });
                });
              }
            } catch (err) {
              console.error(`获取提交详情失败: ${sub.id}`, err);
            }
          }
          submissions = fileLevelData;
        }
        
        setSubmissions(submissions);
        
        // 找到第一个未评分的作品，或者从第一个开始
        const firstUngradedIndex = submissions.findIndex(sub => !sub.grade);
        if (firstUngradedIndex !== -1) {
          setCurrentIndex(firstUngradedIndex);
          setCurrentSubmission(submissions[firstUngradedIndex]);
          console.log('当前选择的作品 (未评分):', submissions[firstUngradedIndex]);
        } else if (submissions.length > 0) {
          setCurrentIndex(0);
          setCurrentSubmission(submissions[0]);
          console.log('当前选择的作品 (全部已评分):', submissions[0]);
        }
        
        // 打印所有加载的文件信息用于调试
        console.log('加载的文件列表:', submissions.map(s => ({
          submission_id: s.submission_id,
          file_id: s.file_id,
          filename: s.filename,
          filePath: s.filePath,
          thumbnailPath: s.thumbnailPath,
          score: s.score,
          grade: s.grade,
          requirement_id: s.requirement_id
        })));
      } else {
        setError('获取作品列表失败');
      }
    } catch (err) {
      console.error('加载失败:', err);
      setError('加载失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      setCurrentSubmission(submissions[newIndex]);
      setSaveError(null);
    }
  };

  const handleNext = () => {
    if (currentIndex < submissions.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      setCurrentSubmission(submissions[newIndex]);
      setSaveError(null);
    }
  };

  // 评分等级选项
  const gradeOptions = [
    { value: 'S', label: 'S (12分)', score: 12, description: '优秀 - 远越出色的工作，超出预期' },
    { value: 'A', label: 'A (10分)', score: 10, description: '良好 - 高质量的工作，符合预期' },
    { value: 'B', label: 'B (8分)', score: 8, description: '中等 - 基本符合要求' },
    { value: 'C', label: 'C (6分)', score: 6, description: '及格 - 仅满足基本要求' },
    { value: 'O', label: 'O (0分)', score: 0, description: '未通过 - 未满足要求' }
  ];

  const handleSelectGrade = async (selectedGrade, selectedScore) => {
    console.log('开始评分...');
    console.log('文件 ID:', currentSubmission.file_id);
    console.log('评分等级:', selectedGrade);
    console.log('分数:', selectedScore);
    console.log('当前认证令牌:', localStorage.getItem('token'));
    
    setSaving(true);
    setSaveError(null);

    try {
      const fileId = currentSubmission.file_id;
      const response = await axios.put(`/api/submissions/files/${fileId}/grade`, {
        score: parseInt(selectedScore),
        grade: selectedGrade
      });
      
      console.log('评分API响应:', response.data);

      // 更新本地数据 - 只更新当前文件的评分
      const updatedSubmissions = [...submissions];
      updatedSubmissions[currentIndex] = {
        ...updatedSubmissions[currentIndex],
        score: parseInt(selectedScore),
        grade: selectedGrade,
        graded_at: new Date().toISOString()
      };
      
      setSubmissions(updatedSubmissions);
      setCurrentSubmission(updatedSubmissions[currentIndex]);
      
      console.log('本地数据已更新');
      setSaving(false);
    } catch (error) {
      console.error('评分失败，错误详情:', error);
      console.error('错误响应:', error.response?.data);
      setSaveError(error.response?.data?.error || '评分失败，请稍后重试');
      setSaving(false);
    }
  };

  const getProgressText = () => {
    if (submissions.length === 0) return '0/0';
    
    const gradedCount = submissions.filter(sub => sub.grade).length;
    return `${currentIndex + 1}/${submissions.length} (已评分: ${gradedCount})`;
  };

  if (loading) {
    return (
      <div className="container-xl py-4">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">加载中...</span>
          </div>
          <p className="mt-3 text-muted">加载作品中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-xl py-4">
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="container-xl py-4">
        <div className="empty">
          <div className="empty-img">
            <svg xmlns="http://www.w3.org/2000/svg" className="icon text-muted" width="64" height="64" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
              <path d="M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0" />
              <path d="M6 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" />
            </svg>
          </div>
          <p className="empty-title">暂无作品</p>
          <p className="empty-subtitle text-muted">该作业还没有学生提交作品</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      {/* 头部信息 */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">作品评分</h2>
          <div className="text-muted">
            作业: {assignmentName} {requirementName && `| 要求: ${requirementName}`} | 进度: {getProgressText()}
          </div>
        </div>
        <div className="d-flex gap-2">
          <button
            className="btn btn-secondary"
            onClick={() => requirementId ? navigate(`/assignments/${assignmentId}`) : navigate('/assignments')}
          >
            {requirementId ? '返回作业详情' : '返回作业列表'}
          </button>
        </div>
      </div>

      <div className="row">
        {/* 左侧：3D模型展示 */}
        <div className="col-lg-7">
          <div className="card mb-4">
            <div className="card-header">
              <h3 className="card-title">3D模型预览</h3>
              <div className="card-subtitle">
                {assignmentName}
              </div>
            </div>
            <div className="card-body">
              <div style={{ height: '500px', width: '100%' }}>
                <babylon-viewer
                  ref={viewerRef}
                  source={`http://localhost:5000${currentSubmission.filePath}`}
                  style={{ width: '100%', height: '100%' }}
                ></babylon-viewer>
              </div>
              {currentSubmission.thumbnailPath && (
                <div className="mt-3">
                  <img 
                    src={currentSubmission.thumbnailPath} 
                    alt="缩略图"
                    className="img-fluid rounded"
                    style={{ maxHeight: '150px' }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 右侧：学生信息和评分标准 */}
        <div className="col-lg-5">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">学生信息</h3>
            </div>
            <div className="card-body">
              <div className="mb-4">
                <div className="row mb-2">
                  <div className="col-4 text-muted">学生姓名:</div>
                  <div className="col-8">{currentSubmission.student_name}</div>
                </div>
                <div className="row mb-2">
                  <div className="col-4 text-muted">年级:</div>
                  <div className="col-8">{currentSubmission.student_year}年级</div>
                </div>
                <div className="row mb-2">
                  <div className="col-4 text-muted">作业名称:</div>
                  <div className="col-8">{assignmentName || currentSubmission.work_name}</div>
                </div>
                <div className="row mb-2">
                  <div className="col-4 text-muted">提交时间:</div>
                  <div className="col-8">
                    {new Date(currentSubmission.created_at).toLocaleString('zh-CN')}
                  </div>
                </div>
                <div className="row mb-2">
                  <div className="col-4 text-muted">当前评分:</div>
                  <div className="col-8">
                    {currentSubmission.grade ? (
                      <span className={`badge ${
                        currentSubmission.grade === 'S' ? 'bg-danger' :
                        currentSubmission.grade === 'A' ? 'bg-primary' :
                        currentSubmission.grade === 'B' ? 'bg-info' :
                        currentSubmission.grade === 'C' ? 'bg-secondary' : 'bg-dark'
                      }`}>
                        {currentSubmission.grade}
                      </span>
                    ) : (
                      <span className="text-muted">未评分</span>
                    )}
                    {currentSubmission.score !== undefined && ` (${currentSubmission.score}分)`}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 评分标准卡片 - 与学生信息并列 */}
          <div className="card mt-3">
            <div className="card-header">
              <h4 className="card-title">评分标准</h4>
            </div>
            <div className="card-body p-0">
              <div className="list-group list-group-flush">
                {gradeOptions.map((g) => (
                  <div 
                    key={g.value} 
                    className={`list-group-item d-flex justify-content-between align-items-start ${
                      currentSubmission.grade === g.value ? 'bg-primary-lt' : ''
                    }`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleSelectGrade(g.value, g.score)}
                  >
                    <div className="ms-2 me-auto">
                      <div className="fw-bold">{g.label}</div>
                      <div className="text-muted small">{g.description}</div>
                    </div>
                    {currentSubmission.grade === g.value && (
                      <span className="badge bg-primary">✓</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 底部导航 */}
      <div className="d-flex justify-content-between align-items-center mt-4">
        <div className="text-muted">
          学生 {currentIndex + 1} / {submissions.length}
        </div>
        <div className="d-flex gap-2">
          <button
            className="btn btn-secondary"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="icon me-2" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
              <path d="M15 6l-6 6l6 6" />
            </svg>
            上一个
          </button>
          <button
            className="btn btn-secondary"
            onClick={handleNext}
            disabled={currentIndex === submissions.length - 1}
          >
            下一个
            <svg xmlns="http://www.w3.org/2000/svg" className="icon ms-2" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
              <path d="M9 6l6 6l-6 6" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default GradingPage;
