# 3D班级管理系统 - AGENTS.md

## 项目概述

这是一个为小学3D建模课程设计的管理系统，允许学生提交STL/OBJ格式的3D模型文件，教师可以查看、管理和下载这些作品。系统采用前后端分离架构，前端使用React，后端使用Express.js和SQLite数据库，具备完整的JWT认证系统和作业管理功能。

### 核心功能
- **学生端**：
  - 上传STL/OBJ文件，填写作品信息
  - 自动生成缩略图
  - 根据作业要求提交多个文件
  - 文件扩展名验证
- **教师端**：
  - 查看所有学生作品
  - 下载/删除作品
  - 3D模型预览（Babylon.js）
  - 作业管理（创建、编辑、删除）
  - 上传类型管理
  - 学生管理
  - 作品批量导出（ZIP）
- **认证系统**：
  - JWT令牌认证
  - 密码加密存储
  - 用户管理
  - 修改密码功能

### 技术栈
- **前端**：React 18, React Router, Bootstrap 5, Babylon.js, Axios, Tabler UI
- **后端**：Express.js, SQLite, Multer, Babylon.js (缩略图生成)
- **安全认证**：JWT (jsonwebtoken), bcryptjs, dotenv
- **文件处理**：STL/OBJ文件上传、缩略图自动生成、ZIP打包导出

## 项目结构

