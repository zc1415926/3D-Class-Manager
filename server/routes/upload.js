const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// 配置文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/images');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
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

module.exports = router;