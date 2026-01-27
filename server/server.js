// 加载环境变量
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { initializeDatabase, closeDatabase } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 5000;

// 中间件
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/thumbnails', express.static(path.join(__dirname, 'thumbnails')));

// 专门的下载端点 - 强制浏览器下载文件
app.get('/api/download/:filename', (req, res) => {
  const filename = req.params.filename;
  console.log(`下载请求: ${filename}`); // 调试日志
  const filePath = path.join(__dirname, 'uploads', filename);

  // 安全检查：确保文件名不包含路径遍历
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    console.log(`无效的文件名: ${filename}`); // 调试日志
    // 返回HTML错误页面而不是JSON，防止浏览器将其作为文件下载
    res.status(400);
    res.setHeader('Content-Type', 'text/html');
    return res.send('<!DOCTYPE html><html><body><h1>400 Bad Request</h1><p>Invalid filename</p></body></html>');
  }

  // 检查文件是否存在
  if (!fs.existsSync(filePath)) {
    console.log(`文件不存在: ${filePath}`); // 调试日志
    // 返回HTML错误页面而不是JSON，防止浏览器将其作为文件下载
    res.status(404);
    res.setHeader('Content-Type', 'text/html');
    return res.send('<!DOCTYPE html><html><body><h1>404 Not Found</h1><p>File not found</p></body></html>');
  }

  // 获取文件统计信息
  let stats;
  try {
    stats = fs.statSync(filePath);
  } catch (error) {
    console.error('文件统计错误:', error);
    res.status(500);
    res.setHeader('Content-Type', 'text/html');
    return res.send('<!DOCTYPE html><html><body><h1>500 Internal Server Error</h1><p>File stat failed</p></body></html>');
  }

  // 设置响应头以强制下载
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Length', stats.size);

  // 创建文件流并传输
  const fileStream = fs.createReadStream(filePath);
  fileStream.pipe(res);

  fileStream.on('error', (error) => {
    console.error('文件流错误:', error);
    if (!res.headersSent) {
      res.status(500);
      res.setHeader('Content-Type', 'text/html');
      res.send('<!DOCTYPE html><html><body><h1>500 Internal Server Error</h1><p>File transfer failed</p></body></html>');
    }
  });

  fileStream.on('end', () => {
    console.log(`文件下载完成: ${filename} (${stats.size} bytes)`);
  });
});

// 确保必要的目录存在
const ensureDirectories = () => {
  const dirs = ['uploads', 'thumbnails', 'database'];
  dirs.forEach(dir => {
    const dirPath = path.join(__dirname, dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  });
};

ensureDirectories();

// 初始化数据库（异步）
let db;
async function startServer() {
  try {
    db = await initializeDatabase();
    console.log('数据库初始化完成');

    // 路由
    const authRoutes = require('./routes/auth');
    app.use('/api/auth', authRoutes);

    const submissionRoutes = require('./routes/submissions');
    app.use('/api/submissions', submissionRoutes);

    const studentRoutes = require('./routes/students');
    app.use('/api/students', studentRoutes);

    const assignmentRoutes = require('./routes/assignments');
    app.use('/api/assignments', assignmentRoutes);

    const uploadRoutes = require('./routes/upload');
    app.use('/api', uploadRoutes);

    const uploadTypesRoutes = require('./routes/upload-types');
    app.use('/api/upload-types', uploadTypesRoutes);

    // 健康检查
    app.get('/api/health', (req, res) => {
      res.json({ status: 'ok', message: 'Server is running' });
    });

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('服务器启动失败:', error);
    process.exit(1);
  }
}

startServer();

// 优雅关闭处理
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  closeDatabase();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  closeDatabase();
  process.exit(0);
});