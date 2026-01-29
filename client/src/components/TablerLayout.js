import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const TablerLayout = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState({});
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
        title: '教师主页',
        icon: 'user',
        children: [
          {
            title: '教师面板',
            path: '/dashboard',
            icon: 'dashboard'
          },
          {
            title: '课时管理',
            path: '/assignments',
            icon: 'clipboard'
          },
          {
            title: '作品管理',
            path: '/works',
            icon: 'list'
          },
          {
            title: '作业类型管理',
            path: '/upload-types',
            icon: 'list-details'
          },
          {
            title: '学生管理',
            path: '/student-management',
            icon: 'users'
          }
        ]
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

  const toggleMenu = (title) => {
    setExpandedMenus(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
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
              {menuItems.map((item, index) => {
                const hasChildren = item.children && item.children.length > 0;
                const isExpanded = expandedMenus[item.title];

                if (hasChildren) {
                  return (
                    <li className="nav-item" key={index}>
                      <a 
                        className={`nav-link ${isExpanded ? 'active' : ''}`}
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          toggleMenu(item.title);
                        }}
                      >
                        <span className={`nav-link-icon d-md-none d-lg-inline-block`}>
                          <svg xmlns="http://www.w3.org/2000/svg" className={`icon icon-tabler icon-tabler-${item.icon}`} width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                            <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                            <path d="M4 6h16" />
                            <path d="M4 12h16" />
                            <path d="M4 18h16" />
                          </svg>
                        </span>
                        <span className="nav-link-title">{item.title}</span>
                        <span className={`nav-link-arrow ${isExpanded ? 'collapsed' : ''}`}>
                          <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                            <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                            <path d="M6 9l6 6l6 -6" />
                          </svg>
                        </span>
                      </a>
                      <div className={`collapse ${isExpanded ? 'show' : ''}`} id={`submenu-${index}`}>
                        <ul className="nav nav-submenu" style={{ flexDirection: 'column' }}>
                          {item.children.map((child, childIndex) => (
                            <li className="nav-item" key={childIndex}>
                              <Link
                                className={`nav-link ${isActive(child.path) ? 'active' : ''}`}
                                to={child.path}
                              >
                                <span className="nav-link-title">{child.title}</span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </li>
                  );
                }

                return (
                  <li className="nav-item" key={index}>
                    <Link 
                      className={`nav-link ${isActive(item.path) ? 'active' : ''}`} 
                      to={item.path}
                      onClick={item.action ? item.action : undefined}
                    >
                      <span className="nav-link-icon d-md-none d-lg-inline-block">
                        <svg xmlns="http://www.w3.org/2000/svg" className={`icon icon-tabler icon-tabler-${item.icon}`} width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                          <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                          <path d="M4 6h16" />
                          <path d="M4 12h16" />
                          <path d="M4 18h16" />
                        </svg>
                      </span>
                      <span className="nav-link-title">{item.title}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </aside>

      {/* 主内容区 */}
      <div className="page-wrapper">
        {/* 页面内容 */}
        <div className="page-body">
          <div className="container-xl">
            {children}
          </div>
        </div>

        {/* 页脚 */}
        <footer className="footer footer-transparent d-print-none">
          <div className="container-xl">
            <div className="row text-center align-items-center flex-row-reverse">
              <div className="col-12 col-lg-auto mt-3 mt-lg-0">
                <ul className="list-inline list-inline-dots mb-0">
                  <li className="list-inline-item">
                    <a href="#" className="link-secondary">帮助</a>
                  </li>
                  <li className="list-inline-item">
                    <a href="#" className="link-secondary">关于</a>
                  </li>
                </ul>
              </div>
              <div className="col-12 col-lg-auto mt-3 mt-lg-0">
                <a href="#" className="link-secondary">3D建模课程管理系统</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default TablerLayout;