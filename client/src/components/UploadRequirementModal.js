import React, { useState, useEffect } from 'react';
import axios from 'axios';

function UploadRequirementModal({ assignmentId, requirement, currentCount, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    upload_type: 'stl',
    is_required: true,
    is_published: true,
    sort_order: 0
  });
  const [uploadTypes, setUploadTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingTypes, setFetchingTypes] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUploadTypes();
  }, []);

  useEffect(() => {
    if (requirement) {
      setFormData({
        name: requirement.name || '',
        upload_type: requirement.upload_type || 'stl',
        is_required: requirement.is_required !== undefined ? requirement.is_required : true,
        is_published: requirement.is_published !== undefined ? requirement.is_published : true,
        sort_order: requirement.sort_order || 0
      });
    } else {
      // 新建要求时，自动设置排序为当前数量
      setFormData(prev => ({
        ...prev,
        sort_order: currentCount !== undefined ? currentCount : 0
      }));
    }
  }, [requirement, currentCount]);

  const fetchUploadTypes = async () => {
    setFetchingTypes(true);
    try {
      const response = await axios.get('/api/v1/upload-types');
      if (response.data.success) {
        setUploadTypes(response.data.data);
      }
    } catch (err) {
      console.error('获取作业类型失败:', err);
      // 如果获取失败，使用默认的作业类型
      setUploadTypes([
        { code: 'stl', name: 'STL模型' },
        { code: 'obj', name: 'OBJ模型' },
        { code: 'image', name: '图片' }
      ]);
    } finally {
      setFetchingTypes(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 如果没有 assignmentId（新建作业时），直接返回数据给父组件处理
      if (!assignmentId) {
        onSave(formData);
        setLoading(false);
        return;
      }

      if (requirement) {
        // 更新现有作业要求
        const response = await axios.put(`/api/v1/assignments/${assignmentId}/upload-requirements/${requirement.id}`, formData);

        if (response.data.success) {
          onSave();
        } else {
          setError(response.data.error || '更新失败');
        }
      } else {
        // 创建新作业要求
        const response = await axios.post(`/api/v1/assignments/${assignmentId}/upload-requirements`, formData);

        if (response.data.success) {
          onSave();
        } else {
          setError(response.data.error || '创建失败');
        }
      }
    } catch (err) {
      console.error('保存作业要求错误:', err);
      setError('保存失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {error && (
        <div className="modal-body">
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="modal-body">
          <div className="mb-3">
            <label className="form-label">
              作业名称 <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              className="form-control"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="例如：主模型、参考图、纹理图"
              required
            />
            <div className="form-text">
              学生提交时将看到这个名称
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label">
              作业类型 <span className="text-danger">*</span>
            </label>
            {fetchingTypes ? (
              <div className="spinner-border spinner-border-sm me-2" role="status">
                <span className="visually-hidden">加载中...</span>
              </div>
            ) : (
              <select
                className="form-select"
                name="upload_type"
                value={formData.upload_type}
                onChange={handleInputChange}
                required
              >
                {uploadTypes.map(type => (
                  <option key={type.code} value={type.code}>
                    {type.name} ({type.code}) - {type.description || "无描述"}
                  </option>
                ))}
              </select>
            )}
            <div className="form-text">
              从作业类型管理中添加的类型会显示在这里
            </div>
          </div>

          <div className="mb-3">
            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                id="is_required"
                name="is_required"
                checked={formData.is_required}
                onChange={handleInputChange}
              />
              <label className="form-check-label" htmlFor="is_required">
                必填项
              </label>
              <div className="form-text">
                学生必须提交此项才能完成作业
              </div>
            </div>
          </div>

          <div className="mb-3">
            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                id="is_published"
                name="is_published"
                checked={formData.is_published}
                onChange={handleInputChange}
              />
              <label className="form-check-label" htmlFor="is_published">
                发布
              </label>
              <div className="form-text">
                取消后学生将看不到此作业要求
              </div>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-link link-secondary"
            onClick={onCancel}
            disabled={loading}
          >
            取消
          </button>
          <button
            type="submit"
            className="btn btn-primary ms-auto"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                保存中...
              </>
            ) : (
              '保存'
            )}
          </button>
        </div>
      </form>
    </>
  );
}

export default UploadRequirementModal;