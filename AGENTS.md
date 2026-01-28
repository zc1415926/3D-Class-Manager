# 3D班级管理系统 - AGENTS.md

## 项目概述

这是一个为小学3D建模课程设计的管理系统，允许学生提交STL/OBJ格式的3D模型文件，教师可以查看、管理和下载这些作品。系统采用前后端分离架构，前端使用React，后端使用Express.js，支持PostgreSQL数据库，具备完整的JWT认证系统和作业管理功能。

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
- **数据库支持**：
  - 支持PostgreSQL（生产环境）  - 一键切换数据库类型

### 技术栈
- **前端**：React 18, React Router, Bootstrap 5, Babylon.js, Axios, Tabler UI, CKEditor
- **后端**：Express.js, PostgreSQL, Multer, Babylon.js (缩略图生成)
- **安全认证**：JWT (jsonwebtoken), bcryptjs, dotenv
- **文件处理**：STL/OBJ文件上传、缩略图自动生成、ZIP打包导出、多文件动态上传
- **数据库**：PostgreSQL (pg), 连接池管理

## 项目结构

```
3D-Class-Manager-master/
├── client/                 # React前端
│   ├── public/            # 静态资源
│   ├── src/
│   │   ├── components/    # 组件 (STLThumbnailGenerator, AssignmentDeleteModal, UploadRequirementModal, TablerLayout)
│   │   ├── pages/         # 页面 (StudentPage, TeacherPage, ViewerPage, AssignmentManagementPage, UploadTypesPage, AccessDeniedPage, AssignmentEditPage, AssignmentNewPage, AssignmentSubmissionsPage, AssignmentViewPage, HomePage, LoginPage, StudentManagementPage, StudentViewPage, TeacherDashboard)
│   │   ├── contexts/      # React上下文 (AuthContext - JWT认证)
│   │   ├── utils/         # 工具函数 (UploadAdapter等)
│   │   ├── App.js         # 主应用组件
│   │   └── index.js       # 入口文件
│   ├── ckeditor-config.json # CKEditor配置
│   └── package.json
├── server/                # Express后端
│   ├── uploads/           # 文件存储 (STL/OBJ)
│   │   └── images/        # 图片文件存储
│   ├── thumbnails/        # 缩略图存储
│   ├── config/            # 配置文件
│   │   └── database.js    # 数据库配置（PostgreSQL）
│   ├── middleware/        # 中间件 (auth.js - JWT认证)
│   ├── routes/            # API路由
│   │   ├── auth.js        # 认证路由（登录、修改密码、用户管理）
│   │   ├── submissions.js # 作品管理
│   │   ├── students.js    # 学生管理
│   │   ├── assignments.js # 作业管理
│   │   ├── upload-types.js # 上传类型管理
│   │   └── upload.js      # 文件上传
│   ├── scripts/           # 脚本目录
│   │   ├── migrate-existing-data.js     # 迁移现有数据
│   │   ├── migrate-missing-data.js      # 迁移缺失数据
│   │   ├── migrate-requirements.js      # 迁移上传要求
│   │   ├── migrate-to-postgresql.js     # 迁移到PostgreSQL
│   │   ├── start-dev.js                 # 开发启动脚本
│   │   └── test-postgresql.js           # PostgreSQL测试脚本
│   ├── models/            # 数据模型 (database.js)
│   ├── .env               # 环境变量配置
│   ├── server.js          # 服务器入口
│   ├── POSTGRESQL_GUIDE.md # PostgreSQL迁移指南
│   ├── STARTUP_GUIDE.md   # 服务器启动指南
│   └── package.json
├── tabler/                # Tabler UI框架（git子模块）
├── .github/               # GitHub工作流
│   └── workflows/
│       ├── issue-killer.yml
│       ├── issue-triage.yaml
│       └── pr-review.yml
├── AGENTS.md              # 项目文档（本文件）
├── DEVELOPMENT_EXPERIENCE.md # 开发经验总结
├── SECURITY_IMPROVEMENTS.md # 安全性改进文档
├── README.md              # 项目README
├── package.json           # 根package.json
└── start.sh               # 启动脚本
```

## 构建和运行

### 安装依赖
```bash
# 安装所有依赖（根目录、前端、后端）
npm run install:all
```

### 数据库配置
系统支持PostgreSQL数据库，通过环境变量配置：

1. **编辑环境变量文件** (`server/.env`)：
```env
# 数据库类型配置
DB_TYPE=postgresql

# PostgreSQL配置
PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=stl_manager
PG_USER=postgres
PG_PASSWORD=your-password
```

2. **PostgreSQL准备工作**：
```bash
# 创建数据库
sudo -u postgres psql -c "CREATE DATABASE stl_manager;"


cd server
npm run migrate:pg
```

### 启动开发服务器
```bash
# 同时启动前端和后端（推荐）
npm run dev

# 或分别启动
npm run server  # 后端服务器运行在端口5000（带热重载）
npm run client  # 前端开发服务器运行在端口3000

# 生产环境启动
cd server && npm start
```

