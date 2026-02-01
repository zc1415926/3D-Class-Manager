# 3D班级管理系统 - Laravel重构计划文档

## 文档信息

- **项目名称**: 3D班级管理系统
- **当前架构**: Express.js + PostgreSQL
- **目标架构**: Laravel + PostgreSQL
- **文档版本**: 1.0
- **创建日期**: 2026-02-01

---

## 目录

1. [当前系统架构分析](#1-当前系统架构分析)
2. [重构目标与原则](#2-重构目标与原则)
3. [Laravel架构设计](#3-laravel架构设计)
4. [数据库迁移方案](#4-数据库迁移方案)
5. [路由映射](#5-路由映射)
6. [控制器设计](#6-控制器设计)
7. [模型设计](#7-模型设计)
8. [中间件设计](#8-中间件设计)
9. [文件处理方案](#9-文件处理方案)
10. [认证系统](#10-认证系统)
11. [实施步骤](#11-实施步骤)
12. [测试计划](#12-测试计划)
13. [部署方案](#13-部署方案)
14. [风险评估](#14-风险评估)

---

## 1. 当前系统架构分析

### 1.1 核心文件功能分析

#### 1.1.1 入口文件 (server.js)
**功能**: Express应用主入口
- 配置Express应用和CORS
- 静态文件服务（/uploads, /thumbnails）
- 文件下载端点（/api/download/:filename）
- 路由注册
- 数据库初始化
- 健康检查端点（/api/health）
- 优雅关闭处理

**依赖**:
- express: Web框架
- cors: 跨域资源共享
- pg: PostgreSQL客户端
- fs/path: 文件系统操作

#### 1.1.2 数据库配置 (config/database.js)
**功能**: PostgreSQL数据库管理
- 连接池配置（最大20连接）
- 表结构创建和自动更新
- 默认数据初始化（用户、上传类型、学生）
- 数据库迁移支持

**核心表结构**:
- users: 用户认证
- submissions: 作品提交
- submission_files: 多文件支持和文件级评分
- students: 学生信息
- assignments: 作业管理
- assignment_upload_requirements: 作业上传要求
- upload_types: 上传类型管理

#### 1.1.3 认证中间件 (middleware/auth.js)
**功能**: JWT认证和授权
- authenticateToken: 强制认证
- optionalAuth: 可选认证
- checkRole: 角色权限检查

#### 1.1.4 路由文件分析

**routes/auth.js** - 认证管理
- POST /login - 用户登录
- GET /me - 获取当前用户
- POST /change-password - 修改密码
- POST /users - 创建用户（管理员）
- GET /users - 用户列表（管理员）
- DELETE /users/:id - 删除用户（管理员）

**routes/submissions.js** - 作品管理
- POST / - 提交作品（支持多文件）
- GET / - 作品列表
- GET /:id - 作品详情
- GET /by-assignment/:assignmentId - 作业提交列表
- PUT /files/:fileId/grade - 文件级评分
- DELETE /:id - 删除作品

**routes/students.js** - 学生管理
- GET / - 学生列表
- POST / - 添加学生
- PUT /:id - 更新学生
- DELETE /:id - 删除学生

**routes/assignments.js** - 作业管理
- GET / - 作业列表
- GET /:id - 作业详情
- POST / - 创建作业
- PUT /:id - 更新作业
- DELETE /:id - 删除作业
- DELETE /:id/cascade - 级联删除
- PUT /reorder - 批量排序
- GET /:id/submissions - 作业提交
- GET /:id/upload-requirements - 作业要求
- POST /:id/upload-requirements - 创建要求
- PUT /:id/upload-requirements/:requirementId - 更新要求
- DELETE /:id/upload-requirements/:requirementId - 删除要求
- PUT /:id/upload-requirements/reorder - 批量排序
- GET /:id/export - 导出ZIP
- POST /:id/move-uploaded-files - 移动文件

**routes/upload-types.js** - 上传类型管理
- GET / - 类型列表
- GET /:id - 单个类型
- POST / - 创建类型
- PUT /:id - 更新类型
- DELETE /:id - 删除类型
- PUT /batch/sort - 批量排序

**routes/upload.js** - 文件上传
- POST /upload-image - CKEditor图片上传
- POST /upload-assignment-attachment - 作业附件上传

#### 1.1.5 迁移脚本 (scripts/)

**migrate-students-grade-class.js**
- 为旧学生数据生成随机年级和班级

**migrate-grade-to-files.js**
- 将评分从submissions迁移到submission_files

**remove-upload-type-columns.js**
- 移除upload_types表的旧字段

**start-dev.js**
- 开发环境启动脚本
- PostgreSQL服务管理
- 数据库连接测试

**test-postgresql.js**
- PostgreSQL连接测试

### 1.2 当前技术栈

| 类别 | 技术栈 |
|------|--------|
| Web框架 | Express.js 4.18.2 |
| 数据库 | PostgreSQL (pg 8.17.2) |
| 认证 | JWT (jsonwebtoken 9.0.3) |
| 密码加密 | bcryptjs 3.0.3 |
| 文件上传 | multer 1.4.5 |
| 文件压缩 | archiver 7.0.1 |
| 环境变量 | dotenv 17.2.3 |
| 开发工具 | nodemon 3.0.2 |

### 1.3 当前系统特点

**优点**:
- 轻量级，响应快速
- JWT认证安全可靠
- 支持多文件上传和文件级评分
- 完整的作业管理系统
- PostgreSQL数据库支持

**待改进**:
- 缺少正式的ORM层，直接使用SQL
- 错误处理不够统一
- 缺少请求验证层
- 缺少正式的日志系统
- 文件路径硬编码较多
- 缺少单元测试

---

## 2. 重构目标与原则

### 2.1 重构目标

1. **现代化框架**: 迁移到Laravel 11，利用其强大的生态系统
2. **ORM支持**: 使用Eloquent ORM，提高代码可维护性
3. **标准化开发**: 遵循Laravel最佳实践和PSR标准
4. **安全性增强**: 利用Laravel内置的安全特性
5. **可扩展性**: 建立清晰的架构，便于未来扩展
6. **测试覆盖**: 建立完整的测试体系
7. **API标准化**: 实现RESTful API设计规范

### 2.2 重构原则

1. **功能等价**: 保持所有现有功能不变
2. **数据兼容**: 确保现有数据无缝迁移
3. **API兼容**: 保持API接口向后兼容
4. **渐进迁移**: 分阶段实施，降低风险
5. **文档完善**: 提供详细的开发文档
6. **性能优化**: 利用Laravel的缓存和优化机制

---

## 3. Laravel架构设计

### 3.1 项目结构

```
laravel-backend/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Api/
│   │   │   │   ├── V1/
│   │   │   │   │   ├── AuthController.php
│   │   │   │   │   ├── SubmissionController.php
│   │   │   │   │   ├── StudentController.php
│   │   │   │   │   ├── AssignmentController.php
│   │   │   │   │   ├── UploadTypeController.php
│   │   │   │   │   └── FileUploadController.php
│   │   │   │   └── Controller.php
│   │   │   └── Controller.php
│   │   ├── Middleware/
│   │   │   ├── Authenticate.php
│   │   │   ├── CheckRole.php
│   │   │   ├── JsonResponse.php
│   │   │   └── OptionalAuth.php
│   │   ├── Requests/
│   │   │   ├── Auth/
│   │   │   │   ├── LoginRequest.php
│   │   │   │   ├── ChangePasswordRequest.php
│   │   │   │   └── CreateUserRequest.php
│   │   │   ├── Submission/
│   │   │   │   ├── StoreSubmissionRequest.php
│   │   │   │   ├── UpdateSubmissionRequest.php
│   │   │   │   └── GradeFileRequest.php
│   │   │   ├── Student/
│   │   │   │   ├── StoreStudentRequest.php
│   │   │   │   └── UpdateStudentRequest.php
│   │   │   ├── Assignment/
│   │   │   │   ├── StoreAssignmentRequest.php
│   │   │   │   ├── UpdateAssignmentRequest.php
│   │   │   │   ├── StoreRequirementRequest.php
│   │   │   │   └── UpdateRequirementRequest.php
│   │   │   └── UploadType/
│   │   │       ├── StoreUploadTypeRequest.php
│   │   │       └── UpdateUploadTypeRequest.php
│   │   └── Resources/
│   │       ├── UserResource.php
│   │       ├── SubmissionResource.php
│   │       ├── StudentResource.php
│   │       ├── AssignmentResource.php
│   │       └── UploadTypeResource.php
│   ├── Models/
│   │   ├── User.php
│   │   ├── Submission.php
│   │   ├── SubmissionFile.php
│   │   ├── Student.php
│   │   ├── Assignment.php
│   │   ├── AssignmentUploadRequirement.php
│   │   └── UploadType.php
│   ├── Services/
│   │   ├── FileService.php
│   │   ├── ZipService.php
│   │   └── AuthService.php
│   ├── Exceptions/
│   │   └── Handler.php
│   └── Providers/
│       ├── AppServiceProvider.php
│       └── AuthServiceProvider.php
├── database/
│   ├── migrations/
│   ├── seeders/
│   │   ├── UserSeeder.php
│   │   ├── UploadTypeSeeder.php
│   │   └── StudentSeeder.php
│   └── factories/
├── routes/
│   ├── api.php
│   └── web.php
├── config/
│   ├── filesystems.php
│   ├── auth.php
│   └── cors.php
├── storage/
│   ├── app/
│   │   └── public/
│   ├── framework/
│   └── logs/
├── tests/
│   ├── Feature/
│   │   ├── AuthTest.php
│   │   ├── SubmissionTest.php
│   │   ├── StudentTest.php
│   │   ├── AssignmentTest.php
│   │   └── UploadTypeTest.php
│   └── Unit/
│       ├── FileServiceTest.php
│       └── AuthServiceTest.php
├── bootstrap/
│   └── app.php
├── public/
│   ├── index.php
│   └── uploads/
├── .env
├── .env.example
├── artisan
├── composer.json
└── phpunit.xml
```

### 3.2 技术选型

| 类别 | 技术栈 | 说明 |
|------|--------|------|
| 框架 | Laravel 11 | 最新稳定版 |
| PHP | PHP 8.2+ | 支持最新特性 |
| 数据库 | PostgreSQL | 与原系统一致 |
| ORM | Eloquent | Laravel内置ORM |
| 认证 | Laravel Sanctum | API认证 |
| 文件存储 | Laravel Storage | 统一文件管理 |
| 队列 | Laravel Queue | 异步任务处理 |
| 缓存 | Redis | 性能优化 |
| 测试 | PHPUnit | 单元测试 |
| API文档 | OpenAPI/Swagger | 自动生成 |

---

## 4. 数据库迁移方案

### 4.1 数据库表设计

#### 4.1.1 users表
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'teacher',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Laravel Migration**:
```php
Schema::create('users', function (Blueprint $table) {
    $table->id();
    $table->string('username')->unique();
    $table->string('password');
    $table->string('role')->default('teacher');
    $table->timestamps();
});
```

#### 4.1.2 submissions表
```sql
CREATE TABLE submissions (
    id SERIAL PRIMARY KEY,
    student_name VARCHAR(100) NOT NULL,
    student_year INTEGER NOT NULL,
    work_name VARCHAR(200) NOT NULL,
    description TEXT,
    assignment_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Laravel Migration**:
```php
Schema::create('submissions', function (Blueprint $table) {
    $table->id();
    $table->string('student_name');
    $table->integer('student_year');
    $table->string('work_name');
    $table->text('description')->nullable();
    $table->foreignId('assignment_id')->nullable()->constrained()->onDelete('set null');
    $table->timestamps();
});
```

#### 4.1.3 submission_files表
```sql
CREATE TABLE submission_files (
    id SERIAL PRIMARY KEY,
    submission_id INTEGER NOT NULL,
    requirement_id INTEGER,
    filename VARCHAR(255) NOT NULL,
    filepath VARCHAR(500) NOT NULL,
    thumbnail_path VARCHAR(500),
    file_type VARCHAR(50) DEFAULT 'general',
    is_primary BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    score INTEGER,
    grade VARCHAR(2),
    grader_id INTEGER,
    graded_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE
);
```

**Laravel Migration**:
```php
Schema::create('submission_files', function (Blueprint $table) {
    $table->id();
    $table->foreignId('submission_id')->constrained()->onDelete('cascade');
    $table->foreignId('requirement_id')->nullable()->constrained('assignment_upload_requirements')->onDelete('set null');
    $table->string('filename');
    $table->string('filepath');
    $table->string('thumbnail_path')->nullable();
    $table->string('file_type')->default('general');
    $table->boolean('is_primary')->default(false);
    $table->integer('sort_order')->default(0);
    $table->integer('score')->nullable();
    $table->string('grade', 2)->nullable();
    $table->foreignId('grader_id')->nullable()->constrained('users')->onDelete('set null');
    $table->timestamp('graded_at')->nullable();
    $table->timestamps();
});
```

#### 4.1.4 students表
```sql
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    year INTEGER NOT NULL,
    grade VARCHAR(10),
    class_number INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Laravel Migration**:
```php
Schema::create('students', function (Blueprint $table) {
    $table->id();
    $table->string('name');
    $table->integer('year');
    $table->string('grade', 10)->default('一');
    $table->integer('class_number')->default(1);
    $table->timestamps();
});
```

#### 4.1.5 assignments表
```sql
CREATE TABLE assignments (
    id SERIAL PRIMARY KEY,
    year INTEGER NOT NULL,
    name VARCHAR(200) NOT NULL,
    upload_types TEXT NOT NULL,
    description TEXT,
    deadline TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active',
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Laravel Migration**:
```php
Schema::create('assignments', function (Blueprint $table) {
    $table->id();
    $table->integer('year');
    $table->string('name');
    $table->text('upload_types');
    $table->text('description')->nullable();
    $table->timestamp('deadline')->nullable();
    $table->string('status')->default('active');
    $table->integer('sort_order')->default(0);
    $table->timestamps();
});
```

#### 4.1.6 assignment_upload_requirements表
```sql
CREATE TABLE assignment_upload_requirements (
    id SERIAL PRIMARY KEY,
    assignment_id INTEGER NOT NULL,
    name VARCHAR(200) NOT NULL,
    upload_type VARCHAR(50) NOT NULL,
    is_required BOOLEAN DEFAULT TRUE,
    is_published BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE
);
```

**Laravel Migration**:
```php
Schema::create('assignment_upload_requirements', function (Blueprint $table) {
    $table->id();
    $table->foreignId('assignment_id')->constrained()->onDelete('cascade');
    $table->string('name');
    $table->string('upload_type');
    $table->boolean('is_required')->default(true);
    $table->boolean('is_published')->default(true);
    $table->integer('sort_order')->default(0);
    $table->timestamps();
});
```

#### 4.1.7 upload_types表
```sql
CREATE TABLE upload_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    extensions TEXT,
    max_file_size INTEGER DEFAULT 52428800,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Laravel Migration**:
```php
Schema::create('upload_types', function (Blueprint $table) {
    $table->id();
    $table->string('name')->unique();
    $table->string('code')->unique();
    $table->text('description')->nullable();
    $table->text('extensions')->nullable();
    $table->integer('max_file_size')->default(52428800);
    $table->integer('sort_order')->default(0);
    $table->timestamps();
});
```

### 4.2 数据迁移策略

#### 4.2.1 数据迁移步骤

1. **备份现有数据**
   ```bash
   pg_dump -U stl_user -h localhost stl_manager > backup_$(date +%Y%m%d).sql
   ```

2. **创建Laravel迁移文件**
   ```bash
   php artisan make:migration create_all_tables
   ```

3. **运行迁移**
   ```bash
   php artisan migrate
   ```

4. **数据导入**（使用现有数据库）
   - Laravel直接连接现有PostgreSQL数据库
   - 无需数据导出导入

5. **验证数据完整性**
   ```bash
   php artisan db:seed --class=DataVerificationSeeder
   ```

#### 4.2.2 数据一致性检查

创建验证脚本来确保数据迁移正确：

```php
// database/seeders/DataVerificationSeeder.php
class DataVerificationSeeder extends Seeder
{
    public function run()
    {
        $checks = [
            'users' => User::count(),
            'submissions' => Submission::count(),
            'submission_files' => SubmissionFile::count(),
            'students' => Student::count(),
            'assignments' => Assignment::count(),
            'upload_types' => UploadType::count(),
        ];

        $this->command->info('数据统计:');
        foreach ($checks as $table => $count) {
            $this->command->line("  {$table}: {$count} 条记录");
        }
    }
}
```

---

## 5. 路由映射

### 5.1 API路由结构

```php
// routes/api.php

Route::prefix('v1')->group(function () {
    // 认证路由（使用Laravel Sanctum）
    Route::prefix('auth')->group(function () {
        Route::post('login', [AuthController::class, 'login']);
        Route::post('logout', [AuthController::class, 'logout'])->middleware('auth:api');
        Route::post('refresh-token', [AuthController::class, 'refreshToken'])->middleware('auth:api');
        Route::get('me', [AuthController::class, 'me'])->middleware('auth:api');
        Route::post('change-password', [AuthController::class, 'changePassword'])->middleware('auth:api');
        Route::post('users', [AuthController::class, 'createUser'])->middleware('auth:api', 'role:admin');
        Route::get('users', [AuthController::class, 'users'])->middleware('auth:api', 'role:admin');
        Route::delete('users/{id}', [AuthController::class, 'deleteUser'])->middleware('auth:api', 'role:admin');
    });

    // 作品管理路由
    Route::prefix('submissions')->group(function () {
        Route::get('/', [SubmissionController::class, 'index']);
        Route::post('/', [SubmissionController::class, 'store']);
        Route::get('/{id}', [SubmissionController::class, 'show']);
        Route::get('/by-assignment/{assignmentId}', [SubmissionController::class, 'byAssignment']);
        Route::put('/files/{fileId}/grade', [SubmissionController::class, 'gradeFile'])->middleware('auth:api');
        Route::delete('/{id}', [SubmissionController::class, 'destroy'])->middleware('auth:api');
    });

    // 学生管理路由
    Route::prefix('students')->group(function () {
        Route::get('/', [StudentController::class, 'index']);
        Route::post('/', [StudentController::class, 'store'])->middleware('auth:api');
        Route::put('/{id}', [StudentController::class, 'update'])->middleware('auth:api');
        Route::delete('/{id}', [StudentController::class, 'destroy'])->middleware('auth:api');
    });

    // 作业管理路由
    Route::prefix('assignments')->group(function () {
        Route::get('/', [AssignmentController::class, 'index']);
        Route::post('/', [AssignmentController::class, 'store'])->middleware('auth:api');
        Route::put('/reorder', [AssignmentController::class, 'reorder'])->middleware('auth:api');
        Route::get('/{id}', [AssignmentController::class, 'show']);
        Route::put('/{id}', [AssignmentController::class, 'update'])->middleware('auth:api');
        Route::delete('/{id}', [AssignmentController::class, 'destroy'])->middleware('auth:api');
        Route::delete('/{id}/cascade', [AssignmentController::class, 'cascadeDelete'])->middleware('auth:api');
        Route::get('/{id}/submissions', [AssignmentController::class, 'submissions']);
        Route::get('/{id}/upload-requirements', [AssignmentController::class, 'uploadRequirements']);
        Route::post('/{id}/upload-requirements', [AssignmentController::class, 'storeRequirement'])->middleware('auth:api');
        Route::put('/{id}/upload-requirements/{requirementId}', [AssignmentController::class, 'updateRequirement'])->middleware('auth:api');
        Route::delete('/{id}/upload-requirements/{requirementId}', [AssignmentController::class, 'destroyRequirement'])->middleware('auth:api');
        Route::put('/{id}/upload-requirements/reorder', [AssignmentController::class, 'reorderRequirements'])->middleware('auth:api');
        Route::get('/{id}/export', [AssignmentController::class, 'export'])->middleware('auth:api');
        Route::post('/{id}/move-uploaded-files', [AssignmentController::class, 'moveUploadedFiles'])->middleware('auth:api');
    });

    // 上传类型管理路由
    Route::prefix('upload-types')->group(function () {
        Route::get('/', [UploadTypeController::class, 'index']);
        Route::get('/{id}', [UploadTypeController::class, 'show']);
        Route::post('/', [UploadTypeController::class, 'store'])->middleware('auth:api');
        Route::put('/{id}', [UploadTypeController::class, 'update'])->middleware('auth:api');
        Route::delete('/{id}', [UploadTypeController::class, 'destroy'])->middleware('auth:api');
        Route::put('/batch/sort', [UploadTypeController::class, 'batchSort'])->middleware('auth:api');
    });

    // 文件上传路由
    Route::prefix('upload')->group(function () {
        Route::post('/upload-image', [FileUploadController::class, 'uploadImage']);
        Route::post('/upload-assignment-attachment', [FileUploadController::class, 'uploadAttachment']);
    });

    // 文件下载路由
    Route::get('/download/{filename}', [FileController::class, 'download']);

    // 健康检查
    Route::get('/health', function () {
        return response()->json([
            'status' => 'ok',
            'message' => 'Server is running',
            'timestamp' => now()
        ]);
    });
});
```

### 5.2 路由映射表

| Express路由 | Laravel路由 | 方法 | 控制器 | 中间件 |
|------------|------------|------|--------|--------|
| POST /api/auth/login | POST /api/v1/auth/login | login | AuthController | - |
| POST /api/auth/logout | POST /api/v1/auth/logout | logout | AuthController | auth:api |
| POST /api/auth/refresh-token | POST /api/v1/auth/refresh-token | refreshToken | AuthController | auth:api |
| GET /api/auth/me | GET /api/v1/auth/me | me | AuthController | auth:api |
| POST /api/auth/change-password | POST /api/v1/auth/change-password | changePassword | AuthController | auth:api |
| POST /api/auth/users | POST /api/v1/auth/users | createUser | AuthController | auth:api, role:admin |
| GET /api/auth/users | GET /api/v1/auth/users | users | AuthController | auth:api, role:admin |
| DELETE /api/auth/users/:id | DELETE /api/v1/auth/users/{id} | deleteUser | AuthController | auth:api, role:admin |
| POST /api/submissions | POST /api/v1/submissions | store | SubmissionController | - |
| GET /api/submissions | GET /api/v1/submissions | index | SubmissionController | - |
| GET /api/submissions/:id | GET /api/v1/submissions/{id} | show | SubmissionController | - |
| GET /api/submissions/by-assignment/:assignmentId | GET /api/v1/submissions/by-assignment/{assignmentId} | byAssignment | SubmissionController | - |
| PUT /api/submissions/files/:fileId/grade | PUT /api/v1/submissions/files/{fileId}/grade | gradeFile | SubmissionController | auth:api |
| DELETE /api/submissions/:id | DELETE /api/v1/submissions/{id} | destroy | SubmissionController | auth:api |
| GET /api/students | GET /api/v1/students | index | StudentController | - |
| POST /api/students | POST /api/v1/students | store | StudentController | auth:api |
| PUT /api/students/:id | PUT /api/v1/students/{id} | update | StudentController | auth:api |
| DELETE /api/students/:id | DELETE /api/v1/students/{id} | destroy | StudentController | auth:api |
| GET /api/assignments | GET /api/v1/assignments | index | AssignmentController | - |
| POST /api/assignments | POST /api/v1/assignments | store | AssignmentController | auth:api |
| PUT /api/assignments/reorder | PUT /api/v1/assignments/reorder | reorder | AssignmentController | auth:api |
| GET /api/assignments/:id | GET /api/v1/assignments/{id} | show | AssignmentController | - |
| PUT /api/assignments/:id | PUT /api/v1/assignments/{id} | update | AssignmentController | auth:api |
| DELETE /api/assignments/:id | DELETE /api/v1/assignments/{id} | destroy | AssignmentController | auth:api |
| DELETE /api/assignments/:id/cascade | DELETE /api/v1/assignments/{id}/cascade | cascadeDelete | AssignmentController | auth:api |
| GET /api/assignments/:id/submissions | GET /api/v1/assignments/{id}/submissions | submissions | AssignmentController | - |
| GET /api/assignments/:id/upload-requirements | GET /api/v1/assignments/{id}/upload-requirements | uploadRequirements | AssignmentController | - |
| POST /api/assignments/:id/upload-requirements | POST /api/v1/assignments/{id}/upload-requirements | storeRequirement | AssignmentController | auth:api |
| PUT /api/assignments/:id/upload-requirements/:requirementId | PUT /api/v1/assignments/{id}/upload-requirements/{requirementId} | updateRequirement | AssignmentController | auth:api |
| DELETE /api/assignments/:id/upload-requirements/:requirementId | DELETE /api/v1/assignments/{id}/upload-requirements/{requirementId} | destroyRequirement | AssignmentController | auth:api |
| PUT /api/assignments/:id/upload-requirements/reorder | PUT /api/v1/assignments/{id}/upload-requirements/reorder | reorderRequirements | AssignmentController | auth:api |
| GET /api/assignments/:id/export | GET /api/v1/assignments/{id}/export | export | AssignmentController | auth:api |
| POST /api/assignments/:id/move-uploaded-files | POST /api/v1/assignments/{id}/move-uploaded-files | moveUploadedFiles | AssignmentController | auth:api |
| GET /api/upload-types | GET /api/v1/upload-types | index | UploadTypeController | - |
| GET /api/upload-types/:id | GET /api/v1/upload-types/{id} | show | UploadTypeController | - |
| POST /api/upload-types | POST /api/v1/upload-types | store | UploadTypeController | auth:api |
| PUT /api/upload-types/:id | PUT /api/v1/upload-types/{id} | update | UploadTypeController | auth:api |
| DELETE /api/upload-types/:id | DELETE /api/v1/upload-types/{id} | destroy | UploadTypeController | auth:api |
| PUT /api/upload-types/batch/sort | PUT /api/v1/upload-types/batch/sort | batchSort | UploadTypeController | auth:api |
| POST /api/upload/upload-image | POST /api/v1/upload/upload-image | uploadImage | FileUploadController | - |
| POST /api/upload/upload-assignment-attachment | POST /api/v1/upload/upload-assignment-attachment | uploadAttachment | FileUploadController | - |
| GET /api/download/:filename | GET /api/v1/download/{filename} | download | FileController | - |
| GET /api/health | GET /api/v1/health | - | Closure | - |

---

## 6. 控制器设计

### 6.1 AuthController

```php
<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\ChangePasswordRequest;
use App\Http\Requests\Auth\CreateUserRequest;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    /**
     * 用户登录（使用Laravel Sanctum令牌认证）
     */
    public function login(LoginRequest $request)
    {
        $credentials = $request->only('username', 'password');

        if (!Auth::attempt($credentials)) {
            return response()->json([
                'success' => false,
                'error' => '用户名或密码错误'
            ], 401);
        }

        $user = Auth::user();
        // 使用Sanctum创建API令牌
        $token = $user->createToken('api-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'data' => [
                'token' => $token,
                'token_type' => 'Bearer',
                'user' => [
                    'id' => $user->id,
                    'username' => $user->username,
                    'role' => $user->role
                ]
            ]
        ]);
    }

    /**
     * 获取当前用户信息
     */
    public function me()
    {
        $user = Auth::user();

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $user->id,
                'username' => $user->username,
                'role' => $user->role
            ]
        ]);
    }

    /**
     * 用户注销（撤销当前令牌）
     */
    public function logout(Request $request)
    {
        // 撤销当前使用的令牌
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => '注销成功'
        ]);
    }

    /**
     * 刷新令牌（撤销旧令牌并创建新令牌）
     */
    public function refreshToken(Request $request)
    {
        $user = $request->user();
        
        // 撤销旧令牌
        $user->currentAccessToken()->delete();
        
        // 创建新令牌
        $token = $user->createToken('api-token')->plainTextToken;
        
        return response()->json([
            'success' => true,
            'data' => [
                'token' => $token,
                'token_type' => 'Bearer'
            ]
        ]);
    }

    /**
     * 修改密码
     */
    public function changePassword(ChangePasswordRequest $request)
    {
        $user = Auth::user();

        if (!Hash::check($request->currentPassword, $user->password)) {
            return response()->json([
                'success' => false,
                'error' => '当前密码错误'
            ], 401);
        }

        $user->password = Hash::make($request->newPassword);
        $user->save();

        // 修改密码后，撤销所有令牌，强制用户重新登录
        $user->tokens()->delete();

        return response()->json([
            'success' => true,
            'message' => '密码修改成功，请重新登录'
        ]);
    }

    /**
     * 创建用户（仅管理员）
     */
    public function createUser(CreateUserRequest $request)
    {
        $user = User::create([
            'username' => $request->username,
            'password' => Hash::make($request->password),
            'role' => $request->role ?? 'teacher'
        ]);

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $user->id,
                'username' => $user->username,
                'role' => $user->role
            ]
        ], 201);
    }

    /**
     * 获取用户列表（仅管理员）
     */
    public function users()
    {
        $users = User::orderBy('created_at', 'desc')
            ->get(['id', 'username', 'role', 'created_at', 'updated_at']);

        return response()->json([
            'success' => true,
            'data' => $users
        ]);
    }

    /**
     * 删除用户（仅管理员）
     */
    public function deleteUser($id)
    {
        if ((int)$id === Auth::id()) {
            return response()->json([
                'success' => false,
                'error' => '不能删除当前用户'
            ], 400);
        }

        $user = User::findOrFail($id);
        
        // 删除用户时，撤销其所有令牌
        $user->tokens()->delete();
        
        $user->delete();

        return response()->json([
            'success' => true,
            'message' => '用户删除成功'
        ]);
    }
}
```

### 6.2 SubmissionController

```php
<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Submission\StoreSubmissionRequest;
use App\Http\Requests\Submission\GradeFileRequest;
use App\Models\Submission;
use App\Services\FileService;
use Illuminate\Support\Facades\DB;

class SubmissionController extends Controller
{
    protected $fileService;

    public function __construct(FileService $fileService)
    {
        $this->fileService = $fileService;
    }

    /**
     * 提交作品
     */
    public function store(StoreSubmissionRequest $request)
    {
        DB::beginTransaction();
        try {
            // 创建提交记录
            $submission = Submission::create([
                'student_name' => $request->studentName,
                'student_year' => $request->studentYear,
                'work_name' => $request->workName,
                'description' => $request->description,
                'assignment_id' => $request->assignmentId ? (int)$request->assignmentId : null
            ]);

            // 处理文件上传
            $files = $this->fileService->handleSubmissionFiles(
                $request->all(),
                $submission->id,
                $request->studentYear,
                $request->assignmentId
            );

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => '作品提交成功',
                'data' => [
                    'id' => $submission->id,
                    'studentName' => $submission->student_name,
                    'workName' => $submission->work_name,
                    'files' => $files
                ]
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 获取作品列表
     */
    public function index()
    {
        $query = Submission::with(['submissionFiles' => function ($query) {
            $query->orderBy('is_primary', 'desc')->orderBy('sort_order');
        }]);

        if (request()->has('studentYear')) {
            $query->where('student_year', request('studentYear'));
        }

        if (request()->has('studentName')) {
            $query->where('student_name', request('studentName'));
        }

        $submissions = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $submissions->map(function ($submission) {
                return [
                    'id' => $submission->id,
                    'studentName' => $submission->student_name,
                    'studentYear' => $submission->student_year,
                    'workName' => $submission->work_name,
                    'description' => $submission->description,
                    'thumbnailPath' => $this->getThumbnailPath($submission),
                    'createdAt' => $submission->created_at
                ];
            })
        ]);
    }

    /**
     * 获取作品详情
     */
    public function show($id)
    {
        $submission = Submission::with(['submissionFiles' => function ($query) {
            $query->orderBy('is_primary', 'desc')->orderBy('sort_order');
        }])->findOrFail($id);

        $primaryFile = $submission->submissionFiles->firstWhere('is_primary', true)
            ?? $submission->submissionFiles->first();

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $submission->id,
                'studentName' => $submission->student_name,
                'studentYear' => $submission->student_year,
                'workName' => $submission->work_name,
                'description' => $submission->description,
                'filename' => $primaryFile->filename ?? null,
                'filePath' => $primaryFile ? $this->getFilePath($primaryFile) : null,
                'thumbnailPath' => $primaryFile ? $this->getThumbnailPath($primaryFile) : null,
                'files' => $submission->submissionFiles->map(function ($file) {
                    return [
                        'id' => $file->id,
                        'requirement_id' => $file->requirement_id,
                        'filename' => $file->filename,
                        'filepath' => $this->getFilePath($file),
                        'thumbnail_path' => $this->getThumbnailPath($file),
                        'is_primary' => $file->is_primary,
                        'sort_order' => $file->sort_order,
                        'file_type' => $file->file_type,
                        'score' => $file->score,
                        'grade' => $file->grade,
                        'grader_id' => $file->grader_id,
                        'graded_at' => $file->graded_at
                    ];
                }),
                'createdAt' => $submission->created_at
            ]
        ]);
    }

    /**
     * 获取作业提交列表
     */
    public function byAssignment($assignmentId)
    {
        $submissions = Submission::with(['submissionFiles' => function ($query) {
            $query->orderBy('is_primary', 'desc')->orderBy('sort_order');
        }])
        ->where('assignment_id', $assignmentId)
        ->orderBy('created_at', 'desc')
        ->get();

        return response()->json([
            'success' => true,
            'data' => $submissions
        ]);
    }

    /**
     * 文件级评分
     */
    public function gradeFile($fileId, GradeFileRequest $request)
    {
        $file = \App\Models\SubmissionFile::findOrFail($fileId);

        $file->update([
            'score' => $request->score,
            'grade' => $request->grade,
            'grader_id' => auth()->id(),
            'graded_at' => $request->score === null && $request->grade === null ? null : now()
        ]);

        return response()->json([
            'success' => true,
            'data' => $file->fresh(),
            'message' => '评分成功'
        ]);
    }

    /**
     * 删除作品
     */
    public function destroy($id)
    {
        $submission = Submission::findOrFail($id);

        // 删除文件
        foreach ($submission->submissionFiles as $file) {
            $this->fileService->deleteFile($file->filepath);
            if ($file->thumbnail_path) {
                $this->fileService->deleteFile($file->thumbnail_path);
            }
        }

        $submission->delete();

        return response()->json([
            'success' => true,
            'message' => '删除成功'
        ]);
    }

    private function getThumbnailPath($submission)
    {
        $primaryFile = $submission->submissionFiles->firstWhere('is_primary', true)
            ?? $submission->submissionFiles->first();

        if ($primaryFile && $primaryFile->thumbnail_path) {
            return $this->fileService->getPublicUrl($primaryFile->thumbnail_path);
        }

        return null;
    }

    private function getFilePath($file)
    {
        return $this->fileService->getPublicUrl($file->filepath);
    }
}
```

### 6.3 StudentController

```php
<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Student\StoreStudentRequest;
use App\Http\Requests\Student\UpdateStudentRequest;
use App\Models\Student;

class StudentController extends Controller
{
    /**
     * 获取学生列表
     */
    public function index()
    {
        $students = Student::orderBy('year', 'desc')
            ->orderBy('name', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $students->map(function ($student) {
                return [
                    'id' => $student->id,
                    'name' => $student->name,
                    'year' => $student->year,
                    'grade' => $student->grade ?? '一',
                    'class_number' => $student->class_number ?? 1,
                    'createdAt' => $student->created_at
                ];
            })
        ]);
    }

    /**
     * 添加学生
     */
    public function store(StoreStudentRequest $request)
    {
        $student = Student::create([
            'name' => $request->name,
            'year' => $request->year,
            'grade' => $request->grade ?? '一',
            'class_number' => $request->class_number ?? 1
        ]);

        return response()->json([
            'success' => true,
            'message' => '学生添加成功',
            'data' => [
                'id' => $student->id,
                'name' => $student->name,
                'year' => $student->year,
                'grade' => $student->grade,
                'class_number' => $student->class_number
            ]
        ], 201);
    }

    /**
     * 更新学生信息
     */
    public function update($id, UpdateStudentRequest $request)
    {
        $student = Student::findOrFail($id);

        $student->update([
            'name' => $request->name,
            'year' => $request->year,
            'grade' => $request->grade ?? '一',
            'class_number' => $request->class_number ?? 1
        ]);

        return response()->json([
            'success' => true,
            'message' => '学生信息更新成功',
            'data' => [
                'id' => $student->id,
                'name' => $student->name,
                'year' => $student->year,
                'grade' => $student->grade,
                'class_number' => $student->class_number
            ]
        ]);
    }

    /**
     * 删除学生
     */
    public function destroy($id)
    {
        $student = Student::findOrFail($id);
        $student->delete();

        return response()->json([
            'success' => true,
            'message' => '删除成功'
        ]);
    }
}
```

### 6.4 AssignmentController

```php
<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Assignment\StoreAssignmentRequest;
use App\Http\Requests\Assignment\UpdateAssignmentRequest;
use App\Models\Assignment;
use App\Services\ZipService;
use Illuminate\Support\Facades\DB;

class AssignmentController extends Controller
{
    protected $zipService;

    public function __construct(ZipService $zipService)
    {
        $this->zipService = $zipService;
    }

    /**
     * 获取作业列表
     */
    public function index()
    {
        $assignments = Assignment::withCount('submissions')
            ->orderBy('sort_order')
            ->orderBy('year', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $assignments->map(function ($assignment) {
                return [
                    ...$assignment->toArray(),
                    'upload_types' => json_decode($assignment->upload_types) ?? []
                ];
            })
        ]);
    }

    /**
     * 获取作业详情
     */
    public function show($id)
    {
        $assignment = Assignment::withCount('submissions')->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => [
                ...$assignment->toArray(),
                'upload_types' => json_decode($assignment->upload_types) ?? []
            ]
        ]);
    }

    /**
     * 创建作业
     */
    public function store(StoreAssignmentRequest $request)
    {
        $assignment = Assignment::create([
            'year' => $request->year,
            'name' => $request->name,
            'upload_types' => json_encode($request->upload_types),
            'description' => $request->description,
            'status' => $request->status ?? 'active'
        ]);

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $assignment->id,
                ...$request->all()
            ]
        ], 201);
    }

    /**
     * 更新作业
     */
    public function update($id, UpdateAssignmentRequest $request)
    {
        $assignment = Assignment::findOrFail($id);

        $assignment->update([
            'year' => $request->year,
            'name' => $request->name,
            'upload_types' => json_encode($request->upload_types),
            'description' => $request->description,
            'deadline' => $request->deadline,
            'status' => $request->status ?? 'active'
        ]);

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $assignment->id,
                ...$request->all()
            ]
        ]);
    }

    /**
     * 批量更新作业排序
     */
    public function reorder()
    {
        $assignments = request('assignments');

        DB::beginTransaction();
        try {
            foreach ($assignments as $assignment) {
                Assignment::where('id', $assignment['id'])
                    ->update(['sort_order' => $assignment['sort_order']]);
            }
            DB::commit();

            return response()->json([
                'success' => true,
                'message' => '排序已更新'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * 删除作业
     */
    public function destroy($id)
    {
        $assignment = Assignment::findOrFail($id);

        $submissionCount = $assignment->submissions()->count();

        if ($submissionCount > 0) {
            return response()->json([
                'success' => false,
                'error' => "该作业有 {$submissionCount} 个相关作品，无法删除"
            ], 400);
        }

        // 删除作业要求
        $assignment->uploadRequirements()->delete();

        $assignment->delete();

        return response()->json([
            'success' => true,
            'message' => '作业已删除'
        ]);
    }

    /**
     * 级联删除作业
     */
    public function cascadeDelete($id)
    {
        $assignment = Assignment::findOrFail($id);

        $submissions = $assignment->submissions;
        $deletedFiles = 0;
        $fileErrors = 0;

        foreach ($submissions as $submission) {
            foreach ($submission->submissionFiles as $file) {
                if (\Storage::exists($file->filepath)) {
                    \Storage::delete($file->filepath);
                    $deletedFiles++;
                }
                if ($file->thumbnail_path && \Storage::exists($file->thumbnail_path)) {
                    \Storage::delete($file->thumbnail_path);
                    $deletedFiles++;
                }
            }
        }

        $deletedSubmissions = $assignment->submissions()->delete();
        $assignment->uploadRequirements()->delete();
        $assignment->delete();

        return response()->json([
            'success' => true,
            'message' => '作业及其所有作品已删除',
            'deleted_submissions' => $deletedSubmissions,
            'deleted_files' => $deletedFiles,
            'file_errors' => $fileErrors
        ]);
    }

    /**
     * 获取作业的提交列表
     */
    public function submissions($id)
    {
        $assignment = Assignment::findOrFail($id);

        $submissions = $assignment->submissions()
            ->with(['submissionFiles' => function ($query) {
                $query->orderBy('is_primary', 'desc')->orderBy('sort_order');
            }])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $submissions
        ]);
    }

    /**
     * 获取作业的上传要求
     */
    public function uploadRequirements($id)
    {
        $requirements = \App\Models\AssignmentUploadRequirement::where('assignment_id', $id)
            ->orderBy('sort_order')
            ->orderBy('created_at')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $requirements->map(function ($req) {
                return [
                    ...$req->toArray(),
                    'is_required' => (bool)$req->is_required,
                    'is_published' => (bool)$req->is_published
                ];
            })
        ]);
    }

    /**
     * 创建作业要求
     */
    public function storeRequirement($id)
    {
        $assignment = Assignment::findOrFail($id);

        $requirement = $assignment->uploadRequirements()->create([
            'name' => request('name'),
            'upload_type' => request('upload_type'),
            'is_required' => request('is_required', true),
            'is_published' => request('is_published', true),
            'sort_order' => request('sort_order', 0)
        ]);

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $requirement->id,
                ...request()->all()
            ]
        ], 201);
    }

    /**
     * 更新作业要求
     */
    public function updateRequirement($id, $requirementId)
    {
        $requirement = \App\Models\AssignmentUploadRequirement::where('assignment_id', $id)
            ->where('id', $requirementId)
            ->firstOrFail();

        $newSortOrder = request('sort_order', 0);
        $oldSortOrder = $requirement->sort_order;

        DB::beginTransaction();
        try {
            if ($oldSortOrder !== $newSortOrder) {
                // 调整排序
                $this->adjustRequirementSortOrder($id, $requirementId, $oldSortOrder, $newSortOrder);
            }

            $requirement->update([
                'name' => request('name'),
                'upload_type' => request('upload_type'),
                'is_required' => request('is_required', true),
                'is_published' => request('is_published', true),
                'sort_order' => $newSortOrder
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $requirement->id,
                    ...request()->all()
                ]
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * 删除作业要求
     */
    public function destroyRequirement($id, $requirementId)
    {
        $requirement = \App\Models\AssignmentUploadRequirement::where('assignment_id', $id)
            ->where('id', $requirementId)
            ->firstOrFail();

        $requirement->delete();

        return response()->json([
            'success' => true,
            'message' => '作业要求已删除'
        ]);
    }

    /**
     * 批量更新作业要求排序
     */
    public function reorderRequirements($id)
    {
        $requirements = request('requirements');

        DB::beginTransaction();
        try {
            foreach ($requirements as $req) {
                \App\Models\AssignmentUploadRequirement::where('assignment_id', $id)
                    ->where('id', $req['id'])
                    ->update(['sort_order' => $req['sort_order']]);
            }
            DB::commit();

            return response()->json([
                'success' => true,
                'message' => '排序已更新'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * 导出作业作品为ZIP
     */
    public function export($id)
    {
        $assignment = Assignment::findOrFail($id);
        $submissions = $assignment->submissions;

        if ($submissions->isEmpty()) {
            return response()->json([
                'success' => false,
                'error' => '该作业没有作品可导出'
            ], 400);
        }

        $timestamp = now()->format('Y-m-d');
        $zipFileName = "{$assignment->name}_作品导出_{$timestamp}.zip";

        return $this->zipService->exportAssignment(
            $assignment,
            $submissions,
            $zipFileName
        );
    }

    /**
     * 移动上传的文件
     */
    public function moveUploadedFiles($id)
    {
        $files = request('files', []);
        $year = request('year');

        if (empty($files)) {
            return response()->json([
                'success' => true,
                'message' => '没有文件需要移动'
            ]);
        }

        $assignment = Assignment::findOrFail($id);
        $movedFiles = [];

        foreach ($files as $fileUrl) {
            $movedFile = $this->moveFile($fileUrl, $year, $id);
            if ($movedFile) {
                $movedFiles[] = $movedFile;
            }
        }

        // 更新作业描述中的URL
        if (!empty($movedFiles)) {
            $this->updateDescriptionUrls($assignment, $movedFiles);
        }

        return response()->json([
            'success' => true,
            'message' => '成功移动 ' . count($movedFiles) . ' 个文件',
            'movedFiles' => $movedFiles
        ]);
    }

    private function adjustRequirementSortOrder($assignmentId, $requirementId, $oldSortOrder, $newSortOrder)
    {
        if ($newSortOrder < $oldSortOrder) {
            \App\Models\AssignmentUploadRequirement::where('assignment_id', $assignmentId)
                ->where('sort_order', '>=', $newSortOrder)
                ->where('id', '!=', $requirementId)
                ->increment('sort_order');
        } else {
            \App\Models\AssignmentUploadRequirement::where('assignment_id', $assignmentId)
                ->where('sort_order', '>', $oldSortOrder)
                ->where('sort_order', '<=', $newSortOrder)
                ->decrement('sort_order');
        }
    }

    private function moveFile($fileUrl, $year, $assignmentId)
    {
        // 实现文件移动逻辑
        // ...
    }

    private function updateDescriptionUrls($assignment, $movedFiles)
    {
        // 实现URL更新逻辑
        // ...
    }
}
```

### 6.5 UploadTypeController

```php
<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\UploadType\StoreUploadTypeRequest;
use App\Http\Requests\UploadType\UpdateUploadTypeRequest;
use App\Models\UploadType;

class UploadTypeController extends Controller
{
    /**
     * 获取上传类型列表
     */
    public function index()
    {
        $uploadTypes = UploadType::orderBy('sort_order')
            ->orderBy('created_at')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $uploadTypes->map(function ($type) {
                return [
                    ...$type->toArray(),
                    'extensions' => $type->extensions ? explode(',', $type->extensions) : [],
                    'max_file_size' => $type->max_file_size ?? 52428800
                ];
            })
        ]);
    }

    /**
     * 获取单个上传类型
     */
    public function show($id)
    {
        $type = UploadType::findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => [
                ...$type->toArray(),
                'extensions' => $type->extensions ? explode(',', $type->extensions) : [],
                'max_file_size' => $type->max_file_size ?? 52428800
            ]
        ]);
    }

    /**
     * 创建上传类型
     */
    public function store(StoreUploadTypeRequest $request)
    {
        $uploadType = UploadType::create([
            'name' => $request->name,
            'code' => $request->code,
            'description' => $request->description,
            'extensions' => is_array($request->extensions) ? implode(',', $request->extensions) : $request->extensions,
            'max_file_size' => $request->max_file_size ?? 52428800,
            'sort_order' => $request->sort_order ?? 0
        ]);

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $uploadType->id,
                ...$request->all()
            ]
        ], 201);
    }

    /**
     * 更新上传类型
     */
    public function update($id, UpdateUploadTypeRequest $request)
    {
        $uploadType = UploadType::findOrFail($id);

        $uploadType->update([
            'name' => $request->name,
            'code' => $request->code,
            'description' => $request->description,
            'extensions' => is_array($request->extensions) ? implode(',', $request->extensions) : $request->extensions,
            'max_file_size' => $request->max_file_size ?? 52428800,
            'sort_order' => $request->sort_order ?? 0
        ]);

        return response()->json([
            'success' => true,
            'data' => [
                'id' => (int)$id,
                ...$request->all()
            ]
        ]);
    }

    /**
     * 删除上传类型
     */
    public function destroy($id)
    {
        $uploadType = UploadType::findOrFail($id);

        $usageCount = $uploadType->uploadRequirements()->count();

        if ($usageCount > 0) {
            return response()->json([
                'success' => false,
                'error' => "该上传类型被 {$usageCount} 个作业要求使用，无法删除"
            ], 400);
        }

        $uploadType->delete();

        return response()->json([
            'success' => true,
            'message' => '上传类型已删除'
        ]);
    }

    /**
     * 批量更新排序
     */
    public function batchSort()
    {
        $items = request('items');

        \DB::beginTransaction();
        try {
            foreach ($items as $index => $item) {
                UploadType::where('id', $item['id'])
                    ->update(['sort_order' => $index]);
            }
            \DB::commit();

            return response()->json([
                'success' => true,
                'message' => '排序更新成功'
            ]);
        } catch (\Exception $e) {
            \DB::rollBack();
            throw $e;
        }
    }
}
```

### 6.6 FileUploadController

```php
<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\FileService;
use Illuminate\Http\Request;

class FileUploadController extends Controller
{
    protected $fileService;

    public function __construct(FileService $fileService)
    {
        $this->fileService = $fileService;
    }

    /**
     * 上传图片（CKEditor）
     */
    public function uploadImage(Request $request)
    {
        $request->validate([
            'upload' => 'required|image|mimes:png,jpg,jpeg,gif,webp|max:5120'
        ]);

        $assignmentId = $request->input('assignmentId', 'temp');
        $studentYear = $request->input('studentYear', now()->year);

        $path = $this->fileService->uploadCkEditorImage(
            $request->file('upload'),
            $assignmentId,
            $studentYear
        );

        return response()->json([
            'url' => $path,
            'default' => $path
        ]);
    }

    /**
     * 上传作业附件
     */
    public function uploadAttachment(Request $request)
    {
        $request->validate([
            'file' => 'required|file|max:51200'
        ]);

        $assignmentId = $request->input('assignmentId', 'temp');
        $studentYear = $request->input('studentYear', now()->year);

        $result = $this->fileService->uploadAssignmentAttachment(
            $request->file('file'),
            $assignmentId,
            $studentYear
        );

        return response()->json([
            'success' => true,
            'data' => $result
        ]);
    }
}
```

### 6.7 FileController

```php
<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Storage;

class FileController extends Controller
{
    /**
     * 下载文件
     */
    public function download($filename)
    {
        // 安全检查：防止路径遍历
        if (str_contains($filename, '..') || str_contains($filename, '/') || str_contains($filename, '\\')) {
            return response()->view('errors.400', [], 400);
        }

        $filePath = "uploads/{$filename}";

        if (!Storage::exists($filePath)) {
            return response()->view('errors.404', [], 404);
        }

        return Storage::download($filePath, $filename);
    }
}
```

---

## 7. 模型设计

### 7.1 User模型

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens; // Sanctum令牌支持

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'username',
        'password',
        'role',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * 评分的文件
     */
    public function gradedFiles()
    {
        return $this->hasMany(SubmissionFile::class, 'grader_id');
    }

    /**
     * 检查用户是否为管理员
     */
    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    /**
     * 检查用户是否为教师
     */
    public function isTeacher(): bool
    {
        return $this->role === 'teacher';
    }
}
```

### 7.2 Submission模型

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Submission extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_name',
        'student_year',
        'work_name',
        'description',
        'assignment_id',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * 关联的作业
     */
    public function assignment()
    {
        return $this->belongsTo(Assignment::class);
    }

    /**
     * 提交的文件
     */
    public function submissionFiles()
    {
        return $this->hasMany(SubmissionFile::class);
    }
}
```

### 7.3 SubmissionFile模型

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SubmissionFile extends Model
{
    use HasFactory;

    protected $fillable = [
        'submission_id',
        'requirement_id',
        'filename',
        'filepath',
        'thumbnail_path',
        'file_type',
        'is_primary',
        'sort_order',
        'score',
        'grade',
        'grader_id',
        'graded_at',
    ];

    protected $casts = [
        'is_primary' => 'boolean',
        'sort_order' => 'integer',
        'score' => 'integer',
        'graded_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * 关联的提交
     */
    public function submission()
    {
        return $this->belongsTo(Submission::class);
    }

    /**
     * 关联的作业要求
     */
    public function requirement()
    {
        return $this->belongsTo(AssignmentUploadRequirement::class, 'requirement_id');
    }

    /**
     * 评分者
     */
    public function grader()
    {
        return $this->belongsTo(User::class, 'grader_id');
    }
}
```

### 7.4 Student模型

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Student extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'year',
        'grade',
        'class_number',
    ];

    protected $casts = [
        'year' => 'integer',
        'class_number' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
}
```

### 7.5 Assignment模型

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Assignment extends Model
{
    use HasFactory;

    protected $fillable = [
        'year',
        'name',
        'upload_types',
        'description',
        'deadline',
        'status',
        'sort_order',
    ];

    protected $casts = [
        'year' => 'integer',
        'sort_order' => 'integer',
        'deadline' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * 获取上传类型（解析JSON）
     */
    public function getUploadTypesAttribute($value)
    {
        return json_decode($value, true) ?? [];
    }

    /**
     * 设置上传类型（转为JSON）
     */
    public function setUploadTypesAttribute($value)
    {
        $this->attributes['upload_types'] = is_array($value) ? json_encode($value) : $value;
    }

    /**
     * 提交的作品
     */
    public function submissions()
    {
        return $this->hasMany(Submission::class);
    }

    /**
     * 上传要求
     */
    public function uploadRequirements()
    {
        return $this->hasMany(AssignmentUploadRequirement::class, 'assignment_id');
    }
}
```

### 7.6 AssignmentUploadRequirement模型

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AssignmentUploadRequirement extends Model
{
    use HasFactory;

    protected $fillable = [
        'assignment_id',
        'name',
        'upload_type',
        'is_required',
        'is_published',
        'sort_order',
    ];

    protected $casts = [
        'is_required' => 'boolean',
        'is_published' => 'boolean',
        'sort_order' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * 关联的作业
     */
    public function assignment()
    {
        return $this->belongsTo(Assignment::class);
    }

    /**
     * 关联的提交文件
     */
    public function submissionFiles()
    {
        return $this->hasMany(SubmissionFile::class, 'requirement_id');
    }
}
```

### 7.7 UploadType模型

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UploadType extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'description',
        'extensions',
        'max_file_size',
        'sort_order',
    ];

    protected $casts = [
        'max_file_size' => 'integer',
        'sort_order' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * 获取扩展名数组
     */
    public function getExtensionsAttribute($value)
    {
        return $value ? explode(',', $value) : [];
    }

    /**
     * 设置扩展名
     */
    public function setExtensionsAttribute($value)
    {
        $this->attributes['extensions'] = is_array($value) ? implode(',', $value) : $value;
    }

    /**
     * 关联的作业要求
     */
    public function uploadRequirements()
    {
        return $this->hasMany(AssignmentUploadRequirement::class, 'upload_type', 'code');
    }
}
```

---

## 8. 中间件设计

### 8.1 CheckRole中间件

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CheckRole
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next, ...$roles)
    {
        if (!$request->user()) {
            return response()->json([
                'success' => false,
                'error' => '未认证'
            ], 401);
        }

        if (!in_array($request->user()->role, $roles)) {
            return response()->json([
                'success' => false,
                'error' => '权限不足'
            ], 403);
        }

        return $next($request);
    }
}
```

### 8.2 JsonResponse中间件

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class JsonResponse
{
    /**
     * 强制所有响应为JSON
     */
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);

        // 如果响应不是JSON，转换成JSON
        if (!$request->expectsJson() && method_exists($response, 'header')) {
            $response->header('Content-Type', 'application/json');
        }

        return $response;
    }
}
```

### 8.3 OptionalAuth中间件

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class OptionalAuth
{
    /**
     * 可选认证中间件
     */
    public function handle(Request $request, Closure $next)
    {
        $token = $request->bearerToken();

        if ($token) {
            try {
                Auth::setUser(
                    \Laravel\Sanctum\PersonalAccessToken::findToken($token)?->tokenable
                );
            } catch (\Exception $e) {
                // 静默失败，继续请求
            }
        }

        return $next($request);
    }
}
```

---

## 9. 文件处理方案

### 9.1 FileService

```php
<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class FileService
{
    /**
     * 处理作品提交文件
     */
    public function handleSubmissionFiles(array $data, int $submissionId, int $studentYear, ?int $assignmentId): array
    {
        $files = [];

        // 处理单文件上传
        if (isset($data['stlFile']) && $data['stlFile'] instanceof UploadedFile) {
            $fileData = $this->storePrimaryFile($data['stlFile'], $data['thumbnail'] ?? null, $submissionId, $studentYear, $assignmentId);
            $files[] = $fileData;
        }

        // 处理多文件上传
        if (isset($data['files']) && is_array($data['files'])) {
            $requirementIds = isset($data['requirementIds']) ? json_decode($data['requirementIds'], true) : [];

            foreach ($data['files'] as $index => $file) {
                if ($file instanceof UploadedFile) {
                    $thumbnail = $data['thumbnails'][$index] ?? null;
                    $requirementId = $requirementIds[$index] ?? null;

                    $fileData = $this->storeSecondaryFile($file, $thumbnail, $submissionId, $studentYear, $assignmentId, $requirementId, $index);
                    $files[] = $fileData;
                }
            }
        }

        return $files;
    }

    /**
     * 存储主文件
     */
    protected function storePrimaryFile(UploadedFile $file, ?UploadedFile $thumbnail, int $submissionId, int $studentYear, ?int $assignmentId): array
    {
        $filename = $this->generateFilename($studentYear, $assignmentId, $file);
        $filepath = $this->getFilePath($studentYear, $assignmentId, $submissionId, $filename);
        $thumbnailPath = null;

        // 存储主文件
        Storage::disk('local')->put($filepath, file_get_contents($file));

        // 存储缩略图
        if ($thumbnail) {
            $thumbFilename = pathinfo($filename, PATHINFO_FILENAME) . '_thumbnail.jpg';
            $thumbFilepath = $this->getThumbnailPath($studentYear, $assignmentId, $submissionId, $thumbFilename);
            Storage::disk('local')->put($thumbFilepath, file_get_contents($thumbnail));
            $thumbnailPath = $thumbFilepath;
        }

        // 创建数据库记录
        $submissionFile = \App\Models\SubmissionFile::create([
            'submission_id' => $submissionId,
            'filename' => $filename,
            'filepath' => $filepath,
            'thumbnail_path' => $thumbnailPath,
            'is_primary' => true,
            'file_type' => 'primary'
        ]);

        return [
            'id' => $submissionFile->id,
            'filename' => $filename,
            'filepath' => $filepath,
            'thumbnail_path' => $thumbnailPath,
            'is_primary' => true
        ];
    }

    /**
     * 存储次级文件
     */
    protected function storeSecondaryFile(UploadedFile $file, ?UploadedFile $thumbnail, int $submissionId, int $studentYear, ?int $assignmentId, ?int $requirementId, int $sortOrder): array
    {
        $filename = $this->generateFilename($studentYear, $assignmentId, $file);
        $filepath = $this->getFilePath($studentYear, $assignmentId, $submissionId, $filename);
        $thumbnailPath = null;

        // 存储主文件
        Storage::disk('local')->put($filepath, file_get_contents($file));

        // 存储缩略图
        if ($thumbnail) {
            $thumbFilename = pathinfo($filename, PATHINFO_FILENAME) . '_thumbnail.jpg';
            $thumbFilepath = $this->getThumbnailPath($studentYear, $assignmentId, $submissionId, $thumbFilename);
            Storage::disk('local')->put($thumbFilepath, file_get_contents($thumbnail));
            $thumbnailPath = $thumbFilepath;
        }

        // 创建数据库记录
        $submissionFile = \App\Models\SubmissionFile::create([
            'submission_id' => $submissionId,
            'requirement_id' => $requirementId,
            'filename' => $filename,
            'filepath' => $filepath,
            'thumbnail_path' => $thumbnailPath,
            'is_primary' => false,
            'sort_order' => $sortOrder,
            'file_type' => 'general'
        ]);

        return [
            'id' => $submissionFile->id,
            'requirement_id' => $requirementId,
            'filename' => $filename,
            'filepath' => $filepath,
            'thumbnail_path' => $thumbnailPath,
            'sort_order' => $sortOrder
        ];
    }

    /**
     * 上传CKEditor图片
     */
    public function uploadCkEditorImage(UploadedFile $file, string $assignmentId, int $studentYear): string
    {
        $filename = $this->generateFilename($studentYear, $assignmentId, $file);
        $filepath = $this->getArticlePath($studentYear, $assignmentId, $filename);

        Storage::disk('local')->put($filepath, file_get_contents($file));

        return "/uploads/{$filepath}";
    }

    /**
     * 上传作业附件
     */
    public function uploadAssignmentAttachment(UploadedFile $file, string $assignmentId, int $studentYear): array
    {
        $filename = $this->generateFilename($studentYear, $assignmentId, $file);
        $filepath = $this->getArticlePath($studentYear, $assignmentId, $filename);

        Storage::disk('local')->put($filepath, file_get_contents($file));

        return [
            'filename' => $filename,
            'filepath' => "/uploads/{$filepath}",
            'originalname' => $file->getClientOriginalName(),
            'size' => $file->getSize(),
            'mimetype' => $file->getMimeType()
        ];
    }

    /**
     * 删除文件
     */
    public function deleteFile(string $path): bool
    {
        return Storage::disk('local')->delete($path);
    }

    /**
     * 获取公共URL
     */
    public function getPublicUrl(string $path): string
    {
        return "/uploads/{$path}";
    }

    /**
     * 生成文件名
     */
    protected function generateFilename(int $studentYear, ?int $assignmentId, UploadedFile $file): string
    {
        $uniqueSuffix = time() . '-' . Str::random(9);
        return "{$studentYear}_{$assignmentId}_{$uniqueSuffix}" . $file->getClientOriginalExtension();
    }

    /**
     * 获取文件路径
     */
    protected function getFilePath(int $studentYear, ?int $assignmentId, int $submissionId, string $filename): string
    {
        return "uploads/{$studentYear}/{$assignmentId}/{$submissionId}/{$filename}";
    }

    /**
     * 获取缩略图路径
     */
    protected function getThumbnailPath(int $studentYear, ?int $assignmentId, int $submissionId, string $filename): string
    {
        return "thumbnails/{$studentYear}/{$assignmentId}/{$submissionId}/{$filename}";
    }

    /**
     * 获取文章路径
     */
    protected function getArticlePath(int $studentYear, string $assignmentId, string $filename): string
    {
        return "uploads/{$studentYear}/{$assignmentId}/article/{$filename}";
    }
}
```

### 9.2 ZipService

```php
<?php

namespace App\Services;

use App\Models\Assignment;
use App\Models\Submission;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Response;
use ZipArchive;

class ZipService
{
    /**
     * 导出作业作品为ZIP
     */
    public function exportAssignment(Assignment $assignment, $submissions, string $zipFileName)
    {
        $zip = new ZipArchive();
        $tempPath = storage_path('app/temp/' . $zipFileName);

        if ($zip->open($tempPath, ZipArchive::CREATE) !== true) {
            throw new \Exception('无法创建ZIP文件');
        }

        // 添加作品清单
        $manifest = $submissions->map(function ($submission) {
            return [
                'id' => $submission->id,
                'student_name' => $submission->student_name,
                'student_year' => $submission->student_year,
                'work_name' => $submission->work_name,
                'description' => $submission->description,
                'filename' => $submission->filename,
                'created_at' => $submission->created_at
            ];
        })->toArray();

        $zip->addFromString('作品清单.json', json_encode($manifest, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

        // 添加所有文件
        foreach ($submissions as $submission) {
            foreach ($submission->submissionFiles as $file) {
                if (Storage::exists($file->filepath)) {
                    $content = Storage::get($file->filepath);
                    $zip->addFromString($file->filename, $content);
                }

                if ($file->thumbnail_path && Storage::exists($file->thumbnail_path)) {
                    $content = Storage::get($file->thumbnail_path);
                    $zip->addFromString(pathinfo($file->filename, PATHINFO_FILENAME) . '_thumb.jpg', $content);
                }
            }
        }

        $zip->close();

        // 返回下载响应
        return Response::download($tempPath, $zipFileName)->deleteFileAfterSend(true);
    }
}
```

---

## 10. 认证系统

### 10.1 Laravel Sanctum概述

本项目使用 **Laravel Sanctum** 作为API认证系统。Sanctum为SPA（单页应用）、移动应用和基于令牌的简单API系统提供轻量级的认证解决方案。

**为什么选择Sanctum**：
- 支持SPA和移动应用的认证需求
- 简单的API令牌认证
- 支持令牌能力/权限管理
- 内置CSRF保护
- 与Laravel生态系统无缝集成
- 支持会话和令牌两种认证方式

### 10.2 Sanctum安装配置

#### 10.2.1 安装Sanctum

```bash
composer require laravel/sanctum
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"
```

#### 10.2.2 发布配置文件

Sanctum的配置文件位于 `config/sanctum.php`，主要配置如下：

```php
<?php

return [
    // SPA认证的有状态域名（前端域名）
    'stateful' => explode(',', env('SANCTUM_STATEFUL_DOMAINS', sprintf(
        '%s%s',
        'localhost,localhost:3000,127.0.0.1,127.0.0.1:8000,::1',
        env('APP_URL') ? ','.parse_url(env('APP_URL'), PHP_URL_HOST) : ''
    ))),

    // Sanctum使用的守卫
    'guard' => ['web'],

    // 令牌过期时间（null表示永不过期）
    'expiration' => null,

    // 中间件配置
    'middleware' => [
        'verify_csrf_token' => App\Http\Middleware\VerifyCsrfToken::class,
        'encrypt_cookies' => App\Http\Middleware\EncryptCookies::class,
    ],
];
```

#### 10.2.3 数据库迁移

Sanctum需要一个表来存储API令牌：

```bash
php artisan migrate
```

这将创建 `personal_access_tokens` 表，结构如下：

```sql
CREATE TABLE personal_access_tokens (
    id SERIAL PRIMARY KEY,
    tokenable_type VARCHAR(255) NOT NULL,
    tokenable_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    token VARCHAR(64) NOT NULL UNIQUE,
    abilities TEXT,
    last_used_at TIMESTAMP NULL,
    expires_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 10.3 认证配置

#### 10.3.1 配置auth.php

在 `config/auth.php` 中配置Sanctum作为API守卫：

```php
<?php

return [
    'defaults' => [
        'guard' => 'web',
        'passwords' => 'users',
    ],

    'guards' => [
        'web' => [
            'driver' => 'session',
            'provider' => 'users',
        ],
        'api' => [
            'driver' => 'sanctum',
            'provider' => 'users',
            'hash' => false,
        ],
    ],

    'providers' => [
        'users' => [
            'driver' => 'eloquent',
            'model' => App\Models\User::class,
        ],
    ],

    'passwords' => [
        'users' => [
            'provider' => 'users',
            'table' => 'password_resets',
            'expire' => 60,
            'throttle' => 60,
        ],
    ],
];
```

#### 10.3.2 User模型配置

在 `app/Models/User.php` 中添加Sanctum trait：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens; // 添加这一行

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable; // 添加 HasApiTokens

    protected $fillable = [
        'username',
        'password',
        'role',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
}
```

### 10.4 令牌认证流程

#### 10.4.1 登录并创建令牌

```php
// AuthController::login()
public function login(LoginRequest $request)
{
    $credentials = $request->only('username', 'password');

    if (!Auth::attempt($credentials)) {
        return response()->json([
            'success' => false,
            'error' => '用户名或密码错误'
        ], 401);
    }

    $user = Auth::user();
    // 创建API令牌，名称为 'api-token'
    $token = $user->createToken('api-token')->plainTextToken;

    return response()->json([
        'success' => true,
        'data' => [
            'token' => $token,  // 返回令牌给客户端
            'token_type' => 'Bearer',
            'user' => [
                'id' => $user->id,
                'username' => $user->username,
                'role' => $user->role
            ]
        ]
    ]);
}
```

#### 10.4.2 使用令牌访问API

客户端在请求头中添加令牌：

```http
Authorization: Bearer {token}
```

#### 10.4.3 路由保护

```php
// 需要认证的路由
Route::middleware('auth:api')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/change-password', [AuthController::class, 'changePassword']);
});

// 需要管理员权限的路由
Route::middleware('auth:api', 'role:admin')->group(function () {
    Route::post('/users', [AuthController::class, 'createUser']);
    Route::get('/users', [AuthController::class, 'users']);
});
```

### 10.5 令牌管理

#### 10.5.1 撤销令牌

```php
// 撤销当前令牌
$request->user()->currentAccessToken()->delete();

// 撤销所有令牌
$request->user()->tokens()->delete();

// 撤销特定令牌
$request->user()->tokens()->where('id', $tokenId)->delete();
```

#### 10.5.2 添加注销功能

```php
// AuthController::logout()
public function logout(Request $request)
{
    // 撤销当前令牌
    $request->user()->currentAccessToken()->delete();

    return response()->json([
        'success' => true,
        'message' => '注销成功'
    ]);
}
```

#### 10.5.3 令牌能力（可选）

创建令牌时可以指定能力/权限：

```php
// 创建带能力的令牌
$token = $user->createToken('api-token', ['server:update'])->plainTextToken;

// 在中间件中检查能力
Route::middleware('auth:api')->group(function () {
    Route::post('/server/update', function () {
        // 只有具有 'server:update' 能力的令牌才能访问
    })->middleware('ability:server:update');
});
```

### 10.6 环境变量配置

在 `.env` 文件中添加Sanctum相关配置：

```env
# Sanctum配置
SANCTUM_STATEFUL_DOMAINS=localhost,localhost:3000,127.0.0.1

# CORS配置（允许的前端域名）
SANCTUM_TOKEN_EXPIRATION=604800  # 7天（秒），null表示永不过期
```

### 10.7 中间件集成

#### 10.7.1 EnsureFrontendRequestsAreStateful

在 `app/Http/Kernel.php` 中配置：

```php
protected $middlewareGroups = [
    'web' => [
        // ... 其他中间件
        \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
    ],

    'api' => [
        // ... 其他中间件
        \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
        'throttle:api',
        \Illuminate\Routing\Middleware\SubstituteBindings::class,
    ],
];
```

#### 10.7.2 自定义认证中间件

```php
// app/Http/Middleware/Authenticate.php
public function handle($request, Closure $next, ...$guards)
{
    if ($jwt = $request->bearerToken()) {
        // 尝试验证Bearer令牌（Sanctum）
        $model = Sanctum::$personalAccessTokenModel;
        $accessToken = $model::findToken($jwt);

        if ($accessToken) {
            return $next($request->authenticate());
        }
    }

    return parent::handle($request, $next, ...$guards);
}
```

### 10.8 安全最佳实践

#### 10.8.1 令牌存储

- **服务端**: 令牌存储在 `personal_access_tokens` 表中
- **客户端**: 建议存储在安全的地方（如HttpOnly Cookie或内存）
- **不要**将令牌存储在localStorage中（易受XSS攻击）

#### 10.8.2 令牌过期

```php
// config/sanctum.php
'expiration' => 60 * 24 * 7, // 7天过期
```

#### 10.8.3 令牌刷新

建议实现令牌刷新机制：

```php
// AuthController::refreshToken()
public function refreshToken(Request $request)
{
    $user = $request->user();
    
    // 撤销旧令牌
    $user->currentAccessToken()->delete();
    
    // 创建新令牌
    $token = $user->createToken('api-token')->plainTextToken;
    
    return response()->json([
        'success' => true,
        'data' => [
            'token' => $token,
            'token_type' => 'Bearer'
        ]
    ]);
}
```

### 10.9 与现有JWT系统的迁移对比

| 特性 | Express JWT | Laravel Sanctum |
|------|------------|-----------------|
| 令牌存储 | 无状态（JWT） | 数据库存储 |
| 令牌撤销 | 困难 | 简单 |
| 令牌能力 | 自定义实现 | 内置支持 |
| 会话支持 | 无 | 支持 |
| CORS处理 | 手动配置 | 自动处理 |
| 安全性 | 高（加密签名） | 高（加密存储） |
| 性能 | 较快（无数据库查询） | 稍慢（需要查询令牌） |

### 10.10 API响应格式

#### 10.10.1 认证成功

```json
{
    "success": true,
    "data": {
        "token": "1|xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        "token_type": "Bearer",
        "user": {
            "id": 1,
            "username": "admin",
            "role": "admin"
        }
    }
}
```

#### 10.10.2 认证失败

```json
{
    "success": false,
    "error": "用户名或密码错误"
}
```

#### 10.10.3 令牌无效/过期

```json
{
    "message": "Unauthenticated."
}
```

### 10.11 测试令牌认证

#### 10.11.1 使用Postman测试

1. 首先调用登录API获取令牌
2. 在请求头中添加：`Authorization: Bearer {token}`
3. 访问受保护的API

#### 10.11.2 使用PHPUnit测试

```php
public function test_authenticated_user_can_access_protected_route()
{
    $user = User::factory()->create();
    $token = $user->createToken('test-token')->plainTextToken;

    $response = $this->withHeaders([
        'Authorization' => 'Bearer ' . $token,
    ])->get('/api/v1/auth/me');

    $response->assertStatus(200);
    $response->assertJson([
        'success' => true,
        'data' => [
            'id' => $user->id,
            'username' => $user->username
        ]
    ]);
}
```

### 10.12 故障排查

#### 10.12.1 令牌无效

**问题**: 返回401 Unauthenticated

**解决方案**:
1. 检查令牌是否正确发送
2. 检查令牌是否已撤销
3. 检查令牌是否过期
4. 确认路由使用了正确的中间件

#### 10.12.2 CORS错误

**问题**: 前端无法调用API

**解决方案**:
1. 检查 `config/cors.php` 配置
2. 确认前端域名在 `SANCTUM_STATEFUL_DOMAINS` 中
3. 检查Nginx/Apache的CORS配置

#### 10.12.3 令牌存储问题

**问题**: 令牌创建失败

**解决方案**:
1. 运行 `php artisan migrate` 创建令牌表
2. 检查数据库连接配置
3. 确认User模型使用了 `HasApiTokens` trait

---

## 11. 实施步骤

### 阶段1: 项目初始化（第1-2周）

#### 1.1 创建Laravel项目
```bash
composer create-project laravel/laravel laravel-backend
cd laravel-backend
```

#### 1.2 配置环境变量
```bash
cp .env.example .env
php artisan key:generate
```

编辑 `.env` 文件：
```env
APP_NAME="3D班级管理系统"
APP_ENV=local
APP_KEY=base64:...
APP_DEBUG=true
APP_URL=http://localhost:8000

LOG_CHANNEL=stack
LOG_DEPRECATIONS_CHANNEL=null
LOG_LEVEL=debug

DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=stl_manager
DB_USERNAME=stl_user
DB_PASSWORD=stl_password_2024

BROADCAST_DRIVER=log
CACHE_DRIVER=redis
FILESYSTEM_DISK=local
QUEUE_CONNECTION=redis
SESSION_DRIVER=file
SESSION_LIFETIME=120

MEMCACHED_HOST=127.0.0.1

REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379

MAIL_MAILER=smtp
MAIL_HOST=mailhog
MAIL_PORT=1025
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_ENCRYPTION=null
MAIL_FROM_ADDRESS="hello@example.com"
MAIL_FROM_NAME="${APP_NAME}"

# Laravel Sanctum配置
SANCTUM_STATEFUL_DOMAINS=localhost,localhost:3000,127.0.0.1
SANCTUM_TOKEN_EXPIRATION=604800  # 7天（秒），null表示永不过期
```

#### 1.3 安装必要依赖
```bash
# 安装Laravel Sanctum（用于API认证）
composer require laravel/sanctum

# 发布Sanctum配置文件
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"

# 运行数据库迁移（创建personal_access_tokens表）
php artisan migrate
```

### 阶段2: 数据库迁移（第3周）

#### 2.1 创建迁移文件
```bash
php artisan make:migration create_users_table
php artisan make:migration create_students_table
php artisan make:migration create_assignments_table
php artisan make:migration create_upload_types_table
php artisan make:migration create_assignment_upload_requirements_table
php artisan make:migration create_submissions_table
php artisan make:migration create_submission_files_table
```

#### 2.2 运行迁移
```bash
php artisan migrate
```

#### 2.3 创建Seeders
```bash
php artisan make:seeder UserSeeder
php artisan make:seeder UploadTypeSeeder
php artisan make:seeder StudentSeeder
php artisan db:seed
```

### 阶段3: 模型和控制器开发（第4-6周）

#### 3.1 创建模型
```bash
php artisan make:model User
php artisan make:model Student
php artisan make:model Assignment
php artisan make:model UploadType
php artisan make:model Submission
php artisan make:model SubmissionFile
php artisan make:model AssignmentUploadRequirement
```

#### 3.2 创建控制器
```bash
php artisan make:controller Api/V1/AuthController
php artisan make:controller Api/V1/SubmissionController
php artisan make:controller Api/V1/StudentController
php artisan make:controller Api/V1/AssignmentController
php artisan make:controller Api/V1/UploadTypeController
php artisan make:controller Api/V1/FileUploadController
php artisan make:controller Api/V1/FileController
```

#### 3.3 创建请求验证类
```bash
php artisan make:request Auth/LoginRequest
php artisan make:request Auth/ChangePasswordRequest
php artisan make:request Submission/StoreSubmissionRequest
php artisan make:request Submission/GradeFileRequest
# ... 其他请求验证类
```

### 阶段4: 服务层开发（第7周）

#### 4.1 创建服务类
```bash
mkdir -p app/Services
touch app/Services/FileService.php
touch app/Services/ZipService.php
touch app/Services/AuthService.php
```

### 阶段5: 中间件开发（第8周）

#### 5.1 创建中间件
```bash
php artisan make:middleware CheckRole
php artisan make:middleware JsonResponse
php artisan make:middleware OptionalAuth
```

注册中间件到 `app/Http/Kernel.php`：
```php
protected $middlewareAliases = [
    // ...
    'role' => \App\Http\Middleware\CheckRole::class,
    'json.response' => \App\Http\Middleware\JsonResponse::class,
    'optional.auth' => \App\Http\Middleware\OptionalAuth::class,
];
```

### 阶段6: 路由配置（第9周）

#### 6.1 配置API路由
编辑 `routes/api.php`，添加所有API路由。

#### 6.2 配置CORS
编辑 `config/cors.php`：
```php
return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => ['http://localhost:3000'],
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,
];
```

### 阶段7: 文件系统配置（第10周）

#### 7.1 配置文件系统
编辑 `config/filesystems.php`：
```php
'disks' => [
    'local' => [
        'driver' => 'local',
        'root' => storage_path('app'),
        'throw' => false,
    ],
    'public' => [
        'driver' => 'local',
        'root' => storage_path('app/public'),
        'url' => env('APP_URL').'/storage',
        'visibility' => 'public',
        'throw' => false,
    ],
    'uploads' => [
        'driver' => 'local',
        'root' => base_path('public/uploads'),
        'url' => env('APP_URL').'/uploads',
        'visibility' => 'public',
    ],
],
```

#### 7.2 创建符号链接
```bash
php artisan storage:link
```

### 阶段8: 测试开发（第11-12周）

#### 8.1 创建测试
```bash
php artisan make:test Feature/AuthTest
php artisan make:test Feature/SubmissionTest
php artisan make:test Feature/StudentTest
php artisan make:test Feature/AssignmentTest
php artisan make:test Feature/UploadTypeTest
php artisan make:test Unit/FileServiceTest
php artisan make:test Unit/AuthServiceTest
```

#### 8.2 运行测试
```bash
php artisan test
```

### 阶段9: 部署准备（第13周）

#### 9.1 性能优化
```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache
```

#### 9.2 生产环境配置
- 配置Nginx
- 配置Supervisor（队列处理）
- 配置日志轮转

### 阶段10: 数据迁移和切换（第14周）

#### 10.1 并行运行测试
- 同时运行Express和Laravel
- 验证API响应一致性
- 性能对比测试

#### 10.2 切换到Laravel
- 更新前端API端点
- 禁用Express服务
- 监控系统运行状态

---

## 12. 测试计划

### 12.1 单元测试

#### 12.1.1 AuthServiceTest
- 测试登录功能
- 测试密码修改
- 测试用户创建
- 测试角色验证

#### 12.1.2 FileServiceTest
- 测试文件上传
- 测试文件删除
- 测试文件路径生成
- 测试文件移动

### 12.2 功能测试

#### 12.2.1 AuthTest
- 测试登录功能（Sanctum令牌生成）
- 测试获取用户信息
- 测试令牌认证
- 测试修改密码
- 测试用户CRUD操作
- 测试令牌刷新
- 测试令牌撤销（注销）
- 测试管理员权限验证

#### 12.2.2 SubmissionTest
- 测试作品提交
- 测试作品列表查询
- 测试作品详情查询
- 测试作品评分
- 测试作品删除

#### 12.2.3 StudentTest
- 测试学生CRUD操作
- 测试学生列表查询
- 测试学生数据验证

#### 12.2.4 AssignmentTest
- 测试作业CRUD操作
- 测试作业要求管理
- 测试作业导出功能
- 测试作业排序功能

#### 12.2.5 UploadTypeTest
- 测试上传类型CRUD操作
- 测试批量排序功能

### 12.3 集成测试

#### 12.3.1 API集成测试
- 测试完整的用户工作流
- 测试文件上传到评分的完整流程
- 测试作业创建到导出的完整流程

#### 12.3.2 性能测试
- 使用JMeter进行负载测试
- 测试并发上传性能
- 测试数据库查询性能

### 12.4 兼容性测试

#### 12.4.1 API兼容性测试
- 对比Express和Laravel的API响应
- 确保前端无缝切换

#### 12.4.2 数据迁移测试
- 验证数据完整性
- 测试数据一致性

---

## 13. 部署方案

### 13.1 服务器环境要求

| 组件 | 版本/要求 |
|------|----------|
| PHP | 8.2+ |
| Composer | 2.x |
| PostgreSQL | 12+ |
| Nginx | 1.18+ |
| Redis | 6.x |
| Supervisor | 4.x |

### 13.2 Nginx配置

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/laravel-backend/public;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    index index.php;

    charset utf-8;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }

    location /uploads {
        alias /var/www/laravel-backend/public/uploads;
    }

    location /thumbnails {
        alias /var/www/laravel-backend/storage/app/thumbnails;
    }
}
```

### 13.3 Supervisor配置

```ini
[program:laravel-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/laravel-backend/artisan queue:work --sleep=3 --tries=3
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
numprocs=4
redirect_stderr=true
stdout_logfile=/var/www/laravel-backend/storage/logs/worker.log
stopwaitsecs=3600
```

### 13.4 部署流程

#### 13.4.1 首次部署
```bash
# 克隆代码
git clone <repository> /var/www/laravel-backend
cd /var/www/laravel-backend

# 安装依赖
composer install --optimize-autoloader --no-dev

# 配置环境
cp .env.example .env
php artisan key:generate

# 设置权限
chown -R www-data:www-data storage bootstrap/cache
chmod -R 775 storage bootstrap/cache

# 运行迁移
php artisan migrate --force

# 缓存配置
php artisan config:cache
php artisan route:cache
php artisan view:cache

# 重启服务
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl restart laravel-worker:*
sudo systemctl reload nginx
```

#### 13.4.2 更新部署
```bash
# 拉取最新代码
cd /var/www/laravel-backend
git pull origin main

# 安装依赖
composer install --optimize-autoloader --no-dev

# 运行迁移
php artisan migrate --force

# 缓存配置
php artisan config:cache
php artisan route:cache
php artisan view:cache

# 重启服务
sudo supervisorctl restart laravel-worker:*
sudo systemctl reload nginx
```

### 13.5 监控和日志

#### 13.5.1 日志配置
在 `.env` 中配置日志级别：
```env
LOG_CHANNEL=daily
LOG_LEVEL=warning
LOG_DAYS=30
```

#### 13.5.2 监控工具
- 使用Laravel Telescope进行应用监控
- 使用Laravel Horizon监控队列
- 使用Sentry进行错误追踪

---

## 14. 风险评估

### 14.1 技术风险

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| 数据迁移失败 | 中 | 高 | 完整的数据备份，分阶段迁移 |
| API不兼容 | 低 | 高 | 详细的API对比测试，版本控制 |
| 性能下降 | 中 | 中 | 性能基准测试，优化查询 |
| 文件路径问题 | 中 | 中 | 统一的文件路径管理策略 |

### 14.2 项目风险

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| 开发周期延长 | 中 | 中 | 详细的实施计划，里程碑管理 |
| 人力资源不足 | 低 | 高 | 提前培训，外部支持 |
| 需求变更 | 中 | 中 | 敏捷开发，迭代交付 |

### 14.3 运营风险

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| 系统宕机 | 低 | 高 | 高可用架构，备份方案 |
| 数据丢失 | 低 | 高 | 定期备份，异地容灾 |
| 安全漏洞 | 中 | 高 | 安全审计，及时更新 |

---

## 15. 附录

### 15.1 相关文档

- [Laravel官方文档](https://laravel.com/docs/11.x)
- [Laravel Sanctum文档](https://laravel.com/docs/11.x/sanctum)
- [Eloquent ORM文档](https://laravel.com/docs/11.x/eloquent)
- [PostgreSQL文档](https://www.postgresql.org/docs/)

### 15.2 工具推荐

| 类别 | 工具 | 用途 |
|------|------|------|
| IDE | PhpStorm/Laravel Idea | 开发环境 |
| API测试 | Postman/Insomnia | API测试 |
| 数据库管理 | pgAdmin/DBeaver | 数据库管理 |
| 版本控制 | Git | 代码管理 |
| 部署工具 | Deployer/Laravel Forge | 自动部署 |
| 监控 | Laravel Telescope | 应用监控 |
| 错误追踪 | Sentry | 错误监控 |

### 15.3 关键指标

| 指标 | 目标值 |
|------|--------|
| API响应时间 | < 200ms (P95) |
| 数据库查询时间 | < 100ms (P95) |
| 文件上传速度 | > 10MB/s |
| 系统可用性 | > 99.9% |
| 测试覆盖率 | > 80% |

### 15.4 联系方式

- 项目负责人：[待定]
- 技术负责人：[待定]
- 文档维护：[待定]

---

**文档结束**

本文档提供了完整的Laravel重构计划，涵盖从架构设计到实施部署的所有关键方面。在实施过程中，请根据实际情况灵活调整，确保项目顺利完成。