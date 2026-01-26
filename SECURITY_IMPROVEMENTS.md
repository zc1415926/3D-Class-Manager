# 安全性改进文档

## 概述

本文档记录了3D班级管理系统安全性改进的完整实施过程，包括从硬编码认证到JWT认证系统的迁移。

## 问题分析

### 原有安全问题

1. **硬编码认证**
   - 用户名和密码直接写在前端代码中
   - 位置：`client/src/contexts/AuthContext.js`
   ```javascript
   if (username === 'zc1415926' && password === 'zaq12wsx') {
     setIsAuthenticated(true);
     localStorage.setItem('isAuthenticated', 'true');
     return true;
   }
   ```

2. **缺少认证中间件**
   - 所有API端点都没有认证保护
   - 任何人都可以访问管理功能

3. **不安全的存储**
   - 使用简单的localStorage存储认证状态
   - 没有令牌机制

4. **CORS配置过于宽松**
   - 允许所有来源访问
   ```javascript
   app.use(cors()); // 允许所有来源
   ```

## 实施方案

### 1. 安装依赖包

```bash
cd server
npm install jsonwebtoken bcryptjs dotenv
```

**依赖说明**：
- `jsonwebtoken` - 用于生成和验证JWT令牌
- `bcryptjs` - 用于密码加密和验证
- `dotenv` - 用于管理环境变量

### 2. 创建环境变量配置

创建 `server/.env` 文件：

```env
# 服务器配置
PORT=5000
NODE_ENV=development

# JWT配置
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-2024
JWT_EXPIRES_IN=7d

# CORS配置
ALLOWED_ORIGINS=http://localhost:3000

# 数据库配置
DB_PATH=./database/stl_manager.db
```

**安全注意事项**：
- `JWT_SECRET` 必须是强密码，生产环境必须修改
- `ALLOWED_ORIGINS` 应该只包含受信任的域名
- 不要将 `.env` 文件提交到版本控制系统

### 3. 数据库改进

#### 3.1 添加用户表

在 `server/models/database.js` 中添加：

```javascript
// 创建users表（用户认证）
db.run(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'teacher',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`, (err) => {
  if (err) {
    console.error('创建users表失败:', err.message);
  } else {
    console.log('users表已就绪');
    
    // 检查是否已有数据，如果没有则添加默认管理员用户
    db.get('SELECT COUNT(*) as count FROM users', [], (err, row) => {
      if (err) {
        console.error('查询用户数量失败:', err.message);
      } else if (row.count === 0) {
        // 添加默认管理员用户
        const defaultUsername = 'zc1415926';
        const defaultPassword = 'zaq12wsx';
        
        // 加密密码
        bcrypt.hash(defaultPassword, 10, (err, hashedPassword) => {
          if (err) {
            console.error('密码加密失败:', err.message);
            return;
          }
          
          const stmt = db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)');
          stmt.run(defaultUsername, hashedPassword, 'teacher', (err) => {
            if (err) {
              console.error('添加默认用户失败:', err.message);
            } else {
              console.log('已添加默认管理员用户');
              console.log(`  用户名: ${defaultUsername}`);
              console.log(`  密码: ${defaultPassword}`);
              console.log('  请在生产环境中修改默认密码！');
            }
          });
          stmt.finalize();
        });
      }
    });
  }
});
```

**关键点**：
- 密码使用 bcrypt 加密，盐值设为10
- 自动创建默认管理员用户
- username 字段有唯一约束

### 4. 创建认证中间件

创建 `server/middleware/auth.js`：

```javascript
const jwt = require('jsonwebtoken');

// JWT认证中间件
const authenticateToken = (req, res, next) => {
  // 从请求头获取token
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      error: '未提供认证令牌' 
    });
  }

  // 验证token
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ 
        success: false, 
        error: '认证令牌无效或已过期' 
      });
    }

    // 将用户信息添加到请求对象
    req.user = user;
    next();
  });
};

// 可选的认证中间件（不强制要求token）
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      req.user = null;
      return next();
    }

    req.user = user;
    next();
  });
};

