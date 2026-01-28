const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getDatabase } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// 配置文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadDir;
    // 支持多种字段名：stlFile, files[], thumbnails[]
    if (file.fieldname === 'stlFile' || file.fieldname.startsWith('files[')) {
      uploadDir = path.join(__dirname, '../uploads');
    } else if (file.fieldname === 'thumbnail' || file.fieldname.startsWith('thumbnails[')) {
      uploadDir = path.join(__dirname, '../thumbnails');
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
    
    if (file.fieldname === 'stlFile' || file.fieldname.startsWith('files[')) {
      cb(null, uniqueSuffix + path.extname(file.originalname));
    } else if (file.fieldname === 'thumbnail' || file.fieldname.startsWith('thumbnails[')) {
      cb(null, uniqueSuffix + '.png');
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

// 提交3D作品（支持多文件上传）
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

      // 检查是否是新的多文件上传方式
      const isMultiFileUpload = filesArray.filter(f => f).length > 0;

      let submissionId;
      let files = [];

      if (isMultiFileUpload) {
        // 新的多文件上传方式
        const validFiles = filesArray.filter(f => f);
        const validThumbnails = thumbnailsArray.filter(f => f);

        // 解析requirementIds，如果不存在则为空数组
        const requirementIdsArray = requirementIds ? JSON.parse(requirementIds) : [];

        // 创建提交记录（不存储文件信息）
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

        submissionId = result.rows[0].id;

        // 保存每个文件到 submission_files 表
        for (let index = 0; index < filesArray.length; index++) {
          const file = filesArray[index];
          if (file) { // 确保文件存在
            const requirementId = requirementIdsArray && requirementIdsArray[index] ? parseInt(requirementIdsArray[index]) : null;
            const thumbnailFile = thumbnailsArray[index] || null;

            const fileResult = await client.query(
              `INSERT INTO submission_files (submission_id, requirement_id, filename, filepath, thumbnail_path)
               VALUES ($1, $2, $3, $4, $5) RETURNING id`,
              [
                submissionId,
                requirementId,
                file.filename,
                file.path,
                thumbnailFile ? thumbnailFile.path : null
              ]
            );

            files.push({
              id: fileResult.rows[0].id,
              requirement_id: requirementId,
              filename: file.filename,
              filepath: file.path,
              thumbnail_path: thumbnailFile ? thumbnailFile.path : null
            });
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

      } else {
        // 旧的单文件上传方式（向后兼容）
        if (stlFile.length === 0) {
          client.release();
          return res.status(400).json({ error: '请上传3D模型文件（STL或OBJ格式）' });
        }

        const mainFile = stlFile[0];
        const mainThumbnail = thumbnailFile.length > 0 ? thumbnailFile[0] : null;

        const result = await client.query(
          `INSERT INTO submissions (student_name, student_year, work_name, description, filename, filepath, thumbnail_path, assignment_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
          [
            studentName,
            parseInt(studentYear),
            workName,
            description || '',
            mainFile.filename,
            mainFile.path,
            mainThumbnail ? mainThumbnail.path : null,
            assignmentId ? parseInt(assignmentId) : null
          ]
        );

        submissionId = result.rows[0].id;

        client.release();
        res.json({
          success: true,
          message: '作品提交成功',
          data: {
            id: submissionId,
            studentName,
            workName,
            filename: stlFile.filename
          }
        });
      }
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
        SELECT id, student_name, student_year, work_name, description, filename, thumbnail_path, created_at
        FROM submissions
      `;
      const params = [];
      const conditions = [];

      if (studentYear) {
        conditions.push(`student_year = ${params.length + 1}`);
        params.push(parseInt(studentYear));
      }

      if (studentName) {
        conditions.push(`student_name = ${params.length + 1}`);
        params.push(studentName);
      }

      if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ');
      }

      sql += ' ORDER BY created_at DESC';

      const result = await client.query(sql, params);

      const submissions = result.rows.map(row => ({
        id: row.id,
        studentName: row.student_name,
        studentYear: row.student_year,
        workName: row.work_name,
        description: row.description,
        filename: row.filename,
        thumbnailPath: row.thumbnail_path ? `/thumbnails/${path.basename(row.thumbnail_path)}` : null,
        createdAt: row.created_at
      }));

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

// 评分提交
router.put('/:id/grade', authenticateToken, async (req, res) => {
  const db = getDatabase();
  const client = await db.connect();
  const { id } = req.params;
  const { score, grade } = req.body;
  const userId = req.user.id;

  // 验证评分数据
  if (score === undefined || grade === undefined) {
    client.release();
    return res.status(400).json({ success: false, error: '缺少评分数据' });
  }

  // 验证评分等级是否有效
  const validGrades = ['S', 'A', 'B', 'C', 'O'];
  if (!validGrades.includes(grade)) {
    client.release();
    return res.status(400).json({ success: false, error: '无效的评分等级' });
  }

  try {
    // 获取当前提交信息
    const submissionResult = await client.query(
      'SELECT * FROM submissions WHERE id = $1', 
      [id]
    );

    if (submissionResult.rows.length === 0) {
      client.release();
      return res.status(404).json({ success: false, error: '提交不存在' });
    }

    // 更新评分
    const updateResult = await client.query(`
      UPDATE submissions 
      SET score = $1, grade = $2, grader_id = $3, graded_at = CURRENT_TIMESTAMP 
      WHERE id = $4 
      RETURNING *
    `, [score, grade, userId, id]);

    client.release();
    res.json({ 
      success: true, 
      data: updateResult.rows[0],
      message: '评分成功' 
    });
  } catch (error) {
    console.error('评分提交失败:', error);
    client.release();
    res.status(500).json({ success: false, error: '评分提交失败' });
  }
});

// 获取单个作品详情
router.get('/:id', async (req, res) => {
  try {
    const db = getDatabase();
    const client = await db.connect();

    try {
      const result = await client.query(
        `SELECT * FROM submissions WHERE id = $1`,
        [req.params.id]
      );

      const row = result.rows[0];

      if (!row) {
        client.release();
        return res.status(404).json({ error: '作品不存在' });
      }

      const submission = {
        id: row.id,
        studentName: row.student_name,
        studentYear: row.student_year,
        workName: row.work_name,
        description: row.description,
        filename: row.filename,
        filePath: `/uploads/${row.filename}`,
        thumbnailPath: row.thumbnail_path ? `/thumbnails/${path.basename(row.thumbnail_path)}` : null,
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
      SELECT s.*, 
             u.username as grader_name
      FROM submissions s
      LEFT JOIN users u ON s.grader_id = u.id
      WHERE s.assignment_id = $1
      ORDER BY s.created_at DESC
    `, [assignmentId]);

    client.release();
    res.json({ success: true, data: result.rows });
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