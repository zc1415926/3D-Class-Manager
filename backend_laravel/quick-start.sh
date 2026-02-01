#!/bin/bash
# Laravel Backend Quick Start Script

cd "$(dirname "$0")"

echo "=========================================="
echo "🚀 Laravel Backend Quick Start"
echo "=========================================="
echo ""

# 等待composer完成
if [ ! -d "vendor" ]; then
    echo "⏳ Waiting for composer install to complete..."
    while [ ! -d "vendor" ]; do
        sleep 2
    done
    echo "✅ Composer installation completed"
fi

# 生成应用密钥
if ! grep -q "^APP_KEY=" .env 2>/dev/null; then
    echo "🔑 Generating application key..."
    php artisan key:generate
fi

# 运行迁移
echo "🗄️  Running database migrations..."
php artisan migrate --force

# 填充数据
echo "📝 Seeding database..."
php artisan db:seed --force

echo ""
echo "✅ Server setup complete!"
echo ""
echo "Starting Laravel server on http://localhost:8000"
echo "Press Ctrl+C to stop"
echo ""

# 启动服务器
php artisan serve