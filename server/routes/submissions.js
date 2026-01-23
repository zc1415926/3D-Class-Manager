const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getDatabase } = require('../models/database');

const router = express.Router();

// 配置文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadDir;
    if (file.fieldname === 'stlFile') {
      uploadDir = path.join(__dirname, '../uploads');
    } else if (file.fieldname === 'thumbnail') {
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
    
    if (file.fieldname === 'stlFile') {
      cb(null, uniqueSuffix + path.extname(file.originalname));
    } else if (file.fieldname === 'thumbnail') {
      cb(null, uniqueSuffix + '.png');
    }
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    if (file.fieldname === 'stlFile') {
      if (ext !== '.stl') {
        return cb(new Error('只允许上传STL文件'));
      }
    } else if (file.fieldname === 'thumbnail') {
      if (ext !== '.png' && ext !== '.jpg' && ext !== '.jpeg') {
        return cb(new Error('只允许上传图片文件'));
      }
    }
    cb(null, true);
  },
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB限制
  }
});

// 提交STL作品
router.post('/', upload.fields([{ name: 'stlFile' }, { name: 'thumbnail' }]), async (req, res) => {
  try {
    if (!req.files || !req.files.stlFile) {
      return res.status(400).json({ error: '请上传STL文件' });
    }

    const { studentName, studentYear, workName, description, assignmentId } = req.body;

    if (!studentName || !studentYear || !workName) {
      return res.status(400).json({ error: '学生姓名、年份和作品名称不能为空' });
    }

    const stlFile = req.files.stlFile[0];
    const thumbnailFile = req.files.thumbnail ? req.files.thumbnail[0] : null;

    // 保存到数据库
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO submissions (student_name, student_year, work_name, description, filename, filepath, thumbnail_path, assignment_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      studentName,
      parseInt(studentYear),
      workName,
      description || '',
      stlFile.filename,
      stlFile.path,
      thumbnailFile ? thumbnailFile.path : null,
      assignmentId ? parseInt(assignmentId) : null
    );

    stmt.finalize();

    res.json({
      success: true,
      message: '作品提交成功',
      data: {
        id: this.lastID,
        studentName,
        workName,
        description,
        filename: stlFile.filename,
        thumbnailPath: thumbnailFile ? `/thumbnails/${thumbnailFile.filename}` : null
      }
    });
  } catch (error) {
    console.error('提交失败:', error);
    res.status(500).json({ error: '提交失败: ' + error.message });
  }
});

// 获取所有作品列表
router.get('/', (req, res) => {
  try {
    const { studentYear, studentName } = req.query;
    const db = getDatabase();
    
    let sql = `
      SELECT id, student_name, student_year, work_name, description, filename, thumbnail_path, created_at
      FROM submissions
    `;
    const params = [];
    const conditions = [];

    if (studentYear) {
      conditions.push('student_year = ?');
      params.push(parseInt(studentYear));
    }

    if (studentName) {
      conditions.push('student_name = ?');
      params.push(studentName);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY created_at DESC';

    db.all(sql, params, (err, rows) => {
      if (err) {
        console.error('查询失败:', err);
        return res.status(500).json({ error: '查询失败' });
      }

      const submissions = rows.map(row => ({
        id: row.id,
        studentName: row.student_name,
        studentYear: row.student_year,
        workName: row.work_name,
        description: row.description,
        filename: row.filename,
        thumbnailPath: row.thumbnail_path ? `/thumbnails/${path.basename(row.thumbnail_path)}` : null,
        createdAt: row.created_at
      }));

      res.json({ success: true, data: submissions });
    });
  } catch (error) {
    console.error('获取列表失败:', error);
    res.status(500).json({ error: '获取列表失败' });
  }
});

// 获取单个作品详情
router.get('/:id', (req, res) => {
  try {
    const db = getDatabase();
    db.get(`
      SELECT * FROM submissions WHERE id = ?
    `, [req.params.id], (err, row) => {
      if (err) {
        console.error('查询失败:', err);
        return res.status(500).json({ error: '查询失败' });
      }

      if (!row) {
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

      res.json({ success: true, data: submission });
    });
  } catch (error) {
    console.error('获取详情失败:', error);
    res.status(500).json({ error: '获取详情失败' });
  }
});

// 删除作品
router.delete('/:id', (req, res) => {
  try {
    const db = getDatabase();
    
    // 先获取作品信息
    db.get(`SELECT * FROM submissions WHERE id = ?`, [req.params.id], async (err, row) => {
      if (err) {
        console.error('查询失败:', err);
        return res.status(500).json({ error: '查询失败' });
      }

      if (!row) {
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
      db.run(`DELETE FROM submissions WHERE id = ?`, [req.params.id], function(delErr) {
        if (delErr) {
          console.error('删除记录失败:', delErr);
          return res.status(500).json({ error: '删除记录失败' });
        }

        res.json({ success: true, message: '删除成功' });
      });
    });
  } catch (error) {
    console.error('删除失败:', error);
    res.status(500).json({ error: '删除失败' });
  }
});

module.exports = router;