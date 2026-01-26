const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDatabase } = require('../models/database');
const { authenticateToken } = require('../middleware/auth');

// 用户登录
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

// 获取用户列表（仅管理员）
router.get('/users', authenticateToken, (req, res) => {
  // 检查权限
  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      error: '权限不足' 
    });
  }

  const db = getDatabase();

  db.all(
    'SELECT id, username, role, created_at, updated_at FROM users ORDER BY created_at DESC',
    [],
    (err, users) => {
      if (err) {
        console.error('查询用户列表失败:', err);
        return res.status(500).json({ 
          success: false, 
          error: '服务器错误' 
        });
      }

      res.json({
        success: true,
        data: users
      });
      db.close();
    }
  );
});

// 删除用户（仅管理员）
router.delete('/users/:id', authenticateToken, (req, res) => {
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

  db.run(
    'DELETE FROM users WHERE id = ?',
    [userId],
    function(err) {
      if (err) {
        console.error('删除用户失败:', err);
        return res.status(500).json({ 
          success: false, 
          error: '服务器错误' 
        });
      }

      if (this.changes === 0) {
        return res.status(404).json({ 
          success: false, 
          error: '用户不存在' 
        });
      }

      res.json({ 
        success: true, 
        message: '用户删除成功' 
      });
      db.close();
    }
  );
});

module.exports = router;