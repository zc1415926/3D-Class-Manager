const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getDatabase } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// 获取三级文件夹路径的辅助函数
function getUploadPath(assignmentId, studentYear, isThumbnail = false, submissionId = null, useTemp = false) {
  // 如果没有assignmentId，使用临时路径
  if (!assignmentId) {
    return path.join(__dirname, isThumbnail ? '../uploads/temp' : '../uploads/temp');
  }
  
  // 根据assignmentId、studentYear创建基础路径
  const basePath = path.join(__dirname, isThumbnail ? '../uploads' : '../uploads', studentYear.toString(), assignmentId.toString());
  
  // 如果指定了submissionId，创建最终路径：uploads/年份/assignmentId/submissionId/
  // 如果useTemp为true，创建临时路径：uploads/年份/assignmentId/temp/
  if (submissionId) {
    return path.join(basePath, submissionId.toString());
  } else if (useTemp) {
    return path.join(basePath, 'temp');
  }
  
  return basePath;
}

// 配置文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadDir;
    const assignmentId = req.body.assignmentId || 'temp';
    const studentYear = req.body.studentYear || new Date().getFullYear();
    
    // 支持多种字段名：stlFile, files[], thumbnails[]
    // 先上传到临时目录，创建submission后再移动到最终目录
    if (file.fieldname === 'stlFile' || file.fieldname.startsWith('files[')) {
      uploadDir = getUploadPath(assignmentId, studentYear, false, null, true);
    } else if (file.fieldname === 'thumbnail' || file.fieldname.startsWith('thumbnails[')) {
      uploadDir = getUploadPath(assignmentId, studentYear, true, null, true);
    } else {
      return cb(new Error('未知的文件字段'));
    }

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const assignmentId = req.body.assignmentId || 'temp';
    const studentYear = req.body.studentYear || new Date().getFullYear();
    
    if (file.fieldname === 'stlFile' || file.fieldname.startsWith('files[')) {
      cb(null, `${studentYear}_${assignmentId}_${uniqueSuffix}${path.extname(file.originalname)}`);
    } else if (file.fieldname === 'thumbnail' || file.fieldname.startsWith('thumbnails[')) {
      // 生成与主文件对应的缩略图文件名
      // 如果主文件是 studentYear_assignmentId_filename.ext 格式，缩略图使用 studentYear_assignmentId_filename_thumbnail.jpg
      let baseFilename = `${studentYear}_${assignmentId}_${uniqueSuffix}`;
      
      // 如果是从前端传递的缩略图（已包含原始文件名信息），尝试解析出原始文件名
      if(file.originalname && typeof file.originalname === 'string' && file.originalname.includes && file.originalname.includes('_thumbnail.jpg')) {
        // 处理前端生成的缩略图文件名（如 originalname_thumbnail.jpg）
        const originalBase = file.originalname && typeof file.originalname === 'string' ? file.originalname.replace('_thumbnail.jpg', '') : '';
        if(originalBase && originalBase !== file.originalname) {
          baseFilename = originalBase;
        }
      }
      
      cb(null, `${baseFilename}_thumbnail.jpg`);
    }
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    
    // 单文件上传字段
    if (file.fieldname === 'stlFile') {
      // 支持STL和OBJ格式
      if (ext !== '.stl' && ext !== '.obj') {
        return cb(new Error('只允许上传STL或OBJ文件'));
      }
    } else if (file.fieldname === 'thumbnail') {
      if (ext !== '.png' && ext !== '.jpg' && ext !== '.jpeg') {
        return cb(new Error('只允许上传图片文件'));
      }
    } 
    // 多文件上传字段
    else if (file.fieldname.startsWith('files[')) {
      // 多文件上传，暂时允许所有常见3D和图片格式
      // 具体验证在后端处理时根据上传类型进行
      const allowedExts = ['.stl', '.obj', '.gcode', '.vox', '.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.doc', '.docx', '.txt', '.mp4', '.avi', '.mov', '.mkv'];
      if (!allowedExts.includes(ext)) {
        return cb(new Error(`不支持的文件类型: ${ext}`));
      }
    } else if (file.fieldname.startsWith('thumbnails[')) {
      if (ext !== '.png' && ext !== '.jpg' && ext !== '.jpeg' && ext !== '.gif' && ext !== '.webp') {
        return cb(new Error('只允许上传图片文件'));
      }
    } else {
      return cb(new Error('未知的文件字段'));
    }
    
    cb(null, true);
  },
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB限制
  }
});

