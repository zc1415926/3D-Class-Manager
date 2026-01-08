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
      <div className="card shadow" style={{ maxWidth: '400px', width: '100%' }}>
        <div className="card-body p-5">
          <div className="text-center mb-4">
            <h2 className="display-4 mb-3">🔐</h2>
            <h3 className="mb-0">教师登录</h3>
          </div>

          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="username" className="form-label">
                用户名
              </label>
              <input
                type="text"
                className="form-control"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="请输入用户名"
                autoFocus
              />
            </div>

            <div className="mb-4">
              <label htmlFor="password" className="form-label">
                密码
              </label>
              <input
                type="password"
                className="form-control"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
              />
            </div>

            <button type="submit" className="btn btn-primary w-100 mb-3">
              登录
            </button>

            <button
              type="button"
              className="btn btn-outline-secondary w-100"
              onClick={() => navigate('/')}
            >
              返回首页
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;