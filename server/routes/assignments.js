const express = require('express');
const router = express.Router();
const { getDatabase } = require('../models/database');
const { authenticateToken } = require('../middleware/auth');

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
      db.close();
      return res.status(500).json({ success: false, error: '获取作业列表失败' });
    }
    
    // 解析 upload_types JSON
    const assignments = rows.map(row => ({
      ...row,
      upload_types: JSON.parse(row.upload_types || '[]')
    }));
    
    res.json({ success: true, data: assignments });
    db.close();
  });
});

// 获取单个作业详情
router.get('/:id', (req, res) => {
  const db = getDatabase();
  const { id } = req.params;
  
  db.get(`
    SELECT 
      a.*,
      COUNT(DISTINCT s.id) as submission_count
    FROM assignments a
    LEFT JOIN submissions s ON a.id = s.assignment_id
    WHERE a.id = ?
    GROUP BY a.id
  `, [id], (err, row) => {
    if (err) {
      console.error('获取作业详情失败:', err.message);
      db.close();
      return res.status(500).json({ success: false, error: '获取作业详情失败' });
    }
    
    if (!row) {
      db.close();
      return res.status(404).json({ success: false, error: '作业不存在' });
    }
    
    // 解析 upload_types JSON
    const assignment = {
      ...row,
      upload_types: JSON.parse(row.upload_types || '[]')
    };
    
    res.json({ success: true, data: assignment });
    db.close();
  });
});

// 创建作业
router.post('/', authenticateToken, (req, res) => {
  const db = getDatabase();
  const { year, name, upload_types, description, deadline, status } = req.body;
  
  // 验证必填字段
  if (!year || !name || !upload_types || !Array.isArray(upload_types)) {
    db.close();
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
      db.close();
      return res.status(500).json({ success: false, error: '创建作业失败' });
    }
    
    res.json({ 
      success: true, 
      data: { id: this.lastID, ...req.body } 
    });
    db.close();
  });
});

// 更新作业
router.put('/:id', authenticateToken, (req, res) => {
  const db = getDatabase();
  const { id } = req.params;
  const { year, name, upload_types, description, deadline, status } = req.body;
  
  // 验证必填字段
  if (!year || !name || !upload_types || !Array.isArray(upload_types)) {
    db.close();
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
      db.close();
      return res.status(500).json({ success: false, error: '更新作业失败' });
    }
    
    if (this.changes === 0) {
      db.close();
      return res.status(404).json({ success: false, error: '作业不存在' });
    }
    
    res.json({ success: true, data: { id, ...req.body } });
    db.close();
  });
});

// 删除作业
router.delete('/:id', authenticateToken, (req, res) => {
  const db = getDatabase();
  const { id } = req.params;
  
  console.log(`[DELETE /api/assignments/${id}] 开始删除作业，ID: ${id}`);
  
  // 先检查是否有关联的提交
  db.get('SELECT COUNT(*) as count FROM submissions WHERE assignment_id = ?', [id], (err, row) => {
    if (err) {
      console.error('[DELETE /api/assignments/:id] 检查作业关联失败:', err.message);
      db.close();
      return res.status(500).json({ success: false, error: '检查作业关联失败' });
    }
    
    console.log(`[DELETE /api/assignments/${id}] 检查到 ${row.count} 个关联提交`);
    
    if (row.count > 0) {
      db.close();
      return res.status(400).json({ 
        success: false, 
        error: `该作业有 ${row.count} 个相关作品，无法删除` 
      });
    }
    
    // 先删除关联的上传要求
    db.run('DELETE FROM assignment_upload_requirements WHERE assignment_id = ?', [id], function(err) {
      if (err) {
        console.error('[DELETE /api/assignments/:id] 删除作业上传要求失败:', err.message);
        db.close();
        return res.status(500).json({ success: false, error: '删除作业上传要求失败' });
      }
      
      console.log(`[DELETE /api/assignments/${id}] 删除了 ${this.changes} 个上传要求`);
      
      // 删除作业
      db.run('DELETE FROM assignments WHERE id = ?', [id], function(err) {
        if (err) {
          console.error('[DELETE /api/assignments/:id] 删除作业失败:', err.message);
          db.close();
          return res.status(500).json({ success: false, error: '删除作业失败' });
        }
        
        console.log(`[DELETE /api/assignments/${id}] 删除了 ${this.changes} 个作业`);
        
        if (this.changes === 0) {
          db.close();
          return res.status(404).json({ success: false, error: '作业不存在' });
        }
        
        res.json({ success: true, message: '作业已删除' });
        db.close();
      });
    });
  });
});

