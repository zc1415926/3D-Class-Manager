# 3D班级管理系统 - 开发经验总结

## 一、数据库迁移经验

### 1.1 SQLite 到 PostgreSQL 迁移

**关键要点：**

1. **连接管理**
   - SQLite 使用单个文件，PostgreSQL 需要连接池管理
   - 使用 `pg` 库创建连接池，配置合理的连接数（默认 20）
   - 生产环境建议使用连接池管理器（如 `pg-pool`）

2. **数据类型映射**
   ```javascript
   // SQLite → PostgreSQL 类型映射
   INTEGER → INTEGER (SERIAL for auto-increment)
   TEXT → TEXT or VARCHAR
   DATETIME → TIMESTAMP
   BLOB → BYTEA
   ```

3. **序列管理**
   - PostgreSQL 使用序列管理自增字段
   - 手动插入数据后必须重置序列
   ```sql
   -- 重置序列的通用方法
   DO $$
   DECLARE
     tbl text;
     col text;
     seq_name text;
     max_id bigint;
   BEGIN
     FOR tbl, col IN
       SELECT table_name, column_name
       FROM information_schema.columns
       WHERE column_default LIKE 'nextval%'
     LOOP
       EXECUTE format('SELECT pg_get_serial_sequence(%L, %L)', tbl, col) INTO seq_name;
       EXECUTE format('SELECT COALESCE(MAX(%I), 0) FROM %I', col, tbl) INTO max_id;
       IF seq_name IS NOT NULL THEN
         EXECUTE format('SELECT setval(%L, %s, false)', seq_name, max_id + 1);
       END IF;
     END LOOP;
   END $$;
   ```

4. **参数化查询**
   - SQLite 使用 `?` 或 `:name` 占位符
   - PostgreSQL 使用 `$1, $2, ...` 占位符
   ```javascript
   // SQLite
   db.run('INSERT INTO users (name) VALUES (?)', ['John']);

   // PostgreSQL
   await client.query('INSERT INTO users (name) VALUES ($1)', ['John']);
   ```

### 1.2 数据迁移策略

**分阶段迁移：**

1. **表结构迁移** - 先创建所有表结构
2. **基础数据迁移** - 迁移不依赖其他表的数据（如 users, students, upload_types）
3. **关联数据迁移** - 迁移有外键关联的数据（如 assignments, submissions）
4. **序列重置** - 重置所有自增序列
5. **数据验证** - 对比源数据和目标数据数量

**迁移脚本模板：**
```javascript
const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');

async function migrate() {
  // 连接 SQLite
  const sqliteDb = new sqlite3.Database('./database/stl_manager.db');

  // 连接 PostgreSQL
  const pool = new Pool({
    host: process.env.PG_HOST,
    port: process.env.PG_PORT,
    database: process.env.PG_DATABASE,
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD
  });

  try {
    // 1. 迁移数据
    const data = await new Promise((resolve, reject) => {
      sqliteDb.all('SELECT * FROM table_name', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    // 2. 插入到 PostgreSQL
    for (const row of data) {
      await pool.query(
        'INSERT INTO table_name (col1, col2) VALUES ($1, $2)',
        [row.col1, row.col2]
      );
    }

    // 3. 重置序列
    await pool.query('SELECT setval(pg_get_serial_sequence($1, $2), (SELECT MAX(id) FROM $1) + 1, false)', ['table_name', 'id']);

  } finally {
    await pool.end();
    sqliteDb.close();
  }
}
```

## 二、文件上传系统重构

### 2.1 动态多文件上传

**问题：** 需要支持每个作业要求上传多个文件，文件数量不固定

**解决方案：**

1. **前端动态表单**
   ```javascript
   // 动态生成文件输入字段
   const fileInputs = requirements.map((req, index) => ({
     field: `files[${index}]`,
     thumbnailField: `thumbnails[${index}]`,
     requirementId: req.id
   }));

   // 构建 FormData
   const formData = new FormData();
   files.forEach((file, index) => {
     formData.append(`files[${index}]`, file);
     if (thumbnails[index]) {
       formData.append(`thumbnails[${index}]`, thumbnails[index]);
     }
   });
   ```