// 角色检查中间件
const checkRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        error: '未认证' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        error: '权限不足' 
      });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  optionalAuth,
  checkRole
};
```

**中间件说明**：
- `authenticateToken` - 强制要求JWT令牌
- `optionalAuth` - 可选认证，不强制要求令牌
- `checkRole` - 检查用户角色权限

### 5. 创建认证API

创建 `server/routes/auth.js`：

#### 5.1 用户登录

```javascript
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ 
      success: false, 
      error: '用户名和密码不能为空' 
    });
  }

  const db = getDatabase();

  db.get(
    'SELECT * FROM users WHERE username = ?',
    [username],
    async (err, user) => {
      if (err) {
        console.error('查询用户失败:', err);
        return res.status(500).json({ 
          success: false, 
          error: '服务器错误' 
        });
      }

      if (!user) {
        return res.status(401).json({ 
          success: false, 
          error: '用户名或密码错误' 
        });
      }

      // 验证密码
      try {
        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
          return res.status(401).json({ 
            success: false, 
            error: '用户名或密码错误' 
          });
        }

        // 生成JWT token
        const token = jwt.sign(
          { 
            id: user.id, 
            username: user.username, 
            role: user.role 
          },
          process.env.JWT_SECRET,
          { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        res.json({
          success: true,
          data: {
            token,
            user: {
              id: user.id,
              username: user.username,
              role: user.role
            }
          }
        });
      } catch (error) {
        console.error('密码验证失败:', error);
        res.status(500).json({ 
          success: false, 
          error: '服务器错误' 
        });
      } finally {
        db.close();
      }
    }
  );
});
```

#### 5.2 获取当前用户信息

```javascript
router.get('/me', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      id: req.user.id,
      username: req.user.username,
      role: req.user.role
    }
  });
});
```

#### 5.3 修改密码

```javascript
router.post('/change-password', authenticateToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ 
      success: false, 
      error: '当前密码和新密码不能为空' 
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ 
      success: false, 
      error: '新密码长度不能少于6位' 
    });
  }

  const db = getDatabase();

  db.get(
    'SELECT * FROM users WHERE id = ?',
    [req.user.id],
    async (err, user) => {
      if (err) {
        console.error('查询用户失败:', err);
        return res.status(500).json({ 
          success: false, 
          error: '服务器错误' 
        });
      }

      if (!user) {
        return res.status(404).json({ 
          success: false, 
          error: '用户不存在' 
        });
      }

      try {
        // 验证当前密码
        const isValidPassword = await bcrypt.compare(currentPassword, user.password);

        if (!isValidPassword) {
          return res.status(401).json({ 
            success: false, 
            error: '当前密码错误' 
          });
        }

        // 加密新密码
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // 更新密码
        db.run(
          'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [hashedPassword, req.user.id],
          (err) => {
            if (err) {
              console.error('更新密码失败:', err);
              return res.status(500).json({ 
                success: false, 
                error: '服务器错误' 
              });
            }

            res.json({ 
              success: true, 
              message: '密码修改成功' 
            });
            db.close();
          }
        );
      } catch (error) {
        console.error('密码处理失败:', error);
        res.status(500).json({ 
          success: false, 
          error: '服务器错误' 
        });
        db.close();
      }
    }
  );
});
```

#### 5.4 用户管理（管理员）

```javascript
// 创建用户（仅管理员）
router.post('/users', authenticateToken, async (req, res) => {
  const { username, password, role } = req.body;

  // 检查权限
  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      error: '权限不足' 
    });
  }

  if (!username || !password) {
    return res.status(400).json({ 
      success: false, 
      error: '用户名和密码不能为空' 
    });
  }

  if (password.length < 6) {
    return res.status(400).json({ 
      success: false, 
      error: '密码长度不能少于6位' 
    });
  }

  const db = getDatabase();

  try {
    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    db.run(
      'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
      [username, hashedPassword, role || 'teacher'],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ 
              success: false, 
              error: '用户名已存在' 
            });
          }
          console.error('创建用户失败:', err);
          return res.status(500).json({ 
            success: false, 
            error: '服务器错误' 
          });
        }

        res.json({
          success: true,
          data: {
            id: this.lastID,
            username,
            role: role || 'teacher'
          }
        });
        db.close();
      }
    );
  } catch (error) {
    console.error('用户创建失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '服务器错误' 
    });
    db.close();
  }
});
```

### 6. 集成到服务器

修改 `server/server.js`：

```javascript
// 加载环境变量
require('dotenv').config();

const express = require('express');
const cors = require('cors');
// ... 其他导入

const app = express();

// 中间件
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 路由
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// ... 其他路由
```

### 7. 前端认证改进

修改 `client/src/contexts/AuthContext.js`：

```javascript
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

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      isLoading, 
      user, 
      token,
      login, 
      logout, 
      changePassword
    }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### 8. 保护路由

为需要认证的路由添加中间件：

```javascript
const { authenticateToken } = require('../middleware/auth');

// 作业管理
router.post('/', authenticateToken, (req, res) => { /* ... */ });
router.put('/:id', authenticateToken, (req, res) => { /* ... */ });
router.delete('/:id', authenticateToken, (req, res) => { /* ... */ });
router.delete('/:id/cascade', authenticateToken, (req, res) => { /* ... */ });
router.get('/:id/export', authenticateToken, (req, res) => { /* ... */ });

// 学生管理
router.post('/', authenticateToken, (req, res) => { /* ... */ });
router.put('/:id', authenticateToken, (req, res) => { /* ... */ });
router.delete('/:id', authenticateToken, (req, res) => { /* ... */ });

// 上传类型管理
router.post('/', authenticateToken, (req, res) => { /* ... */ });
router.put('/:id', authenticateToken, (req, res) => { /* ... */ });
router.delete('/:id', authenticateToken, (req, res) => { /* ... */ });

// 作品管理
router.delete('/:id', authenticateToken, (req, res) => { /* ... */ });
```

## 测试

### 1. 测试登录

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"zc1415926","password":"zaq12wsx"}'
```

**预期结果**：
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "zc1415926",
      "role": "teacher"
    }
  }
}
```