```
StlManager/
├── client/                 # React前端
│   ├── public/            # 静态资源
│   ├── src/
│   │   ├── components/    # 组件 (STLThumbnailGenerator, AssignmentDeleteModal, UploadRequirementModal)
│   │   ├── pages/         # 页面 (StudentPage, TeacherPage, ViewerPage, AssignmentManagementPage, UploadTypesPage)
│   │   ├── contexts/      # React上下文 (AuthContext - JWT认证)
│   │   ├── utils/         # 工具函数
│   │   ├── App.js         # 主应用组件
│   │   └── index.js       # 入口文件
│   └── package.json
├── server/                # Express后端
│   ├── uploads/           # 文件存储 (STL/OBJ)
│   ├── uploads/images/    # 图片文件存储
│   ├── thumbnails/        # 缩略图存储
│   ├── database/          # SQLite数据库文件
│   ├── middleware/        # 中间件 (auth.js - JWT认证)
│   ├── routes/            # API路由
│   │   ├── auth.js        # 认证路由 (登录、修改密码、用户管理)
│   │   ├── submissions.js # 作品管理
│   │   ├── students.js    # 学生管理
│   │   ├── assignments.js # 作业管理
│   │   ├── upload-types.js # 上传类型管理
│   │   └── upload.js      # 文件上传
│   ├── models/            # 数据模型 (database.js)
│   ├── .env               # 环境变量配置
│   ├── server.js          # 服务器入口
│   └── package.json
├── SECURITY_IMPROVEMENTS.md # 安全性改进文档
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

### 认证管理
- POST `/api/auth/login` - 用户登录，返回JWT令牌
- GET `/api/auth/me` - 获取当前用户信息 (需要认证)
- POST `/api/auth/change-password` - 修改密码 (需要认证)
- POST `/api/auth/users` - 创建用户 (需要管理员权限)
- GET `/api/auth/users` - 获取用户列表 (需要管理员权限)
- DELETE `/api/auth/users/:id` - 删除用户 (需要管理员权限)

### 作品管理
- POST `/api/submissions` - 提交作品 (multipart/form-data，支持多文件)
- GET `/api/submissions` - 获取作品列表
- GET `/api/submissions/:id` - 获取作品详情
- DELETE `/api/submissions/:id` - 删除作品 (需要认证)

### 学生管理
- GET `/api/students` - 获取学生列表
- POST `/api/students` - 创建学生 (需要认证)
- PUT `/api/students/:id` - 更新学生信息 (需要认证)
- DELETE `/api/students/:id` - 删除学生 (需要认证)

### 作业管理
- GET `/api/assignments` - 获取作业列表
- GET `/api/assignments/:id` - 获取作业详情
- POST `/api/assignments` - 创建作业 (需要认证)
- PUT `/api/assignments/:id` - 更新作业 (需要认证)
- DELETE `/api/assignments/:id` - 删除作业 (需要认证)
- DELETE `/api/assignments/:id/cascade` - 级联删除作业及其所有作品 (需要认证)
- GET `/api/assignments/:id/submissions` - 获取作业的所有提交
- GET `/api/assignments/:id/upload-requirements` - 获取作业的上传要求
- POST `/api/assignments/:id/upload-requirements` - 创建上传要求 (需要认证)
- PUT `/api/assignments/:id/upload-requirements/:requirementId` - 更新上传要求 (需要认证)
- DELETE `/api/assignments/:id/upload-requirements/:requirementId` - 删除上传要求 (需要认证)
- PUT `/api/assignments/:id/upload-requirements/reorder` - 批量更新排序 (需要认证)
- GET `/api/assignments/:id/export` - 打包导出作业的所有作品 (需要认证)

### 上传类型管理
- GET `/api/upload-types` - 获取上传类型列表
- GET `/api/upload-types/:id` - 获取单个上传类型
- POST `/api/upload-types` - 创建上传类型 (需要认证)
- PUT `/api/upload-types/:id` - 更新上传类型 (需要认证)
- DELETE `/api/upload-types/:id` - 删除上传类型 (软删除，需要认证)
- PUT `/api/upload-types/batch/sort` - 批量更新排序 (需要认证)

### 文件服务
- GET `/uploads/:filename` - 访问上传的文件
- GET `/thumbnails/:filename` - 访问缩略图
- GET `/api/download/:filename` - 下载文件

### 健康检查
- GET `/api/health` - 服务器健康状态

## 数据库设计

### users表 (用户认证)
- id: INTEGER PRIMARY KEY AUTOINCREMENT
- username: TEXT NOT NULL UNIQUE
- password: TEXT NOT NULL (bcrypt加密)
- role: TEXT DEFAULT 'teacher' (teacher/admin)
- created_at: DATETIME DEFAULT CURRENT_TIMESTAMP
- updated_at: DATETIME DEFAULT CURRENT_TIMESTAMP

### submissions表 (作品提交)
- id: INTEGER PRIMARY KEY AUTOINCREMENT
- student_name: TEXT NOT NULL
- student_year: INTEGER NOT NULL
- work_name: TEXT NOT NULL
- description: TEXT
- filename: TEXT NOT NULL
- filepath: TEXT NOT NULL
- thumbnail_path: TEXT
- assignment_id: INTEGER (外键)
- created_at: DATETIME DEFAULT CURRENT_TIMESTAMP

### submission_files表 (多文件支持)
- id: INTEGER PRIMARY KEY AUTOINCREMENT
- submission_id: INTEGER NOT NULL (外键)
- requirement_id: INTEGER (外键)
- filename: TEXT NOT NULL
- filepath: TEXT NOT NULL
- thumbnail_path: TEXT
- created_at: DATETIME DEFAULT CURRENT_TIMESTAMP

### students表 (学生信息)
- id: INTEGER PRIMARY KEY AUTOINCREMENT
- name: TEXT NOT NULL
- year: INTEGER NOT NULL
- created_at: DATETIME DEFAULT CURRENT_TIMESTAMP

### assignments表 (作业管理)
- id: INTEGER PRIMARY KEY AUTOINCREMENT
- year: INTEGER NOT NULL
- name: TEXT NOT NULL
- upload_types: TEXT NOT NULL (JSON数组)
- description: TEXT
- deadline: DATETIME
- status: TEXT DEFAULT 'active'
- created_at: DATETIME DEFAULT CURRENT_TIMESTAMP
- updated_at: DATETIME DEFAULT CURRENT_TIMESTAMP

### assignment_upload_requirements表 (作业上传要求)
- id: INTEGER PRIMARY KEY AUTOINCREMENT
- assignment_id: INTEGER NOT NULL (外键)
- name: TEXT NOT NULL
- upload_type: TEXT NOT NULL
- is_required: INTEGER DEFAULT 1
- is_published: INTEGER DEFAULT 1
- sort_order: INTEGER DEFAULT 0
- created_at: DATETIME DEFAULT CURRENT_TIMESTAMP

### upload_types表 (上传类型管理)
- id: INTEGER PRIMARY KEY AUTOINCREMENT
- name: TEXT NOT NULL UNIQUE
- code: TEXT NOT NULL UNIQUE
- description: TEXT
- icon: TEXT
- extensions: TEXT (逗号分隔)
- is_active: INTEGER DEFAULT 1
- sort_order: INTEGER DEFAULT 0
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

1. **数据库选择**：项目当前使用SQLite数据库，适合小规模用户访问（<20并发用户）
2. **并发处理**：多用户并发访问时，可能需要考虑使用更强大的数据库（如PostgreSQL、MySQL）
3. **3D渲染**：系统包含缩略图自动生成功能，使用Babylon.js在服务端渲染
4. **文件限制**：上传文件大小限制为50MB
5. **安全防护**：文件路径包含安全检查，防止路径遍历攻击
6. **认证机制**：使用JWT令牌认证，密码使用bcrypt加密存储
7. **环境变量**：敏感信息存储在.env文件中，生产环境必须修改默认密钥
8. **CORS配置**：已限制允许的来源，生产环境需配置正确的域名
9. **路由保护**：所有管理API端点都需要认证
10. **默认账户**：系统自动创建默认管理员用户（用户名：zc1415926，密码：zaq12wsx），生产环境必须修改

## 可扩展性建议

1. **数据库扩展**：对于30个并发用户，建议考虑使用PostgreSQL或MySQL
2. **文件存储**：可考虑使用云存储服务（如AWS S3）来存储大文件
3. **缩略图生成**：可考虑使用独立的微服务或队列系统来处理缩略图生成
4. **身份验证**：可增强身份验证机制，添加学生/教师角色管理

## 安全性改进

系统已完成全面的安全性改进，主要包括：

### 认证系统
- **JWT令牌认证**：使用jsonwebtoken生成和验证令牌
- **密码加密**：使用bcryptjs加密存储密码
- **环境变量管理**：使用dotenv管理敏感信息
- **认证中间件**：为需要认证的路由添加中间件保护

### 路由保护
- 所有管理API端点都需要JWT认证
- 支持可选认证和角色权限检查
- 提供清晰的错误信息

### 用户管理
- 支持创建、查看、删除用户
- 支持修改密码功能
- 支持角色管理（teacher/admin）

### 安全最佳实践
- 密码使用bcrypt加密，盐值设为10
- JWT令牌7天过期
- CORS配置限制允许的来源
- 参数化查询防止SQL注入
- 文件上传安全检查

### 详细文档
完整的安全性改进实施文档请参考：`SECURITY_IMPROVEMENTS.md`

### 默认账户
- 用户名：`zc1415926`
- 密码：`zaq12wsx`
- ⚠️ 生产环境必须修改默认密码和JWT_SECRET