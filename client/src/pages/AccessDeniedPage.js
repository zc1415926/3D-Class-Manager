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
        <div className="mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="icon text-danger" width="80" height="80" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
            <path d="M5 13a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v6a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-6z" />
            <path d="M11 16a1 1 0 1 0 2 0a1 1 0 0 0 -2 0" />
            <path d="M8 11v-4a4 4 0 1 1 8 0v4" />
          </svg>
        </div>
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