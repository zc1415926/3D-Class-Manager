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
  const [formData, setFormData] = useState({ 
    name: '', 
    year: currentYear.toString(),
    grade: '',
    class_number: '1'
  });

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
      const response = await axios.get('/api/v1/students');
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
      const response = await axios.post('/api/v1/students', formData);
      if (response.data.success) {
        setShowAddModal(false);
        setFormData({ 
          name: '', 
          year: currentYear.toString(),
          grade: '',
          class_number: '1'
        });
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
      const response = await axios.put(`/api/v1/students/${editingStudent.id}`, formData);
      if (response.data.success) {
        setShowEditModal(false);
        setEditingStudent(null);
        setFormData({ 
          name: '', 
          year: currentYear.toString(),
          grade: '',
          class_number: '1'
        });
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
    setFormData({ 
      name: student.name, 
      year: student.year,
      grade: student.grade || '一',
      class_number: student.class_number ? student.class_number.toString() : '1'
    });
    setShowEditModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('确定要删除这个学生吗？')) {
      return;
    }

    try {
      await axios.delete(`/api/v1/students/${id}`);
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
    setFormData({ 
      name: '', 
      year: currentYear.toString(),
      grade: '',
      class_number: '1'
    });
  };

  // ... 其余代码保持不变
  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="mb-1">学生管理</h3>
          <div className="text-muted">管理所有学生信息</div>
        </div>
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
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="icon me-2" width="20" height="20" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                  <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
                  <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
                </svg>
                刷新列表
              </>
            )}
          </button>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <svg xmlns="http://www.w3.org/2000/svg" className="icon me-2" width="20" height="20" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
              <path d="M12 5l0 14" />
              <path d="M5 12l14 0" />
            </svg>
            添加学生
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {error}
          <button type="button" className="btn-close" onClick={() => setError(null)}></button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">加载中...</span>
          </div>
          <p className="mt-3 text-muted">加载学生列表中...</p>
        </div>
      ) : students.length === 0 ? (
        <div className="card">
          <div className="empty py-5">
            <div className="empty-img">
              <svg xmlns="http://www.w3.org/2000/svg" className="icon text-muted" width="64" height="64" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
                <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
              </svg>
            </div>
            <p className="empty-title">暂无学生</p>
            <p className="empty-subtitle text-muted">还没有添加任何学生</p>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-vcenter card-table">
                <thead>
                  <tr>
                    <th>姓名</th>
                    <th>年级</th>
                    <th>班级</th>
                    <th>年份</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.id}>
                      <td>
                        <div className="d-flex py-1 align-items-center">
                          <div>
                            <div className="fw-bold">{student.name}</div>
                          </div>
                        </div>
                      </td>
                      <td>{student.grade}</td>
                      <td>{student.class_number}班</td>
                      <td>{student.year}</td>
                      <td>
                        <div className="btn-list flex-nowrap">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => handleEdit(student)}
                          >
                            编辑
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDelete(student.id)}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="20" height="20" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                              <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                              <path d="M4 7l16 0" />
                              <path d="M10 11l0 6" />
                              <path d="M14 11l0 6" />
                              <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" />
                              <path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" />
                            </svg>
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

      {/* 添加学生模态框 */}
      {showAddModal && (
        <div className="modal modal-blur fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">添加学生</h5>
                <button type="button" className="btn-close" onClick={handleCloseModal}></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleAddSubmit} autoComplete="off">
                  <div className="mb-3">
                    <label className="form-label">姓名 <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      placeholder="请输入学生姓名"
                    />
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">年级 <span className="text-danger">*</span></label>
                      <select
                        className="form-select"
                        value={formData.grade}
                        onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                        required
                      >
                        <option value="">请选择年级</option>
                        <option value="一">一年级</option>
                        <option value="二">二年级</option>
                        <option value="三">三年级</option>
                        <option value="四">四年级</option>
                        <option value="五">五年级</option>
                        <option value="六">六年级</option>
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">班级 <span className="text-danger">*</span></label>
                      <input
                        type="number"
                        className="form-control"
                        value={formData.class_number}
                        onChange={(e) => setFormData({ ...formData, class_number: e.target.value })}
                        required
                        min="1"
                        max="20"
                        placeholder="1"
                      />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">年份 <span className="text-danger">*</span></label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                      required
                      min="2000"
                      max="2100"
                    />
                  </div>
                  <div className="modal-footer px-0 pb-0">
                    <button type="button" className="btn btn-link link-secondary" onClick={handleCloseModal}>
                      取消
                    </button>
                    <button type="submit" className="btn btn-primary ms-auto">
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
        <div className="modal modal-blur fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">编辑学生</h5>
                <button type="button" className="btn-close" onClick={handleCloseModal}></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleEditSubmit} autoComplete="off">
                  <div className="mb-3">
                    <label className="form-label">姓名 <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      placeholder="请输入学生姓名"
                    />
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">年级 <span className="text-danger">*</span></label>
                      <select
                        className="form-select"
                        value={formData.grade}
                        onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                        required
                      >
                        <option value="">请选择年级</option>
                        <option value="一">一年级</option>
                        <option value="二">二年级</option>
                        <option value="三">三年级</option>
                        <option value="四">四年级</option>
                        <option value="五">五年级</option>
                        <option value="六">六年级</option>
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">班级 <span className="text-danger">*</span></label>
                      <input
                        type="number"
                        className="form-control"
                        value={formData.class_number}
                        onChange={(e) => setFormData({ ...formData, class_number: e.target.value })}
                        required
                        min="1"
                        max="20"
                        placeholder="1"
                      />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">年份 <span className="text-danger">*</span></label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                      required
                      min="2000"
                      max="2100"
                    />
                  </div>
                  <div className="modal-footer px-0 pb-0">
                    <button type="button" className="btn btn-link link-secondary" onClick={handleCloseModal}>
                      取消
                    </button>
                    <button type="submit" className="btn btn-primary ms-auto">
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
