# 3D班级管理系统 - Laravel后端

## 项目信息

- **项目名称**: 3D班级管理系统
- **框架**: Laravel 11
- **PHP版本**: >= 8.2
- **数据库**: PostgreSQL

## 环境要求

- PHP >= 8.2
- Composer
- PostgreSQL >= 12
- Redis >= 6

## 安装步骤

### 1. 安装依赖

```bash
cd backend_laravel
composer install
```

### 2. 配置环境变量

```bash
cp .env.example .env
php artisan key:generate
```

编辑 `.env` 文件，配置数据库连接：

```env
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=stl_manager
DB_USERNAME=stl_user
DB_PASSWORD=stl_password_2024
```

### 3. 运行数据库迁移

```bash
php artisan migrate
```

### 4. 填充默认数据

```bash
php artisan db:seed
```

### 5. 创建符号链接

```bash
php artisan storage:link
```

### 6. 启动开发服务器

```bash
php artisan serve
```

服务将运行在 `http://localhost:8000`

## API文档

### 认证API

#### 登录
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "username": "zc1415926",
  "password": "zaq12wsx"
}
```

#### 获取当前用户
```http
GET /api/v1/auth/me
Authorization: Bearer {token}
```

#### 注销
```http
POST /api/v1/auth/logout
Authorization: Bearer {token}
```

#### 刷新令牌
```http
POST /api/v1/auth/refresh-token
Authorization: Bearer {token}
```

#### 修改密码
```http
POST /api/v1/auth/change-password
Authorization: Bearer {token}
Content-Type: application/json

{
  "currentPassword": "old_password",
  "newPassword": "new_password"
}
```

### 健康检查

```http
GET /api/v1/health
```

## 默认账户

- **用户名**: zc1415926
- **密码**: zaq12wsx
- **角色**: teacher

⚠️ **生产环境必须修改默认密码！**

## 目录结构

```
backend_laravel/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   └── Api/
│   │   │       └── V1/
│   │   │           └── AuthController.php
│   │   ├── Middleware/
│   │   │   ├── CheckRole.php
│   │   │   ├── JsonResponse.php
│   │   │   └── OptionalAuth.php
│   │   └── Requests/
│   │       └── Auth/
│   │           ├── LoginRequest.php
│   │           ├── ChangePasswordRequest.php
│   │           └── CreateUserRequest.php
│   ├── Models/
│   │   ├── User.php
│   │   ├── Student.php
│   │   ├── Assignment.php
│   │   ├── UploadType.php
│   │   ├── AssignmentUploadRequirement.php
│   │   ├── Submission.php
│   │   └── SubmissionFile.php
│   └── Providers/
│       ├── AppServiceProvider.php
│       └── AuthServiceProvider.php
├── config/
│   ├── app.php
│   ├── auth.php
│   ├── cors.php
│   ├── database.php
│   ├── filesystems.php
│   └── sanctum.php
├── database/
│   ├── migrations/
│   └── seeders/
├── routes/
│   └── api.php
├── public/
│   └── index.php
├── .env
├── .env.example
├── artisan
├── composer.json
└── README.md
```

## 认证系统

本项目使用 **Laravel Sanctum** 进行API认证。

### 令牌格式

```
Bearer {token}
```

### 令牌管理

- 登录时创建令牌
- 注销时撤销当前令牌
- 刷新令牌时撤销旧令牌并创建新令牌
- 修改密码时撤销所有令牌

## 中间件

- `auth:api` - 需要认证
- `role:admin` - 需要管理员权限
- `role:teacher` - 需要教师权限

## 开发工具

```bash
# 查看路由
php artisan route:list

# 清除缓存
php artisan cache:clear
php artisan config:clear
php artisan route:clear

# 运行测试
php artisan test

# 创建控制器
php artisan make:controller Api/V1/ControllerName

# 创建模型
php artisan make:model ModelName

# 创建迁移
php artisan make:migration create_table_name
```

## 部署

### 生产环境配置

1. 设置 `APP_ENV=production`
2. 设置 `APP_DEBUG=false`
3. 配置正确的数据库凭据
4. 修改默认密码
5. 配置正确的 `SANCTUM_STATEFUL_DOMAINS`

### 性能优化

```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

## 故障排查

### 数据库连接失败

1. 检查 PostgreSQL 服务是否运行
2. 检查 `.env` 文件中的数据库配置
3. 确认数据库和用户已创建

### 认证失败

1. 确认令牌正确发送
2. 检查令牌是否已撤销
3. 检查 `config/sanctum.php` 配置

## 许可证

MIT

## 联系方式

如有问题，请联系项目维护者。