const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDatabase } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// 用户登录
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ 
      success: false, 
      error: '用户名和密码不能为空' 
    });
  }

  const db = getDatabase();
  const client = await db.connect();

  try {
    const result = await client.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

    const user = result.rows[0];

    if (!user) {
      client.release();
      return res.status(401).json({ 
        success: false, 
        error: '用户名或密码错误' 
      });
    }

    // 验证密码
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      client.release();
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

    client.release();
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
    console.error('查询用户失败:', error);
    client.release();
    res.status(500).json({ 
      success: false, 
      error: '服务器错误' 
    });
  }
});

// 获取当前用户信息
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

// 修改密码
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
  const client = await db.connect();

  try {
    // 查询用户
    const result = await client.query(
      'SELECT * FROM users WHERE id = $1',
      [req.user.id]
    );

    const user = result.rows[0];

    if (!user) {
      client.release();
      return res.status(404).json({ 
        success: false, 
        error: '用户不存在' 
      });
    }

    // 验证当前密码
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);

    if (!isValidPassword) {
      client.release();
      return res.status(401).json({ 
        success: false, 
        error: '当前密码错误' 
      });
    }

    // 加密新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 更新密码
    await client.query(
      'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedPassword, req.user.id]
    );

    client.release();
    res.json({ 
      success: true, 
      message: '密码修改成功' 
    });
  } catch (error) {
    console.error('密码处理失败:', error);
    client.release();
    res.status(500).json({ 
      success: false, 
      error: '服务器错误' 
    });
  }
});

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
  const client = await db.connect();

  try {
    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await client.query(
      'INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING id',
      [username, hashedPassword, role || 'teacher']
    );

    client.release();
    res.json({
      success: true,
      data: {
        id: result.rows[0].id,
        username,
        role: role || 'teacher'
      }
    });
  } catch (error) {
    console.error('创建用户失败:', error);
    client.release();

    if (error.code === '23505') { // 唯一约束违反
      return res.status(400).json({ 
        success: false, 
        error: '用户名已存在' 
      });
    }

    res.status(500).json({ 
      success: false, 
      error: '服务器错误' 
    });
  }
});

// 获取用户列表（仅管理员）
router.get('/users', authenticateToken, async (req, res) => {
  // 检查权限
  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      error: '权限不足' 
    });
  }

  const db = getDatabase();
  const client = await db.connect();

  try {
    const result = await client.query(
      'SELECT id, username, role, created_at, updated_at FROM users ORDER BY created_at DESC'
    );

    client.release();
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('查询用户列表失败:', error);
    client.release();
    res.status(500).json({ 
      success: false, 
      error: '服务器错误' 
    });
  }
});

// 删除用户（仅管理员）
router.delete('/users/:id', authenticateToken, async (req, res) => {
  // 检查权限
  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      error: '权限不足' 
    });
  }

  const userId = req.params.id;

  // 不允许删除自己
  if (parseInt(userId) === req.user.id) {
    return res.status(400).json({ 
      success: false, 
      error: '不能删除当前用户' 
    });
  }

  const db = getDatabase();
  const client = await db.connect();

  try {
    const result = await client.query(
      'DELETE FROM users WHERE id = $1',
      [userId]
    );

    client.release();

    if (result.rowCount === 0) {
      return res.status(404).json({ 
        success: false, 
        error: '用户不存在' 
      });
    }

    res.json({ 
      success: true, 
      message: '用户删除成功' 
    });
  } catch (error) {
    console.error('删除用户失败:', error);
    client.release();
    res.status(500).json({ 
      success: false, 
      error: '服务器错误' 
    });
  }
});

module.exports = router;