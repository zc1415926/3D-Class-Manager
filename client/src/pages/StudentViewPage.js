import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useLocation } from 'react-router-dom';

function StudentViewPage() {
  const location = useLocation();
  const currentYear = new Date().getFullYear();
  const [students, setStudents] = useState([]);
  const [allSubmissions, setAllSubmissions] = useState([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [displayedSubmissions, setDisplayedSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9; // 每页显示9个作品（3行 x 3列）

  // 获取所有学生列表和作品列表
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 并行获取学生和作品数据
      const [studentsRes, submissionsRes] = await Promise.all([
        axios.get('/api/students'),
        axios.get('/api/submissions')
      ]);

      if (studentsRes.data.success) {
        setStudents(studentsRes.data.data);
      }

      if (submissionsRes.data.success) {
        setAllSubmissions(submissionsRes.data.data);
      }
    } catch (err) {
      console.error('获取数据失败:', err);
      setError('获取数据失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 根据选中的年份筛选学生
  useEffect(() => {
    if (!selectedYear) {
      setFilteredStudents(students);
    } else {
      const filtered = students.filter(student => student.year === selectedYear);
      setFilteredStudents(filtered);
    }
    // 如果当前选中的学生不在筛选结果中，清空选择
    if (selectedStudent && selectedYear && !filteredStudents.some(s => s.name === selectedStudent)) {
      setSelectedStudent('');
    }
  }, [selectedYear, students]);

  // 根据筛选条件过滤作品
  useEffect(() => {
    let filtered = allSubmissions;

    if (selectedYear) {
      filtered = filtered.filter(sub => sub.studentYear === selectedYear);
    }

    if (selectedStudent) {
      filtered = filtered.filter(sub => sub.studentName === selectedStudent);
    }

    setDisplayedSubmissions(filtered);
    setCurrentPage(1); // 重置到第一页
  }, [selectedYear, selectedStudent, allSubmissions]);

  // 获取所有可用的年份
  const availableYears = [...new Set(students.map(s => s.year))].sort((a, b) => b - a);

  // 分页计算
  const totalPages = Math.ceil(displayedSubmissions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentSubmissions = displayedSubmissions.slice(startIndex, endIndex);

  // 分页按钮生成
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  const handlePageChange = (page) => {
    if (page !== '...' && page !== currentPage) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleYearChange = (e) => {
    const year = e.target.value ? parseInt(e.target.value) : '';
    setSelectedYear(year);
    setSelectedStudent(''); // 清空学生选择
  };

  const handleStudentChange = (e) => {
    setSelectedStudent(e.target.value);
  };

  const handleResetFilters = () => {
    setSelectedYear('');
    setSelectedStudent('');
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>👁️ 查看学生作品</h2>
        <button
          className="btn btn-outline-secondary"
          onClick={fetchData}
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
      </div>

      {/* 筛选区域 */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row">
            <div className="col-md-4 mb-3">
              <label htmlFor="filterYear" className="form-label">
                年份
              </label>
              <select
                className="form-select"
                id="filterYear"
                value={selectedYear || ''}
                onChange={handleYearChange}
                disabled={loading}
              >
                <option value="">全部年份</option>
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <div className="col-md-4 mb-3">
              <label htmlFor="filterStudent" className="form-label">
                学生姓名
              </label>
              <select
                className="form-select"
                id="filterStudent"
                value={selectedStudent}
                onChange={handleStudentChange}
                disabled={loading || !selectedYear}
              >
                <option value="">{selectedYear ? '请选择学生' : '请先选择年份'}</option>
                {filteredStudents.map(student => (
                  <option key={student.id} value={student.name}>{student.name}</option>
                ))}
              </select>
            </div>
            <div className="col-md-4 mb-3 d-flex align-items-end">
              <button
                className="btn btn-outline-secondary w-100"
                onClick={handleResetFilters}
                disabled={loading || (!selectedYear && !selectedStudent)}
              >
                🔄 重置筛选
              </button>
            </div>
          </div>
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
          <p className="mt-3">加载中...</p>
        </div>
      ) : displayedSubmissions.length === 0 ? (
        <div className="text-center py-5">
          <div className="display-1 mb-3">📭</div>
          <h4>暂无作品</h4>
          <p className="text-muted">
            {selectedYear || selectedStudent ? '没有找到符合条件的作品' : '还没有任何作品提交'}
          </p>
        </div>
      ) : (
        <>
          <div className="mb-3">
            <small className="text-muted">
              共找到 <strong>{displayedSubmissions.length}</strong> 个作品
              {selectedYear && ` · 年份: ${selectedYear}`}
              {selectedStudent && ` · 学生: ${selectedStudent}`}
            </small>
          </div>
          
          <div className="row">
            {currentSubmissions.map((submission) => (
              <div key={submission.id} className="col-md-6 col-lg-4 mb-4">
                <div className="card h-100">
                  {submission.thumbnailPath ? (
                    <div style={{ position: 'relative', width: '100%', paddingTop: '62.5%' }}>
                      <img
                        src={submission.thumbnailPath}
                        alt={submission.workName}
                        className="card-img-top"
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'contain' }}
                      />
                    </div>
                  ) : (
                    <div className="card-img-top thumbnail-placeholder" style={{ aspectRatio: '16/10', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8f9fa' }}>
                      <span>📷 暂无缩略图</span>
                    </div>
                  )}
                  <div className="card-body">
                    <h5 className="card-title mb-2" style={{ fontSize: '1.25rem', fontWeight: '600' }}>
                      {submission.workName}
                    </h5>
                    <p className="card-text mb-2" style={{ fontSize: '0.95rem' }}>
                      <span className="me-2">👤</span>
                      <strong>{submission.studentName}</strong>
                      <span className="badge bg-info text-dark ms-2">{submission.studentYear}</span>
                    </p>
                    {submission.description && (
                      <p className="card-text text-muted small mb-3" style={{ fontSize: '0.9rem', lineHeight: '1.4' }}>
                        {submission.description}
                      </p>
                    )}
                    <p className="card-text text-muted small mb-0" style={{ fontSize: '0.85rem' }}>
                      📅 {new Date(submission.createdAt).toLocaleString('zh-CN')}
                    </p>
                  </div>
                  <div className="card-footer bg-white border-top-0">
                    <Link
                      to={`/viewer/${submission.id}`}
                      state={{ from: location.pathname }}
                      className="btn btn-primary w-100"
                      style={{ borderRadius: '8px', padding: '0.5rem 0.25rem', fontSize: '0.85rem' }}
                    >
                      👁️ 在线预览
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 分页控件 */}
          {totalPages > 1 && (
            <nav aria-label="分页导航" className="mt-4">
              <ul className="pagination justify-content-center">
                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                  <button
                    className="page-link"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    上一页
                  </button>
                </li>
                {getPageNumbers().map((page, index) => (
                  <li
                    key={index}
                    className={`page-item ${page === currentPage ? 'active' : ''} ${page === '...' ? 'disabled' : ''}`}
                  >
                    <button
                      className="page-link"
                      onClick={() => handlePageChange(page)}
                      disabled={page === '...'}
                    >
                      {page}
                    </button>
                  </li>
                ))}
                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                  <button
                    className="page-link"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    下一页
                  </button>
                </li>
              </ul>
            </nav>
          )}
        </>
      )}
    </div>
  );
}

export default StudentViewPage;