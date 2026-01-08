import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import STLThumbnailGenerator from '../components/STLThumbnailGenerator';

function StudentPage() {
  const currentYear = new Date().getFullYear();
  const [students, setStudents] = useState([]);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [formData, setFormData] = useState({
    studentName: '',
    workName: '',
    description: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [generatingThumbnail, setGeneratingThumbnail] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const fileInputRef = useRef(null);

  // 获取所有学生列表
  useEffect(() => {
    fetchStudents();
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

  // 根据选中的年份筛选学生
  useEffect(() => {
    const filtered = students.filter(student => student.year === selectedYear);
    setFilteredStudents(filtered);
    // 如果当前选中的学生不在筛选结果中，清空选择
    if (formData.studentName && !filtered.some(s => s.name === formData.studentName)) {
      setFormData(prev => ({ ...prev, studentName: '' }));
    }
  }, [selectedYear, students]);

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
    <div className="row justify-content-center">
      <div className="col-md-8 col-lg-6">
        <div className="card">
          <div className="card-header bg-primary text-white">
            <h4 className="mb-0">📝 提交3D作品</h4>
          </div>
          <div className="card-body">
            {message.text && (
              <div className={`alert alert-${message.type} mb-3`} role="alert">
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="studentYear" className="form-label">
                  年份 <span className="text-danger">*</span>
                </label>
                <select
                  className="form-select"
                  id="studentYear"
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
                <label htmlFor="studentName" className="form-label">
                  学生姓名 <span className="text-danger">*</span>
                </label>
                <select
                  className="form-select"
                  id="studentName"
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
                  <small className="text-muted">该年份暂无学生，请先在学生管理页面添加</small>
                )}
              </div>

              <div className="mb-3">
                <label htmlFor="workName" className="form-label">
                  作品名称 <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="workName"
                  name="workName"
                  value={formData.workName}
                  onChange={handleInputChange}
                  required
                  placeholder="请输入作品名称"
                  disabled={uploading}
                />
              </div>

              <div className="mb-3">
                <label htmlFor="description" className="form-label">
                  作品说明
                </label>
                <textarea
                  className="form-control"
                  id="description"
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
                  className={`upload-area ${selectedFile ? 'border-success' : ''}`}
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
                    <div>
                      <h5 className="text-success">✓ {selectedFile.name}</h5>
                      <p className="text-muted mb-0">
                        文件大小: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  ) : (
                    <div>
                      <h5 className="mb-2">📁 点击或拖拽上传STL文件</h5>
                      <p className="text-muted mb-0">支持 .stl 格式，最大 50MB</p>
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
                  <div className="mt-3 text-center">
                    <p className="text-success mb-2">✓ 缩略图生成成功</p>
                    <div style={{ position: 'relative', width: '100%', maxWidth: '400px', margin: '0 auto', aspectRatio: '16/10' }}>
                      <img
                        src={URL.createObjectURL(thumbnailFile)}
                        alt="缩略图预览"
                        className="img-fluid rounded"
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'contain' }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="btn btn-primary w-100"
                disabled={uploading}
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
            </form>
          </div>
        </div>

        <div className="card mt-4">
          <div className="card-header bg-info text-white">
            <h5 className="mb-0">💡 提交说明</h5>
          </div>
          <div className="card-body">
            <ul className="mb-0">
              <li>请确保上传的是有效的STL格式的3D模型文件</li>
              <li>文件大小不能超过50MB</li>
              <li>选择文件后会自动生成缩略图预览</li>
              <li>教师可以在教师页面查看所有提交的作品</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentPage;