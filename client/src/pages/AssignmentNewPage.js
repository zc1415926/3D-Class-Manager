import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// CKEditor 5
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import UploadAdapter from '../utils/UploadAdapter';

function AssignmentNewPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [formData, setFormData] = useState({
    year: new Date().getFullYear(),
    name: '',
    upload_types: ['stl'],
    description: '',
    deadline: '',
    status: 'active'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  React.useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUploadTypeToggle = (type) => {
    setFormData(prev => {
      const types = prev.upload_types.includes(type)
        ? prev.upload_types.filter(t => t !== type)
        : [...prev.upload_types, type];
      return { ...prev, upload_types: types };
    });
  };

  const handleAddUploadType = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const newType = e.target.value.trim().toLowerCase();
      if (newType && !formData.upload_types.includes(newType)) {
        setFormData(prev => ({
          ...prev,
          upload_types: [...prev.upload_types, newType]
        }));
      }
      e.target.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        ...formData,
        upload_types: formData.upload_types,
        deadline: formData.deadline || null
      };

      const response = await axios.post('/api/assignments', payload);

      if (response.data.success) {
        setSuccess('作业创建成功！');
        setTimeout(() => {
          navigate('/assignments');
        }, 1500);
      } else {
        setError(response.data.error || '创建失败');
      }
    } catch (err) {
      console.error('创建作业错误:', err);
      setError('创建失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

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

      <div className="row row-cards">
        <div className="col-lg-8">
          <div className="card">
            <div className="card-body">
              <h3 className="card-title mb-4">创建作业</h3>

              {error && (
                <div className="alert alert-danger alert-dismissible fade show" role="alert">
                  {error}
                  <button type="button" className="btn-close" onClick={() => setError(null)}></button>
                </div>
              )}

              {success && (
                <div className="alert alert-success alert-dismissible fade show" role="alert">
                  {success}
                  <button type="button" className="btn-close" onClick={() => setSuccess(null)}></button>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="row mb-3">
                  <div className="col-md-4">
                    <label className="form-label">
                      年份 <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      name="year"
                      value={formData.year}
                      onChange={handleInputChange}
                      required
                      min="2020"
                      max="2030"
                      placeholder="例如：2026"
                    />
                  </div>
                  <div className="col-md-8">
                    <label className="form-label">
                      作业名称 <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      placeholder="请输入作业名称"
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">
                    上传类型 <span className="text-danger">*</span>
                  </label>
                  <div className="mb-2">
                    {['stl', 'obj'].map(type => (
                      <button
                        key={type}
                        type="button"
                        className={`btn me-2 mb-2 ${
                          formData.upload_types.includes(type)
                            ? 'btn-primary'
                            : 'btn-outline-primary'
                        }`}
                        onClick={() => handleUploadTypeToggle(type)}
                      >
                        {type.toUpperCase()}
                      </button>
                    ))}
                  </div>
                  <div className="mb-2">
                    <small className="text-muted">已选择的类型：</small>
                    {formData.upload_types.map((type, index) => (
                      <span key={index} className="badge bg-info text-dark me-1">
                        {type.toUpperCase()}
                      </span>
                    ))}
                  </div>
                  <div>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="输入新类型后按回车添加（例如：fbx、gltf）"
                      onKeyDown={handleAddUploadType}
                    />
                  </div>
                </div>

                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">截止日期</label>
                    <input
                      type="date"
                      className="form-control"
                      name="deadline"
                      value={formData.deadline}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">状态</label>
                    <select
                      className="form-select"
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                    >
                      <option value="active">进行中</option>
                      <option value="archived">已归档</option>
                    </select>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">详细描述</label>
                  <div style={{ minHeight: '400px' }}>
                    <CKEditor
                      editor={ClassicEditor}
                      data={formData.description}
                      onChange={(event, editor) => {
                        const data = editor.getData();
                        setFormData(prev => ({ ...prev, description: data }));
                      }}
                      onReady={(editor) => {
                        editor.plugins.get('FileRepository').createUploadAdapter = (loader) => {
                          return new UploadAdapter(loader);
                        };
                      }}
                      config={{
                        toolbar: [
                          'heading',
                          '|',
                          'bold',
                          'italic',
                          'underline',
                          'link',
                          '|',
                          'bulletedList',
                          'numberedList',
                          '|',
                          'imageUpload',
                          '|',
                          'undo',
                          'redo'
                        ]
                      }}
                    />
                  </div>
                </div>

                <div className="d-flex gap-2">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        创建中...
                      </>
                    ) : (
                      '创建作业'
                    )}
                  </button>
                  <Link
                    to="/assignments"
                    className="btn btn-outline-secondary"
                  >
                    取消
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card">
            <div className="card-body">
              <h3 className="card-title">
                <svg xmlns="http://www.w3.org/2000/svg" className="icon text-yellow me-2" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                  <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
                  <path d="M9 12l2 2l4 -4" />
                </svg>
                提示
              </h3>
              <div className="list-group list-group-flush">
                <div className="list-group-item">
                  <div className="text-muted mb-1">上传类型说明</div>
                  <div className="text-muted small">
                    选择学生可以上传的文件类型。可以预设常用类型（STL、OBJ），也可以添加新的类型。
                  </div>
                </div>
                <div className="list-group-item">
                  <div className="text-muted mb-1">截止日期</div>
                  <div className="text-muted small">
                    设置作业的截止日期，可选。设置后可以跟踪学生是否按时提交。
                  </div>
                </div>
                <div className="list-group-item">
                  <div className="text-muted mb-1">状态管理</div>
                  <div className="text-muted small">
                    "进行中"状态的作业会显示在学生提交页面，"已归档"的作业不会显示。
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AssignmentNewPage;