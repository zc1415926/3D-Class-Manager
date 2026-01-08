import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function AccessDeniedPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // 2秒后自动跳转到查看作品页面
    const timer = setTimeout(() => {
      navigate('/student-view', { replace: true });
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
      <div className="card shadow text-center p-5" style={{ maxWidth: '500px', width: '100%' }}>
        <div className="display-1 mb-3">🔒</div>
        <h3 className="mb-3">需要教师权限</h3>
        <p className="text-muted mb-4">
          此页面需要教师登录才能访问。您将自动跳转到查看作品页面...
        </p>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">跳转中...</span>
        </div>
        <p className="text-muted small mt-3">
          2秒后自动跳转
        </p>
      </div>
    </div>
  );
}

export default AccessDeniedPage;