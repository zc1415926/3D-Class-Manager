#!/bin/bash

# 3D班级管理系统重启脚本
# 功能：终止可能存在的前、后端服务器进程，然后统一启动整个系统

echo "🔄 3D班级管理系统重启脚本"
echo "📝 此脚本会终止可能存在的前、后端服务器进程，然后重新启动整个系统"
echo ""

# 终止占用端口的进程
echo "🧹 清理已占用的端口..."

# 终止占用5000端口的进程（后端服务器）
if lsof -i :5000 > /dev/null 2>&1; then
    echo "  停止占用5000端口的进程..."
    lsof -ti:5000 | xargs kill -9 2>/dev/null
fi

# 终止占用3000端口的进程（前端服务器）
if lsof -i :3000 > /dev/null 2>&1; then
    echo "  停止占用3000端口的进程..."
    lsof -ti:3000 | xargs kill -9 2>/dev/null
fi

# 等待一段时间让端口释放
sleep 2

echo "✅ 端口清理完成"
echo ""

# 启动整个系统
echo "🚀 启动3D班级管理系统..."
echo "   包括：前端服务器（端口3000）、后端服务器（端口5000）"

# 使用 concurrently 同时启动前端和后端
npx concurrently "cd server && npm run dev" "cd client && npm start"