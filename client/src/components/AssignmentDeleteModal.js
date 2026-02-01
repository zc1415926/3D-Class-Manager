import React from 'react';
import axios from 'axios';

function AssignmentDeleteModal({ show, assignment, onClose, onDelete, onExport }) {
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);

  if (!show || !assignment) return null;

  const handleDelete = async () => {
    // 如果没有作品，直接删除
    if (!assignment.submission_count || assignment.submission_count === 0) {
      performDelete();
      return;
    }

    // 有作品，显示二次确认
    setShowConfirm(true);
  };

  const performDelete = async () => {
    setIsDeleting(true);
    try {
      const endpoint = assignment.submission_count > 0 
        ? `/api/v1/assignments/${assignment.id}/cascade` 
        : `/api/v1/assignments/${assignment.id}`;
      
      await axios.delete(endpoint);
      onDelete();
      onClose();
      setShowConfirm(false);
    } catch (err) {
      console.error('删除失败:', err);
      alert(`删除失败：${err.response?.data?.error || err.message || '请稍后重试'}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await axios.get(`/api/v1/assignments/${assignment.id}/export`, {
        responseType: 'blob'
      });

      // 创建下载链接
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `${assignment.name}_作品导出_${new Date().toISOString().slice(0, 10)}.zip`
      );
      document.body.appendChild(link);
      link.click();

      // 清理
      link.remove();
      window.URL.revokeObjectURL(url);

      alert('导出成功！');
    } catch (err) {
      console.error('导出失败:', err);
      alert(`导出失败：${err.response?.data?.error || err.message || '请稍后重试'}`);
    } finally {
      setIsExporting(false);
    }
  };

  const getStatusBadge = (status) => {
    return status === 'active'
      ? '<span class="badge bg-success-lt">进行中</span>'
      : '<span class="badge bg-secondary-lt">已归档</span>';
  };

  return (
    <div className="modal modal-blur fade show" style={{ display: 'block' }} tabIndex="-1">
      <div className="modal-dialog modal-dialog-centered" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">删除作业确认</h5>
            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
              onClick={onClose}
            ></button>
          </div>
          <div className="modal-body">
            {showConfirm ? (
              <div className="alert alert-danger" role="alert">
                <div className="d-flex">
                  <div>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="icon alert-icon"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      strokeWidth="2"
                      stroke="currentColor"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                      <path d="M12 9v2m0 4v.01" />
                      <path d="M5 19h14a2 2 0 0 0 1.84 -2.75l-7.1 -12.25a2 2 0 0 0 -3.5 0l-7.1 12.25a2 2 0 0 0 1.75 2.75" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="alert-title">确认删除</h4>
                    <div className="text-muted">
                      {assignment.submission_count > 0 
                        ? `确定要删除作业"${assignment.name}"及其所有 ${assignment.submission_count} 个作品吗？\n\n此操作不可恢复！`
                        : `确定要删除作业"${assignment.name}"吗？\n\n此操作不可恢复！`
                      }
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {assignment.submission_count > 0 ? (
                  <div className="alert alert-warning" role="alert">
                    <div className="d-flex">
                      <div>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="icon alert-icon"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          strokeWidth="2"
                          stroke="currentColor"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                          <path d="M12 9v2m0 4v.01" />
                          <path d="M5 19h14a2 2 0 0 0 1.84 -2.75l-7.1 -12.25a2 2 0 0 0 -3.5 0l-7.1 12.25a2 2 0 0 0 1.75 2.75" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="alert-title">该作业有 {assignment.submission_count} 个相关作品</h4>
                        <div className="text-muted">请选择操作：</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="alert alert-info" role="alert">
                    <div className="d-flex">
                      <div>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="icon alert-icon"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          strokeWidth="2"
                          stroke="currentColor"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                          <path d="M12 9v2m0 4v.01" />
                          <path d="M5 19h14a2 2 0 0 0 1.84 -2.75l-7.1 -12.25a2 2 0 0 0 -3.5 0l-7.1 12.25a2 2 0 0 0 1.75 2.75" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="alert-title">该作业暂无作品</h4>
                        <div className="text-muted">可以直接删除作业</div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="card">
                  <div className="card-body">
                    <div className="row g-3">
                      <div className="col-12">
                        <label className="form-label">作业名称</label>
                        <div className="form-control-plaintext">{assignment.name}</div>
                      </div>
                      <div className="col-6">
                        <label className="form-label">作品数量</label>
                        <div className="form-control-plaintext">{assignment.submission_count || 0} 个</div>
                      </div>
                      <div className="col-6">
                        <label className="form-label">作业状态</label>
                        <div className="form-control-plaintext" dangerouslySetInnerHTML={{ __html: getStatusBadge(assignment.status) }} />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
          <div className="modal-footer">
            {showConfirm ? (
              <>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowConfirm(false)}
                  disabled={isDeleting}
                >
                  返回
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={performDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      删除中...
                    </>
                  ) : (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="icon me-2"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        strokeWidth="2"
                        stroke="currentColor"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                        <path d="M4 7l16 0" />
                        <path d="M10 11l0 6" />
                        <path d="M14 11l0 6" />
                        <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" />
                        <path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" />
                      </svg>
                      确认删除
                    </>
                  )}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onClose}
                  disabled={isDeleting || isExporting}
                >
                  取消
                </button>
                {assignment.submission_count > 0 && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleExport}
                    disabled={isExporting || isDeleting}
                  >
                    {isExporting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        导出中...
                      </>
                    ) : (
                      <>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="icon me-2"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          strokeWidth="2"
                          stroke="currentColor"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                          <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" />
                          <path d="M7 11l5 5l5 -5" />
                          <path d="M12 4l0 12" />
                        </svg>
                        打包导出所有作品
                      </>
                    )}
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleDelete}
                  disabled={isDeleting || isExporting}
                >
                  {isDeleting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      删除中...
                    </>
                  ) : (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="icon me-2"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        strokeWidth="2"
                        stroke="currentColor"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                        <path d="M4 7l16 0" />
                        <path d="M10 11l0 6" />
                        <path d="M14 11l0 6" />
                        <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" />
                        <path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" />
                      </svg>
                      {assignment.submission_count > 0 ? '删除作品及作业' : '删除作业'}
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AssignmentDeleteModal;