const express = require('express');
const { getDatabase } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// 获取所有学生列表
router.get('/', async (req, res) => {
  try {
    const db = getDatabase();
    const client = await db.connect();

    const result = await client.query(`
      SELECT id, name, year, created_at
      FROM students
      ORDER BY year DESC, name ASC
    `);

    client.release();

    const students = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      year: row.year,
      createdAt: row.created_at
    }));

    res.json({ success: true, data: students });
  } catch (error) {
    console.error('获取列表失败:', error);
    res.status(500).json({ error: '获取列表失败' });
  }
});

// 添加学生
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, year } = req.body;

    if (!name || !year) {
      return res.status(400).json({ error: '学生姓名和年份不能为空' });
    }

    const db = getDatabase();
    const client = await db.connect();

    const result = await client.query(
      'INSERT INTO students (name, year) VALUES ($1, $2) RETURNING id',
      [name, year]
    );

    client.release();

    res.json({
      success: true,
      message: '学生添加成功',
      data: {
        id: result.rows[0].id,
        name,
        year
      }
    });
  } catch (error) {
    console.error('添加失败:', error);
    res.status(500).json({ error: '添加失败: ' + error.message });
  }
});

// 更新学生信息
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { name, year } = req.body;
    const studentId = req.params.id;

    if (!name || !year) {
      return res.status(400).json({ error: '学生姓名和年份不能为空' });
    }

    const db = getDatabase();
    const client = await db.connect();

    const result = await client.query(
      'UPDATE students SET name = $1, year = $2 WHERE id = $3',
      [name, year, studentId]
    );

    client.release();

    if (result.rowCount === 0) {
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
  } catch (error) {
    console.error('更新失败:', error);
    res.status(500).json({ error: '更新失败: ' + error.message });
  }
});

// 删除学生
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const db = getDatabase();
    const client = await db.connect();

    const result = await client.query(
      'DELETE FROM students WHERE id = $1',
      [req.params.id]
    );

    client.release();

    if (result.rowCount === 0) {
      return res.status(404).json({ error: '学生不存在' });
    }

    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    console.error('删除失败:', error);
    res.status(500).json({ error: '删除失败' });
  }
});

module.exports = router;