// 级联删除作业（删除作业及其所有作品）
router.delete('/:id/cascade', authenticateToken, (req, res) => {
  const db = getDatabase();
  const { id } = req.params;
  const fs = require('fs');
  const path = require('path');
  
  console.log(`[DELETE /api/assignments/${id}/cascade] 开始级联删除作业，ID: ${id}`);
  
  // 1. 查询作业的所有作品
  db.all('SELECT * FROM submissions WHERE assignment_id = ?', [id], (err, submissions) => {
    if (err) {
      console.error('[CASCADE DELETE] 查询作品失败:', err.message);
      db.close();
      return res.status(500).json({ success: false, error: '查询作品失败' });
    }
    
    console.log(`[CASCADE DELETE] 找到 ${submissions.length} 个作品`);
    
    // 2. 删除每个作品的文件
    let deletedFiles = 0;
    let fileErrors = 0;
    
    submissions.forEach(submission => {
      // 删除 STL/OBJ 文件
      if (submission.filepath) {
        try {
          if (fs.existsSync(submission.filepath)) {
            fs.unlinkSync(submission.filepath);
            deletedFiles++;
            console.log(`[CASCADE DELETE] 已删除文件: ${submission.filepath}`);
          }
        } catch (err) {
          console.error(`[CASCADE DELETE] 删除文件失败: ${submission.filepath}`, err.message);
          fileErrors++;
        }
      }
      
      // 删除缩略图文件
      if (submission.thumbnail_path) {
        try {
          if (fs.existsSync(submission.thumbnail_path)) {
            fs.unlinkSync(submission.thumbnail_path);
            deletedFiles++;
            console.log(`[CASCADE DELETE] 已删除缩略图: ${submission.thumbnail_path}`);
          }
        } catch (err) {
          console.error(`[CASCADE DELETE] 删除缩略图失败: ${submission.thumbnail_path}`, err.message);
          fileErrors++;
        }
      }
    });
    
    console.log(`[CASCADE DELETE] 已删除 ${deletedFiles} 个文件，${fileErrors} 个错误`);
    
    // 3. 删除作品记录
    db.run('DELETE FROM submissions WHERE assignment_id = ?', [id], function(err) {
      if (err) {
        console.error('[CASCADE DELETE] 删除作品记录失败:', err.message);
        db.close();
        return res.status(500).json({ success: false, error: '删除作品记录失败' });
      }
      
      const deletedSubmissions = this.changes;
      console.log(`[CASCADE DELETE] 已删除 ${deletedSubmissions} 个作品记录`);
      
      // 4. 删除作业的上传要求
      db.run('DELETE FROM assignment_upload_requirements WHERE assignment_id = ?', [id], function(err) {
        if (err) {
          console.error('[CASCADE DELETE] 删除上传要求失败:', err.message);
          db.close();
          return res.status(500).json({ success: false, error: '删除上传要求失败' });
        }
        
        console.log(`[CASCADE DELETE] 已删除 ${this.changes} 个上传要求`);
        
        // 5. 删除作业记录
        db.run('DELETE FROM assignments WHERE id = ?', [id], function(err) {
          if (err) {
            console.error('[CASCADE DELETE] 删除作业失败:', err.message);
            db.close();
            return res.status(500).json({ success: false, error: '删除作业失败' });
          }
          
          if (this.changes === 0) {
            db.close();
            return res.status(404).json({ success: false, error: '作业不存在' });
          }
          
          console.log(`[CASCADE DELETE] 级联删除完成`);
          
          res.json({ 
            success: true, 
            message: '作业及其所有作品已删除',
            deleted_submissions: deletedSubmissions,
            deleted_files: deletedFiles,
            file_errors: fileErrors
          });
          db.close();
        });
      });
    });
  });
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
      db.close();
      return res.status(500).json({ success: false, error: '获取作业提交失败' });
    }
    
    res.json({ success: true, data: rows });
    db.close();
  });
});

