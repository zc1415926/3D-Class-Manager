import React, { useState } from 'react';

function GradeSubmissionModal({ show, submission, onClose, onSave }) {
  const [grade, setGrade] = useState(submission?.grade || '');
  const [score, setScore] = useState(submission?.score || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const grades = [
    { value: 'S', label: 'S (12分)', score: 12, description: '优秀 - 远越出色的工作，超出预期' },
    { value: 'A', label: 'A (10分)', score: 10, description: '良好 - 高质量的工作，符合预期' },
    { value: 'B', label: 'B (8分)', score: 8, description: '中等 - 基本符合要求' },
    { value: 'C', label: 'C (6分)', score: 6, description: '及格 - 仅满足基本要求' },
    { value: 'O', label: 'O (0分)', score: 0, description: '未通过 - 未满足要求' }
  ];

  const handleGradeChange = (e) => {
    const selectedGrade = e.target.value;
    setGrade(selectedGrade);
    const gradeInfo = grades.find(g => g.value === selectedGrade);
    if (gradeInfo) {
      setScore(gradeInfo.score);
    }
  };

  const handleSave = async () => {
    if (!grade) {
      setError('请选择评分等级');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onSave({
        id: submission.id,
        grade,
        score: parseInt(score)
      });
      onClose();
    } catch (err) {
      setError(err.message || '评分失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  if (!show) {
    return null;
  }

  return (
    <div className="modal modal-blur fade show" style={{ display: 'block' }} tabIndex="-1">
      <div className="modal-dialog modal-lg" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              评分 - {submission?.work_name || '作品'}
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
            ></button>
          </div>
          <div className="modal-body">
            {error && (
              <div className="alert alert-danger alert-dismissible fade show" role="alert">
                {error}
                <button type="button" className="btn-close" onClick={() => setError(null)}></button>
              </div>
            )}

            <div className="row">
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">学生姓名</label>
                  <input
                    type="text"
                    className="form-control"
                    value={submission?.student_name || ''}
                    disabled
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">
                    评分等级 <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select"
                    value={grade}
                    onChange={handleGradeChange}
                  >
                    <option value="">请选择评分等级</option>
                    {grades.map((g) => (
                      <option key={g.value} value={g.value}>
                        {g.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label">分数</label>
                  <input
                    type="number"
                    className="form-control"
                    value={score}
                    onChange={(e) => setScore(e.target.value)}
                    min="0"
                    max="12"
                  />
                  <div className="form-text">输入分数或从评分等级自动设置</div>
                </div>
              </div>

              <div className="col-md-6">
                <div className="card">
                  <div className="card-header">
                    <h4 className="card-title">评分标准</h4>
                  </div>
                  <div className="card-body">
                    <div className="list-group list-group-flush">
                      {grades.map((g) => (
                        <div 
                          key={g.value} 
                          className={`list-group-item d-flex justify-content-between align-items-start ${
                            grade === g.value ? 'bg-primary-lt' : ''
                          }`}
                          style={{ cursor: 'pointer' }}
                          onClick={() => {
                            setGrade(g.value);
                            setScore(g.score);
                          }}
                        >
                          <div className="ms-2 me-auto">
                            <div className="fw-bold">{g.label}</div>
                            <div className="text-muted small">{g.description}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-link link-secondary me-3"
              onClick={onClose}
            >
              取消
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  评分中...
                </>
              ) : (
                '保存评分'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GradeSubmissionModal;