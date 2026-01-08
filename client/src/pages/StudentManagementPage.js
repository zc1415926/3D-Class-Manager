import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function StudentManagementPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const currentYear = new Date().getFullYear();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [formData, setFormData] = useState({ name: '', year: currentYear.toString() });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/access-denied', { replace: true });
      return;
    }
    fetchStudents();
  }, [isAuthenticated, navigate]);

  const fetchStudents = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get('/api/students');
      if (response.data.success) {
        setStudents(response.data.data);
      } else {
        setError('获取学生列表失败');
      }
    } catch (err) {
      console.error('获取学生列表错误:', err);
      setError('获取学生列表失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await axios.post('/api/students', formData);
      if (response.data.success) {
        setShowAddModal(false);
        setFormData({ name: '', year: '' });
        fetchStudents();
      } else {
        alert('添加失败: ' + (response.data.error || '未知错误'));
      }
    } catch (err) {
      console.error('添加失败:', err);
      alert('添加失败，请稍后重试');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    if (!editingStudent) return;
    
    try {
      const response = await axios.put(`/api/students/${editingStudent.id}`, formData);
      if (response.data.success) {
        setShowEditModal(false);
        setEditingStudent(null);
        setFormData({ name: '', year: '' });
        fetchStudents();
      } else {
        alert('更新失败: ' + (response.data.error || '未知错误'));
      }
    } catch (err) {
      console.error('更新失败:', err);
      alert('更新失败，请稍后重试');
    }
  };

  const handleEdit = (student) => {
    setEditingStudent(student);
    setFormData({ name: student.name, year: student.year });
    setShowEditModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('确定要删除这个学生吗？')) {
      return;
    }

    try {
      await axios.delete(`/api/students/${id}`);
      setStudents(students.filter(student => student.id !== id));
    } catch (err) {
      console.error('删除失败:', err);
      alert('删除失败，请稍后重试');
    }
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setEditingStudent(null);
    setFormData({ name: '', year: currentYear.toString() });
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>👨‍🎓 学生管理页面</h2>
        <div>
          <button
            className="btn btn-secondary me-2"
            onClick={fetchStudents}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                刷新中...
              </>
            ) : (
              '🔄 刷新'
            )}
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setShowAddModal(true)}
          >
            ➕ 添加学生
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">加载中...</span>
          </div>
          <p className="mt-3">加载学生列表中...</p>
        </div>
      ) : students.length === 0 ? (
        <div className="text-center py-5">
          <div className="display-1 mb-3">👨‍🎓</div>
          <h4>暂无学生</h4>
          <p className="text-muted">点击"添加学生"按钮开始添加...</p>
        </div>
      ) : (
        <div className="card">
          <div className="card-body p-0">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th style={{ width: '10%' }}>ID</th>
                  <th style={{ width: '40%' }}>姓名</th>
                  <th style={{ width: '20%' }}>年份</th>
                  <th style={{ width: '20%' }}>创建时间</th>
                  <th style={{ width: '10%' }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id}>
                    <td>{student.id}</td>
                    <td>
                      <strong>{student.name}</strong>
                    </td>
                    <td>
                      <span className="badge bg-info text-dark">{student.year}</span>
                    </td>
                    <td className="text-muted small">
                      {new Date(student.createdAt).toLocaleString('zh-CN')}
                    </td>
                    <td>
                      <div className="btn-group btn-group-sm">
                        <button
                          className="btn btn-outline-primary"
                          onClick={() => handleEdit(student)}
                          title="编辑"
                        >
                          ✏️
                        </button>
                        <button
                          className="btn btn-outline-danger"
                          onClick={() => handleDelete(student.id)}
                          title="删除"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 添加学生模态框 */}
      {showAddModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">添加学生</h5>
                <button type="button" className="btn-close" onClick={handleCloseModal}></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleAddSubmit}>
                  <div className="mb-3">
                    <label htmlFor="studentName" className="form-label">姓名</label>
                    <input
                      type="text"
                      className="form-control"
                      id="studentName"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="studentYear" className="form-label">年份</label>
                    <input
                      type="number"
                      className="form-control"
                      id="studentYear"
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                      required
                      min="2000"
                      max="2100"
                    />
                  </div>
                  <div className="modal-footer px-0 pb-0">
                    <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                      取消
                    </button>
                    <button type="submit" className="btn btn-primary">
                      添加
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 编辑学生模态框 */}
      {showEditModal && editingStudent && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">编辑学生</h5>
                <button type="button" className="btn-close" onClick={handleCloseModal}></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleEditSubmit}>
                  <div className="mb-3">
                    <label htmlFor="editStudentName" className="form-label">姓名</label>
                    <input
                      type="text"
                      className="form-control"
                      id="editStudentName"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="editStudentYear" className="form-label">年份</label>
                    <input
                      type="number"
                      className="form-control"
                      id="editStudentYear"
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                      required
                      min="2000"
                      max="2100"
                    />
                  </div>
                  <div className="modal-footer px-0 pb-0">
                    <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                      取消
                    </button>
                    <button type="submit" className="btn btn-primary">
                      保存
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentManagementPage;