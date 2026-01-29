const express = require('express');
const router = express.Router();
const path = require('path');
const { getDatabase } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// 获取所有作业
router.get('/', async (req, res) => {
  const db = getDatabase();
  const client = await db.connect();

  try {
    const sql = `
      SELECT
        a.*,
      COUNT(DISTINCT s.id) as submission_count
    FROM assignments a
    LEFT JOIN submissions s ON a.id = s.assignment_id
    GROUP BY a.id
    ORDER BY a.sort_order ASC, a.year DESC, a.created_at DESC
  `;

    const result = await client.query(sql);

    // 解析 upload_types JSON
    const assignments = result.rows.map(row => ({
      ...row,
      upload_types: JSON.parse(row.upload_types || '[]')
    }));

    client.release();
    res.json({ success: true, data: assignments });
  } catch (error) {
    console.error('获取作业列表失败:', error);
    client.release();
    res.status(500).json({ success: false, error: '获取作业列表失败' });
  }
});

// 获取单个作业详情
router.get('/:id', async (req, res) => {
  const db = getDatabase();
  const client = await db.connect();
  const { id } = req.params;

  try {
    const result = await client.query(`
      SELECT
        a.*,
      COUNT(DISTINCT s.id) as submission_count
    FROM assignments a
    LEFT JOIN submissions s ON a.id = s.assignment_id
    WHERE a.id = $1
    GROUP BY a.id
  `, [id]);

    const row = result.rows[0];

    if (!row) {
      client.release();
      return res.status(404).json({ success: false, error: '作业不存在' });
    }

    // 解析 upload_types JSON
    const assignment = {
      ...row,
      upload_types: JSON.parse(row.upload_types || '[]')
    };

    client.release();
    res.json({ success: true, data: assignment });
  } catch (error) {
    console.error('获取作业详情失败:', error);
    client.release();
    res.status(500).json({ success: false, error: '获取作业详情失败' });
  }
});

// 创建作业
router.post('/', authenticateToken, async (req, res) => {
  const db = getDatabase();
  const client = await db.connect();
  const { year, name, upload_types, description, status } = req.body;

  // 验证必填字段
  if (!year || !name || !upload_types || !Array.isArray(upload_types)) {
    client.release();
    return res.status(400).json({ success: false, error: '缺少必填字段' });
  }

  try {
    const sql = `
      INSERT INTO assignments (year, name, upload_types, description, status)
      VALUES ($1, $2, $3, $4, $5) RETURNING id
    `;

    const values = [
      year,
      name,
      JSON.stringify(upload_types),
      description || null,
      status || 'active'
    ];

    const result = await client.query(sql, values);

    client.release();
    res.json({
      success: true,
      data: { id: result.rows[0].id, ...req.body }
    });
  } catch (error) {
    console.error('创建作业失败:', error);
    client.release();
    res.status(500).json({ success: false, error: '创建作业失败' });
  }
});

