const express = require('express');
const router = express.Router();
const { getDatabase } = require('../models/database');

// 获取所有作业
router.get('/', (req, res) => {
  const db = getDatabase();
  
  const sql = `
    SELECT 
      a.*,
      COUNT(DISTINCT s.id) as submission_count
    FROM assignments a
    LEFT JOIN submissions s ON a.id = s.assignment_id
    GROUP BY a.id
    ORDER BY a.year DESC, a.created_at DESC
  `;
  
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error('获取作业列表失败:', err.message);
      return res.status(500).json({ success: false, error: '获取作业列表失败' });
    }
    
    // 解析 upload_types JSON
    const assignments = rows.map(row => ({
      ...row,
      upload_types: JSON.parse(row.upload_types || '[]')
    }));
    
    res.json({ success: true, data: assignments });
  });
  
  db.close();
});

// 获取单个作业详情
router.get('/:id', (req, res) => {
  const db = getDatabase();
  const { id } = req.params;
  
  db.get('SELECT * FROM assignments WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error('获取作业详情失败:', err.message);
      return res.status(500).json({ success: false, error: '获取作业详情失败' });
    }
    
    if (!row) {
      return res.status(404).json({ success: false, error: '作业不存在' });
    }
    
    // 解析 upload_types JSON
    const assignment = {
      ...row,
      upload_types: JSON.parse(row.upload_types || '[]')
    };
    
    res.json({ success: true, data: assignment });
  });
  
  db.close();
});

// 创建作业
router.post('/', (req, res) => {
  const db = getDatabase();
  const { year, name, upload_types, description, deadline, status } = req.body;
  
  // 验证必填字段
  if (!year || !name || !upload_types || !Array.isArray(upload_types)) {
    return res.status(400).json({ success: false, error: '缺少必填字段' });
  }
  
  const sql = `
    INSERT INTO assignments (year, name, upload_types, description, deadline, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  
  const values = [
    year,
    name,
    JSON.stringify(upload_types),
    description || null,
    deadline || null,
    status || 'active'
  ];
  
  db.run(sql, values, function(err) {
    if (err) {
      console.error('创建作业失败:', err.message);
      return res.status(500).json({ success: false, error: '创建作业失败' });
    }
    
    res.json({ 
      success: true, 
      data: { id: this.lastID, ...req.body } 
    });
  });
  
  db.close();
});

// 更新作业
router.put('/:id', (req, res) => {
  const db = getDatabase();
  const { id } = req.params;
  const { year, name, upload_types, description, deadline, status } = req.body;
  
  // 验证必填字段
  if (!year || !name || !upload_types || !Array.isArray(upload_types)) {
    return res.status(400).json({ success: false, error: '缺少必填字段' });
  }
  
  const sql = `
    UPDATE assignments
    SET year = ?, name = ?, upload_types = ?, description = ?, deadline = ?, status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;
  
  const values = [
    year,
    name,
    JSON.stringify(upload_types),
    description || null,
    deadline || null,
    status || 'active',
    id
  ];
  
  db.run(sql, values, function(err) {
    if (err) {
      console.error('更新作业失败:', err.message);
      return res.status(500).json({ success: false, error: '更新作业失败' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ success: false, error: '作业不存在' });
    }
    
    res.json({ success: true, data: { id, ...req.body } });
  });
  
  db.close();
});

// 删除作业
router.delete('/:id', (req, res) => {
  const db = getDatabase();
  const { id } = req.params;
  
  // 先检查是否有关联的提交
  db.get('SELECT COUNT(*) as count FROM submissions WHERE assignment_id = ?', [id], (err, row) => {
    if (err) {
      console.error('检查作业关联失败:', err.message);
      return res.status(500).json({ success: false, error: '检查作业关联失败' });
    }
    
    if (row.count > 0) {
      return res.status(400).json({ 
        success: false, 
        error: `该作业有 ${row.count} 个相关作品，无法删除` 
      });
    }
    
    // 删除作业
    db.run('DELETE FROM assignments WHERE id = ?', [id], function(err) {
      if (err) {
        console.error('删除作业失败:', err.message);
        return res.status(500).json({ success: false, error: '删除作业失败' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ success: false, error: '作业不存在' });
      }
      
      res.json({ success: true, message: '作业已删除' });
    });
  });
  
  db.close();
});

// 获取某个作业的所有提交
router.get('/:id/submissions', (req, res) => {
  const db = getDatabase();
  const { id } = req.params;
  
  const sql = `
    SELECT * FROM submissions
    WHERE assignment_id = ?
    ORDER BY created_at DESC
  `;
  
  db.all(sql, [id], (err, rows) => {
    if (err) {
      console.error('获取作业提交失败:', err.message);
      return res.status(500).json({ success: false, error: '获取作业提交失败' });
    }
    
    res.json({ success: true, data: rows });
  });
  
  db.close();
});

module.exports = router;