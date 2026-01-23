import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const TablerLayout = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { isAuthenticated, logout } = useAuth();
  const location = useLocation();

  // 侧边栏菜单项
  const menuItems = [
    {
      title: '首页',
      path: '/',
      icon: 'home'
    },
    {
      title: '作品提交',
      path: '/submit',
      icon: 'upload'
    },
    {
      title: '查看作品',
      path: '/student-view',
      icon: 'eye'
    },
    ...(isAuthenticated ? [
      {
        title: '作业管理',
        path: '/assignments',
        icon: 'clipboard'
      },
      {
        title: '作品管理',
        path: '/works',
        icon: 'list'
      },
      {
        title: '学生管理',
        path: '/student-management',
        icon: 'users'
      },
      {
        title: '教师主页',
        path: '/dashboard',
        icon: 'user'
      }
    ] : []),
    {
      title: isAuthenticated ? '登出' : '教师登录',
      path: isAuthenticated ? '#logout' : '/login',
      icon: isAuthenticated ? 'logout' : 'login',
      action: isAuthenticated ? logout : null
    }
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="page">
      {/* 侧边栏 */}
      <aside className="navbar navbar-vertical navbar-expand-lg" data-bs-theme="dark">
        <div className="container-fluid">
          <button 
            className="navbar-toggler" 
            type="button" 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <Link className="navbar-brand navbar-brand-autodark" to="/">
            <strong style={{fontFamily: "'MiSans', sans-serif", fontWeight: 500, fontSize: '1.3rem'}}>3D建模课程管理</strong>
          </Link>
          <div className={`collapse navbar-collapse ${sidebarCollapsed ? '' : 'show'}`} id="sidebar-menu">
            <ul className="navbar-nav pt-lg-3">
              {menuItems.map((item, index) => (
                <li key={index} className="nav-item">
                  {item.action ? (
                    <a 
                      className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        item.action();
                      }}
                    >
                      <span className="nav-link-icon">
                        {item.icon === 'home' && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-home" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                            <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                            <path d="M5 12l-2 0l9 -9l9 9l-2 0" />
                            <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-7" />
                            <path d="M9 21v-6a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v6" />
                          </svg>
                        )}
                        {item.icon === 'upload' && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-upload" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                            <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                            <path d="M7 18a4.6 4.4 0 0 1 0 -9a5 4.5 0 0 1 11 2h1a3.5 3.5 0 0 1 0 7h-12" />
                            <path d="M9 15l2 -2l2 2" />
                            <path d="M12 11v8" />
                          </svg>
                        )}
                        {item.icon === 'eye' && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-eye" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                            <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                            <path d="M10 12a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" />
                            <path d="M21 12c-2.4 4 -5.4 6 -9 6c-3.6 0 -6.6 -2 -9 -6c2.4 -4 5.4 -6 9 -6c3.6 0 6.6 2 9 6" />
                          </svg>
                        )}
                        {item.icon === 'clipboard' && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-clipboard" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                            <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                            <path d="M9 5h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-12a2 2 0 0 0 -2 -2h-2" />
                            <path d="M9 3m0 2a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v0a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2v0a2 2 0 0 1 2 -2" />
                            <path d="M9 14h6" />
                            <path d="M9 10h6" />
                            <path d="M9 18h6" />
                          </svg>
                        )}
                        {item.icon === 'list' && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-list" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                            <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                            <path d="M9 6l11 0" />
                            <path d="M9 12l11 0" />
                            <path d="M9 18l11 0" />
                            <path d="M5 6l0 .01" />
                            <path d="M5 12l0 .01" />
                            <path d="M5 18l0 .01" />
                          </svg>
                        )}
                        {item.icon === 'users' && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-users" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                            <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                            <path d="M9 7m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" />
                            <path d="M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            <path d="M21 21v-2a4 4 0 0 0 -3 -3.85" />
                          </svg>
                        )}
                        {item.icon === 'user' && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-user" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                            <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                            <path d="M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0" />
                            <path d="M6 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" />
                          </svg>
                        )}
                        {item.icon === 'logout' && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-logout" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                            <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                            <path d="M14 8v-2a2 2 0 0 0 -2 -2h-7a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h7a2 2 0 0 0 2 -2v-2" />
                            <path d="M7 12h14l-3 -3m0 6l3 -3" />
                          </svg>
                        )}
                        {item.icon === 'login' && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-login" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                            <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                            <path d="M15 8v-2a2 2 0 0 0 -2 -2h-7a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h7a2 2 0 0 0 2 -2v-2" />
                            <path d="M21 12h-13l3 -3m0 6l-3 -3" />
                          </svg>
                        )}
                      </span>
                      <span className="nav-link-title">{item.title}</span>
                    </a>
                  ) : (
                    <Link 
                      className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
                      to={item.path}
                    >
                      <span className="nav-link-icon d-md-none d-lg-inline-block">
                        <i className={`ti ti-${item.icon}`}></i>
                      </span>
                      <span className="nav-link-title" style={{fontFamily: "'MiSans', sans-serif", fontWeight: 400, fontSize: '0.95rem'}}>{item.title}</span>
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </aside>

      {/* 主内容区域 */}
      <div className="page-wrapper">

        {/* 页面主体内容 */}
        <div className="page-body">
          <div className="container-xl">
            {children}
          </div>
        </div>

        {/* 页脚 */}
        <footer className="footer footer-transparent py-3 mt-auto">
          <div className="container-xl">
            <div className="row text-center align-items-center flex-row-reverse">
              <div className="col-lg-auto ms-lg-auto">
                <ul className="list-inline list-inline-dots mb-0">
                  <li className="list-inline-item">
                    <a href="https://github.com/zc1415926/3D-Class-Manager" className="link-secondary" rel="noopener">
                      3D-Class-Manager
                    </a>
                  </li>
                </ul>
              </div>
              <div className="col-12 col-lg-auto mt-3 mt-lg-0">
                <ul className="list-inline list-inline-dots mb-0">
                  <li className="list-inline-item" style={{fontFamily: "'MiSans', sans-serif", fontWeight: 400, fontSize: '0.85rem'}}>
                    &copy; 2026 小学3D建模课程管理系统
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default TablerLayout;