### 数据库管理命令
```bash
# 迁移数据到PostgreSQL
cd server && npm run migrate:pg

# 测试PostgreSQL连接
cd server && npm run test:pg

# 查看服务器日志
tail -f server/server.log
```

### 快速启动脚本
```bash
# 使用启动脚本（包含自动配置）
./start.sh
```

### 访问应用
- 前端地址: http://localhost:3000
- 后端API: http://localhost:5000
- 健康检查: http://localhost:5000/api/health

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

系统支持PostgreSQL数据库。以下是数据库表结构设计：

### 数据库类型映射
| PostgreSQL 数据类型 | 说明 |
|-------------------|------|
| SERIAL PRIMARY KEY | 自增主键 |
| VARCHAR(n) 或 TEXT | 文本类型 |
| TIMESTAMP | 日期时间 |
| INTEGER | 整数 |
| BYTEA | 二进制数据 |
| FOREIGN KEY | 外键约束 |
| ON DELETE CASCADE | 级联删除 |

### 默认数据库配置
- **PostgreSQL**：通过环境变量配置（生产环境推荐）

### users表 (用户认证)
- id: SERIAL PRIMARY KEY
- username: VARCHAR(50) NOT NULL UNIQUE
- password: VARCHAR(255) NOT NULL (bcrypt加密)
- role: VARCHAR(20) DEFAULT 'teacher' (teacher/admin)
- created_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- updated_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP

### submissions表 (作品提交)
- id: SERIAL PRIMARY KEY
- student_name: VARCHAR(100) NOT NULL
- student_year: INTEGER NOT NULL
- work_name: VARCHAR(200) NOT NULL
- description: TEXT
- filename: VARCHAR(255) NOT NULL
- filepath: VARCHAR(500) NOT NULL
- thumbnail_path: VARCHAR(500)
- assignment_id: INTEGER (外键)
- created_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP

### submission_files表 (多文件支持)
- id: SERIAL PRIMARY KEY
- submission_id: INTEGER NOT NULL (外键)
- requirement_id: INTEGER (外键)
- filename: VARCHAR(255) NOT NULL
- filepath: VARCHAR(500) NOT NULL
- thumbnail_path: VARCHAR(500)
- created_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- 外键约束: FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE

### students表 (学生信息)
- id: SERIAL PRIMARY KEY
- name: VARCHAR(100) NOT NULL
- year: INTEGER NOT NULL
- created_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP

### assignments表 (作业管理)
- id: SERIAL PRIMARY KEY
- year: INTEGER NOT NULL
- name: VARCHAR(200) NOT NULL
- upload_types: TEXT NOT NULL (JSON数组)
- description: TEXT
- deadline: TIMESTAMP
- status: VARCHAR(20) DEFAULT 'active'
- created_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- updated_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP

### assignment_upload_requirements表 (作业上传要求)
- id: SERIAL PRIMARY KEY
- assignment_id: INTEGER NOT NULL (外键)
- name: VARCHAR(200) NOT NULL
- upload_type: VARCHAR(50) NOT NULL
- is_required: BOOLEAN DEFAULT TRUE
- is_published: BOOLEAN DEFAULT TRUE
- sort_order: INTEGER DEFAULT 0
- created_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- 外键约束: FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE

### upload_types表 (上传类型管理)
- id: SERIAL PRIMARY KEY
- name: VARCHAR(100) NOT NULL UNIQUE
- code: VARCHAR(50) NOT NULL UNIQUE
- description: TEXT
- icon: VARCHAR(50)
- extensions: TEXT (逗号分隔)
- is_active: BOOLEAN DEFAULT TRUE
- sort_order: INTEGER DEFAULT 0
- created_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP

## 开发和部署

### 开发说明
- **前端**：使用Create React App，支持热重载、ESLint代码检查
- **后端**：使用nodemon实现热重载，自动重启服务
- **数据库**：
  - 支持PostgreSQL（生产环境推荐）
  - 首次运行自动创建数据库和示例数据
- **文件上传**：
  - 支持STL/OBJ/图片/文档/视频等多种格式
  - 文件大小限制：50MB
  - 自动生成STL/OBJ文件缩略图预览
  - 支持动态多文件上传（根据作业要求）
- **认证系统**：JWT令牌认证，7天有效期
- **UI框架**：集成Tabler UI，响应式设计
- **富文本编辑器**：集成CKEditor，支持代码块、媒体嵌入等功能

### 开发工作流
1. **环境配置**：
   ```bash
   # 克隆项目
   git clone https://github.com/zc1415926/3D-Class-Manager.git
   cd 3D-Class-Manager
   
   # 安装依赖
   npm run install:all
   
   # 配置数据库（编辑 server/.env）
   ```

2. **启动开发**：
   ```bash
   # 同时启动前后端
   npm run dev
   
   # 或分别启动
   npm run server  # 后端：http://localhost:5000
   npm run client  # 前端：http://localhost:3000
   ```

