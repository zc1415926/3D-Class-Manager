import React, { useState, useEffect } from 'react';
import axios from 'axios';

function StudentPage() {
  const currentYear = new Date().getFullYear();
  const [students, setStudents] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [filteredAssignments, setFilteredAssignments] = useState([]);

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
  }, [selectedYear, students]);

  // 根据选中的年份筛选作业
  useEffect(() => {
    const filtered = assignments.filter(assignment => 
      assignment.year === selectedYear && assignment.status === 'active'
    );
    setFilteredAssignments(filtered);
  }, [selectedYear, assignments]);

  // 获取所有可用的年份
  const availableYears = [...new Set(students.map(s => s.year))].sort((a, b) => b - a);

  return (
    <div className="row row-cards">
      <div className="col-md-8 col-lg-12">
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
            <div className="row g-4">
              {/* 学生信息展示 */}
              <div className="col-md-6">
                <div className="card h-100">
                  <div className="card-body">
                    <h5 className="card-title mb-4">学生信息</h5>
                    
                    <div className="mb-3">
                      <label className="form-label">
                        年份
                      </label>
                      <select
                        className="form-select"
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
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
                        学生列表
                      </label>
                      <div className="list-group">
                        {filteredStudents.map(student => (
                          <div key={student.id} className="list-group-item">
                            <div className="row align-items-center">
                              <div className="col">
                                <div className="text-body">{student.name}</div>
                                <div className="text-muted">{student.year} 年级</div>
                              </div>
                              <div className="col-auto">
                                <span className="badge bg-success">已注册</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      {filteredStudents.length === 0 && (
                        <div className="text-center text-muted py-4">
                          <div>该年份暂无学生</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 作业信息展示 */}
              <div className="col-md-6">
                <div className="card h-100">
                  <div className="card-body">
                    <h5 className="card-title mb-4">进行中的课时</h5>

                    <div className="mb-3">
                      <div className="list-group">
                        {filteredAssignments.map(assignment => (
                          <div key={assignment.id} className="list-group-item">
                            <div className="row align-items-center">
                              <div className="col">
                                <div className="text-body">{assignment.name}</div>
                                {assignment.deadline && (
                                  <div className="text-muted">截止时间: {new Date(assignment.deadline).toLocaleDateString()}</div>
                                )}
                              </div>
                              <div className="col-auto">
                                <span className="badge bg-blue">进行中</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      {filteredAssignments.length === 0 && (
                        <div className="text-center text-muted py-4">
                          <div>该年份暂无进行中的课时</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 页面说明 */}
            <div className="card mt-4">
              <div className="card-header">
                <h3 className="card-title">
                  <svg xmlns="http://www.w3.org/2000/svg" className="icon text-blue me-2" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                    <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
                    <path d="M12 10v4" />
                    <path d="M12 16v.01" />
                  </svg>
                  学生页面说明
                </h3>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6">
                    <div className="list-group list-group-flush">
                      <div className="list-group-item d-flex align-items-center gap-3 py-3">
                        <div className="flex-fill">
                          <div className="font-weight-medium">学生管理</div>
                          <div className="text-muted">查看和管理学生信息</div>
                        </div>
                        <svg xmlns="http://www.w3.org/2000/svg" className="icon text-muted" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                          <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                          <path d="M9 12h6" />
                          <path d="M9 12v6" />
                        </svg>
                      </div>
                      <div className="list-group-item d-flex align-items-center gap-3 py-3">
                        <div className="flex-fill">
                          <div className="font-weight-medium">课时信息</div>
                          <div className="text-muted">查看进行中的课时</div>
                        </div>
                        <svg xmlns="http://www.w3.org/2000/svg" className="icon text-muted" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                          <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                          <path d="M9 12l2 2l4 -4" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="list-group list-group-flush">
                      <div className="list-group-item d-flex align-items-center gap-3 py-3">
                        <div className="flex-fill">
                          <div className="font-weight-medium">提交作品</div>
                          <div className="text-muted">请前往提交页面上传作品</div>
                        </div>
                        <svg xmlns="http://www.w3.org/2000/svg" className="icon text-muted" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                          <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                          <path d="M9 12l2 2l4 -4" />
                        </svg>
                      </div>
                      <div className="list-group-item d-flex align-items-center gap-3 py-3">
                        <div className="flex-fill">
                          <div className="font-weight-medium">查看作品</div>
                          <div className="text-muted">请前往作品页面查看</div>
                        </div>
                        <svg xmlns="http://www.w3.org/2000/svg" className="icon text-muted" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                          <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                          <path d="M9 12l2 2l4 -4" />
                        </svg>
                      </div>
                    </div>
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

export default StudentPage;