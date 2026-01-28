const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// 数据库类型配置
const DB_TYPE = process.env.DB_TYPE || 'postgresql'; // 现在只支持 'postgresql'

// PostgreSQL配置
const pgPool = new Pool({
  host: process.env.PG_HOST || 'localhost',
  port: process.env.PG_PORT || 5432,
  database: process.env.PG_DATABASE || 'stl_manager',
  user: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD || '',
  max: 20, // 连接池大小
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// 创建表结构（PostgreSQL版本）
const createPostgreSQLTables = async (client) => {
  try {
    // 创建users表
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'teacher',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 创建submissions表
    await client.query(`
      CREATE TABLE IF NOT EXISTS submissions (
        id SERIAL PRIMARY KEY,
        student_name VARCHAR(100) NOT NULL,
        student_year INTEGER NOT NULL,
        work_name VARCHAR(200) NOT NULL,
        description TEXT,
        filename VARCHAR(255) NOT NULL,
        filepath VARCHAR(500) NOT NULL,
        thumbnail_path VARCHAR(500),
        assignment_id INTEGER,
        score INTEGER,  -- 评分（数字）
        grade VARCHAR(2), -- 等级 (S, A, B, C, O)
        grader_id INTEGER, -- 评分者ID
        graded_at TIMESTAMP, -- 评分时间
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 检查并添加评分相关字段（如果不存在）
    try {
      let columnExists = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='submissions' AND column_name='score'
      `);
      
      if (columnExists.rows.length === 0) {
        await client.query(`ALTER TABLE submissions ADD COLUMN score INTEGER`);
        console.log('已添加score字段到submissions表');
      }
      
      columnExists = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='submissions' AND column_name='grade'
      `);
      
      if (columnExists.rows.length === 0) {
        await client.query(`ALTER TABLE submissions ADD COLUMN grade VARCHAR(2)`);
        console.log('已添加grade字段到submissions表');
      }
      
      columnExists = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='submissions' AND column_name='grader_id'
      `);
      
      if (columnExists.rows.length === 0) {
        await client.query(`ALTER TABLE submissions ADD COLUMN grader_id INTEGER`);
        console.log('已添加grader_id字段到submissions表');
      }
      
      columnExists = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='submissions' AND column_name='graded_at'
      `);
      
      if (columnExists.rows.length === 0) {
        await client.query(`ALTER TABLE submissions ADD COLUMN graded_at TIMESTAMP`);
        console.log('已添加graded_at字段到submissions表');
      }
    } catch (error) {
      console.error('检查或添加评分相关字段时出错:', error);
    }

    // 创建assignments表
    await client.query(`
      CREATE TABLE IF NOT EXISTS assignments (
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
      )
    `);

    // 检查并添加 sort_order 字段（如果不存在）
    try {
      const columnExists = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='assignments' AND column_name='sort_order'
      `);
      
      if (columnExists.rows.length === 0) {
        // 添加 sort_order 列
        await client.query(`
          ALTER TABLE assignments 
          ADD COLUMN sort_order INTEGER DEFAULT 0
        `);
        console.log('已添加sort_order字段到assignments表');
      }
    } catch (error) {
      console.error('检查或添加sort_order字段时出错:', error);
    }

    // 创建submission_files表
    await client.query(`
      CREATE TABLE IF NOT EXISTS submission_files (
        id SERIAL PRIMARY KEY,
        submission_id INTEGER NOT NULL,
        requirement_id INTEGER,
        filename VARCHAR(255) NOT NULL,
        filepath VARCHAR(500) NOT NULL,
        thumbnail_path VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE
      )
    `);

    // 创建assignment_upload_requirements表
    await client.query(`
      CREATE TABLE IF NOT EXISTS assignment_upload_requirements (
        id SERIAL PRIMARY KEY,
        assignment_id INTEGER NOT NULL,
        name VARCHAR(200) NOT NULL,
        upload_type VARCHAR(50) NOT NULL,
        is_required BOOLEAN DEFAULT TRUE,
        is_published BOOLEAN DEFAULT TRUE,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE
      )
    `);

    // 创建upload_types表
    await client.query(`
      CREATE TABLE IF NOT EXISTS upload_types (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        code VARCHAR(50) NOT NULL UNIQUE,
        description TEXT,
        extensions TEXT,
        max_file_size INTEGER DEFAULT 52428800, -- 50MB default
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 检查并添加 max_file_size 字段（如果不存在）
    try {
      // 检查列是否存在
      const columnExists = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='upload_types' AND column_name='max_file_size'
      `);
      
      if (columnExists.rows.length === 0) {
        // 添加 max_file_size 列
        await client.query(`
          ALTER TABLE upload_types 
          ADD COLUMN max_file_size INTEGER DEFAULT 52428800
        `);
        console.log('已添加max_file_size字段到upload_types表（默认50MB）');
      }
    } catch (error) {
      console.error('检查或添加max_file_size字段时出错:', error);
    }

    // 创建students表
    await client.query(`
      CREATE TABLE IF NOT EXISTS students (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        year INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('PostgreSQL表结构已创建');
  } catch (error) {
    console.error('创建PostgreSQL表失败:', error);
    throw error;
  }
};

// 初始化默认数据（PostgreSQL版本）
const initPostgreSQLData = async (client) => {
  try {
    // 检查并添加默认用户
    const userCount = await client.query('SELECT COUNT(*) as count FROM users');
    if (parseInt(userCount.rows[0].count) === 0) {
      const defaultUsername = 'zc1415926';
      const defaultPassword = 'zaq12wsx';
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);

      await client.query(
        'INSERT INTO users (username, password, role) VALUES ($1, $2, $3)',
        [defaultUsername, hashedPassword, 'teacher']
      );

      console.log('已添加默认管理员用户');
      console.log(`  用户名: ${defaultUsername}`);
      console.log(`  密码: ${defaultPassword}`);
      console.log('  请在生产环境中修改默认密码！');
    }

    // 检查并添加默认上传类型
    const uploadTypeCount = await client.query('SELECT COUNT(*) as count FROM upload_types');
    if (parseInt(uploadTypeCount.rows[0].count) === 0) {
      const defaultUploadTypes = [
        { name: 'STL模型', code: 'stl', description: '3D打印模型文件', extensions: '.stl', sort_order: 1 },
        { name: 'OBJ模型', code: 'obj', description: '3D对象文件', extensions: '.obj', sort_order: 2 },
        { name: '图片', code: 'image', description: '图片文件（JPG、PNG等）', extensions: '.jpg,.jpeg,.png,.gif,.webp', sort_order: 3 },
        { name: '文档', code: 'document', description: '文档文件（PDF、DOC等）', extensions: '.pdf,.doc,.docx,.txt', sort_order: 4 },
        { name: '视频', code: 'video', description: '视频文件', extensions: '.mp4,.avi,.mov,.mkv', sort_order: 5 }
      ];

      for (const type of defaultUploadTypes) {
        await client.query(
          'INSERT INTO upload_types (name, code, description, extensions, sort_order) VALUES ($1, $2, $3, $4, $5)',
          [type.name, type.code, type.description, type.extensions, type.sort_order]
        );
      }

      console.log('已添加5个默认上传类型');
    }

    // 检查并添加示例学生
    const studentCount = await client.query('SELECT COUNT(*) as count FROM students');
    if (parseInt(studentCount.rows[0].count) === 0) {
      const sampleStudents = [
        { name: '张三', year: 2026 },
        { name: '李四', year: 2026 },
        { name: '王五', year: 2025 },
        { name: '赵六', year: 2026 },
        { name: '钱七', year: 2025 },
        { name: '孙八', year: 2026 },
        { name: '周九', year: 2024 },
        { name: '吴十', year: 2026 },
        { name: '郑十一', year: 2025 },
        { name: '王十二', year: 2026 }
      ];

      for (const student of sampleStudents) {
        await client.query(
          'INSERT INTO students (name, year) VALUES ($1, $2)',
          [student.name, student.year]
        );
      }

      console.log('已添加10个示例学生数据');
    }
  } catch (error) {
    console.error('初始化PostgreSQL数据失败:', error);
    throw error;
  }
};

// 初始化PostgreSQL数据库
const initializePostgreSQL = async () => {
  try {
    // 测试连接
    const client = await pgPool.connect();
    console.log('已连接到PostgreSQL数据库');
    
    // 创建表结构
    await createPostgreSQLTables(client);
    
    // 初始化默认数据
    await initPostgreSQLData(client);
    
    client.release();
    
    // 返回连接池
    return pgPool;
  } catch (error) {
    console.error('PostgreSQL数据库连接失败:', error.message);
    process.exit(1);
  }
};

// 统一的数据库初始化函数
const initializeDatabase = () => {
  return initializePostgreSQL();
};

// 获取数据库实例（PostgreSQL）
const getPostgreSQLDatabase = () => {
  return pgPool;
};

// 统一的数据库获取函数
const getDatabase = () => {
  return getPostgreSQLDatabase();
};

// 关闭数据库连接
const closeDatabase = () => {
  if (DB_TYPE === 'postgresql') {
    pgPool.end();
    console.log('PostgreSQL连接池已关闭');
  }
};

module.exports = {
  initializeDatabase,
  getDatabase,
  closeDatabase
};
