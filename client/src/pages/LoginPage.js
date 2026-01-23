import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from || '/';

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('请输入用户名和密码');
      return;
    }

    if (login(username, password)) {
      navigate(from, { replace: true });
    } else {
      setError('用户名或密码错误');
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
      <div className="card card-md" style={{ maxWidth: '400px', width: '100%' }}>
        <div className="card-body">
          <h2 className="h2 text-center mb-4">教师登录</h2>
          
          {error && (
            <div className="alert alert-danger alert-dismissible fade show mb-4" role="alert">
              {error}
              <button type="button" className="btn-close" onClick={() => setError('')}></button>
            </div>
          )}

          <form onSubmit={handleSubmit} autoComplete="off">
            <div className="mb-3">
              <label className="form-label">用户名</label>
              <input
                type="text"
                className="form-control"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="请输入用户名"
                autoFocus
              />
            </div>

            <div className="mb-2">
              <label className="form-label">
                密码
              </label>
              <input
                type="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
              />
            </div>

            <div className="form-footer">
              <button type="submit" className="btn btn-primary w-100">
                <svg xmlns="http://www.w3.org/2000/svg" className="icon me-2" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                  <path d="M14 8v-2a2 2 0 0 0 -2 -2h-7a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h7a2 2 0 0 0 2 -2v-2" />
                  <path d="M7 12h14l-3 -3m0 6l3 -3" />
                </svg>
                登录
              </button>
            </div>
          </form>
        </div>

        <div className="hr-text">或</div>

        <div className="card-body">
          <button
            type="button"
            className="btn btn-outline-secondary w-100"
            onClick={() => navigate('/')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="icon me-2" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
              <path d="M15 6l-6 6l6 6" />
            </svg>
            返回首页
          </button>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;