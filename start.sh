#!/bin/bash

# 开发环境启动脚本
# 快捷命令: ./start.sh

echo "🚀 启动3D班级管理系统..."

# 检查PostgreSQL服务（如果需要）
if [ "$DB_TYPE" = "postgresql" ]; then
    echo "📦 检查PostgreSQL服务..."
    if ! systemctl is-active --quiet postgresql 2>/dev/null; then
        echo "🔄 启动PostgreSQL..."
        sudo systemctl start postgresql
        sleep 2
    fi
fi

# 启动服务器
echo "🌐 启动服务器..."
cd server && npm run dev