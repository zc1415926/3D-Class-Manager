import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import STLThumbnailGenerator from '../components/STLThumbnailGenerator';

function StudentPage() {
  const currentYear = new Date().getFullYear();
  const [students, setStudents] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [filteredAssignments, setFilteredAssignments] = useState([]);
  const [formData, setFormData] = useState({
    studentName: '',
    workName: '',
    description: '',
    assignmentId: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [generatingThumbnail, setGeneratingThumbnail] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const fileInputRef = useRef(null);

  // 获取所有学生列表和作业列表
  useEffect(() => {
    fetchStudents();
    fetchAssignments();
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

  // 获取所有可用的年份
  const availableYears = [...new Set(students.map(s => s.year))].sort((a, b) => b - a);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'model/stl' && !file.name.endsWith('.stl')) {
        setMessage({ type: 'danger', text: '请选择STL文件' });
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        setMessage({ type: 'danger', text: '文件大小不能超过50MB' });
        return;
      }
      setSelectedFile(file);
      setThumbnailFile(null);
      setGeneratingThumbnail(true);
      setMessage({ type: '', text: '' });
    }
  };

  const handleThumbnailGenerated = (file) => {
    setThumbnailFile(file);
    setGeneratingThumbnail(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const file = e.dataTransfer.files[0];
    if (file) {
      if (file.type !== 'model/stl' && !file.name.endsWith('.stl')) {
        setMessage({ type: 'danger', text: '请选择STL文件' });
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        setMessage({ type: 'danger', text: '文件大小不能超过50MB' });
        return;
      }
      setSelectedFile(file);
      setThumbnailFile(null);
      setGeneratingThumbnail(true);
      setMessage({ type: '', text: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedFile) {
      setMessage({ type: 'danger', text: '请选择STL文件' });
      return;
    }

    if (!formData.studentName || !formData.workName) {
      setMessage({ type: 'danger', text: '请填写学生姓名和作品名称' });
      return;
    }

    if (generatingThumbnail) {
      setMessage({ type: 'warning', text: '请等待缩略图生成完成' });
      return;
    }

    setUploading(true);
    setMessage({ type: '', text: '' });

    const formDataToSend = new FormData();
    formDataToSend.append('stlFile', selectedFile);
    if (thumbnailFile) {
      formDataToSend.append('thumbnail', thumbnailFile);
    }
    if (formData.assignmentId) {
      formDataToSend.append('assignmentId', formData.assignmentId);
    }
    formDataToSend.append('studentName', formData.studentName);
    formDataToSend.append('studentYear', selectedYear);
    formDataToSend.append('workName', formData.workName);
    formDataToSend.append('description', formData.description);

    try {
      const response = await axios.post('/api/submissions', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 60000 // 60秒超时
      });

      if (response.data.success) {
        setMessage({ type: 'success', text: '作品提交成功！' });
        setFormData({ studentName: '', workName: '', description: '' });
        setSelectedFile(null);
        setThumbnailFile(null);
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
      <div className="col-md-8 col-lg-6">
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
              <div className={`alert alert-${message.type} alert-dismissible fade show mb-4`} role="alert">
                {message.text}
                <button type="button" className="btn-close" onClick={() => setMessage({ type: '', text: '' })}></button>
              </div>
            )}

            <form onSubmit={handleSubmit} autoComplete="off">
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
                  选择作业
                </label>
                <select
                  className="form-select"
                  name="assignmentId"
                  value={formData.assignmentId}
                  onChange={handleInputChange}
                  disabled={uploading}
                >
                  <option value="">不选择作业（自由提交）</option>
                  {filteredAssignments.map(assignment => (
                    <option key={assignment.id} value={assignment.id}>
                      {assignment.name}
                    </option>
                  ))}
                </select>
                {filteredAssignments.length === 0 && selectedYear && (
                  <div className="form-text">该年份暂无进行中的作业</div>
                )}
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
                  作品名称 <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  name="workName"
                  value={formData.workName}
                  onChange={handleInputChange}
                  required
                  placeholder="请输入作品名称"
                  disabled={uploading}
                />
              </div>

              <div className="mb-3">
                <label className="form-label">
                  作品说明
                </label>
                <textarea
                  className="form-control"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="请描述你的作品（可选）"
                  disabled={uploading}
                ></textarea>
              </div>

              <div className="mb-3">
                <label className="form-label">
                  STL文件 <span className="text-danger">*</span>
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
                    onChange={handleFileSelect}
                    accept=".stl"
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
                      <h5 className="mb-1">点击或拖拽上传STL文件</h5>
                      <div className="text-muted">支持 .stl 格式，最大 50MB</div>
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

              <div className="form-footer">
                <button
                  type="submit"
                  className="btn btn-primary w-100"
                  disabled={uploading || generatingThumbnail}
                >
                  {uploading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      提交中...
                    </>
                  ) : (
                    '提交作品'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="card mt-4">
          <div className="card-header">
            <h3 className="card-title">
              <svg xmlns="http://www.w3.org/2000/svg" className="icon text-yellow me-2" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
                <path d="M9 12h6" />
                <path d="M12 9v6" />
              </svg>
              提交说明
            </h3>
          </div>
          <div className="card-body">
            <div className="list-group list-group-flush">
              <div className="list-group-item d-flex align-items-center gap-3 py-3">
                <div className="flex-fill">
                  <div className="font-weight-medium">STL格式文件</div>
                  <div className="text-muted">请确保上传的是有效的STL格式的3D模型文件</div>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" className="icon text-muted" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                  <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
                  <path d="M9 12l2 2l4 -4" />
                </svg>
              </div>
              <div className="list-group-item d-flex align-items-center gap-3 py-3">
                <div className="flex-fill">
                  <div className="font-weight-medium">文件大小限制</div>
                  <div className="text-muted">文件大小不能超过50MB</div>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" className="icon text-muted" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                  <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
                  <path d="M9 12l2 2l4 -4" />
                </svg>
              </div>
              <div className="list-group-item d-flex align-items-center gap-3 py-3">
                <div className="flex-fill">
                  <div className="font-weight-medium">自动生成缩略图</div>
                  <div className="text-muted">选择文件后会自动生成缩略图预览</div>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" className="icon text-muted" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                  <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
                  <path d="M9 12l2 2l4 -4" />
                </svg>
              </div>
              <div className="list-group-item d-flex align-items-center gap-3 py-3">
                <div className="flex-fill">
                  <div className="font-weight-medium">教师审核</div>
                  <div className="text-muted">教师可以在教师页面查看所有提交的作品</div>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" className="icon text-muted" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                  <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
                  <path d="M9 12l2 2l4 -4" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentPage;