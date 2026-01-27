# 服务器启动指南

## 快速启动

### 使用默认数据库（SQLite）
```bash
cd server
npm run dev
```

### 使用PostgreSQL数据库
```bash
cd server
npm run dev
```

## 启动脚本说明

### npm run dev
开发环境启动脚本，会自动：
- ✅ 检查并启动PostgreSQL服务（如果使用PostgreSQL）
- ✅ 测试数据库连接
- ✅ 启动Express服务器（带热重载）
- ✅ 显示服务器状态信息

### npm start
生产环境启动脚本（手动启动服务）：
```bash
cd server
npm start
```

## 数据库切换

### 1. 编辑 .env 文件
```env
# 使用SQLite（默认）
DB_TYPE=sqlite

# 或使用PostgreSQL
DB_TYPE=postgresql
PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=stl_manager
PG_USER=postgres
PG_PASSWORD=your-password
```

### 2. 重启服务器
```bash
npm run dev
```

## PostgreSQL 自动管理

启动脚本会自动：
1. 检测PostgreSQL服务状态
2. 如果服务未运行，自动启动
3. 等待服务完全启动
4. 测试数据库连接
5. 启动应用服务器

## 常见问题

### 1. 端口占用
```
Error: listen EADDRINUSE: address already in use :::5000
```
**解决**：启动脚本会自动停止占用端口的进程

### 2. PostgreSQL未启动
```
❌ 启动PostgreSQL失败
```
**解决**：
```bash
# Linux
sudo systemctl start postgresql

# macOS
brew services start postgresql@16

# Windows
net start postgresql-x64-16
```

### 3. 数据库连接失败
**解决**：运行测试脚本检查连接
```bash
npm run test:pg
```

## 开发工具

### 迁移数据到PostgreSQL
```bash
npm run migrate:pg
```

### 测试PostgreSQL连接
```bash
npm run test:pg
```

### 查看日志
```bash
tail -f server/server.log
```