2. **后端 Multer 配置**
   ```javascript
   // 使用 upload.any() 接收任意数量的文件
   router.post('/', upload.any(), async (req, res) => {
     const filesArray = [];
     const thumbnailsArray = [];

     // 按字段名分类文件
     req.files.forEach(file => {
       if (file.fieldname.startsWith('files[')) {
         const index = parseInt(file.fieldname.match(/\[(\d+)\]/)[1]);
         filesArray[index] = file;
       } else if (file.fieldname.startsWith('thumbnails[')) {
         const index = parseInt(file.fieldname.match(/\[(\d+)\]/)[1]);
         thumbnailsArray[index] = file;
       }
     });
   });
   ```

3. **文件过滤器**
   ```javascript
   const upload = multer({
     storage: multer.diskStorage({
       destination: (req, file, cb) => {
         const ext = path.extname(file.originalname);
         const isImage = ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
         cb(null, isImage ? 'uploads/images/' : 'uploads/');
       },
       filename: (req, file, cb) => {
         const uniqueName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${ext}`;
         cb(null, uniqueName);
       }
     }),
     fileFilter: (req, file, cb) => {
       const ext = path.extname(file.originalname);
       const allowedExts = ['.stl', '.obj', '.gcode', '.vox', '.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.doc', '.docx', '.txt', '.mp4', '.avi', '.mov', '.mkv'];

       if (allowedExts.includes(ext)) {
         cb(null, true);
       } else {
         cb(new Error(`不支持的文件类型: ${ext}`));
       }
     },
     limits: { fileSize: 50 * 1024 * 1024 } // 50MB
   });
   ```

### 2.2 错误处理

**常见问题及解决方案：**

1. **文件字段识别失败**
   - 问题：Multer 无法识别动态字段名（如 `files[0]`, `files[1]`）
   - 解决：使用 `upload.any()` 而不是 `upload.fields()`，手动解析字段名

2. **文件大小限制**
   - 问题：大文件上传失败
   - 解决：在 Multer 配置中设置 `limits.fileSize`，前端也要验证文件大小

3. **文件类型验证**
   - 问题：用户上传不允许的文件类型
   - 解决：使用 Multer 的 `fileFilter` 验证文件扩展名

## 三、UI/UX 改进经验

### 3.1 模态框确认

**场景：** 删除操作需要二次确认

**实现要点：**

1. **两步确认流程**
   ```javascript
   const [showConfirm, setShowConfirm] = useState(false);

   const handleDelete = async () => {
     if (!assignment.submission_count || assignment.submission_count === 0) {
       // 无提交记录，直接删除
       performDelete();
       return;
     }
     // 有提交记录，显示确认
     setShowConfirm(true);
   };
   ```

2. **不同的警告信息**
   ```jsx
   {showConfirm ? (
     <div className="alert alert-danger">
       <h4 className="alert-title">确认删除</h4>
       <div className="text-muted">
         {assignment.submission_count > 0
           ? `确定要删除作业"${assignment.name}"及其所有 ${assignment.submission_count} 个作品吗？`
           : `确定要删除作业"${assignment.name}"吗？`
         }
       </div>
     </div>
   ) : (
     // 初始信息显示
   )}
   ```

### 3.2 两列布局优化

**场景：** 学生提交页面信息太多，需要更好的布局

**实现要点：**

1. **响应式布局**
   ```jsx
   <div className="row g-4">
     {/* 左列：表单信息 */}
     <div className="col-md-6 col-lg-6">
       <div className="card h-100">
         <div className="card-body">
           <h5 className="card-title mb-4">提交信息</h5>
           {/* 表单字段 */}
         </div>
       </div>
     </div>

     {/* 右列：文件上传 */}
     <div className="col-md-6 col-lg-6">
       <div className="card h-100">
         <div className="card-body">
           <h5 className="card-title mb-4">上传作业</h5>
           {/* 文件上传区域 */}
         </div>
       </div>
     </div>
   </div>
   ```

2. **自动生成值**
   ```javascript
   // 自动生成作品名称
   const workName = `${formData.studentName}-${new Date().toISOString().slice(0, 10)}`;
   ```

3. **减少用户输入**
   - 移除不必要的字段（如作品名称、作品说明）
   - 自动计算默认值
   - 简化表单验证

### 3.3 页面布局优化

**关键优化点：**

1. **移除顶部导航栏**
   - 使用侧边栏作为主要导航
   - 释放更多屏幕空间
   - 简化页面结构

2. **优化间距**
   ```css
   .page-body {
     flex: 1;
     padding: 0.5rem 0 1.5rem 0; /* 上边距减小，下边距保持 */
   }
   ```

3. **使用卡片布局**
   - 将相关内容分组
   - 提供清晰的视觉层次
   - 响应式设计

## 四、常见问题及解决方案

### 4.1 数据库相关问题

**问题 1：序列不匹配导致重复键错误**
```
error: duplicate key value violates unique constraint
```

**解决方案：**
```sql
-- 重置所有序列
DO $$
DECLARE
  tbl text;
  col text;
  seq_name text;
  max_id bigint;
