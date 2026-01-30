import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  // 根据用户角色判断是否为教师
  const isTeacher = React.useMemo(() => {
    return user && (user.role === 'teacher' || user.role === 'admin');
  }, [user]);

  useEffect(() => {
    // 从localStorage检查登录状态
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        setIsAuthenticated(true);
        
        // 设置axios默认请求头
        axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      } catch (error) {
        console.error('解析用户信息失败:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const response = await axios.post('/api/auth/login', {
        username,
        password
      });

      if (response.data.success) {
        const { token, user } = response.data.data;
        
        // 保存到localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        // 更新状态
        setToken(token);
        setUser(user);
        setIsAuthenticated(true);
        
        // 设置axios默认请求头
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        return { success: true };
      }
      
      return { success: false, error: '登录失败' };
    } catch (error) {
      console.error('登录错误:', error);
      const errorMessage = error.response?.data?.error || '登录失败，请稍后重试';
      return { success: false, error: errorMessage };
    }
  };

  const logout = () => {
    // 清除localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // 清除状态
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    
    // 清除axios默认请求头
    delete axios.defaults.headers.common['Authorization'];
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      const response = await axios.post('/api/auth/change-password', {
        currentPassword,
        newPassword
      });

      return response.data;
    } catch (error) {
      console.error('修改密码错误:', error);
      const errorMessage = error.response?.data?.error || '修改密码失败，请稍后重试';
      return { success: false, error: errorMessage };
    }
  };

  const refreshToken = async () => {
    try {
      const response = await axios.get('/api/auth/me');
      
      if (response.data.success) {
        setUser(response.data.data);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('刷新用户信息失败:', error);
      logout();
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      isTeacher,
      isLoading, 
      user, 
      token,
      login, 
      logout, 
      changePassword,
      refreshToken
    }}>
      {children}
    </AuthContext.Provider>
  );
};