// 批量更新作业排序
router.put('/reorder', authenticateToken, async (req, res) => {
  const db = getDatabase();
  const client = await db.connect();
  const { assignments } = req.body; // [{id: 1, sort_order: 0}, {id: 2, sort_order: 1}, ...]

  if (!Array.isArray(assignments)) {
    client.release();
    return res.status(400).json({ success: false, error: '无效的数据格式' });
  }

  try {
    // 使用事务批量更新
    await client.query('BEGIN');

    for (const assignment of assignments) {
      await client.query(
        'UPDATE assignments SET sort_order = $1 WHERE id = $2',
        [assignment.sort_order, assignment.id]
      );
    }

    await client.query('COMMIT');

    client.release();
    res.json({ success: true, message: '排序已更新' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('批量更新作业排序失败:', error);
    client.release();
    res.status(500).json({ success: false, error: '批量更新作业排序失败' });
  }
});

// 更新作业
router.put('/:id', authenticateToken, async (req, res) => {
  const db = getDatabase();
  const client = await db.connect();
  const { id } = req.params;
  const { year, name, upload_types, description, status, deadline } = req.body;

  // 验证必填字段
  if (!year || !name || !upload_types || !Array.isArray(upload_types)) {
    client.release();
    return res.status(400).json({ success: false, error: '缺少必填字段' });
  }

  try {
    const sql = `
      UPDATE assignments
      SET year = $1, name = $2, upload_types = $3, description = $4, deadline = $5, status = $6, updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
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

    const result = await client.query(sql, values);

    if (result.rowCount === 0) {
      client.release();
      return res.status(404).json({ success: false, error: '作业不存在' });
    }

    client.release();
    res.json({ success: true, data: { id, ...req.body } });
  } catch (error) {
    console.error('更新作业失败:', error);
    client.release();
    res.status(500).json({ success: false, error: '更新作业失败' });
  }
});



// 删除作业
router.delete('/:id', authenticateToken, async (req, res) => {
  const db = getDatabase();
  const client = await db.connect();
  const { id } = req.params;

  console.log(`[DELETE /api/assignments/${id}] 开始删除作业，ID: ${id}`);

  try {
    // 先检查是否有关联的提交
    const countResult = await client.query('SELECT COUNT(*) as count FROM submissions WHERE assignment_id = $1', [id]);

    console.log(`[DELETE /api/assignments/${id}] 检查到 ${countResult.rows[0].count} 个关联提交`);

    if (countResult.rows[0].count > 0) {
      client.release();
      return res.status(400).json({
        success: false,
        error: `该作业有 ${countResult.rows[0].count} 个相关作品，无法删除`
      });
    }

    // 先删除关联的作业要求
    await client.query('DELETE FROM assignment_upload_requirements WHERE assignment_id = $1', [id]);

    // 删除作业
    const result = await client.query('DELETE FROM assignments WHERE id = $1', [id]);

    if (result.rowCount === 0) {
      client.release();
      return res.status(404).json({ success: false, error: '作业不存在' });
    }

    client.release();
    res.json({ success: true, message: '作业已删除' });
  } catch (error) {
    console.error('[DELETE /api/assignments/:id] 删除作业失败:', error);
    client.release();
    res.status(500).json({ success: false, error: '删除作业失败' });
  }
});

// 级联删除作业（删除作业及其所有作品）
router.delete('/:id/cascade', authenticateToken, async (req, res) => {
  const db = getDatabase();
  const client = await db.connect();
  const { id } = req.params;
  const fs = require('fs');
  const path = require('path');

  console.log(`[DELETE /api/assignments/${id}/cascade] 开始级联删除作业，ID: ${id}`);

  try {
    // 1. 查询作业的所有作品
    const submissionsResult = await client.query('SELECT * FROM submissions WHERE assignment_id = $1', [id]);

    const submissions = submissionsResult.rows;
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
    const deletedSubmissionsResult = await client.query('DELETE FROM submissions WHERE assignment_id = $1', [id]);

    const deletedSubmissions = deletedSubmissionsResult.rowCount;
    console.log(`[CASCADE DELETE] 已删除 ${deletedSubmissions} 个作品记录`);

    // 4. 删除作业的作业要求
    await client.query('DELETE FROM assignment_upload_requirements WHERE assignment_id = $1', [id]);

    // 5. 删除作业记录
    const result = await client.query('DELETE FROM assignments WHERE id = $1', [id]);

    if (result.rowCount === 0) {
      client.release();
      return res.status(404).json({ success: false, error: '作业不存在' });
    }

    console.log(`[CASCADE DELETE] 级联删除完成`);

    client.release();
    res.json({
      success: true,
      message: '作业及其所有作品已删除',
      deleted_submissions: deletedSubmissions,
      deleted_files: deletedFiles,
      file_errors: fileErrors
    });
  } catch (error) {
    console.error('[CASCADE DELETE] 级联删除失败:', error);
    client.release();
    res.status(500).json({ success: false, error: '级联删除失败' });
  }
});

// 获取某个作业的所有提交
router.get('/:id/submissions', async (req, res) => {
  const db = getDatabase();
  const client = await db.connect();
  const { id } = req.params;

  try {
    const sql = `
      SELECT s.*,
             sf.id as file_id, sf.filename, sf.filepath, sf.thumbnail_path,
             sf.is_primary, sf.sort_order
      FROM submissions s
      LEFT JOIN submission_files sf ON s.id = sf.submission_id
      WHERE s.assignment_id = $1
      ORDER BY s.created_at DESC, sf.is_primary DESC, sf.sort_order
    `;

    const result = await client.query(sql, [id]);
    
    // 处理数据，将文件路径转换为相对路径
    const submissions = [];
    let currentSubmission = null;
    
    for (const row of result.rows) {
      // 如果是新的提交记录
      if (!currentSubmission || currentSubmission.id !== row.id) {
        if (currentSubmission) {
          submissions.push(currentSubmission);
        }
        
        currentSubmission = {
          id: row.id,
          student_name: row.student_name,
          student_year: row.student_year,
          work_name: row.work_name,
          description: row.description,
          filename: row.filename,
          filePath: null,
          thumbnail_path: null,
          created_at: row.created_at,
          assignment_id: row.assignment_id,
          score: row.score,
          grade: row.grade,
          grader_id: row.grader_id,
          graded_at: row.graded_at
        };
      }
      
      // 如果当前行有文件数据
      if (row.file_id) {
        // 使用primary文件或第一个文件作为主要文件
        if (row.is_primary || !currentSubmission.filePath) {
          if (row.filepath) {
            const relativePath = row.filepath.replace(path.join(__dirname, '../uploads'), '');
            currentSubmission.filePath = `/uploads${relativePath}`;
          }
          if (row.thumbnail_path) {
            const relativeThumbPath = row.thumbnail_path.replace(path.join(__dirname, '../uploads'), '');
            currentSubmission.thumbnail_path = `/uploads${relativeThumbPath}`;
          }
        }
      }
    }
    
    // 添加最后一个提交
    if (currentSubmission) {
      submissions.push(currentSubmission);
    }

    client.release();
    res.json({ success: true, data: submissions });
  } catch (error) {
    console.error('获取作业提交失败:', error);
    client.release();
    res.status(500).json({ success: false, error: '获取作业提交失败' });
  }
});

// 获取某个作业的所有作业要求
router.get('/:id/upload-requirements', async (req, res) => {
  const db = getDatabase();
  const client = await db.connect();
  const { id } = req.params;

  try {
    const sql = `
      SELECT * FROM assignment_upload_requirements
      WHERE assignment_id = $1
      ORDER BY sort_order ASC, created_at ASC
    `;

    const result = await client.query(sql, [id]);

    // 转换布尔值
    const requirements = result.rows.map(row => ({
      ...row,
      is_required: !!row.is_required,
      is_published: !!row.is_published
    }));

    client.release();
    res.json({ success: true, data: requirements });
  } catch (error) {
    console.error('获取作业作业要求失败:', error);
    client.release();
    res.status(500).json({ success: false, error: '获取作业作业要求失败' });
  }
});

// 创建作业要求
router.post('/:id/upload-requirements', authenticateToken, async (req, res) => {
  const db = getDatabase();
  const client = await db.connect();
  const { id } = req.params;
  const { name, upload_type, is_required, is_published, sort_order } = req.body;

  // 验证必填字段
  if (!name || !upload_type) {
    client.release();
    return res.status(400).json({ success: false, error: '缺少必填字段' });
  }

  try {
    const sql = `
      INSERT INTO assignment_upload_requirements
      (assignment_id, name, upload_type, is_required, is_published, sort_order)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING id
    `;

    const values = [
      id,
      name,
      upload_type,
      is_required !== undefined ? (is_required ? 1 : 0) : 1,
      is_published !== undefined ? (is_published ? 1 : 0) : 1,
      sort_order || 0
    ];

    const result = await client.query(sql, values);

    client.release();
    res.json({
      success: true,
      data: { id: result.rows[0].id, ...req.body }
    });
  } catch (error) {
    console.error('创建作业要求失败:', error);
    client.release();
    res.status(500).json({ success: false, error: '创建作业要求失败' });
  }
});

// 更新作业要求
router.put('/:id/upload-requirements/:requirementId', authenticateToken, async (req, res) => {
  const db = getDatabase();
  const client = await db.connect();
  const { id, requirementId } = req.params;
  const { name, upload_type, is_required, is_published, sort_order } = req.body;

  try {
    // 先获取当前要求的信息
    const result = await client.query(
      'SELECT * FROM assignment_upload_requirements WHERE id = $1 AND assignment_id = $2',
      [requirementId, id]
    );

    const row = result.rows[0];

    if (!row) {
      client.release();
      return res.status(404).json({ success: false, error: '作业要求不存在' });
    }

    const oldSortOrder = row.sort_order;
    const newSortOrder = sort_order !== undefined ? sort_order : 0;

    // 如果排序没有变化，直接更新其他字段
    if (oldSortOrder === newSortOrder) {
      const sql = `
        UPDATE assignment_upload_requirements
        SET name = $1, upload_type = $2, is_required = $3, is_published = $4
        WHERE id = $5 AND assignment_id = $6
      `;

      const values = [
        name,
        upload_type,
        is_required !== undefined ? (is_required ? 1 : 0) : 1,
        is_published !== undefined ? (is_published ? 1 : 0) : 1,
        requirementId,
        id
      ];

      await client.query(sql, values);

      client.release();
      res.json({ success: true, data: { id: requirementId, ...req.body } });
      return;
    }

    // 排序发生变化，需要调整其他要求的排序
    if (newSortOrder < oldSortOrder) {
      // 排序变小：把当前位置的项目先移到临时位置，然后调整中间项，最后移到目标位置
      // 例如：原来的 0, 1, 2，把 2 改成 0
      // 步骤1：把 2 移到 -1（临时位置）
      await client.query(
        `UPDATE assignment_upload_requirements SET sort_order = -1 WHERE id = $1`,
        [requirementId]
      );

      // 步骤2：把 sort_order >= newSortOrder 的项 +1（0,1 变成 1,2）
      await client.query(
        `UPDATE assignment_upload_requirements
         SET sort_order = sort_order + 1
         WHERE assignment_id = $1 AND sort_order >= $2`,
        [id, newSortOrder]
      );

      // 步骤3：把临时位置的项目移到目标位置（-1 变成 0）
      await updateCurrentRequirement();
    } else {
      // 排序变大：把当前位置的项目先移到临时位置，然后调整中间项，最后移到目标位置
      // 例如：原来的 0, 1, 2，把 0 改成 2
      // 步骤1：把 0 移到 -1（临时位置）
      await client.query(
        `UPDATE assignment_upload_requirements SET sort_order = -1 WHERE id = $1`,
        [requirementId]
      );

      // 步骤2：把 sort_order > oldSortOrder AND sort_order <= newSortOrder 的项 -1（1,2 变成 0,1）
      await client.query(
        `UPDATE assignment_upload_requirements
         SET sort_order = sort_order - 1
         WHERE assignment_id = $1 AND sort_order > $2 AND sort_order <= $3`,
        [id, oldSortOrder, newSortOrder]
      );

      // 步骤3：把临时位置的项目移到目标位置（-1 变成 2）
      await updateCurrentRequirement();
    }

    async function updateCurrentRequirement() {
      const sql = `
        UPDATE assignment_upload_requirements
        SET name = $1, upload_type = $2, is_required = $3, is_published = $4, sort_order = $5
        WHERE id = $6 AND assignment_id = $7
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

      await client.query(sql, values);

      client.release();
      res.json({ success: true, data: { id: requirementId, ...req.body } });
    }
  } catch (error) {
    console.error('更新作业要求失败:', error);
    client.release();
    res.status(500).json({ success: false, error: '更新作业要求失败' });
  }
});

// 删除作业要求
router.delete('/:id/upload-requirements/:requirementId', authenticateToken, async (req, res) => {
  const db = getDatabase();
  const client = await db.connect();
  const { id, requirementId } = req.params;

  try {
    const result = await client.query(
      'DELETE FROM assignment_upload_requirements WHERE id = $1 AND assignment_id = $2',
      [requirementId, id]
    );

    if (result.rowCount === 0) {
      client.release();
      return res.status(404).json({ success: false, error: '作业要求不存在' });
    }

    client.release();
    res.json({ success: true, message: '作业要求已删除' });
  } catch (error) {
    console.error('删除作业要求失败:', error);
    client.release();
    res.status(500).json({ success: false, error: '删除作业要求失败' });
  }
});

// 批量更新作业要求排序
router.put('/:id/upload-requirements/reorder', authenticateToken, async (req, res) => {
  const db = getDatabase();
  const client = await db.connect();
  const { id } = req.params;
  const { requirements } = req.body; // [{id: 1, sort_order: 0}, {id: 2, sort_order: 1}, ...]

  if (!Array.isArray(requirements)) {
    client.release();
    return res.status(400).json({ success: false, error: '无效的数据格式' });
  }

  try {
    // 使用事务批量更新
    await client.query('BEGIN');

    for (const req of requirements) {
      await client.query(
        'UPDATE assignment_upload_requirements SET sort_order = $1 WHERE id = $2 AND assignment_id = $3',
        [req.sort_order, req.id, id]
      );
    }

    await client.query('COMMIT');

    client.release();
    res.json({ success: true, message: '排序已更新' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('批量更新排序失败:', error);
    client.release();
    res.status(500).json({ success: false, error: '批量更新排序失败' });
  }
});

// 打包导出作业的所有作品
router.get('/:id/export', authenticateToken, async (req, res) => {
  const db = getDatabase();
  const client = await db.connect();
  const { id } = req.params;
  const fs = require('fs');
  const path = require('path');
  const archiver = require('archiver');

  console.log(`[EXPORT /api/assignments/${id}] 开始导出作业作品，ID: ${id}`);

  try {
    // 1. 查询作业信息
    const assignmentResult = await client.query('SELECT * FROM assignments WHERE id = $1', [id]);

    const assignment = assignmentResult.rows[0];

    if (!assignment) {
      client.release();
      return res.status(404).json({ success: false, error: '作业不存在' });
    }

    console.log(`[EXPORT] 作业名称: ${assignment.name}`);

    // 2. 查询所有作品
    const submissionsResult = await client.query('SELECT * FROM submissions WHERE assignment_id = $1', [id]);

    const submissions = submissionsResult.rows;
    console.log(`[EXPORT] 找到 ${submissions.length} 个作品`);

    if (submissions.length === 0) {
      client.release();
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
      client.release();
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
      client.release();
    }).catch((err) => {
      console.error('[EXPORT] 完成压缩失败:', err);
      client.release();
    });
  } catch (error) {
    console.error('[EXPORT] 导出失败:', error);
    client.release();
    res.status(500).json({ success: false, error: '导出失败' });
  }
});

// 移动新建作业时上传的文件到正确的目录
// 将文件从 temp/article 移动到 {assignmentId}/article
router.post('/:id/move-uploaded-files', authenticateToken, async (req, res) => {
  const db = getDatabase();
  const client = await db.connect();
  const { id } = req.params;
  const { files, year } = req.body;

  if (!files || !Array.isArray(files) || files.length === 0) {
    client.release();
    return res.json({ success: true, message: '没有文件需要移动' });
  }

  try {
    const movedFiles = [];
    const fs = require('fs').promises;
    const path = require('path');

    // 确保目标目录存在
    const targetDir = path.join(__dirname, '../uploads', year.toString(), id.toString(), 'article');
    await fs.mkdir(targetDir, { recursive: true });

    for (const fileUrl of files) {
      try {
        // 解析文件URL，提取路径
        // URL格式: /uploads/年份/assignmentId/article/filename 或 /uploads/年份/temp/article/filename
        const urlParts = fileUrl.split('/');
        const filename = urlParts[urlParts.length - 1];
        const oldAssignmentId = urlParts[urlParts.length - 3]; // article前面的部分
        
        // 只有当文件在temp目录中时才需要移动
        if (oldAssignmentId === 'temp') {
          const oldDir = path.join(__dirname, '../uploads', year.toString(), 'temp', 'article');
          const oldPath = path.join(oldDir, filename);
          const newPath = path.join(targetDir, filename);
          
          // 检查文件是否存在
          try {
            await fs.access(oldPath);
            // 移动文件
            await fs.rename(oldPath, newPath);
            movedFiles.push({
              oldUrl: fileUrl,
              newUrl: `/uploads/${year}/${id}/article/${filename}`
            });
            console.log(`文件移动成功: ${oldPath} -> ${newPath}`);
          } catch (fileError) {
            console.error(`文件不存在或无法移动: ${oldPath}`, fileError);
            // 文件可能已经被移动或不存在，跳过
          }
        } else {
          // 文件已经在正确的目录中，不需要移动
          movedFiles.push({
            oldUrl: fileUrl,
            newUrl: fileUrl
          });
        }
      } catch (parseError) {
        console.error(`解析文件URL失败: ${fileUrl}`, parseError);
      }
    }

    // 如果有文件被移动，更新作业描述中的URL
    if (movedFiles.length > 0) {
      const assignmentResult = await client.query(
        'SELECT description FROM assignments WHERE id = $1',
        [id]
      );
      
      if (assignmentResult.rows.length > 0) {
        let description = assignmentResult.rows[0].description || '';
        
        // 替换描述中的所有旧URL为新URL
        for (const file of movedFiles) {
          if (file.oldUrl !== file.newUrl) {
            const oldUrlRegex = new RegExp(file.oldUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
            description = description.replace(oldUrlRegex, file.newUrl);
          }
        }
        
        // 更新作业描述
        await client.query(
          'UPDATE assignments SET description = $1 WHERE id = $2',
          [description, id]
        );
      }
    }

    client.release();
    res.json({
      success: true,
      message: `成功移动 ${movedFiles.filter(f => f.oldUrl !== f.newUrl).length} 个文件`,
      movedFiles: movedFiles
    });
  } catch (error) {
    console.error('移动文件失败:', error);
    client.release();
    res.status(500).json({ success: false, error: '移动文件失败' });
  }
});

module.exports = router;