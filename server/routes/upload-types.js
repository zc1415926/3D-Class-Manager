const express = require('express');
const { getDatabase } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// 获取所有上传类型
router.get('/', async (req, res) => {
  const db = getDatabase();
  const client = await db.connect();

  try {
    const sql = `
      SELECT * FROM upload_types
      WHERE is_active = true
      ORDER BY sort_order ASC, created_at ASC
    `;

    const result = await client.query(sql);

    // 转换布尔值、扩展名数组和文件大小
    const uploadTypes = result.rows.map(row => ({
      ...row,
      is_active: !!row.is_active,
      extensions: row.extensions ? row.extensions.split(',').map(ext => ext.trim()) : [],
      max_file_size: row.max_file_size || 52428800 // 默认50MB
    }));

    client.release();
    res.json({ success: true, data: uploadTypes });
  } catch (error) {
    console.error('获取上传类型失败:', error);
    client.release();
    res.status(500).json({ success: false, error: '获取上传类型失败' });
  }
});

// 获取单个上传类型
router.get('/:id', async (req, res) => {
  const db = getDatabase();
  const client = await db.connect();
  const { id } = req.params;

  try {
    const sql = 'SELECT * FROM upload_types WHERE id = $1';

    const result = await client.query(sql, [id]);

    const row = result.rows[0];

    if (!row) {
      client.release();
      return res.status(404).json({ success: false, error: '上传类型不存在' });
    }

    client.release();
    res.json({
      success: true,
      data: {
        ...row,
        is_active: !!row.is_active,
        extensions: row.extensions ? row.extensions.split(',').map(ext => ext.trim()) : [],
        max_file_size: row.max_file_size || 52428800 // 默认50MB
      }
    });
  } catch (error) {
    console.error('获取上传类型失败:', error);
    client.release();
    res.status(500).json({ success: false, error: '获取上传类型失败' });
  }
});

// 创建上传类型
router.post('/', authenticateToken, async (req, res) => {
  const db = getDatabase();
  const client = await db.connect();
  const { name, code, description, icon, extensions, max_file_size, sort_order } = req.body;

  // 验证必填字段
  if (!name || !code) {
    client.release();
    return res.status(400).json({ success: false, error: '缺少必填字段' });
  }

  try {
    // 检查编码是否已存在
    const checkResult = await client.query('SELECT id FROM upload_types WHERE code = $1', [code]);

    if (checkResult.rows.length > 0) {
      client.release();
      return res.status(400).json({ success: false, error: '上传类型编码已存在' });
    }

    // 处理扩展名数组
    const extensionsStr = Array.isArray(extensions) ? extensions.join(',') : (extensions || '');
    
    // 处理max_file_size，默认为50MB
    const fileSize = max_file_size || 52428800; // 默认50MB

    const sql = `
      INSERT INTO upload_types (name, code, description, icon, extensions, max_file_size, sort_order)
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id
    `;

    const values = [
      name,
      code,
      description || '',
      icon || 'file',
      extensionsStr,
      fileSize,
      sort_order || 0
    ];

    const result = await client.query(sql, values);

    client.release();
    res.json({
      success: true,
      data: { id: result.rows[0].id, ...req.body }
    });
  } catch (error) {
    console.error('创建上传类型失败:', error);
    client.release();
    res.status(500).json({ success: false, error: '创建上传类型失败' });
  }
});

// 更新上传类型
router.put('/:id', authenticateToken, async (req, res) => {
  const db = getDatabase();
  const client = await db.connect();
  const { id } = req.params;
  const { name, code, description, icon, is_active, extensions, max_file_size, sort_order } = req.body;

  try {
    // 先检查上传类型是否存在
    const checkResult = await client.query('SELECT id FROM upload_types WHERE id = $1', [id]);

    if (checkResult.rows.length === 0) {
      client.release();
      return res.status(404).json({ success: false, error: '上传类型不存在' });
    }

    // 如果修改了编码，检查新编码是否已被其他类型使用
    if (code) {
      const codeCheckResult = await client.query(
        'SELECT id FROM upload_types WHERE code = $1 AND id != $2',
        [code, id]
      );

      if (codeCheckResult.rows.length > 0) {
        client.release();
        return res.status(400).json({ success: false, error: '上传类型编码已存在' });
      }
    }

    // 处理扩展名数组
    const extensionsStr = Array.isArray(extensions) ? extensions.join(',') : (extensions || '');
    
    // 处理max_file_size，默认为50MB
    const fileSize = max_file_size || 52428800; // 默认50MB

    const sql = `
      UPDATE upload_types
      SET name = $1, code = $2, description = $3, icon = $4, is_active = $5, extensions = $6, max_file_size = $7, sort_order = $8
      WHERE id = $9
    `;

    const values = [
      name,
      code,
      description || '',
      icon || 'file',
      is_active !== undefined ? (is_active ? 1 : 0) : 1,
      extensionsStr,
      fileSize,
      sort_order || 0,
      id
    ];

    await client.query(sql, values);

    client.release();
    res.json({ success: true, data: { id: parseInt(id), ...req.body } });
  } catch (error) {
    console.error('更新上传类型失败:', error);
    client.release();
    res.status(500).json({ success: false, error: '更新上传类型失败' });
  }
});

// 删除上传类型（软删除）
router.delete('/:id', authenticateToken, async (req, res) => {
  const db = getDatabase();
  const client = await db.connect();
  const { id } = req.params;

  try {
    // 先检查上传类型是否被使用
    const checkResult = await client.query(
      'SELECT COUNT(*) as count FROM assignment_upload_requirements WHERE upload_type = (SELECT code FROM upload_types WHERE id = $1)',
      [id]
    );

    if (checkResult.rows[0].count > 0) {
      client.release();
      return res.status(400).json({
        success: false,
        error: `该上传类型被 ${checkResult.rows[0].count} 个作业要求使用，无法删除`
      });
    }

    // 执行软删除（设置为不活跃）
    const sql = 'UPDATE upload_types SET is_active = 0 WHERE id = $1';

    const result = await client.query(sql, [id]);

    if (result.rowCount === 0) {
      client.release();
      return res.status(404).json({ success: false, error: '上传类型不存在' });
    }

    client.release();
    res.json({ success: true, message: '上传类型已删除' });
  } catch (error) {
    console.error('删除上传类型失败:', error);
    client.release();
    res.status(500).json({ success: false, error: '删除上传类型失败' });
  }
});

// 批量更新排序
router.put('/batch/sort', authenticateToken, async (req, res) => {
  const db = getDatabase();
  const client = await db.connect();
  const { items } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    client.release();
    return res.status(400).json({ success: false, error: '无效的排序数据' });
  }

  try {
    // 使用事务批量更新
    await client.query('BEGIN');

    for (let index = 0; index < items.length; index++) {
      const item = items[index];
      await client.query(
        'UPDATE upload_types SET sort_order = $1 WHERE id = $2',
        [index, item.id]
      );
    }

    await client.query('COMMIT');

    client.release();
    res.json({ success: true, message: '排序更新成功' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('批量更新排序失败:', error);
    client.release();
    res.status(500).json({ success: false, error: '批量更新排序失败' });
  }
});

module.exports = router;