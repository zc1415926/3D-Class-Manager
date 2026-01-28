import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import STLThumbnailGenerator from '../components/STLThumbnailGenerator';

function SubmissionPage() {
  const currentYear = new Date().getFullYear();
  const [students, setStudents] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [uploadTypes, setUploadTypes] = useState([]);
  const [uploadRequirements, setUploadRequirements] = useState([]);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [filteredAssignments, setFilteredAssignments] = useState([]);
  const [formData, setFormData] = useState({
    studentName: '',
    description: '',
    assignmentId: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [generatingThumbnail, setGeneratingThumbnail] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const fileInputRef = useRef(null);
  const [uploadedFiles, setUploadedFiles] = useState({}); // 存储每个作业要求的文件 { requirementId: { file, thumbnail } }

  // 获取所有学生列表和作业列表
  useEffect(() => {
    fetchStudents();
    fetchAssignments();
    fetchUploadTypes();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await axios.get('/api/students');
      if (response.data.success) {
        setStudents(response.data.data);
      }
    } catch (err) {
      console.error('获取学生列表失败:', err);
    }
  };

  const fetchAssignments = async () => {
    try {
      const response = await axios.get('/api/assignments');
      if (response.data.success) {
        setAssignments(response.data.data);
      }
    } catch (err) {
      console.error('获取作业列表失败:', err);
    }
  };

  const fetchUploadTypes = async () => {
    try {
      const response = await axios.get('/api/upload-types');
      if (response.data.success) {
        setUploadTypes(response.data.data);
      }
    } catch (err) {
      console.error('获取上传类型失败:', err);
    }
  };

  const fetchUploadRequirements = async (assignmentId) => {
    try {
      const response = await axios.get(`/api/assignments/${assignmentId}/upload-requirements`);
      if (response.data.success) {
        setUploadRequirements(response.data.data);
      }
    } catch (err) {
      console.error('获取作业要求失败:', err);
    }
  };

  // 根据选中的年份筛选学生和作业
  useEffect(() => {
    const filtered = students.filter(student => student.year === selectedYear);
    setFilteredStudents(filtered);
    // 如果当前选中的学生不在筛选结果中，清空选择
    if (formData.studentName && !filtered.some(s => s.name === formData.studentName)) {
      setFormData(prev => ({ ...prev, studentName: '' }));
    }
  }, [selectedYear, students]);

  // 根据选中的年份筛选作业
  useEffect(() => {
    const filtered = assignments.filter(assignment => 
      assignment.year === selectedYear && assignment.status === 'active'
    );
    setFilteredAssignments(filtered);
    // 如果当前选中的作业不在筛选结果中，清空选择
    if (formData.assignmentId && !filtered.some(a => a.id === formData.assignmentId)) {
      setFormData(prev => ({ ...prev, assignmentId: '' }));
    }
  }, [selectedYear, assignments]);

  // 获取当前选中作业的文件类型
  const currentAssignment = assignments.find(a => String(a.id) === String(formData.assignmentId));
  
  // 获取当前作业要求的扩展名限制
  const getRequirementExtensions = (requirement) => {
    const uploadType = uploadTypes.find(t => t.code === requirement.upload_type);
    return uploadType?.extensions || [];
  };
  
  const allowedFileTypes = currentAssignment?.upload_types || ['stl'];
  const acceptAttribute = `.${allowedFileTypes.join(', .')}`;
  const fileExtensions = allowedFileTypes.map(t => `.${t}`).join(', ');

  // 获取所有可用的年份
  const availableYears = [...new Set(students.map(s => s.year))].sort((a, b) => b - a);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newFormData = { ...prev, [name]: value };

      // 如果改变了作业选择，清除已选择的文件
      if (name === 'assignmentId' && value !== prev.assignmentId) {
        setSelectedFile(null);
        setThumbnailFile(null);
        setGeneratingThumbnail(false);
        setUploadedFiles({});
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }

        // 如果选择了作业，获取作业要求
        if (value) {
          fetchUploadRequirements(value);
        } else {
          setUploadRequirements([]);
        }
      }

      return newFormData;
    });
  };

  const handleFileSelect = (e, requirementId = null) => {
    const file = e.target.files[0];
    if (file) {
      const fileExtension = file.name.split('.').pop().toLowerCase();

      // 根据作业要求获取允许的扩展名
      let allowedExtensions = [];
      if (requirementId) {
        const requirement = uploadRequirements.find(r => r.id === requirementId);
        if (requirement) {
          allowedExtensions = getRequirementExtensions(requirement);
        }
      }
      
      // 如果没有特定扩展名限制，使用默认的文件类型
      if (allowedExtensions.length === 0) {
        allowedExtensions = allowedFileTypes.map(t => `.${t}`);
      }
      
      // 验证文件扩展名
      const fileExtWithDot = file.name.includes('.') ? file.name.substring(file.name.lastIndexOf('.')) : '';
      if (allowedExtensions.length > 0 && !allowedExtensions.includes(fileExtWithDot)) {
        setMessage({
          type: 'danger',
          text: `请选择 ${allowedExtensions.join(', ')} 格式的文件`
        });
        return;
      }
      
      if (file.size > 50 * 1024 * 1024) {
        setMessage({ type: 'danger', text: '文件大小不能超过50MB' });
        return;
      }

      if (requirementId) {
        // 多文件上传模式
        setUploadedFiles(prev => ({
          ...prev,
          [requirementId]: {
            file: file,
            thumbnail: null,
            generating: true
          }
        }));
      } else {
        // 单文件上传模式（向后兼容）
        setSelectedFile(file);
        setThumbnailFile(null);
        setGeneratingThumbnail(true);
      }
      setMessage({ type: '', text: '' });
    }
  };

  const handleThumbnailGenerated = (file, requirementId = null) => {
    if (requirementId) {
      setUploadedFiles(prev => ({
        ...prev,
        [requirementId]: {
          ...prev[requirementId],
          thumbnail: file,
          generating: false
        }
      }));
    } else {
      setThumbnailFile(file);
      setGeneratingThumbnail(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e, requirementId = null) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files[0];
    if (file) {
      const fileExtension = file.name.split('.').pop().toLowerCase();

      // 根据作业要求获取允许的扩展名
      let allowedExtensions = [];
      if (requirementId) {
        const requirement = uploadRequirements.find(r => r.id === requirementId);
        if (requirement) {
          allowedExtensions = getRequirementExtensions(requirement);
        }
      }
      
      // 如果没有特定扩展名限制，使用默认的文件类型
      if (allowedExtensions.length === 0) {
        allowedExtensions = allowedFileTypes.map(t => `.${t}`);
      }
      
      // 验证文件扩展名
      const fileExtWithDot = file.name.includes('.') ? file.name.substring(file.name.lastIndexOf('.')) : '';
      if (allowedExtensions.length > 0 && !allowedExtensions.includes(fileExtWithDot)) {
        setMessage({
          type: 'danger',
          text: `请选择 ${allowedExtensions.join(', ')} 格式的文件`
        });
        return;
      }
      
      if (file.size > 50 * 1024 * 1024) {
        setMessage({ type: 'danger', text: '文件大小不能超过50MB' });
        return;
      }

      if (requirementId) {
        // 多文件上传模式
        setUploadedFiles(prev => ({
          ...prev,
          [requirementId]: {
            file: file,
            thumbnail: null,
            generating: true
          }
        }));
      } else {
        // 单文件上传模式（向后兼容）
        setSelectedFile(file);
        setThumbnailFile(null);
        setGeneratingThumbnail(true);
      }
      setMessage({ type: '', text: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 检查是否有作业要求
    const isMultiFileMode = uploadRequirements.length > 0;

    if (isMultiFileMode) {
      // 多文件上传模式
      const requiredFiles = uploadRequirements.filter(req => req.is_required);
      const uploadedRequiredFiles = requiredFiles.filter(req => uploadedFiles[req.id]?.file);

      if (uploadedRequiredFiles.length !== requiredFiles.length) {
        setMessage({ type: 'danger', text: `请上传所有必填文件（${requiredFiles.length} 个）` });
        return;
      }

      // 检查是否有文件正在生成缩略图
      const anyGenerating = Object.values(uploadedFiles).some(f => f.generating);
      if (anyGenerating) {
        setMessage({ type: 'warning', text: '请等待所有文件的缩略图生成完成' });
        return;
      }
    } else {
      // 单文件上传模式（向后兼容）
      if (!selectedFile) {
        setMessage({ type: 'danger', text: `请选择 ${fileExtensions} 格式的文件` });
        return;
      }

      if (generatingThumbnail) {
        setMessage({ type: 'warning', text: '请等待缩略图生成完成' });
        return;
      }
    }

    if (!formData.studentName) {
      setMessage({ type: 'danger', text: '请选择学生姓名' });
      return;
    }

    if (!formData.assignmentId) {
      setMessage({ type: 'danger', text: '请选择课时' });
      return;
    }

    setUploading(true);
    setMessage({ type: '', text: '' });

    const formDataToSend = new FormData();
    formDataToSend.append('studentName', formData.studentName);
    formDataToSend.append('studentYear', selectedYear);
    // 作品名称自动生成，使用学生姓名+时间戳
    const workName = `${formData.studentName}-${new Date().toISOString().slice(0, 10)}`;
    formDataToSend.append('workName', workName);
    formDataToSend.append('description', formData.description || '');
    if (formData.assignmentId) {
      formDataToSend.append('assignmentId', formData.assignmentId);
    }

    if (isMultiFileMode) {
      // 多文件上传
      const files = [];
      const thumbnails = [];
      const requirementIds = [];

      uploadRequirements.forEach(req => {
        const uploadedFile = uploadedFiles[req.id];
        if (uploadedFile?.file) {
          files.push(uploadedFile.file);
          thumbnails.push(uploadedFile.thumbnail || null);
          requirementIds.push(req.id);
        }
      });

      files.forEach((file, index) => {
        formDataToSend.append(`files[${index}]`, file);
        if (thumbnails[index]) {
          formDataToSend.append(`thumbnails[${index}]`, thumbnails[index]);
        }
      });

      formDataToSend.append('requirementIds', JSON.stringify(requirementIds));
    } else {
      // 单文件上传（向后兼容）
      formDataToSend.append('stlFile', selectedFile);
      if (thumbnailFile) {
        formDataToSend.append('thumbnail', thumbnailFile);
      }
    }

    try {
      const response = await axios.post('/api/submissions', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 120000 // 120秒超时
      });

      if (response.data.success) {
        setMessage({ type: 'success', text: '作品提交成功！' });
        setFormData({ studentName: '', description: '', assignmentId: '' });
        setSelectedFile(null);
        setThumbnailFile(null);
        setUploadedFiles({});
        setUploadRequirements([]);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        setMessage({ type: 'danger', text: response.data.error || '提交失败' });
      }
    } catch (error) {
      console.error('提交错误:', error);
      setMessage({
        type: 'danger',
        text: error.response?.data?.error || '提交失败，请稍后重试'
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="row row-cards">
      <div className="col-md-8 col-lg-12">
        <div className="card card-md">
          <div className="card-stamp card-stamp-lg">
            <div className="card-stamp-icon bg-primary">
              <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
                <path d="M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
                <path d="M12 12l3 2" />
                <path d="M12 12l-3 -2" />
              </svg>
            </div>
          </div>
          <div className="card-body">
            {message.text && (
              <div className={`alert alert-${message.type} alert-dismissible fade show mb-4 d-flex align-items-center`} role="alert">
                <svg xmlns="http://www.w3.org/2000/svg" className={`icon alert-icon flex-shrink-0 ${message.type === 'success' ? 'text-success' : message.type === 'danger' ? 'text-danger' : 'text-info'}`} width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  {message.type === 'success' ? (
                    <>
                      <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                      <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
                      <path d="M9 12l2 2l4 -4" />
                    </>
                  ) : message.type === 'danger' ? (
                    <>
                      <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                      <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
                      <path d="M10 10l4 4m0 -4l-4 4" />
                    </>
                  ) : (
                    <>
                      <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                      <path d="M12 9v2m0 4v.01" />
                      <path d="M20 12a8 8 0 1 0 -16 0a8 8 0 0 0 16 0" />
                    </>
                  )}
                </svg>
                {message.text}
                <button type="button" className="btn-close" onClick={() => setMessage({ type: '', text: '' })}></button>
              </div>
            )}

            <form onSubmit={handleSubmit} autoComplete="off">
              <div className="row g-4">
                {/* 左列：选择信息 */}
                <div className="col-md-6">
                  <div className="card h-100">
                    <div className="card-body">
                      <h5 className="card-title mb-4">提交信息</h5>
                      
                      <div className="mb-3">
                        <label className="form-label">
                          年份 <span className="text-danger">*</span>
                        </label>
                        <select
                          className="form-select"
                          value={selectedYear}
                          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                          required
                          disabled={uploading}
                        >
                          {availableYears.length === 0 ? (
                            <option value={currentYear}>{currentYear}</option>
                          ) : (
                            availableYears.map(year => (
                              <option key={year} value={year}>{year}</option>
                            ))
                          )}
                        </select>
                      </div>

                      <div className="mb-3">
                        <label className="form-label">
                          学生姓名 <span className="text-danger">*</span>
                        </label>
                        <select
                          className="form-select"
                          name="studentName"
                          value={formData.studentName}
                          onChange={handleInputChange}
                          required
                          disabled={uploading}
                        >
                          <option value="">请选择学生</option>
                          {filteredStudents.map(student => (
                            <option key={student.id} value={student.name}>{student.name}</option>
                          ))}
                        </select>
                        {filteredStudents.length === 0 && (
                          <div className="form-text">该年份暂无学生，请先在学生管理页面添加</div>
                        )}
                      </div>

                      <div className="mb-3">
                        <label className="form-label">
                          选择课时 <span className="text-danger">*</span>
                        </label>
                        <select
                          className="form-select"
                          name="assignmentId"
                          value={formData.assignmentId}
                          onChange={handleInputChange}
                          required
                          disabled={uploading}
                        >
                          <option value="">请选择课时</option>
                          {filteredAssignments.map(assignment => (
                            <option key={assignment.id} value={assignment.id}>
                              {assignment.name}
                            </option>
                          ))}
                        </select>
                        {filteredAssignments.length === 0 && selectedYear && (
                          <div className="form-text">该年份暂无进行中的课时</div>
                        )}
                        {currentAssignment && uploadRequirements.length === 0 && (
                          <div className="form-text">
                            <strong>允许的文件类型：</strong>
                            {currentAssignment.upload_types.map((type, index) => (
                              <span key={index} className="badge bg-info text-dark ms-1">
                                {type.toUpperCase()}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {currentAssignment && currentAssignment.description && (
                        <div className="alert alert-info">
                          <div className="d-flex">
                            <div>
                              <svg xmlns="http://www.w3.org/2000/svg" className="icon alert-icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                                <path d="M12 9v2m0 4v.01" />
                                <path d="M20 12a8 8 0 1 0 -16 0a8 8 0 0 0 16 0" />
                              <path d="M12 16h.01" />
                              <path d="M3 12h1m8 -9v1m8 8h1m-4 4h.01m-4 -4h.01" />
                            </svg>
                            </div>
                            <div>
                              <h4 className="alert-title">课时说明</h4>
                              <div className="text-muted" dangerouslySetInnerHTML={{ __html: currentAssignment.description }} />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 右列：上传文件 */}
                <div className="col-md-6">
                  <div className="card h-100">
                    <div className="card-body">
                      <h5 className="card-title mb-4">上传作业</h5>

                      {/* 动态作业要求 */}
                      {uploadRequirements.length > 0 && (
                        <>
                          <div className="accordion" id="uploadRequirementsAccordion">
                            {uploadRequirements.map((requirement, index) => {
                              const uploadedFile = uploadedFiles[requirement.id];
                              const requirementExtensions = getRequirementExtensions(requirement);
                              return (
                                <div className="accordion-item" key={requirement.id}>
                                  <h2 className="accordion-header" id={`heading-${requirement.id}`}>
                                    <button
                                      className={`accordion-button ${index !== 0 ? 'collapsed' : ''}`}
                                      type="button"
                                      data-bs-toggle="collapse"
                                      data-bs-target={`#collapse-${requirement.id}`}
                                      aria-expanded={index === 0}
                                      aria-controls={`collapse-${requirement.id}`}
                                    >
                                      <span className="me-2">
                                        {requirement.is_required && <span className="text-danger">*</span>}
                                        {index + 1}. {requirement.name}
                                      </span>
                                      <span className="badge bg-info text-dark ms-auto">
                                        {requirement.upload_type.toUpperCase()}
                                      </span>
                                    </button>
                                  </h2>
                                  <div
                                    id={`collapse-${requirement.id}`}
                                    className={`accordion-collapse collapse ${index === 0 ? 'show' : ''}`}
                                    data-bs-parent="#uploadRequirementsAccordion"
                                  >
                                    <div className="accordion-body">
                                      <div
                                        className={`dropzone dropzone-sm ${uploadedFile?.file ? 'dropzone-success' : ''}`}
                                        onDragOver={handleDragOver}
                                        onDrop={(e) => handleDrop(e, requirement.id)}
                                        onClick={() => {
                                          const input = document.getElementById(`file-input-${requirement.id}`);
                                          if (input) input.click();
                                        }}
                                      >
                                        <input
                                          type="file"
                                          id={`file-input-${requirement.id}`}
                                          onChange={(e) => handleFileSelect(e, requirement.id)}
                                          accept={requirementExtensions.length > 0 ? requirementExtensions.join(',') : acceptAttribute}
                                          style={{ display: 'none' }}
                                          disabled={uploading}
                                        />
                                        {uploadedFile?.file ? (
                                          <div className="text-center py-4">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="icon text-green mb-2" width="48" height="48" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                              <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                                              <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
                                              <path d="M9 12l2 2l4 -4" />
                                            </svg>
                                            <h5 className="text-success">{uploadedFile.file.name}</h5>
                                            <div className="text-muted">
                                              文件大小: {(uploadedFile.file.size / 1024 / 1024).toFixed(2)} MB
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="text-center py-4">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="icon text-muted mb-2" width="48" height="48" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                              <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                                              <path d="M7 18a4.6 4.4 0 0 1 0 -9a5 4.5 0 0 1 11 2h1a3.5 3.5 0 0 1 0 7h-12" />
                                              <path d="M9 15l2 -2l2 2" />
                                              <path d="M12 11v8" />
                                            </svg>
                                            <h5 className="mb-1">点击或拖拽上传文件</h5>
                                            <div className="text-muted">
                                              支持 {requirementExtensions.length > 0 ? requirementExtensions.join(', ') : currentAssignment?.upload_types?.map(t => t.toUpperCase()).join(', ') || 'STL, OBJ'} 格式
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                      {uploadedFile?.generating && (
                                        <div className="mt-3">
                                          <STLThumbnailGenerator
                                            stlFile={uploadedFile.file}
                                            onThumbnailGenerated={(file) => handleThumbnailGenerated(file, requirement.id)}
                                          />
                                        </div>
                                      )}
                                      {uploadedFile?.thumbnail && (
                                        <div className="mt-3">
                                          <div className="alert alert-success d-flex align-items-center" role="alert">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="icon alert-icon flex-shrink-0" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                              <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                                              <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
                                              <path d="M9 12l2 2l4 -4" />
                                            </svg>
                                            <div>
                                              <div className="alert-title">缩略图生成成功</div>
                                              <div className="text-muted">您可以在下方预览模型缩略图</div>
                                            </div>
                                          </div>
                                          <div className="card border-0 bg-transparent">
                                            <div className="card-body p-0">
                                              <img
                                                src={URL.createObjectURL(uploadedFile.thumbnail)}
                                                alt="缩略图预览"
                                                className="img-fluid rounded"
                                              />
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          <div className="form-text mt-2">
                            {uploadRequirements.filter(req => req.is_required).length > 0 && (
                              <span className="text-danger">* 必填项</span>
                            )}
                          </div>
                        </>
                      )}

                      {/* 单文件上传区域（向后兼容） */}
                      {uploadRequirements.length === 0 && (
                        <div className="mb-4">
                          <label className="form-label">
                            文件 <span className="text-danger">*</span>
                          </label>
                          <div
                            className={`dropzone dropzone-sm ${selectedFile ? 'dropzone-success' : ''}`}
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <input
                              type="file"
                              ref={fileInputRef}
                              key={acceptAttribute}
                              onChange={handleFileSelect}
                              accept={acceptAttribute}
                              style={{ display: 'none' }}
                              disabled={uploading}
                            />
                            {selectedFile ? (
                              <div className="text-center py-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="icon text-green mb-2" width="48" height="48" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                  <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                                  <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
                                  <path d="M9 12l2 2l4 -4" />
                                </svg>
                                <h5 className="text-success">{selectedFile.name}</h5>
                                <div className="text-muted">
                                  文件大小: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                </div>
                              </div>
                            ) : (
                              <div className="text-center py-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="icon text-muted mb-2" width="48" height="48" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                  <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                                  <path d="M7 18a4.6 4.4 0 0 1 0 -9a5 4.5 0 0 1 11 2h1a3.5 3.5 0 0 1 0 7h-12" />
                                  <path d="M9 15l2 -2l2 2" />
                                  <path d="M12 11v8" />
                                </svg>
                                <h5 className="mb-1">点击或拖拽上传文件</h5>
                                <div className="text-muted">支持 {fileExtensions} 格式，最大 50MB</div>
                              </div>
                            )}
                          </div>
                          {selectedFile && generatingThumbnail && (
                            <div className="mt-3">
                              <STLThumbnailGenerator
                                stlFile={selectedFile}
                                onThumbnailGenerated={handleThumbnailGenerated}
                              />
                            </div>
                          )}
                          {thumbnailFile && (
                            <div className="mt-3">
                              <div className="alert alert-success d-flex align-items-center" role="alert">
                                <svg xmlns="http://www.w3.org/2000/svg" className="icon alert-icon flex-shrink-0" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                  <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                                  <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
                                  <path d="M9 12l2 2l4 -4" />
                                </svg>
                                <div>
                                  <div className="alert-title">缩略图生成成功</div>
                                  <div className="text-muted">您可以在下方预览模型缩略图</div>
                                </div>
                              </div>
                              <div className="card border-0 bg-transparent">
                                <div className="card-body p-0">
                                  <img
                                    src={URL.createObjectURL(thumbnailFile)}
                                    alt="缩略图预览"
                                    className="img-fluid rounded"
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* 提交按钮 */}
                      <div className="d-grid">
                        <button
                          type="submit"
                          className="btn btn-primary btn-lg"
                          disabled={uploading || (uploadRequirements.length === 0 ? generatingThumbnail : Object.values(uploadedFiles).some(f => f.generating))}
                        >
                          {uploading ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                              提交中...
                            </>
                          ) : (
                            <>
                              <svg xmlns="http://www.w3.org/2000/svg" className="icon me-2" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                                <path d="M9 12l2 2l4 -4" />
                              </svg>
                              提交作品
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SubmissionPage;