// 获取某个作业的所有上传要求
router.get('/:id/upload-requirements', (req, res) => {
  const db = getDatabase();
  const { id } = req.params;
  
  const sql = `
    SELECT * FROM assignment_upload_requirements
    WHERE assignment_id = ?
    ORDER BY sort_order ASC, created_at ASC
  `;
  
  db.all(sql, [id], (err, rows) => {
    if (err) {
      console.error('获取作业上传要求失败:', err.message);
      db.close();
      return res.status(500).json({ success: false, error: '获取作业上传要求失败' });
    }
    
    // 转换布尔值
    const requirements = rows.map(row => ({
      ...row,
      is_required: !!row.is_required,
      is_published: !!row.is_published
    }));
    
    res.json({ success: true, data: requirements });
    db.close();
  });
});

// 创建上传要求
router.post('/:id/upload-requirements', authenticateToken, (req, res) => {
  const db = getDatabase();
  const { id } = req.params;
  const { name, upload_type, is_required, is_published, sort_order } = req.body;
  
  // 验证必填字段
  if (!name || !upload_type) {
    db.close();
    return res.status(400).json({ success: false, error: '缺少必填字段' });
  }
  
  const sql = `
    INSERT INTO assignment_upload_requirements 
    (assignment_id, name, upload_type, is_required, is_published, sort_order)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  
  const values = [
    id,
    name,
    upload_type,
    is_required !== undefined ? (is_required ? 1 : 0) : 1,
    is_published !== undefined ? (is_published ? 1 : 0) : 1,
    sort_order || 0
  ];
  
  db.run(sql, values, function(err) {
    if (err) {
      console.error('创建上传要求失败:', err.message);
      db.close();
      return res.status(500).json({ success: false, error: '创建上传要求失败' });
    }
    
    res.json({ 
      success: true, 
      data: { id: this.lastID, ...req.body } 
    });
    db.close();
  });
});

// 更新上传要求
router.put('/:id/upload-requirements/:requirementId', authenticateToken, (req, res) => {
  const db = getDatabase();
  const { id, requirementId } = req.params;
  const { name, upload_type, is_required, is_published, sort_order } = req.body;
  
  // 先获取当前要求的信息
  db.get('SELECT * FROM assignment_upload_requirements WHERE id = ? AND assignment_id = ?', [requirementId, id], (err, row) => {
    if (err) {
      console.error('查询上传要求失败:', err.message);
      db.close();
      return res.status(500).json({ success: false, error: '查询上传要求失败' });
    }
    
    if (!row) {
      db.close();
      return res.status(404).json({ success: false, error: '上传要求不存在' });
    }
    
    const oldSortOrder = row.sort_order;
    const newSortOrder = sort_order !== undefined ? sort_order : 0;
    
    // 如果排序没有变化，直接更新其他字段
    if (oldSortOrder === newSortOrder) {
      const sql = `
        UPDATE assignment_upload_requirements
        SET name = ?, upload_type = ?, is_required = ?, is_published = ?
        WHERE id = ? AND assignment_id = ?
      `;
      
      const values = [
        name,
        upload_type,
        is_required !== undefined ? (is_required ? 1 : 0) : 1,
        is_published !== undefined ? (is_published ? 1 : 0) : 1,
        requirementId,
        id
      ];
      
      db.run(sql, values, function(err) {
        if (err) {
          console.error('更新上传要求失败:', err.message);
          db.close();
          return res.status(500).json({ success: false, error: '更新上传要求失败' });
        }
        
        res.json({ success: true, data: { id: requirementId, ...req.body } });
        db.close();
      });
      return;
    }
    
    // 排序发生变化，需要调整其他要求的排序
    if (newSortOrder < oldSortOrder) {
      // 排序变小：把当前位置的项目先移到临时位置，然后调整中间项，最后移到目标位置
      // 例如：原来的 0, 1, 2，把 2 改成 0
      // 步骤1：把 2 移到 -1（临时位置）
      db.run(
        `UPDATE assignment_upload_requirements SET sort_order = -1 WHERE id = ?`,
        [requirementId],
        function(err) {
          if (err) {
            console.error('临时移除失败:', err.message);
            db.close();
            return res.status(500).json({ success: false, error: '临时移除失败' });
          }
          
          // 步骤2：把 sort_order >= newSortOrder 的项 +1（0,1 变成 1,2）
          db.run(
            `UPDATE assignment_upload_requirements 
             SET sort_order = sort_order + 1 
             WHERE assignment_id = ? AND sort_order >= ?`,
            [id, newSortOrder],
            function(err) {
              if (err) {
                console.error('调整排序失败:', err.message);
                db.close();
                return res.status(500).json({ success: false, error: '调整排序失败' });
              }
              
              // 步骤3：把临时位置的项目移到目标位置（-1 变成 0）
              updateCurrentRequirement();
            }
          );
        }
      );
    } else {
      // 排序变大：把当前位置的项目先移到临时位置，然后调整中间项，最后移到目标位置
      // 例如：原来的 0, 1, 2，把 0 改成 2
      // 步骤1：把 0 移到 -1（临时位置）
      db.run(
        `UPDATE assignment_upload_requirements SET sort_order = -1 WHERE id = ?`,
        [requirementId],
        function(err) {
          if (err) {
            console.error('临时移除失败:', err.message);
            db.close();
            return res.status(500).json({ success: false, error: '临时移除失败' });
          }
          
          // 步骤2：把 sort_order > oldSortOrder AND sort_order <= newSortOrder 的项 -1（1,2 变成 0,1）
          db.run(
            `UPDATE assignment_upload_requirements 
             SET sort_order = sort_order - 1 
             WHERE assignment_id = ? AND sort_order > ? AND sort_order <= ?`,
            [id, oldSortOrder, newSortOrder],
            function(err) {
              if (err) {
                console.error('调整排序失败:', err.message);
                db.close();
                return res.status(500).json({ success: false, error: '调整排序失败' });
              }
              
              // 步骤3：把临时位置的项目移到目标位置（-1 变成 2）
              updateCurrentRequirement();
            }
          );
        }
      );
    }
    
    function updateCurrentRequirement() {
      const sql = `
        UPDATE assignment_upload_requirements
        SET name = ?, upload_type = ?, is_required = ?, is_published = ?, sort_order = ?
        WHERE id = ? AND assignment_id = ?
      `;
      
      const values = [
        name,
        upload_type,
        is_required !== undefined ? (is_required ? 1 : 0) : 1,
        is_published !== undefined ? (is_published ? 1 : 0) : 1,
        newSortOrder,
        requirementId,
        id
      ];
      
      db.run(sql, values, function(err) {
        if (err) {
          console.error('更新上传要求失败:', err.message);
          db.close();
          return res.status(500).json({ success: false, error: '更新上传要求失败' });
        }
        
        res.json({ success: true, data: { id: requirementId, ...req.body } });
        db.close();
      });
    }
  });
});

// 删除上传要求
router.delete('/:id/upload-requirements/:requirementId', authenticateToken, (req, res) => {
  const db = getDatabase();
  const { id, requirementId } = req.params;
  
  db.run('DELETE FROM assignment_upload_requirements WHERE id = ? AND assignment_id = ?', [requirementId, id], function(err) {
    if (err) {
      console.error('删除上传要求失败:', err.message);
      db.close();
      return res.status(500).json({ success: false, error: '删除上传要求失败' });
    }
    
    if (this.changes === 0) {
      db.close();
      return res.status(404).json({ success: false, error: '上传要求不存在' });
    }
    
    res.json({ success: true, message: '上传要求已删除' });
    db.close();
  });
});

// 批量更新上传要求排序
router.put('/:id/upload-requirements/reorder', authenticateToken, (req, res) => {
  const db = getDatabase();
  const { id } = req.params;
  const { requirements } = req.body; // [{id: 1, sort_order: 0}, {id: 2, sort_order: 1}, ...]
  
  if (!Array.isArray(requirements)) {
    db.close();
    return res.status(400).json({ success: false, error: '无效的数据格式' });
  }
  
  db.serialize(() => {
    const stmt = db.prepare('UPDATE assignment_upload_requirements SET sort_order = ? WHERE id = ? AND assignment_id = ?');
    
    requirements.forEach(req => {
      stmt.run(req.sort_order, req.id, id);
    });
    
    stmt.finalize((err) => {
      if (err) {
        console.error('批量更新排序失败:', err.message);
        db.close();
        return res.status(500).json({ success: false, error: '批量更新排序失败' });
      }
      
      res.json({ success: true, message: '排序已更新' });
      db.close();
    });
  });
});

// 打包导出作业的所有作品
router.get('/:id/export', authenticateToken, (req, res) => {
  const db = getDatabase();
  const { id } = req.params;
  const fs = require('fs');
  const path = require('path');
  const archiver = require('archiver');
  
  console.log(`[EXPORT /api/assignments/${id}] 开始导出作业作品，ID: ${id}`);
  
  // 1. 查询作业信息
  db.get('SELECT * FROM assignments WHERE id = ?', [id], (err, assignment) => {
    if (err) {
      console.error('[EXPORT] 查询作业失败:', err.message);
      db.close();
      return res.status(500).json({ success: false, error: '查询作业失败' });
    }
    
    if (!assignment) {
      db.close();
      return res.status(404).json({ success: false, error: '作业不存在' });
    }
    
    console.log(`[EXPORT] 作业名称: ${assignment.name}`);
    
    // 2. 查询所有作品
    db.all('SELECT * FROM submissions WHERE assignment_id = ?', [id], (err, submissions) => {
      if (err) {
        console.error('[EXPORT] 查询作品失败:', err.message);
        db.close();
        return res.status(500).json({ success: false, error: '查询作品失败' });
      }
      
      console.log(`[EXPORT] 找到 ${submissions.length} 个作品`);
      
      if (submissions.length === 0) {
        db.close();
        return res.status(400).json({ success: false, error: '该作业没有作品可导出' });
      }
      
      // 3. 创建 ZIP 文件
      const timestamp = new Date().toISOString().slice(0, 10);
      const zipFileName = `${assignment.name}_作品导出_${timestamp}.zip`;
      
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(zipFileName)}"`);
      
      const archive = archiver('zip', {
        zlib: { level: 9 } // 最高压缩级别
      });
      
      archive.on('error', (err) => {
        console.error('[EXPORT] ZIP 压缩错误:', err);
        db.close();
        res.status(500).json({ success: false, error: 'ZIP 压缩失败' });
      });
      
      archive.pipe(res);
      
      // 4. 添加作品清单
      const manifest = submissions.map(sub => ({
        id: sub.id,
        student_name: sub.student_name,
        student_year: sub.student_year,
        work_name: sub.work_name,
        description: sub.description,
        filename: sub.filename,
        created_at: sub.created_at
      }));
      
      archive.append(JSON.stringify(manifest, null, 2), { name: '作品清单.json' });
      
      // 5. 添加所有作品文件
      let addedFiles = 0;
      let skippedFiles = 0;
      
      submissions.forEach(submission => {
        // 添加 STL/OBJ 文件
        if (submission.filepath && fs.existsSync(submission.filepath)) {
          const fileExt = path.extname(submission.filepath);
          const fileName = `${submission.student_name}_${submission.work_name}${fileExt}`;
          archive.file(submission.filepath, { name: fileName });
          addedFiles++;
          console.log(`[EXPORT] 已添加文件: ${fileName}`);
        } else {
          skippedFiles++;
          console.log(`[EXPORT] 跳过文件: ${submission.filepath}`);
        }
        
        // 添加缩略图文件
        if (submission.thumbnail_path && fs.existsSync(submission.thumbnail_path)) {
          const thumbFileName = `${submission.student_name}_${submission.work_name}_thumb.png`;
          archive.file(submission.thumbnail_path, { name: thumbFileName });
          addedFiles++;
          console.log(`[EXPORT] 已添加缩略图: ${thumbFileName}`);
        }
      });
      
      console.log(`[EXPORT] 已添加 ${addedFiles} 个文件，跳过 ${skippedFiles} 个文件`);
      
      // 6. 完成压缩
      archive.finalize().then(() => {
        console.log('[EXPORT] 导出完成');
        db.close();
      }).catch((err) => {
        console.error('[EXPORT] 完成压缩失败:', err);
        db.close();
      });
    });
  });
});

module.exports = router;