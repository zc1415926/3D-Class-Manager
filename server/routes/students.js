const express = require('express');
const { getDatabase } = require('../models/database');

const router = express.Router();

// 获取所有学生列表
router.get('/', (req, res) => {
  try {
    const db = getDatabase();
    db.all(`
      SELECT id, name, year, created_at
      FROM students
      ORDER BY year DESC, name ASC
    `, [], (err, rows) => {
      if (err) {
        console.error('查询失败:', err);
        return res.status(500).json({ error: '查询失败' });
      }

      const students = rows.map(row => ({
        id: row.id,
        name: row.name,
        year: row.year,
        createdAt: row.created_at
      }));

      res.json({ success: true, data: students });
    });
  } catch (error) {
    console.error('获取列表失败:', error);
    res.status(500).json({ error: '获取列表失败' });
  }
});

// 添加学生
router.post('/', (req, res) => {
  try {
    const { name, year } = req.body;

    if (!name || !year) {
      return res.status(400).json({ error: '学生姓名和年份不能为空' });
    }

    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO students (name, year)
      VALUES (?, ?)
    `);

    stmt.run(name, year, function(err) {
      if (err) {
        console.error('添加失败:', err);
        return res.status(500).json({ error: '添加失败' });
      }

      res.json({
        success: true,
        message: '学生添加成功',
        data: {
          id: this.lastID,
          name,
          year
        }
      });
    });

    stmt.finalize();
  } catch (error) {
    console.error('添加失败:', error);
    res.status(500).json({ error: '添加失败: ' + error.message });
  }
});

// 更新学生信息
router.put('/:id', (req, res) => {
  try {
    const { name, year } = req.body;
    const studentId = req.params.id;

    if (!name || !year) {
      return res.status(400).json({ error: '学生姓名和年份不能为空' });
    }

    const db = getDatabase();
    db.run(`
      UPDATE students
      SET name = ?, year = ?
      WHERE id = ?
    `, [name, year, studentId], function(err) {
      if (err) {
        console.error('更新失败:', err);
        return res.status(500).json({ error: '更新失败' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: '学生不存在' });
      }

      res.json({
        success: true,
        message: '学生信息更新成功',
        data: {
          id: studentId,
          name,
          year
        }
      });
    });
  } catch (error) {
    console.error('更新失败:', error);
    res.status(500).json({ error: '更新失败: ' + error.message });
  }
});

// 删除学生
router.delete('/:id', (req, res) => {
  try {
    const db = getDatabase();
    
    db.run(`DELETE FROM students WHERE id = ?`, [req.params.id], function(err) {
      if (err) {
        console.error('删除失败:', err);
        return res.status(500).json({ error: '删除失败' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: '学生不存在' });
      }

      res.json({ success: true, message: '删除成功' });
    });
  } catch (error) {
    console.error('删除失败:', error);
    res.status(500).json({ error: '删除失败' });
  }
});

module.exports = router;