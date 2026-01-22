# 3D班级管理系统 - AGENTS.md

## 项目概述

这是一个为小学3D建模课程设计的管理系统，允许学生提交STL格式的3D模型文件，教师可以查看、管理和下载这些作品。系统采用前后端分离架构，前端使用React，后端使用Express.js和SQLite数据库。

### 核心功能
- **学生端**：上传STL文件，填写作品信息，自动生成缩略图
- **教师端**：查看所有学生作品，下载/删除作品，3D模型预览
- **3D预览**：使用Three.js渲染STL模型，支持旋转、缩放、平移

### 技术栈
- **前端**：React 18, React Router, Bootstrap 5, Three.js, Axios
- **后端**：Express.js, SQLite, Multer, Three.js (缩略图生成)
- **文件处理**：STL文件上传、缩略图自动生成

## 项目结构

```
StlManager/
├── client/                 # React前端
│   ├── public/            # 静态资源
│   ├── src/
│   │   ├── components/    # 组件 (如STLThumbnailGenerator)
│   │   ├── pages/         # 页面 (StudentPage, TeacherPage, ViewerPage)
│   │   ├── services/      # API服务
│   │   ├── contexts/      # React上下文 (如AuthContext)
│   │   ├── App.js         # 主应用组件
│   │   └── index.js       # 入口文件
│   └── package.json
├── server/                # Express后端
│   ├── uploads/           # STL文件存储
│   ├── thumbnails/        # 缩略图存储
│   ├── database/          # SQLite数据库文件
│   ├── routes/            # API路由 (submissions, students)
│   ├── models/            # 数据模型 (database.js)
│   ├── utils/             # 工具函数 (缩略图生成)
│   ├── server.js          # 服务器入口
│   └── package.json
└── package.json           # 根package.json
```

## 构建和运行

### 安装依赖
```bash
# 安装所有依赖（根目录、前端、后端）
npm run install:all
```

### 启动开发服务器
```bash
# 同时启动前端和后端
npm run dev

# 或分别启动
npm run server  # 后端服务器运行在端口5000
npm run client  # 前端开发服务器运行在端口3000
```

### 访问应用
- 前端地址: http://localhost:3000
- 后端API: http://localhost:5000

## API接口

### 作品管理
- POST `/api/submissions` - 提交作品 (multipart/form-data)
- GET `/api/submissions` - 获取作品列表
- GET `/api/submissions/:id` - 获取作品详情
- DELETE `/api/submissions/:id` - 删除作品

### 学生管理
- GET `/api/students` - 获取学生列表
- POST `/api/students` - 创建学生
- DELETE `/api/students/:id` - 删除学生

### 文件服务
- GET `/uploads/:filename` - 访问上传的STL文件
- GET `/thumbnails/:filename` - 访问缩略图
- GET `/api/download/:filename` - 下载STL文件

## 数据库设计

### submissions表
- id: INTEGER PRIMARY KEY AUTOINCREMENT
- student_name: TEXT NOT NULL
- student_year: INTEGER NOT NULL
- work_name: TEXT NOT NULL
- description: TEXT
- filename: TEXT NOT NULL
- filepath: TEXT NOT NULL
- thumbnail_path: TEXT
- created_at: DATETIME DEFAULT CURRENT_TIMESTAMP

### students表
- id: INTEGER PRIMARY KEY AUTOINCREMENT
- name: TEXT NOT NULL
- year: INTEGER NOT NULL
- created_at: DATETIME DEFAULT CURRENT_TIMESTAMP

## 开发和部署

### 开发说明
- 前端使用Create React App，支持热重载
- 后端使用nodemon实现热重载
- 首次运行会自动创建SQLite数据库和示例数据
- 文件上传限制为50MB
- 上传STL文件时会自动生成缩略图预览

### 生产部署
```bash
# 构建前端
cd client
npm run build

# 启动后端
cd server
npm start
```

## 注意事项

1. 项目当前使用SQLite数据库，适合小规模用户访问
2. 多用户并发访问时，可能需要考虑使用更强大的数据库（如PostgreSQL、MySQL）
3. 系统包含缩略图自动生成功能，使用Three.js在服务端渲染
4. 上传文件大小限制为50MB
5. 文件路径包含安全检查，防止路径遍历攻击
6. 包含基本的身份验证机制

## 可扩展性建议

1. **数据库扩展**：对于30个并发用户，建议考虑使用PostgreSQL或MySQL
2. **文件存储**：可考虑使用云存储服务（如AWS S3）来存储大文件
3. **缩略图生成**：可考虑使用独立的微服务或队列系统来处理缩略图生成
4. **身份验证**：可增强身份验证机制，添加学生/教师角色管理