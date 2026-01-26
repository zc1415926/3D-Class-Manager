import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function UploadTypesPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [uploadTypes, setUploadTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    icon: 'file',
    extensions: '',
    sort_order: 0
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchUploadTypes();
  }, [isAuthenticated, navigate]);

  const fetchUploadTypes = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get('/api/upload-types');
      if (response.data.success) {
        setUploadTypes(response.data.data);
      } else {
        setError('获取上传类型失败');
      }
    } catch (err) {
      console.error('获取上传类型错误:', err);
      setError('获取上传类型失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleExtensionsChange = (e) => {
    setFormData(prev => ({ ...prev, extensions: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.code) {
      alert('请填写名称和编码');
      return;
    }

    // 处理扩展名
    const extensionsArray = formData.extensions
      .split(',')
      .map(ext => ext.trim())
      .filter(ext => ext.length > 0)
      .map(ext => ext.startsWith('.') ? ext : `.${ext}`);

    try {
      if (editingType) {
        await axios.put(`/api/upload-types/${editingType.id}`, {
          ...formData,
          extensions: extensionsArray
        });
      } else {
        await axios.post('/api/upload-types', {
          ...formData,
          extensions: extensionsArray
        });
      }
      handleCloseModal();
      fetchUploadTypes();
    } catch (err) {
      console.error('保存上传类型失败:', err);
      alert(err.response?.data?.error || '保存失败，请稍后重试');
    }
  };

  const handleEdit = (type) => {
    setEditingType(type);
    setFormData({
      name: type.name,
      code: type.code,
      description: type.description || '',
      icon: type.icon || 'file',
      extensions: Array.isArray(type.extensions) ? type.extensions.join(', ') : '',
      sort_order: type.sort_order || 0
    });
    setShowModal(true);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`确定要删除上传类型"${name}"吗？`)) {
      return;
    }

    try {
      await axios.delete(`/api/upload-types/${id}`);
      fetchUploadTypes();
    } catch (err) {
      console.error('删除上传类型失败:', err);
      alert(err.response?.data?.error || '删除失败，请稍后重试');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingType(null);
    setFormData({
      name: '',
      code: '',
      description: '',
      icon: 'file',
      extensions: '',
      sort_order: 0
    });
  };

  const getIcon = (iconName) => {
    const icons = {
      'file': 'M4 7v-1a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v1a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2v-1z',
      'box': 'M4 7v-1a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v1a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2v-1z',
      'photo': 'M4 7v-1a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v1a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2v-1z',
      'file-text': 'M4 7v-1a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v1a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2v-1z',
      'video': 'M4 7v-1a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v1a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2v-1z'
    };
    return icons[iconName] || icons['file'];
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">加载中...</span>
        </div>
        <p className="mt-3 text-muted">加载上传类型中...</p>
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
            <button onClick={fetchUploadTypes} className="btn btn-primary">
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
          <div className="text-muted">管理作业上传类型</div>
        </div>
        <div>
          <button
            onClick={() => setShowModal(true)}
            className="btn btn-primary"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="icon me-2" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
              <path d="M12 5l0 14" />
              <path d="M5 12l14 0" />
            </svg>
            添加上传类型
          </button>
        </div>
      </div>

      {uploadTypes.length === 0 ? (
        <div className="card">
          <div className="empty py-5">
            <div className="empty-img">
              <svg xmlns="http://www.w3.org/2000/svg" className="icon text-muted" width="64" height="64" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                <path d="M4 7v-1a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v1a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2v-1z" />
                <path d="M14 7v-1a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v1a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2v-1z" />
                <path d="M7 17v-1a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v1a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2v-1z" />
                <path d="M17 17v-1a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v1a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2v-1z" />
              </svg>
            </div>
            <p className="empty-title">暂无上传类型</p>
            <p className="empty-subtitle text-muted">还没有创建任何上传类型</p>
            <div className="empty-action">
              <button onClick={() => setShowModal(true)} className="btn btn-primary">
                创建第一个上传类型
              </button>
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
                    <th>排序</th>
                    <th>名称</th>
                    <th>编码</th>
                    <th>描述</th>
                    <th>扩展名</th>
                    <th>图标</th>
                    <th>状态</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {uploadTypes.map((type) => (
                    <tr key={type.id}>
                      <td>{type.sort_order}</td>
                      <td>
                        <span className="text-reset fw-bold">{type.name}</span>
                      </td>
                      <td>
                        <code>{type.code}</code>
                      </td>
                      <td>
                        <div className="text-muted">{type.description || '-'}</div>
                      </td>
                      <td>
                        {type.extensions && type.extensions.length > 0 ? (
                          <div className="d-flex flex-wrap gap-1">
                            {type.extensions.map((ext, idx) => (
                              <span key={idx} className="badge bg-info text-dark">
                                {ext}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td>
                        <svg xmlns="http://www.w3.org/2000/svg" className="icon text-muted" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                          <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                          <path d={getIcon(type.icon)} />
                        </svg>
                      </td>
                      <td>
                        <span className={`badge ${type.is_active ? 'bg-success' : 'bg-secondary'}`}>
                          {type.is_active ? '活跃' : '禁用'}
                        </span>
                      </td>
                      <td>
                        <div className="btn-list flex-nowrap">
                          <button
                            onClick={() => handleEdit(type)}
                            className="btn btn-sm btn-outline-primary"
                          >
                            编辑
                          </button>
                          <button
                            onClick={() => handleDelete(type.id, type.name)}
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

      {/* 添加/编辑模态框 */}
      {showModal && (
        <div className="modal modal-blur fade show" style={{ display: 'block' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingType ? '编辑上传类型' : '添加上传类型'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleCloseModal}
                ></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">
                      名称 <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      placeholder="例如：STL模型"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">
                      编码 <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      name="code"
                      value={formData.code}
                      onChange={handleInputChange}
                      required
                      placeholder="例如：stl（英文小写）"
                      disabled={!!editingType}
                    />
                    {editingType && (
                      <div className="form-text">编码创建后不可修改</div>
                    )}
                  </div>

                  <div className="mb-3">
                    <label className="form-label">描述</label>
                    <textarea
                      className="form-control"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows="2"
                      placeholder="请描述该上传类型的用途"
                    ></textarea>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">
                      扩展名 <span className="text-muted">(可选)</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      name="extensions"
                      value={formData.extensions}
                      onChange={handleExtensionsChange}
                      placeholder="例如： .stl, .obj 或 stl, obj (多个用逗号分隔)"
                    />
                    <div className="form-text">
                      支持的文件扩展名，多个扩展名用逗号分隔。例如：.stl, .obj
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">图标</label>
                    <select
                      className="form-select"
                      name="icon"
                      value={formData.icon}
                      onChange={handleInputChange}
                    >
                      <option value="file">文件</option>
                      <option value="box">盒子</option>
                      <option value="photo">图片</option>
                      <option value="file-text">文档</option>
                      <option value="video">视频</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">排序</label>
                    <input
                      type="number"
                      className="form-control"
                      name="sort_order"
                      value={formData.sort_order}
                      onChange={handleInputChange}
                      min="0"
                      placeholder="数字越小越靠前"
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-link link-secondary"
                    onClick={handleCloseModal}
                  >
                    取消
                  </button>
                  <button type="submit" className="btn btn-primary ms-auto">
                    {editingType ? '保存' : '添加'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 模态框背景 */}
      {showModal && (
        <div
          className="modal-backdrop fade show"
          onClick={handleCloseModal}
        ></div>
      )}
    </div>
  );
}

export default UploadTypesPage;