3. **数据库迁移**（可选）：
   ```bash
   # 迁移到PostgreSQL
   cd server && npm run migrate:pg
   
   # 测试PostgreSQL连接
   cd server && npm run test:pg
   ```

### 生产部署
1. **前端构建**：
   ```bash
   cd client
   npm run build  # 生成 build/ 目录
   ```

2. **后端部署**：
   ```bash
   cd server
   # 配置生产环境变量
   cp .env.example .env
   # 编辑 .env 文件，设置生产环境配置
   
   # 启动服务
   npm start  # 或使用PM2：pm2 start server.js --name stl-manager
   ```

3. **数据库部署**：
   - **推荐使用PostgreSQL**（支持更高并发）
   - 配置连接池（默认20个连接）
   - 定期备份数据库

4. **反向代理配置**（Nginx示例）：
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
       
       location /api {
           proxy_pass http://localhost:5000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
       
       location /uploads {
           alias /path/to/server/uploads;
       }
       
       location /thumbnails {
           alias /path/to/server/thumbnails;
       }
   }
   ```

### 监控和维护
- **日志管理**：查看 `server/server.log` 和 `client/client.log`
- **健康检查**：访问 `http://localhost:5000/api/health`
- **性能监控**：使用PostgreSQL的 `pg_stat_activity` 监控连接
- **备份策略**：定期备份数据库和上传文件

## 注意事项

### 数据库相关
1. **PostgreSQL支持**：系统支持PostgreSQL数据库，通过环境变量 `DB_TYPE` 配置
2. **并发性能**：
   - PostgreSQL：适合100+并发用户，生产环境推荐
3. **连接池管理**：PostgreSQL使用连接池（默认20连接），避免连接泄漏

### 文件处理
5. **文件类型支持**：支持STL、OBJ、图片（JPG/PNG/GIF）、文档（PDF/DOC/TXT）、视频（MP4/AVI/MOV）等多种格式
6. **文件大小限制**：单个文件最大50MB，可通过Multer配置调整
7. **缩略图生成**：自动为STL/OBJ文件生成预览缩略图，使用Babylon.js渲染
8. **动态多文件上传**：支持根据作业要求上传多个文件，文件字段动态生成

### 安全相关
9. **认证机制**：JWT令牌认证，令牌7天有效期，密码使用bcrypt加密存储（盐值10）
10. **路由保护**：所有管理API端点都需要JWT认证，支持角色权限检查
11. **文件安全**：文件路径包含安全检查，防止路径遍历攻击
12. **SQL注入防护**：使用参数化查询，防止SQL注入攻击
13. **CORS配置**：已限制允许的来源，生产环境需配置正确的域名

### 部署和配置
14. **环境变量**：敏感信息存储在 `.env` 文件中，生产环境必须修改默认密钥和密码
15. **默认账户**：系统自动创建默认管理员用户（用户名：`zc1415926`，密码：`zaq12wsx`），**生产环境必须修改**
16. **端口配置**：前端默认3000端口，后端默认5000端口，可通过环境变量修改
17. **日志管理**：服务器日志输出到 `server/server.log`，客户端日志输出到 `client/client.log`

### 开发和维护
18. **热重载**：前端使用Create React App热重载，后端使用nodemon热重载
19. **代码质量**：使用ESLint进行代码检查，保持代码一致性
20. **文档完整性**：参考 `DEVELOPMENT_EXPERIENCE.md` 获取开发经验，`POSTGRESQL_GUIDE.md` 获取数据库指南

## 可扩展性建议

### 已实现的功能
1. **PostgreSQL支持**：系统已支持PostgreSQL数据库，适合生产环境部署
2. **动态多文件上传**：已实现根据作业要求动态上传多个文件
3. **完整的认证系统**：JWT认证、角色管理、密码加密已实现

### 未来扩展建议
5. **云存储集成**：集成AWS S3、阿里云OSS等云存储服务，减轻服务器存储压力
6. **CDN加速**：为静态文件和缩略图配置CDN，提升访问速度
7. **微服务架构**：将缩略图生成、文件处理等拆分为独立微服务
8. **实时通知**：添加WebSocket支持，实现作品提交、批改等实时通知
9. **移动端适配**：开发移动端应用或PWA，方便随时查看和管理
10. **数据分析**：集成数据分析功能，统计作品提交趋势、学生活跃度等
11. **批量操作**：增强批量导入/导出、批量评分、批量删除等功能
12. **API文档**：使用Swagger/OpenAPI自动生成API文档
13. **国际化**：支持多语言界面，适应不同地区用户
14. **第三方登录**：集成微信、QQ、GitHub等第三方登录方式
15. **自动化测试**：完善单元测试、集成测试、端到端测试
16. **容器化部署**：提供Docker和Kubernetes部署方案
17. **监控告警**：集成Prometheus、Grafana等监控工具
18. **备份恢复**：实现自动化备份和快速恢复机制
19. **权限细化**：细化角色权限，支持班级管理员、学科教师等不同角色
20. **插件系统**：设计插件架构，支持功能模块化扩展

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