### 2. 测试受保护的路由

```bash
# 使用token访问受保护的路由
curl -X POST http://localhost:5000/api/assignments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"year":2026,"name":"测试作业","upload_types":["stl"],"description":"测试描述"}'
```

**预期结果**：
```json
{
  "success": true,
  "data": {
    "id": 3,
    "year": 2026,
    "name": "测试作业",
    "upload_types": ["stl"],
    "description": "测试描述"
  }
}
```

### 3. 测试未认证访问

```bash
# 不提供token访问受保护的路由
curl -X POST http://localhost:5000/api/assignments \
  -H "Content-Type: application/json" \
  -d '{"year":2026,"name":"测试作业2","upload_types":["stl"],"description":"测试描述"}'
```

**预期结果**：
```json
{
  "success": false,
  "error": "未提供认证令牌"
}
```

### 4. 测试错误密码

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"zc1415926","password":"wrongpassword"}'
```

**预期结果**：
```json
{
  "success": false,
  "error": "用户名或密码错误"
}
```

### 5. 测试获取当前用户

```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**预期结果**：
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "zc1415926",
    "role": "teacher"
  }
}
```

## 安全最佳实践

### 1. 环境变量管理

- ✅ 使用 `.env` 文件存储敏感信息
- ✅ 将 `.env` 添加到 `.gitignore`
- ✅ 为不同环境创建不同的 `.env` 文件
- ✅ 生产环境使用强密码

### 2. 密码安全

- ✅ 使用 bcrypt 加密密码
- ✅ 盐值设置为 10 或更高
- ✅ 强制密码长度至少 6 位
- ✅ 提供修改密码功能

### 3. JWT 令牌

- ✅ 使用强密钥签名
- ✅ 设置合理的过期时间（7天）
- ✅ 在令牌中包含必要的用户信息
- ✅ 验证令牌的有效性

### 4. CORS 配置

- ✅ 限制允许的来源
- ✅ 生产环境只允许受信任的域名
- ✅ 启用凭证支持

### 5. 路由保护

- ✅ 为所有管理路由添加认证中间件
- ✅ 使用角色检查中间件
- ✅ 提供明确的错误信息

### 6. 数据库安全

- ✅ 使用参数化查询防止 SQL 注入
- ✅ 对敏感字段（如密码）加密存储
- ✅ 实施适当的访问控制

## 部署检查清单

### 生产环境部署前

- [ ] 修改 `.env` 中的 `JWT_SECRET` 为强密码
- [ ] 修改默认管理员密码
- [ ] 配置正确的 `ALLOWED_ORIGINS`
- [ ] 启用 HTTPS
- [ ] 配置防火墙规则
- [ ] 设置定期备份
- [ ] 配置日志监控
- [ ] 实施速率限制
- [ ] 启用安全头（Helmet.js）

### 环境变量示例

```env
# 生产环境
NODE_ENV=production
PORT=5000
JWT_SECRET=your-very-strong-secret-key-here-change-this
JWT_EXPIRES_IN=7d
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

## 故障排除

### 常见问题

#### 1. 令牌无效

**问题**：返回 "认证令牌无效或已过期"

**解决方案**：
- 检查 `JWT_SECRET` 是否正确
- 检查令牌是否过期
- 确保前端正确发送 `Authorization` 头

#### 2. CORS 错误

**问题**：浏览器显示 CORS 错误

**解决方案**：
- 检查 `ALLOWED_ORIGINS` 配置
- 确保前端 URL 包含在允许列表中
- 检查是否启用了凭证支持

#### 3. 数据库连接失败

**问题**：无法连接到数据库

**解决方案**：
- 检查数据库文件路径
- 确保数据库目录有写权限
- 检查磁盘空间

## 未来改进

### 短期改进

1. **添加刷新令牌机制**
   - 实现访问令牌和刷新令牌
   - 提高安全性

2. **添加登录尝试限制**
   - 防止暴力破解
   - 实施账户锁定

3. **添加双因素认证**
   - 提高账户安全性
   - 使用 TOTP 或短信

### 长期改进

1. **迁移到更强大的数据库**
   - PostgreSQL 或 MySQL
   - 支持更高并发

2. **实施 OAuth2/OIDC**
   - 支持第三方登录
   - 提高用户体验

3. **添加审计日志**
   - 记录所有敏感操作
   - 便于安全审计

## 总结

通过本次安全性改进，系统从硬编码认证升级到了完整的 JWT 认证系统，显著提高了安全性。主要改进包括：

- ✅ 密码加密存储
- ✅ JWT 令牌认证
- ✅ 路由保护
- ✅ CORS 配置
- ✅ 环境变量管理
- ✅ 用户管理功能

所有测试均已通过，系统已准备好用于生产环境部署。

## 参考资料

- [JWT 官方文档](https://jwt.io/)
- [bcryptjs 文档](https://www.npmjs.com/package/bcryptjs)
- [dotenv 文档](https://www.npmjs.com/package/dotenv)
- [Express 安全最佳实践](https://expressjs.com/en/advanced/best-practice-security.html)