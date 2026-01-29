# 服务器启动说明

## 重要提示
当需要启动服务器时，请务必先阅读此说明，按照以下步骤操作以确保系统正常运行。

## 启动步骤

### 方法1：使用重启脚本（推荐）
```bash
npm run restart-servers
```

或直接运行脚本：
```bash
./restart-servers.sh
```

### 方法2：手动终止进程后启动
如果上述命令失败，请手动执行以下步骤：

1. 终止可能存在的进程：
   ```bash
   # 终止占用5000端口的进程（后端服务器）
   lsof -ti:5000 | xargs kill -9
   
   # 终止占用3000端口的进程（前端服务器）
   lsof -ti:3000 | xargs kill -9
   ```

2. 启动完整系统：
   ```bash
   npm run dev
   ```

## 常见问题解决

### 问题1：地址已被使用 (EADDRINUSE)
- 症状：`Error: listen EADDRINUSE: address already in use :::5000`
- 解决方案：使用上述重启脚本，它会自动清理占用的端口

### 问题2：端口3000已被占用
- 症状：`Something is already running on port 3000`
- 解决方案：使用重启脚本自动终止占用进程

## 系统组件
- 前端服务器：http://localhost:3000
- 后端API：http://localhost:5000
- 数据库：PostgreSQL（自动连接）

## 验证服务器状态
- 检查后端健康状态：`curl http://localhost:5000/api/health`
- 访问前端界面：http://localhost:3000