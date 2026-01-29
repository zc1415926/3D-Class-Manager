const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// 获取三级文件夹路径的辅助函数
function getUploadPath(assignmentId, studentYear, isThumbnail = false, isArticle = false) {
  // 如果没有assignmentId，使用临时路径
  if (!assignmentId) {
    const basePath = path.join(__dirname, '../uploads', studentYear.toString() || new Date().getFullYear().toString(), 'temp');
    return isArticle ? path.join(basePath, 'article') : basePath;
  }
  
  // 根据assignmentId、studentYear创建路径
  // 如果是article上传：uploads/年份/assignmentId/article/
  // 否则：uploads/年份/assignmentId/
  const basePath = path.join(__dirname, '../uploads', studentYear.toString() || new Date().getFullYear().toString(), assignmentId.toString());
  return isArticle ? path.join(basePath, 'article') : basePath;
}

// 图片上传端点 - 使用fields处理文件和其他字段
router.post('/upload-image', (req, res) => {
  // 使用配置好的multer处理，但先处理所有字段
  const upload = multer({
    storage: multer.diskStorage({
      destination: function (req, file, cb) {
        // 在这里需要获取assignmentId和studentYear，但它们可能还未解析
        // 我们将使用一个临时目录，然后在中间件中设置这些值
        cb(null, path.join(__dirname, '../uploads/temp'));
      },
      filename: function (req, file, cb) {
        // 我们将在后续处理中重命名文件
        cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
      }
    }),
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

  // 使用.fields()方法处理upload字段及其他字段
  upload.fields([{ name: 'upload', maxCount: 1 }])(req, res, async (err) => {
    if (err) {
      return res.status(500).json({ error: { message: err.message } });
    }

    if (!req.files || !req.files.upload || req.files.upload.length === 0) {
      return res.status(400).json({ error: { message: '没有上传文件' } });
    }

    const file = req.files.upload[0];
    const assignmentId = req.body.assignmentId || 'temp';
    const studentYear = req.body.studentYear || new Date().getFullYear();

    // 现在移动文件到正确位置（CKEditor上传的文件存放到article文件夹）
    const uploadDir = getUploadPath(assignmentId, studentYear, false, true);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const newFilename = `${studentYear}_${assignmentId}_${uniqueSuffix}${path.extname(file.originalname)}`;
    const newFilePath = path.join(uploadDir, newFilename);

    try {
      // 移动文件到新位置
      await fs.promises.rename(file.path, newFilePath);

      // 返回图片 URL - CKEditor 5 期望的格式（包含article子目录）
      const imageUrl = assignmentId === 'temp' 
        ? `/uploads/${studentYear}/temp/article/${newFilename}`
        : `/uploads/${studentYear}/${assignmentId}/article/${newFilename}`;
      res.json({
        url: imageUrl,
        default: imageUrl
      });
    } catch (moveError) {
      console.error('移动文件错误:', moveError);
      res.status(500).json({ error: { message: '移动文件失败' } });
    }
  });
});

// 作业附件上传端点 - 使用fields处理文件和其他字段
router.post('/upload-assignment-attachment', (req, res) => {
  const upload = multer({
    storage: multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../uploads/temp'));
      },
      filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
      }
    }),
    fileFilter: function (req, file, cb) {
      // 允许所有文件类型
      cb(null, true);
    },
    limits: {
      fileSize: 50 * 1024 * 1024 // 50MB
    }
  });

  upload.fields([{ name: 'file', maxCount: 1 }])(req, res, async (err) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }

    if (!req.files || !req.files.file || req.files.file.length === 0) {
      return res.status(400).json({ success: false, error: '没有上传文件' });
    }

    const file = req.files.file[0];
    const assignmentId = req.body.assignmentId || 'temp';
    const studentYear = req.body.studentYear || new Date().getFullYear();

    // 移动文件到正确位置（作业附件也存放到article文件夹）
    const uploadDir = getUploadPath(assignmentId, studentYear, false, true);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const newFilename = `${studentYear}_${assignmentId}_${uniqueSuffix}${path.extname(file.originalname)}`;
    const newFilePath = path.join(uploadDir, newFilename);

    try {
      // 移动文件到新位置
      await fs.promises.rename(file.path, newFilePath);

      // 返回文件路径（包含article子目录）
      const fileUrl = assignmentId === 'temp' 
        ? `/uploads/${studentYear}/temp/article/${newFilename}`
        : `/uploads/${studentYear}/${assignmentId}/article/${newFilename}`;
      
      res.json({
        success: true,
        data: {
          filename: newFilename,
          filepath: fileUrl,
          originalname: file.originalname,
          size: file.size,
          mimetype: file.mimetype
        }
      });
    } catch (moveError) {
      console.error('移动文件错误:', moveError);
      res.status(500).json({ success: false, error: '移动文件失败' });
    }
  });
});

module.exports = router;