# 小学3D建模课程管理系统

一个用于管理小学生3D建模作品的Web应用系统。

## 技术栈

### 前端
- React 18
- React Router
- Bootstrap 5
- Three.js (3D模型渲染)
- Axios

### 后端
- Express.js
- PostgreSQL
- Multer (文件上传)
- Puppeteer (缩略图渲染)

## 功能特性

### 学生页面
- 上传STL格式的3D模型文件
- 填写学生姓名、作品名称和作品说明
- 自动生成作品缩略图

### 教师页面
- 查看所有提交的作品列表
- 查看作品缩略图和详细信息
- 删除作品

### 3D查看器
- 实时交互式预览STL模型
- 支持旋转、平移、缩放操作
- 下载STL文件

## 安装步骤

### 1. 安装依赖

```bash
# 安装所有依赖（根目录、前端、后端）
npm run install:all
```

或者分别安装：

```bash
# 安装根目录依赖
npm install

# 安装前端依赖
cd client
npm install

# 安装后端依赖
cd ../server
npm install
```

### 2. 启动开发服务器

```bash
# 同时启动前端和后端
npm run dev
```

或者分别启动：

```bash
# 启动后端服务器（端口5000）
npm run server

# 启动前端开发服务器（端口3000）
npm run client
```

### 3. 访问应用

- 前端地址: http://localhost:3000
- 后端API: http://localhost:5000

## 项目结构

```
StlManager/
├── client/                 # React前端
│   ├── public/            # 静态资源
│   ├── src/
│   │   ├── components/    # 组件
│   │   ├── pages/         # 页面
│   │   │   ├── StudentPage.js    # 学生提交页面
│   │   │   ├── TeacherPage.js    # 教师管理页面
│   │   │   └── ViewerPage.js     # 3D查看器页面
│   │   ├── services/      # API服务
│   │   ├── App.js         # 主应用组件
│   │   └── index.js       # 入口文件
│   └── package.json
├── server/                # Express后端
│   ├── uploads/           # STL文件存储
│   ├── thumbnails/        # 缩略图存储
│   ├── routes/            # API路由
│   │   └── submissions.js # 作品相关路由
│   ├── models/            # 数据模型
│   │   └── database.js    # 数据库配置
│   ├── utils/             # 工具函数
│   │   └── thumbnailGenerator.js  # 缩略图生成
│   ├── server.js          # 服务器入口
│   └── package.json
└── package.json           # 根package.json
```

## API接口

### 提交作品
- POST `/api/submissions`
- Content-Type: `multipart/form-data`
- 参数:
  - `stlFile`: STL文件
  - `studentName`: 学生姓名
  - `workName`: 作品名称
  - `description`: 作品说明（可选）

### 获取作品列表
- GET `/api/submissions`

### 获取作品详情
- GET `/api/submissions/:id`

### 删除作品
- DELETE `/api/submissions/:id`

## 注意事项

1. 首次运行会自动连接PostgreSQL数据库并创建表结构
2. 上传的STL文件会保存在 `server/uploads/` 目录
3. 生成的缩略图会保存在 `server/thumbnails/` 目录
4. 文件上传限制为50MB
5. 缩略图生成可能需要一些时间，请耐心等待

## 开发说明

### 前端开发
- React开发服务器运行在端口3000
- 支持热重载
- 使用Bootstrap进行样式设计

### 后端开发
- Express服务器运行在端口5000
- 使用nodemon实现热重载
- PostgreSQL数据库自动初始化

## 生产部署

### 构建前端
```bash
cd client
npm run build
```

### 启动后端
```bash
cd server
npm start
```

## 许可证

MIT