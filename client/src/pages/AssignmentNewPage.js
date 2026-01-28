import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import UploadRequirementModal from '../components/UploadRequirementModal';

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
    description: '',
    status: 'active'
  });

  const [uploadRequirements, setUploadRequirements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showRequirementModal, setShowRequirementModal] = useState(false);
  const [editingRequirement, setEditingRequirement] = useState(null);
  const [tempAssignmentId, setTempAssignmentId] = useState(null);

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

  const handleAddRequirement = () => {
    setEditingRequirement(null);
    setShowRequirementModal(true);
  };

  const handleEditRequirement = (requirement) => {
    setEditingRequirement(requirement);
    setShowRequirementModal(true);
  };

  const handleDeleteRequirement = async (requirementId) => {
    if (!window.confirm('确定要删除这个作业要求吗？')) {
      return;
    }

    try {
      const response = await axios.delete(`/api/assignments/${tempAssignmentId}/upload-requirements/${requirementId}`);
      if (response.data.success) {
        setUploadRequirements(prev => prev.filter(r => r.id !== requirementId));
        setSuccess('作业要求已删除');
        setTimeout(() => setSuccess(null), 2000);
      }
    } catch (err) {
      console.error('删除作业要求错误:', err);
      setError('删除作业要求失败');
    }
  };

  const handleRequirementModalClose = () => {
    setShowRequirementModal(false);
    setEditingRequirement(null);
  };

  const handleRequirementSaved = (requirementData) => {
    if (editingRequirement) {
      // 更新现有要求
      setUploadRequirements(prev => 
        prev.map(r => r.id === editingRequirement.id ? { ...r, ...requirementData } : r)
      );
    } else {
      // 添加新要求，自动设置排序为当前数量
      setUploadRequirements(prev => [...prev, { 
        id: Date.now(), 
        ...requirementData,
        sort_order: prev.length
      }]);
    }
    setShowRequirementModal(false);
    setEditingRequirement(null);
  };

  const handleMoveUp = (index) => {
    const sorted = [...uploadRequirements].sort((a, b) => a.sort_order - b.sort_order);
    if (index <= 0) return; // 已经在第一位，不能上移
    
    // 交换相邻元素的 sort_order
    const currentReq = sorted[index];
    const prevReq = sorted[index - 1];
    const tempSortOrder = currentReq.sort_order;
    currentReq.sort_order = prevReq.sort_order;
    prevReq.sort_order = tempSortOrder;
    
    setUploadRequirements([...sorted]);
  };

  const handleMoveDown = (index) => {
    const sorted = [...uploadRequirements].sort((a, b) => a.sort_order - b.sort_order);
    if (index >= sorted.length - 1) return; // 已经在最后一位，不能下移
    
    // 交换相邻元素的 sort_order
    const currentReq = sorted[index];
    const nextReq = sorted[index + 1];
    const tempSortOrder = currentReq.sort_order;
    currentReq.sort_order = nextReq.sort_order;
    nextReq.sort_order = tempSortOrder;
    
    setUploadRequirements([...sorted]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // 创建作业
      const payload = {
        ...formData,
        upload_types: uploadRequirements.map(r => r.upload_type)
      };

      const response = await axios.post('/api/assignments', payload);

      if (response.data.success) {
        const assignmentId = response.data.data.id;
        setTempAssignmentId(assignmentId);

        // 批量创建上传要求
        if (uploadRequirements.length > 0) {
          for (const req of uploadRequirements) {
            await axios.post(`/api/assignments/${assignmentId}/upload-requirements`, {
              name: req.name,
              upload_type: req.upload_type,
              is_required: req.is_required,
              is_published: req.is_published,
              sort_order: req.sort_order
            });
          }
        }

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
          <h3 className="mb-1">创建作业</h3>
          <Link to="/assignments" className="btn btn-outline-secondary">
            <svg xmlns="http://www.w3.org/2000/svg" className="icon me-1" width="20" height="20" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
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
              {error && (
                <div className="alert alert-danger alert-dismissible fade show" role="alert">
                  <svg xmlns="http://www.w3.org/2000/svg" className="icon alert-icon flex-shrink-0" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                    <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
                    <path d="M10 10l4 4m0 -4l-4 4" />
                  </svg>
                  {error}
                  <button type="button" className="btn-close" onClick={() => setError(null)}></button>
                </div>
              )}

              {success && (
                <div className="alert alert-success alert-dismissible fade show" role="alert">
                  <svg xmlns="http://www.w3.org/2000/svg" className="icon alert-icon flex-shrink-0" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                    <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
                    <path d="M9 12l2 2l4 -4" />
                  </svg>
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
                    作业要求 <span className="text-danger">*</span>
                  </label>
                  <div className="mb-2">
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      onClick={handleAddRequirement}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-plus me-1" width="16" height="16" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                        <path d="M12 5l0 14" />
                        <path d="M5 12l14 0" />
                      </svg>
                      添加作业要求
                    </button>
                  </div>

                  {uploadRequirements.length === 0 ? (
                    <div className="text-center py-4 border rounded bg-light">
                      <div className="text-muted">
                        <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-upload mb-2" width="48" height="48" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                          <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                          <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" />
                          <path d="M7 11l5 5l5 -5" />
                          <path d="M12 4l0 12" />
                        </svg>
                        <p>暂无作业要求</p>
                        <small className="text-muted">点击"添加作业要求"按钮设置学生需要提交的内容</small>
                      </div>
                    </div>
                  ) : (
                    <div className="list-group list-group-flush border rounded">
                      {[...uploadRequirements].sort((a, b) => a.sort_order - b.sort_order).map((req, index) => (
                        <div key={req.id} className="list-group-item d-flex justify-content-between align-items-center">
                          <div className="d-flex align-items-center flex-grow-1">
                            <div className="me-3">
                              <span className="badge bg-secondary me-2">{index + 1}</span>
                            </div>
                            <div className="flex-grow-1">
                              <div className="fw-medium">
                                {req.name}
                                {req.is_required && <span className="badge bg-danger ms-2">必填</span>}
                                {!req.is_published && <span className="badge bg-warning ms-2">未发布</span>}
                              </div>
                              <div className="text-muted small">
                                类型: {req.upload_type.toUpperCase()}
                              </div>
                            </div>
                          </div>
                          <div className="d-flex gap-2">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() => handleMoveUp(index)}
                              disabled={index === 0}
                              title="上移"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-arrow-up" width="16" height="16" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                                <path d="M12 5l0 14" />
                                <path d="M18 11l-6 -6" />
                                <path d="M6 11l6 -6" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() => handleMoveDown(index)}
                              disabled={index === uploadRequirements.length - 1}
                              title="下移"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-arrow-down" width="16" height="16" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                                <path d="M12 5l0 14" />
                                <path d="M18 13l-6 6" />
                                <path d="M6 13l6 6" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() => handleEditRequirement(req)}
                              title="编辑"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-edit" width="16" height="16" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                                <path d="M7 7h-1a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-1" />
                                <path d="M20.385 6.585a2.1 2.1 0 0 0 -2.97 -2.97l-8.415 8.385v3h3l8.385 -8.415z" />
                                <path d="M16 5l3 3" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDeleteRequirement(req.id)}
                              title="删除"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-trash" width="16" height="16" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                                <path d="M4 7l16 0" />
                                <path d="M10 11l0 6" />
                                <path d="M14 11l0 6" />
                                <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" />
                                <path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {uploadRequirements.length === 0 && (
                    <div className="text-danger small mt-1">请至少添加一个作业要求</div>
                  )}
                </div>

                <div className="row mb-3">
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
                          'strikethrough',
                          'code',
                          '|',
                          'bulletedList',
                          'numberedList',
                          '|',
                          'outdent',
                          'indent',
                          '|',
                          'link',
                          'imageUpload',
                          'insertTable',
                          'blockQuote',
                          'mediaEmbed',
                          'horizontalLine',
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
                <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-bulb text-yellow me-2" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                  <path d="M3 12h1m8 -9v1m8 8h1m-15.4 -6.4l.7 .7m12.1 -.7l-.7 .7" />
                  <path d="M9 16a5 5 0 1 1 6 0" />
                  <path d="M15 20h0" />
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
      {/* 作业要求模态框 */}
      {showRequirementModal && (
        <div className="modal modal-blur fade show" style={{ display: 'block' }} tabIndex="-1">
          <div className="modal-dialog modal-lg" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingRequirement ? '编辑作业要求' : '添加作业要求'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleRequirementModalClose}
                ></button>
              </div>
              <UploadRequirementModal
                assignmentId={tempAssignmentId}
                requirement={editingRequirement}
                currentCount={uploadRequirements.length}
                onSave={handleRequirementSaved}
                onCancel={handleRequirementModalClose}
              />
            </div>
          </div>
        </div>
      )}
      {showRequirementModal && <div className="modal-backdrop fade show" onClick={handleRequirementModalClose}></div>}
    </div>
  );
}

export default AssignmentNewPage;