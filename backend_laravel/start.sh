#!/bin/bash
# Laravel Backend Startup Script

cd "$(dirname "$0")"

echo "🚀 Starting Laravel Backend Server..."
echo "====================================="

# 检查composer依赖
if [ ! -d "vendor" ]; then
    echo "📦 Installing dependencies..."
    composer install --no-interaction
fi

# 检查.env文件
if [ ! -f ".env" ]; then
    echo "⚙️  Creating .env file..."
    cp .env.example .env
    php artisan key:generate
fi

# 运行迁移
echo "🗄️  Running migrations..."
php artisan migrate --force

# 填充数据
echo "📝 Seeding database..."
php artisan db:seed --force

echo ""
echo "✅ Laravel server starting on http://localhost:8000"
echo "📝 API endpoints available at http://localhost:8000/api/v1"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# 启动服务器
php artisan serve
