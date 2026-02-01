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
        axios.get('/api/v1/students'),
        axios.get('/api/v1/submissions')
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
    <div>
      {/* 筛选区域 */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">年份</label>
              <select
                className="form-select"
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
            <div className="col-md-4">
              <label className="form-label">学生姓名</label>
              <select
                className="form-select"
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
            <div className="col-md-4 d-flex align-items-end">
              <button
                className="btn btn-outline-secondary w-100"
                onClick={handleResetFilters}
                disabled={loading || (!selectedYear && !selectedStudent)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="icon me-2" width="20" height="20" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                  <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
                  <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
                </svg>
                重置筛选
              </button>
            </div>
          </div>
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
          <p className="mt-3 text-muted">加载中...</p>
        </div>
      ) : displayedSubmissions.length === 0 ? (
        <div className="card">
          <div className="empty py-5">
            <div className="empty-img">
              <svg xmlns="http://www.w3.org/2000/svg" className="icon text-muted" width="64" height="64" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
                <path d="M9 12l2 2l4 -4" />
              </svg>
            </div>
            <p className="empty-title">暂无作品</p>
            <p className="empty-subtitle text-muted">
              {selectedYear || selectedStudent ? '没有找到符合条件的作品' : '还没有任何作品提交'}
            </p>
          </div>
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
          
          <div className="row row-cards">
            {currentSubmissions.map((submission) => (
              <div key={submission.id} className="col-md-6 col-lg-4">
                <div className="card">
                  {submission.thumbnailPath ? (
                    <Link
                      to={`/viewer/${submission.id}`}
                      state={{ from: location.pathname }}
                      className="card-img-top position-relative"
                      style={{ aspectRatio: '16/10', overflow: 'hidden', display: 'block', cursor: 'pointer' }}
                    >
                      <img
                        src={submission.thumbnailPath}
                        alt={submission.workName}
                        className="w-100 h-100 object-fit-contain bg-light"
                        style={{ transition: 'opacity 0.2s' }}
                        onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                        onMouseLeave={(e) => e.target.style.opacity = '1'}
                      />
                    </Link>
                  ) : (
                    <Link
                      to={`/viewer/${submission.id}`}
                      state={{ from: location.pathname }}
                      className="card-img-top bg-light d-flex align-items-center justify-content-center"
                      style={{ aspectRatio: '16/10', display: 'block', cursor: 'pointer', transition: 'background-color 0.2s' }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#e9ecef'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                    >
                      <div className="text-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="icon text-muted mb-2" width="48" height="48" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                          <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                          <path d="M15 8h.01" />
                          <path d="M3 6a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v12a3 3 0 0 1 -3 3h-12a3 3 0 0 1 -3 -3v-12z" />
                          <path d="M3 16l5 -5c.928 -.893 2.072 -.893 3 0l5 5" />
                          <path d="M14 14l1 -1c.928 -.893 2.072 -.893 3 0l3 3" />
                        </svg>
                        <div className="text-muted">暂无缩略图</div>
                      </div>
                    </Link>
                  )}
                  <div className="card-body">
                    <h3 className="card-title">{submission.workName}</h3>
                    <div className="d-flex align-items-center mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="icon text-muted me-2" width="20" height="20" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                        <path d="M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0" />
                        <path d="M6 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" />
                      </svg>
                      <span className="text-muted">{submission.studentName}</span>
                      <span className="badge bg-info-lt ms-2">{submission.studentYear}</span>
                    </div>
                    {submission.description && (
                      <p className="card-text text-muted">{submission.description}</p>
                    )}
                    <div className="d-flex align-items-center text-muted">
                      <svg xmlns="http://www.w3.org/2000/svg" className="icon me-2" width="16" height="16" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                        <path d="M4 7a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12z" />
                        <path d="M16 3v4" />
                        <path d="M8 3v4" />
                        <path d="M4 11h16" />
                        <path d="M15 11v6" />
                        <path d="M15 15h.01" />
                      </svg>
                      <span>{new Date(submission.createdAt).toLocaleString('zh-CN')}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 分页控件 */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-center mt-4">
              <ul className="pagination">
                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                  <button
                    className="page-link"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="20" height="20" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                      <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                      <path d="M15 6l-6 6l6 6" />
                    </svg>
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
                    <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="20" height="20" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                      <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                      <path d="M9 6l6 6l-6 6" />
                    </svg>
                  </button>
                </li>
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default StudentViewPage;