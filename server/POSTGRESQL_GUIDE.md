# PostgreSQL 迁移指南

## 概述

本指南说明如何将3D班级管理系统从SQLite迁移到PostgreSQL数据库。

## 为什么选择 PostgreSQL？

### 相比 SQLite 的优势

1. **并发性能**：支持更高的并发用户访问
2. **数据完整性**：更强大的事务和约束支持
3. **扩展性**：支持水平扩展和读写分离
4. **企业级功能**：支持全文搜索、JSON数据类型、GIS等
5. **生产就绪**：经过大规模生产环境验证

### 适用场景

- 30个或更多并发用户
- 需要高可用性和数据备份
- 需要复杂查询和数据分析
- 需要实时数据同步

## 前置要求

### 1. 安装 PostgreSQL

#### Ubuntu/Debian
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
```

#### macOS
```bash
brew install postgresql@16
brew services start postgresql@16
```

#### Windows
下载并安装 [PostgreSQL](https://www.postgresql.org/download/windows/)

### 2. 创建数据库和用户

```bash
# 以 postgres 用户身份登录
sudo -u postgres psql

# 在 PostgreSQL 提示符下执行以下命令

# 创建数据库
CREATE DATABASE stl_manager;

# 创建用户（可选，也可以使用默认的 postgres 用户）
CREATE USER stlmanager WITH PASSWORD 'your-secure-password';

# 授予权限
GRANT ALL PRIVILEGES ON DATABASE stl_manager TO stlmanager;

# 退出
\q
```

## 配置步骤

### 1. 安装 Node.js 依赖

```bash
cd server
npm install pg
```

### 2. 配置环境变量

编辑 `server/.env` 文件：

```env
# 数据库类型配置
DB_TYPE=postgresql

# PostgreSQL配置
PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=stl_manager
PG_USER=stlmanager
PG_PASSWORD=your-secure-password

# 其他配置保持不变...
```

### 3. 迁移数据（如果从 SQLite 迁移）

如果你有现有的 SQLite 数据库数据，使用迁移脚本：

```bash
cd server
node scripts/migrate-to-postgresql.js
```

迁移脚本会：
- ✅ 迁移所有表的数据
- ✅ 保留数据关系
- ✅ 显示迁移进度和统计信息

### 4. 启动服务器

```bash
cd server
npm start
```

## 数据库管理

### 连接到 PostgreSQL

```bash
# 使用 psql 命令行工具
psql -h localhost -U stlmanager -d stl_manager

# 或使用默认的 postgres 用户
psql -h localhost -U postgres -d stl_manager
```

### 常用管理命令

#### 查看所有表
```sql
\dt
```

#### 查看表结构
```sql
\d users
\d assignments
\d submissions
```

#### 查询用户
```sql
SELECT id, username, role, created_at FROM users;
```

#### 查看统计数据
```sql
-- 作品统计
SELECT COUNT(*) as total_submissions FROM submissions;

-- 作业统计
SELECT id, name, year, status FROM assignments;

-- 学生统计
SELECT year, COUNT(*) as student_count 
FROM students 
GROUP BY year;
```

#### 备份数据库
```bash
pg_dump -h localhost -U stlmanager stl_manager > backup.sql
```

#### 恢复数据库
```bash
psql -h localhost -U stlmanager stl_manager < backup.sql
```

## 性能优化

### 1. 创建索引

```sql
-- 为 submissions 表添加索引
CREATE INDEX idx_submissions_assignment_id ON submissions(assignment_id);
CREATE INDEX idx_submissions_student_year ON submissions(student_year);

-- 为 assignments 表添加索引
CREATE INDEX idx_assignments_year_status ON assignments(year, status);