// 提交3D作品（统一处理单文件和多文件上传）
router.post('/', upload.any(), async (req, res) => {
  try {
    const { studentName, studentYear, workName, description, assignmentId, requirementIds } = req.body;

    if (!studentName || !studentYear || !workName) {
      return res.status(400).json({ error: '学生姓名、年份和作品名称不能为空' });
    }

    const db = getDatabase();
    const client = await db.connect();

    try {
      // 分类文件
      const filesArray = [];
      const thumbnailsArray = [];
      const stlFile = [];
      const thumbnailFile = [];

      if (req.files && Array.isArray(req.files)) {
        req.files.forEach(file => {
          if (file.fieldname.startsWith('files[')) {
            const index = parseInt(file.fieldname.match(/\[(\d+)\]/)[1]);
            filesArray[index] = file;
          } else if (file.fieldname.startsWith('thumbnails[')) {
            const index = parseInt(file.fieldname.match(/\[(\d+)\]/)[1]);
            thumbnailsArray[index] = file;
          } else if (file.fieldname === 'stlFile') {
            stlFile.push(file);
          } else if (file.fieldname === 'thumbnail') {
            thumbnailFile.push(file);
          }
        });
      }

      // 创建提交记录
      const result = await client.query(
        `INSERT INTO submissions (student_name, student_year, work_name, description, assignment_id)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [
          studentName,
          parseInt(studentYear),
          workName,
          description || '',
          assignmentId ? parseInt(assignmentId) : null
        ]
      );

      const submissionId = result.rows[0].id;
      const files = [];

      // 辅助函数：将文件从临时目录移动到最终目录
      async function moveFileToFinalPath(filePath, assignmentId, studentYear, submissionId, isThumbnail = false) {
        if (!filePath) return null;
        
        const tempDir = getUploadPath(assignmentId, studentYear, isThumbnail, null, true);
        const finalDir = getUploadPath(assignmentId, studentYear, isThumbnail, submissionId, false);
        
        // 确保最终目录存在
        if (!fs.existsSync(finalDir)) {
          fs.mkdirSync(finalDir, { recursive: true });
        }
        
        // 获取文件名
        const filename = path.basename(filePath);
        const finalPath = path.join(finalDir, filename);
        
        try {
          // 移动文件
          await fs.promises.rename(filePath, finalPath);
          return finalPath;
        } catch (error) {
          console.error(`移动文件失败: ${filePath} -> ${finalPath}`, error);
          throw error;
        }
      }

      // 处理单文件上传模式
      if (stlFile.length > 0) {
        const mainFile = stlFile[0];
        const mainThumbnail = thumbnailFile.length > 0 ? thumbnailFile[0] : null;

        // 将文件从临时目录移动到最终目录
        const finalFilePath = await moveFileToFinalPath(mainFile.path, assignmentId, studentYear, submissionId, false);
        const finalThumbnailPath = mainThumbnail ? await moveFileToFinalPath(mainThumbnail.path, assignmentId, studentYear, submissionId, true) : null;

        const fileResult = await client.query(
          `INSERT INTO submission_files (submission_id, filename, filepath, thumbnail_path, is_primary, file_type)
           VALUES ($1, $2, $3, $4, true, 'primary')
           RETURNING id`,
          [
            submissionId,
            mainFile.filename,
            finalFilePath,
            finalThumbnailPath
          ]
        );

        files.push({
          id: fileResult.rows[0].id,
          filename: mainFile.filename,
          filepath: finalFilePath,
          thumbnail_path: finalThumbnailPath,
          is_primary: true
        });
      }

      // 处理多文件上传模式
      if (filesArray.length > 0) {
        // 解析requirementIds，如果不存在则为空数组
        let requirementIdsArray = [];
        if (requirementIds) {
          try {
            requirementIdsArray = JSON.parse(requirementIds);
          } catch (parseError) {
            console.error('解析requirementIds失败:', parseError);
            return res.status(400).json({ success: false, error: 'requirementIds格式错误' });
          }
        }

        // 保存每个文件到 submission_files 表
        for (let index = 0; index < filesArray.length; index++) {
          const file = filesArray[index];
          if (file) { // 确保文件存在
            const requirementId = requirementIdsArray && requirementIdsArray[index] ? parseInt(requirementIdsArray[index]) : null;
            let thumbnailFile = thumbnailsArray[index] || null;
            
            // 如果存在对应的缩略图，重命名缩略图文件使其与对应文件名相关联
            if (thumbnailFile) {
              try {
                // 从原文件名中提取基础名称（不含扩展名）
                const originalBasename = path.basename(file.filename, path.extname(file.filename));
                // 创建新的缩略图文件名，基于对应文件名
                const newThumbnailFilename = `${originalBasename}_thumbnail.jpg`;
                const newThumbnailPath = path.join(path.dirname(thumbnailFile.path), newThumbnailFilename);
                
                // 重命名缩略图文件
                await fs.promises.rename(thumbnailFile.path, newThumbnailPath);
                
                // 更新thumbnailFile对象的属性
                thumbnailFile.filename = newThumbnailFilename;
                thumbnailFile.path = newThumbnailPath;
                
                console.log(`缩略图已重命名为: ${newThumbnailFilename}`);
              } catch (renameError) {
                console.error(`重命名缩略图失败:`, renameError);
                // 如果重命名失败，继续使用原始缩略图文件
              }
            }

            // 将文件从临时目录移动到最终目录
            const finalFilePath = await moveFileToFinalPath(file.path, assignmentId, studentYear, submissionId, false);
            const finalThumbnailPath = thumbnailFile ? await moveFileToFinalPath(thumbnailFile.path, assignmentId, studentYear, submissionId, true) : null;

            const fileResult = await client.query(
              `INSERT INTO submission_files (submission_id, requirement_id, filename, filepath, thumbnail_path, sort_order, file_type)
               VALUES ($1, $2, $3, $4, $5, $6, 'general')
               RETURNING id`,
              [
                submissionId,
                requirementId,
                file.filename,
                finalFilePath,
                finalThumbnailPath,
                index
              ]
            );

            files.push({
              id: fileResult.rows[0].id,
              requirement_id: requirementId,
              filename: file.filename,
              filepath: finalFilePath,
              thumbnail_path: finalThumbnailPath,
              sort_order: index
            });
          }
        }
      }

      client.release();
      res.json({
        success: true,
        message: '作品提交成功',
        data: {
          id: submissionId,
          studentName,
          workName,
          files: files
        }
      });
    } catch (error) {
      client.release();
      throw error;
    }
  } catch (error) {
    console.error('提交错误:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取所有作品列表
router.get('/', async (req, res) => {
  try {
    const { studentYear, studentName } = req.query;
    const db = getDatabase();
    const client = await db.connect();

    try {
      let sql = `
        SELECT s.id, s.student_name, s.student_year, s.work_name, s.description, s.created_at
        FROM submissions s
      `;
      const params = [];
      const conditions = [];

      if (studentYear) {
        conditions.push(`s.student_year = $${params.length + 1}`);
        params.push(parseInt(studentYear));
      }

      if (studentName) {
        conditions.push(`s.student_name = $${params.length + 1}`);
        params.push(studentName);
      }

      if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ');
      }

      sql += ' ORDER BY s.created_at DESC';

      const result = await client.query(sql, params);

      // 为每个提交查询submission_files表获取缩略图
      const submissions = [];
      for (const row of result.rows) {
        // 获取缩略图 - 优先使用primary文件的缩略图，否则使用第一个文件的缩略图
        const fileResult = await client.query(
          'SELECT thumbnail_path FROM submission_files WHERE submission_id = $1 AND thumbnail_path IS NOT NULL ORDER BY is_primary DESC LIMIT 1',
          [row.id]
        );
        
        let thumbnailPath = null;
        if (fileResult.rows.length > 0 && fileResult.rows[0].thumbnail_path) {
          const relativePath = fileResult.rows[0].thumbnail_path.replace(path.join(__dirname, '../uploads'), '');
          thumbnailPath = `/uploads${relativePath}`;
        }

        submissions.push({
          id: row.id,
          studentName: row.student_name,
          studentYear: row.student_year,
          workName: row.work_name,
          description: row.description,
          filename: null, // 不再在主表中存储filename
          thumbnailPath: thumbnailPath,
          createdAt: row.created_at
        });
      }

      client.release();
      res.json({ success: true, data: submissions });
    } catch (error) {
      client.release();
      throw error;
    }
  } catch (error) {
    console.error('获取列表失败:', error);
    res.status(500).json({ error: '获取列表失败' });
  }
});

// 评分提交（文件级别）
router.put('/files/:fileId/grade', authenticateToken, async (req, res) => {
  const db = getDatabase();
  const client = await db.connect();
  const { fileId } = req.params;
  const { score, grade } = req.body;
  const userId = req.user.id;

  console.log(`[评分API] 收到文件评分请求: fileId=${fileId}, score=${score}, grade=${grade}, userId=${userId}`);

  // 验证评分数据
  if (score === undefined || grade === undefined) {
    console.error('[评分API] 缺少评分数据');
    client.release();
    return res.status(400).json({ success: false, error: '缺少评分数据' });
  }

  // 验证评分等级是否有效
  const validGrades = ['S', 'A', 'B', 'C', 'O'];
  if (!validGrades.includes(grade)) {
    console.error(`[评分API] 无效的评分等级: ${grade}`);
    client.release();
    return res.status(400).json({ success: false, error: '无效的评分等级' });
  }

  try {
    // 先查询当前数据
    const beforeResult = await client.query(
      'SELECT * FROM submission_files WHERE id = $1',
      [fileId]
    );
    
    if (beforeResult.rows.length === 0) {
      console.error('[评分API] 文件不存在');
      client.release();
      return res.status(404).json({ success: false, error: '文件不存在' });
    }
    
    console.log(`[评分API] 更新前数据:`, beforeResult.rows[0]);

    // 更新评分
    const updateResult = await client.query(`
      UPDATE submission_files
      SET score = $1, grade = $2, grader_id = $3, graded_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *
    `, [score, grade, userId, fileId]);

    console.log(`[评分API] 更新后数据:`, updateResult.rows[0]);
    console.log(`[评分API] 更新行数:`, updateResult.rowCount);

    client.release();
    res.json({
      success: true,
      data: updateResult.rows[0],
      message: '评分成功'
    });
  } catch (error) {
    console.error('[评分API] 评分提交失败:', error);
    console.error('[评分API] 错误详情:', error.message, error.stack);
    client.release();
    res.status(500).json({ success: false, error: '评分提交失败' });
  }
});

// 向后兼容：保留原有的评分路由，但会返回错误提示
router.put('/:id/grade', authenticateToken, async (req, res) => {
  console.log(`[评分API] 收到旧的评分请求: ID=${req.params.id}`);
  console.log(`[评分API] 警告：请使用新的文件级别评分路由: /api/submissions/files/:fileId/grade`);
  
  res.status(400).json({
    success: false,
    error: '评分API已更新，请使用新的文件级别评分路由：/api/submissions/files/:fileId/grade'
  });
});

// 获取单个作品详情
router.get('/:id', async (req, res) => {
  try {
    const db = getDatabase();
    const client = await db.connect();

    try {
      // 首先获取提交基本信息
      const result = await client.query(
        `SELECT * FROM submissions WHERE id = $1`,
        [req.params.id]
      );

      const row = result.rows[0];

      if (!row) {
        client.release();
        return res.status(404).json({ error: '作品不存在' });
      }

      // 获取所有相关文件信息
      const filesResult = await client.query(
        `SELECT * FROM submission_files WHERE submission_id = $1 ORDER BY is_primary DESC, sort_order`,
        [req.params.id]
      );

      // 使用第一个primary文件或第一个文件作为主要文件
      let primaryFile = filesResult.rows.find(f => f.is_primary) || filesResult.rows[0];
      
      let thumbnailPath = null;
      let filePath = null;
      
      if (primaryFile) {
        thumbnailPath = primaryFile.thumbnail_path ? `/uploads${primaryFile.thumbnail_path.replace(path.join(__dirname, '../uploads'), '')}` : null;
        filePath = primaryFile.filepath ? `/uploads${primaryFile.filepath.replace(path.join(__dirname, '../uploads'), '')}` : null;
      }

      const submission = {
        id: row.id,
        studentName: row.student_name,
        studentYear: row.student_year,
        workName: row.work_name,
        description: row.description,
        filename: primaryFile ? primaryFile.filename : null,
        filePath: filePath,
        thumbnailPath: thumbnailPath,
        files: filesResult.rows.map(file => ({
          id: file.id,
          requirement_id: file.requirement_id,
          filename: file.filename,
          filepath: file.filepath ? `/uploads${file.filepath.replace(path.join(__dirname, '../uploads'), '')}` : null,
          thumbnail_path: file.thumbnail_path ? `/uploads${file.thumbnail_path.replace(path.join(__dirname, '../uploads'), '')}` : null,
          is_primary: file.is_primary,
          sort_order: file.sort_order,
          file_type: file.file_type,
          score: file.score,
          grade: file.grade,
          grader_id: file.grader_id,
          graded_at: file.graded_at
        })),
        createdAt: row.created_at
      };

      client.release();
      res.json({ success: true, data: submission });
    } catch (error) {
      client.release();
      throw error;
    }
  } catch (error) {
    console.error('获取详情失败:', error);
    res.status(500).json({ error: '获取详情失败' });
  }
});

// 获取指定作业的所有提交（包含评分信息）
router.get('/by-assignment/:assignmentId', async (req, res) => {
  const db = getDatabase();
  const client = await db.connect();
  const { assignmentId } = req.params;

  try {
    const result = await client.query(`
      SELECT s.*
      FROM submissions s
      WHERE s.assignment_id = $1
      ORDER BY s.created_at DESC
    `, [assignmentId]);

    // 为每个 submission 获取文件信息和评分
    const submissionsWithFiles = await Promise.all(
      result.rows.map(async (submission) => {
        const filesResult = await client.query(
          `SELECT * FROM submission_files WHERE submission_id = $1 ORDER BY is_primary DESC, sort_order`,
          [submission.id]
        );

        return {
          ...submission,
          files: filesResult.rows.map(file => ({
            id: file.id,
            requirement_id: file.requirement_id,
            filename: file.filename,
            filepath: file.filepath ? `/uploads${file.filepath.replace(path.join(__dirname, '../uploads'), '')}` : null,
            thumbnail_path: file.thumbnail_path ? `/uploads${file.thumbnail_path.replace(path.join(__dirname, '../uploads'), '')}` : null,
            is_primary: file.is_primary,
            sort_order: file.sort_order,
            file_type: file.file_type,
            score: file.score,
            grade: file.grade,
            grader_id: file.grader_id,
            graded_at: file.graded_at
          }))
        };
      })
    );

    client.release();
    res.json({ success: true, data: submissionsWithFiles });
  } catch (error) {
    console.error('获取作业提交失败:', error);
    client.release();
    res.status(500).json({ success: false, error: '获取作业提交失败' });
  }
});

// 删除作品
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const db = getDatabase();
    const client = await db.connect();

    try {
      // 先获取作品信息
      const result = await client.query(
        `SELECT * FROM submissions WHERE id = $1`,
        [req.params.id]
      );

      const row = result.rows[0];

      if (!row) {
        client.release();
        return res.status(404).json({ error: '作品不存在' });
      }

      // 删除文件
      try {
        if (fs.existsSync(row.filepath)) {
          fs.unlinkSync(row.filepath);
        }
        if (row.thumbnail_path && fs.existsSync(row.thumbnail_path)) {
          fs.unlinkSync(row.thumbnail_path);
        }
      } catch (fileErr) {
        console.error('删除文件失败:', fileErr);
      }

      // 删除数据库记录
      await client.query(`DELETE FROM submissions WHERE id = $1`, [req.params.id]);

      client.release();
      res.json({ success: true, message: '删除成功' });
    } catch (error) {
      client.release();
      throw error;
    }
  } catch (error) {
    console.error('删除失败:', error);
    res.status(500).json({ error: '删除失败' });
  }
});

module.exports = router;