BEGIN
  FOR tbl, col IN
    SELECT table_name, column_name
    FROM information_schema.columns
    WHERE column_default LIKE 'nextval%'
  LOOP
    EXECUTE format('SELECT pg_get_serial_sequence(%L, %L)', tbl, col) INTO seq_name;
    EXECUTE format('SELECT COALESCE(MAX(%I), 0) FROM %I', col, tbl) INTO max_id;
    IF seq_name IS NOT NULL THEN
      EXECUTE format('SELECT setval(%L, %s, false)', seq_name, max_id + 1);
    END IF;
  END LOOP;
END $$;
```

**问题 2：外键约束导致删除失败**
```
error: update or delete on table violates foreign key constraint
```

**解决方案：**
- 使用级联删除：`ON DELETE CASCADE`
- 或先删除子表数据，再删除父表数据

### 4.2 文件上传相关问题

**问题 1：未知的文件字段**
```
Error: 未知的文件字段
```

**解决方案：**
```javascript
// 更新文件过滤器支持动态字段名
if (file.fieldname.startsWith('files[') || file.fieldname.startsWith('thumbnails[')) {
  // 允许通过
  cb(null, true);
}
```

**问题 2：文件大小超限**
```
Error: File too large
```

**解决方案：**
1. 调整 Multer 配置的 `limits.fileSize`
2. 前端添加文件大小验证
3. 给用户明确的错误提示

### 4.3 前端相关问题

**问题 1：JSX 语法错误**
```
SyntaxError: Unexpected token, expected "..."
```

**解决方案：**
- 检查标签嵌套是否正确
- 确保注释不在标签属性内部
- 使用 ESLint 进行语法检查

**问题 2：样式不生效**
```
CSS 样式未应用
```

**解决方案：**
1. 检查 CSS 导入顺序
2. 使用 `!important` 作为临时解决方案
3. 检查 CSS 选择器优先级
4. 清除浏览器缓存

## 五、最佳实践建议

### 5.1 数据库管理

1. **使用环境变量管理配置**
   ```javascript
   const pool = new Pool({
     host: process.env.PG_HOST,
     port: process.env.PG_PORT,
     database: process.env.PG_DATABASE,
     user: process.env.PG_USER,
     password: process.env.PG_PASSWORD
   });
   ```

2. **使用连接池**
   - 避免为每个请求创建新连接
   - 设置合理的连接数（通常 10-20）
   - 及时释放连接

3. **事务管理**
   ```javascript
   const client = await pool.connect();
   try {
     await client.query('BEGIN');
     // 执行多个操作
     await client.query('INSERT INTO ...');
     await client.query('UPDATE ...');
     await client.query('COMMIT');
   } catch (err) {
     await client.query('ROLLBACK');
     throw err;
   } finally {
     client.release();
   }
   ```

### 5.2 代码组织

1. **分离关注点**
   - 路由层：处理 HTTP 请求
   - 业务逻辑层：处理业务规则
   - 数据访问层：处理数据库操作

2. **错误处理**
   ```javascript
   // 统一错误处理
   const handleError = (err, res) => {
     console.error(err);
     res.status(500).json({
       success: false,
       message: err.message || '服务器内部错误'
     });
   };
   ```

3. **日志记录**
   ```javascript
   // 使用日志库（如 winston）
   const logger = winston.createLogger({
     level: 'info',
     format: winston.format.json(),
     transports: [
       new winston.transports.File({ filename: 'error.log', level: 'error' }),
       new winston.transports.File({ filename: 'combined.log' })
     ]
   });
   ```

### 5.3 安全性

1. **参数化查询**
   - 防止 SQL 注入
   - 永远不要拼接 SQL 字符串

2. **输入验证**
   ```javascript
   // 验证文件类型
   const allowedExts = ['.stl', '.obj', '.jpg', '.png'];
   const ext = path.extname(file.originalname).toLowerCase();
   if (!allowedExts.includes(ext)) {
     return res.status(400).json({ message: '不支持的文件类型' });
   }
   ```

3. **JWT 认证**
   ```javascript
   // 验证 JWT 令牌
   const authMiddleware = (req, res, next) => {
     const token = req.headers.authorization?.split(' ')[1];
     if (!token) {
       return res.status(401).json({ message: '未授权' });
     }

     try {
       const decoded = jwt.verify(token, process.env.JWT_SECRET);
       req.user = decoded;
       next();
     } catch (err) {
       return res.status(401).json({ message: '令牌无效' });
     }
   };
   ```

4. **密码加密**
   ```javascript
   // 使用 bcrypt 加密密码
   const hashedPassword = await bcrypt.hash(password, 10);

   // 验证密码
   const isValid = await bcrypt.compare(plainPassword, hashedPassword);
   ```

### 5.4 性能优化

1. **数据库索引**
   ```sql
   -- 为常用查询字段添加索引
   CREATE INDEX idx_student_name ON submissions(student_name);
   CREATE INDEX idx_assignment_id ON submissions(assignment_id);
   ```

2. **查询优化**
   ```javascript
   // 只查询需要的字段
   await client.query('SELECT id, name FROM students');

   // 使用 LIMIT 限制结果数量
   await client.query('SELECT * FROM submissions LIMIT 100');
   ```

3. **缓存**
   - 使用 Redis 缓存常用数据
   - 减少数据库查询次数

## 六、总结

### 6.1 关键经验

1. **数据库迁移不是简单的复制**
   - 需要考虑数据类型、序列、约束等差异
   - 必须进行完整的数据验证

2. **文件上传系统要灵活**
   - 支持动态文件数量
   - 严格的文件类型和大小验证
   - 清晰的错误提示

3. **UI/UX 要以用户为中心**
   - 减少用户输入
   - 自动生成默认值
   - 提供清晰的反馈

4. **错误处理要完善**
   - 捕获所有可能的错误
   - 提供有意义的错误信息
   - 记录详细的错误日志

### 6.2 工具推荐

1. **数据库管理**
   - pgAdmin（PostgreSQL 可视化管理工具）
   - DBeaver（通用数据库管理工具）

2. **API 测试**
   - Postman
   - curl

3. **代码质量**
   - ESLint（JavaScript 代码检查）
   - Prettier（代码格式化）

4. **版本控制**
   - Git
   - GitHub / GitLab

### 6.3 下一步计划

1. **功能扩展**
   - 添加批量操作功能
   - 实现数据导出和导入
   - 添加更多统计和报表功能

2. **性能优化**
   - 实现数据库查询优化
   - 添加缓存机制
   - 优化前端渲染性能

3. **用户体验**
   - 添加更多动画效果
   - 优化移动端适配
   - 实现离线功能

4. **安全性增强**
   - 添加文件病毒扫描
   - 实现更严格的访问控制
   - 添加审计日志

---

**文档版本：** 1.0
**最后更新：** 2026-01-27
**作者：** iFlow CLI