-- 为 students 表添加索引
CREATE INDEX idx_students_year ON students(year);
```

### 2. 连接池配置

在 `server/config/database.js` 中调整连接池大小：

```javascript
const pgPool = new Pool({
  host: process.env.PG_HOST || 'localhost',
  port: process.env.PG_PORT || 5432,
  database: process.env.PG_DATABASE || 'stl_manager',
  user: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD || '',
  max: 20, // 增加连接池大小（根据并发用户调整）
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

### 3. 查询优化

使用 `EXPLAIN ANALYZE` 分析慢查询：

```sql
EXPLAIN ANALYZE
SELECT s.*, a.name as assignment_name
FROM submissions s
LEFT JOIN assignments a ON s.assignment_id = a.id
WHERE s.student_year = 2026;
```

## 备份策略

### 1. 自动备份脚本

创建 `server/scripts/backup-postgresql.sh`：

```bash
#!/bin/bash

# 配置
DB_NAME="stl_manager"
DB_USER="stlmanager"
DB_HOST="localhost"
BACKUP_DIR="/var/backups/postgresql"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/stl_manager_$DATE.sql"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 执行备份
pg_dump -h $DB_HOST -U $DB_USER $DB_NAME > $BACKUP_FILE

# 压缩备份
gzip $BACKUP_FILE

# 删除7天前的备份
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "备份完成: $BACKUP_FILE.gz"
```

### 2. 定时备份（crontab）

```bash
# 编辑 crontab
crontab -e

# 添加定时任务（每天凌晨2点备份）
0 2 * * * /path/to/backup-postgresql.sh
```

## 监控和维护

### 1. 查看数据库大小

```sql
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### 2. 查看连接数

```sql
SELECT 
  state,
  COUNT(*) as connection_count
FROM pg_stat_activity
GROUP BY state;
```

### 3. 终止空闲连接

```sql
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'idle'
  AND state_change < now() - interval '30 minutes';
```

## 故障排除

### 问题1: 连接失败

**错误**: `password authentication failed for user "stlmanager"`

**解决方案**:
```sql
-- 重置密码
ALTER USER stlmanager WITH PASSWORD 'new-password';

-- 或修改 pg_hba.conf 配置
# 编辑 /etc/postgresql/16/main/pg_hba.conf
# 将 md5 改为 scram-sha-256

# 重启 PostgreSQL
sudo systemctl restart postgresql
```

### 问题2: 表已存在

**错误**: `relation "users" already exists`

**解决方案**:
```bash
# 清空数据库（谨慎使用！）
psql -U postgres -c "DROP DATABASE stl_manager;"
psql -U postgres -c "CREATE DATABASE stl_manager;"
```

### 问题3: 权限不足

**错误**: `permission denied for table users`

**解决方案**:
```sql
-- 授予所有权限
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO stlmanager;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO stlmanager;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO stlmanager;
```

## 迁移回 SQLite

如果需要从 PostgreSQL 迁移回 SQLite：

```bash
# 导出 PostgreSQL 数据
pg_dump -h localhost -U stlmanager stl_manager > export.sql

# 使用转换工具或手动转换为 SQLite 格式
# 可以使用 https://www.convertsql.com/ 或类似工具
```

## 性能对比

| 指标 | SQLite | PostgreSQL |
|------|--------|------------|
| 并发用户 | < 30 | 100+ |
| 响应时间 | 10-50ms | 5-20ms |
| 数据大小 | < 1GB | 无限制 |
| 备份速度 | 快 | 中等 |
| 故障恢复 | 简单 | 中等 |
| 扩展性 | 有限 | 优秀 |

## 生产环境部署

### 1. 使用连接池中间件

```bash
npm install pg-pool
```

### 2. 配置读写分离

```javascript
const { Pool } = require('pg');

// 主库（写）
const primaryPool = new Pool({
  host: process.env.PG_PRIMARY_HOST,
  // ... 配置
});

// 从库（读）
const replicaPool = new Pool({
  host: process.env.PG_REPLICA_HOST,
  // ... 配置
});
```

### 3. 使用 ORM（可选）

```bash
npm install sequelize
```

## 总结

迁移到 PostgreSQL 后，系统将获得：

✅ 更高的并发性能
✅ 更好的数据完整性
✅ 更强的扩展能力
✅ 更丰富的功能支持
✅ 更好的生产环境支持

建议在生产环境中使用 PostgreSQL，在开发环境中可以继续使用 SQLite 以简化配置。