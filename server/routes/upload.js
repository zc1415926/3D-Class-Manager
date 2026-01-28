const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// 获取三级文件夹路径的辅助函数
function getUploadPath(assignmentId, studentYear, isThumbnail = false) {
  // 如果没有assignmentId，使用默认路径
  if (!assignmentId) {
    return path.join(__dirname, '../uploads/images');
  }
  
  // 根据assignmentId、studentYear创建三级文件夹路径
  return path.join(__dirname, '../uploads', 'images', studentYear.toString(), assignmentId.toString());
}

// 配置文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const assignmentId = req.body.assignmentId || 'general';
    const studentYear = req.body.studentYear || new Date().getFullYear();
    const uploadDir = getUploadPath(assignmentId, studentYear);
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const assignmentId = req.body.assignmentId || 'general';
    const studentYear = req.body.studentYear || new Date().getFullYear();
    
    cb(null, `${studentYear}_${assignmentId}_${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== '.png' && ext !== '.jpg' && ext !== '.jpeg' && ext !== '.gif' && ext !== '.webp') {
      return cb(new Error('只允许上传图片文件'));
    }
    cb(null, true);
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

// 图片上传端点
router.post('/upload-image', upload.single('upload'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: { message: '没有上传文件' } });
    }

    // 返回图片 URL - CKEditor 5 期望的格式
    const imageUrl = `/uploads/images/${req.file.filename}`;
    res.json({
      url: imageUrl,
      default: imageUrl
    });
  } catch (error) {
    console.error('图片上传错误:', error);
    res.status(500).json({ error: { message: '图片上传失败' } });
  }
});

// 配置作业附件上传（支持各种文件类型）
const assignmentStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const assignmentId = req.body.assignmentId || 'general';
    const studentYear = req.body.studentYear || new Date().getFullYear();
    const uploadDir = getUploadPath(assignmentId, studentYear);
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const assignmentId = req.body.assignmentId || 'general';
    const studentYear = req.body.studentYear || new Date().getFullYear();
    
    cb(null, `${studentYear}_${assignmentId}_${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const assignmentUpload = multer({
  storage: assignmentStorage,
  fileFilter: function (req, file, cb) {
    // 允许所有文件类型
    cb(null, true);
  },
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  }
});

// 作业附件上传端点
router.post('/upload-assignment-attachment', assignmentUpload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: '没有上传文件' });
    }

    res.json({
      success: true,
      data: {
        filename: req.file.filename,
        filepath: `/uploads/images/${req.file.filename}`,
        originalname: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    });
  } catch (error) {
    console.error('附件上传错误:', error);
    res.status(500).json({ success: false, error: '附件上传失败' });
  }
});

module.exports = router;