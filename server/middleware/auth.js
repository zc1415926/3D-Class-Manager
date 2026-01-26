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