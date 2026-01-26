const express = require('express');
const { getDatabase } = require('../models/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// 获取所有上传类型
router.get('/', (req, res) => {
  const db = getDatabase();
  
  const sql = `
    SELECT * FROM upload_types
    WHERE is_active = 1
    ORDER BY sort_order ASC, created_at ASC
  `;
  
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error('获取上传类型失败:', err.message);
      db.close();
      return res.status(500).json({ success: false, error: '获取上传类型失败' });
    }
    
    // 转换布尔值和扩展名数组
    const uploadTypes = rows.map(row => ({
      ...row,
      is_active: !!row.is_active,
      extensions: row.extensions ? row.extensions.split(',').map(ext => ext.trim()) : []
    }));
    
    res.json({ success: true, data: uploadTypes });
    db.close();
  });
});

// 获取单个上传类型
router.get('/:id', (req, res) => {
  const db = getDatabase();
  const { id } = req.params;
  
  const sql = 'SELECT * FROM upload_types WHERE id = ?';
  
  db.get(sql, [id], (err, row) => {
    if (err) {
      console.error('获取上传类型失败:', err.message);
      db.close();
      return res.status(500).json({ success: false, error: '获取上传类型失败' });
    }
    
    if (!row) {
      db.close();
      return res.status(404).json({ success: false, error: '上传类型不存在' });
    }
    
    res.json({ 
      success: true, 
      data: {
        ...row,
        is_active: !!row.is_active,
        extensions: row.extensions ? row.extensions.split(',').map(ext => ext.trim()) : []
      }
    });
    db.close();
  });
});

// 创建上传类型
router.post('/', authenticateToken, (req, res) => {
  const db = getDatabase();
  const { name, code, description, icon, extensions, sort_order } = req.body;
  
  // 验证必填字段
  if (!name || !code) {
    db.close();
    return res.status(400).json({ success: false, error: '缺少必填字段' });
  }
  
  // 检查编码是否已存在
  db.get('SELECT id FROM upload_types WHERE code = ?', [code], (err, row) => {
    if (err) {
      console.error('检查上传类型失败:', err.message);
      db.close();
      return res.status(500).json({ success: false, error: '检查上传类型失败' });
    }
    
    if (row) {
      db.close();
      return res.status(400).json({ success: false, error: '上传类型编码已存在' });
    }
    
    // 处理扩展名数组
    const extensionsStr = Array.isArray(extensions) ? extensions.join(',') : (extensions || '');
    
    const sql = `
      INSERT INTO upload_types (name, code, description, icon, extensions, sort_order)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    const values = [
      name,
      code,
      description || '',
      icon || 'file',
      extensionsStr,
      sort_order || 0
    ];
    
    db.run(sql, values, function(err) {
      if (err) {
        console.error('创建上传类型失败:', err.message);
        db.close();
        return res.status(500).json({ success: false, error: '创建上传类型失败' });
      }
      
      res.json({ 
        success: true, 
        data: { id: this.lastID, ...req.body } 
      });
      db.close();
    });
  });
});

// 更新上传类型
router.put('/:id', authenticateToken, (req, res) => {
  const db = getDatabase();
  const { id } = req.params;
  const { name, code, description, icon, is_active, extensions, sort_order } = req.body;
  
  // 先检查上传类型是否存在
  db.get('SELECT id FROM upload_types WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error('查询上传类型失败:', err.message);
      db.close();
      return res.status(500).json({ success: false, error: '查询上传类型失败' });
    }
    
    if (!row) {
      db.close();
      return res.status(404).json({ success: false, error: '上传类型不存在' });
    }
    
    // 如果修改了编码，检查新编码是否已被其他类型使用
    if (code) {
      db.get('SELECT id FROM upload_types WHERE code = ? AND id != ?', [code, id], (err, row) => {
        if (err) {
          console.error('检查上传类型失败:', err.message);
          db.close();
          return res.status(500).json({ success: false, error: '检查上传类型失败' });
        }
        
        if (row) {
          db.close();
          return res.status(400).json({ success: false, error: '上传类型编码已存在' });
        }
        
        updateUploadType();
      });
    } else {
      updateUploadType();
    }
    
    function updateUploadType() {
      // 处理扩展名数组
      const extensionsStr = Array.isArray(extensions) ? extensions.join(',') : (extensions || '');
      
      const sql = `
        UPDATE upload_types
        SET name = ?, code = ?, description = ?, icon = ?, is_active = ?, extensions = ?, sort_order = ?
        WHERE id = ?
      `;
      
      const values = [
        name,
        code,
        description || '',
        icon || 'file',
        is_active !== undefined ? (is_active ? 1 : 0) : 1,
        extensionsStr,
        sort_order || 0,
        id
      ];
      
      db.run(sql, values, function(err) {
        if (err) {
          console.error('更新上传类型失败:', err.message);
          db.close();
          return res.status(500).json({ success: false, error: '更新上传类型失败' });
        }
        
        res.json({ success: true, data: { id: parseInt(id), ...req.body } });
        db.close();
      });
    }
  });
});

// 删除上传类型（软删除）
router.delete('/:id', authenticateToken, (req, res) => {
  const db = getDatabase();
  const { id } = req.params;
  
  // 先检查上传类型是否被使用
  db.get('SELECT COUNT(*) as count FROM assignment_upload_requirements WHERE upload_type = (SELECT code FROM upload_types WHERE id = ?)', [id], (err, row) => {
    if (err) {
      console.error('检查上传类型使用情况失败:', err.message);
      db.close();
      return res.status(500).json({ success: false, error: '检查上传类型使用情况失败' });
    }
    
    if (row.count > 0) {
      db.close();
      return res.status(400).json({ 
        success: false, 
        error: `该上传类型被 ${row.count} 个上传要求使用，无法删除` 
      });
    }
    
    // 执行软删除（设置为不活跃）
    const sql = 'UPDATE upload_types SET is_active = 0 WHERE id = ?';
    
    db.run(sql, [id], function(err) {
      if (err) {
        console.error('删除上传类型失败:', err.message);
        db.close();
        return res.status(500).json({ success: false, error: '删除上传类型失败' });
      }
      
      if (this.changes === 0) {
        db.close();
        return res.status(404).json({ success: false, error: '上传类型不存在' });
      }
      
      res.json({ success: true, message: '上传类型已删除' });
      db.close();
    });
  });
});

// 批量更新排序
router.put('/batch/sort', authenticateToken, (req, res) => {
  const db = getDatabase();
  const { items } = req.body;
  
  if (!Array.isArray(items) || items.length === 0) {
    db.close();
    return res.status(400).json({ success: false, error: '无效的排序数据' });
  }
  
  let completed = 0;
  let hasError = false;
  
  items.forEach((item, index) => {
    const sql = 'UPDATE upload_types SET sort_order = ? WHERE id = ?';
    db.run(sql, [index, item.id], (err) => {
      if (err) {
        console.error('更新排序失败:', err.message);
        hasError = true;
      }
      
      completed++;
      
      if (completed === items.length) {
        if (hasError) {
          db.close();
          return res.status(500).json({ success: false, error: '部分排序更新失败' });
        }
        
        res.json({ success: true, message: '排序更新成功' });
        db.close();
      }
    });
  });
});

module.exports = router;