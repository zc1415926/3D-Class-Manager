const { Pool } = require('pg');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

// 数据库类型配置
const DB_TYPE = process.env.DB_TYPE || 'sqlite'; // 'sqlite' 或 'postgresql'

// SQLite配置
const sqliteDbPath = path.join(__dirname, '../database/stl_manager.db');

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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

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
        icon VARCHAR(50),
        extensions TEXT,
        max_file_size INTEGER DEFAULT 52428800, -- 50MB default
        is_active BOOLEAN DEFAULT TRUE,
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
        { name: 'STL模型', code: 'stl', description: '3D打印模型文件', icon: 'box', extensions: '.stl', sort_order: 1 },
        { name: 'OBJ模型', code: 'obj', description: '3D对象文件', icon: 'box', extensions: '.obj', sort_order: 2 },
        { name: '图片', code: 'image', description: '图片文件（JPG、PNG等）', icon: 'photo', extensions: '.jpg,.jpeg,.png,.gif,.webp', sort_order: 3 },
        { name: '文档', code: 'document', description: '文档文件（PDF、DOC等）', icon: 'file-text', extensions: '.pdf,.doc,.docx,.txt', sort_order: 4 },
        { name: '视频', code: 'video', description: '视频文件', icon: 'video', extensions: '.mp4,.avi,.mov,.mkv', sort_order: 5 }
      ];

      for (const type of defaultUploadTypes) {
        await client.query(
          'INSERT INTO upload_types (name, code, description, icon, extensions, sort_order) VALUES ($1, $2, $3, $4, $5, $6)',
          [type.name, type.code, type.description, type.icon, type.extensions, type.sort_order]
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

// 初始化SQLite数据库
const initializeSQLite = () => {
  const db = new sqlite3.Database(sqliteDbPath, (err) => {
    if (err) {
      console.error('SQLite数据库连接失败:', err.message);
      process.exit(1);
    }
    console.log('已连接到SQLite数据库');
  });

  // 创建表（同步方式）
  db.serialize(() => {
    // 创建submissions表
    db.run(`CREATE TABLE IF NOT EXISTS submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_name TEXT NOT NULL,
      student_year INTEGER NOT NULL,
      work_name TEXT NOT NULL,
      description TEXT,
      filename TEXT NOT NULL,
      filepath TEXT NOT NULL,
      thumbnail_path TEXT,
      assignment_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (err) {
        console.error('创建submissions表失败:', err.message);
      } else {
        console.log('submissions表已就绪');
      }
    });

    // 创建assignments表
    db.run(`CREATE TABLE IF NOT EXISTS assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      year INTEGER NOT NULL,
      name TEXT NOT NULL,
      upload_types TEXT NOT NULL,
      description TEXT,
      deadline DATETIME,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (err) {
        console.error('创建assignments表失败:', err.message);
      } else {
        console.log('assignments表已就绪');
      
      // 检查并删除deadline列（如果存在）
      db.get("PRAGMA table_info(assignments)", [], (err, rows) => {
        if (!err) {
          const hasDeadline = rows.some(col => col.name === "deadline");
          if (hasDeadline) {
            console.log("正在移除assignments表中的deadline列...");
            
            // 创建新表结构（不含deadline列）
            db.run(`CREATE TABLE assignments_new (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              year INTEGER NOT NULL,
              name TEXT NOT NULL,
              upload_types TEXT NOT NULL,
              description TEXT,
              status TEXT DEFAULT "active",
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`, (err) => {
              if (err) {
                console.error("创建新assignments表失败:", err.message);
                return;
              }
              
              // 复制数据
              db.run(`INSERT INTO assignments_new (
                id, year, name, upload_types, description, status, created_at, updated_at
              ) SELECT 
                id, year, name, upload_types, description, status, created_at, updated_at 
              FROM assignments`, (err) => {
                if (err) {
                  console.error("复制数据失败:", err.message);
                  return;
                }
                
                // 删除原表并重命名新表
                db.run(`DROP TABLE assignments`, (err) => {
                  if (err) {
                    console.error("删除原表失败:", err.message);
                    return;
                  }
                  db.run(`ALTER TABLE assignments_new RENAME TO assignments`, (err) => {
                    if (err) {
                      console.error("重命名表失败:", err.message);
                    } else {
                      console.log("成功移除deadline列");
                    }
                  });
                });
              });
            });
          }
        }
      });
      }
    });

    // 创建submission_files表
    db.run(`CREATE TABLE IF NOT EXISTS submission_files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      submission_id INTEGER NOT NULL,
      requirement_id INTEGER,
      filename TEXT NOT NULL,
      filepath TEXT NOT NULL,
      thumbnail_path TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE
    )`, (err) => {
      if (err) {
        console.error('创建submission_files表失败:', err.message);
      } else {
        console.log('submission_files表已就绪');
      }
    });

    // 创建assignment_upload_requirements表
    db.run(`CREATE TABLE IF NOT EXISTS assignment_upload_requirements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      assignment_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      upload_type TEXT NOT NULL,
      is_required INTEGER DEFAULT 1,
      is_published INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE
    )`, (err) => {
      if (err) {
        console.error('创建assignment_upload_requirements表失败:', err.message);
      } else {
        console.log('assignment_upload_requirements表已就绪');
      }
    });

    // 创建upload_types表
    db.run(`CREATE TABLE IF NOT EXISTS upload_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      code TEXT NOT NULL UNIQUE,
      description TEXT,
      icon TEXT,
      extensions TEXT,
      max_file_size INTEGER DEFAULT 52428800, -- 50MB default (50*1024*1024)
      is_active INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (err) {
        console.error('创建upload_types表失败:', err.message);
      } else {
        console.log('upload_types表已就绪');
        
        // 检查并添加 max_file_size 字段（如果不存在）
        db.all("PRAGMA table_info(upload_types)", [], (err, columns) => {
          if (!err) {
            const hasMaxFileSize = columns.some(col => col.name === 'max_file_size');
            if (!hasMaxFileSize) {
              db.run('ALTER TABLE upload_types ADD COLUMN max_file_size INTEGER DEFAULT 52428800', (err) => {
                if (err) {
                  console.error('添加max_file_size字段失败:', err.message);
                } else {
                  console.log('已添加max_file_size字段到upload_types表（默认50MB）');
                }
              });
            }
          }
          
          // 检查是否已有数据，如果没有则添加默认上传类型
          db.get('SELECT COUNT(*) as count FROM upload_types', [], (err, row) => {
            if (err) {
              console.error('查询上传类型数量失败:', err.message);
            } else if (row.count === 0) {
              const defaultUploadTypes = [
                { name: 'STL模型', code: 'stl', description: '3D打印模型文件', icon: 'box', extensions: '.stl', sort_order: 1 },
                { name: 'OBJ模型', code: 'obj', description: '3D对象文件', icon: 'box', extensions: '.obj', sort_order: 2 },
                { name: '图片', code: 'image', description: '图片文件（JPG、PNG等）', icon: 'photo', extensions: '.jpg,.jpeg,.png,.gif,.webp', sort_order: 3 },
                { name: '文档', code: 'document', description: '文档文件（PDF、DOC等）', icon: 'file-text', extensions: '.pdf,.doc,.docx,.txt', sort_order: 4 },
                { name: '视频', code: 'video', description: '视频文件', icon: 'video', extensions: '.mp4,.avi,.mov,.mkv', sort_order: 5 }
              ];
              
              const stmt = db.prepare('INSERT INTO upload_types (name, code, description, icon, extensions, max_file_size, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)');
              defaultUploadTypes.forEach(type => {
                stmt.run(type.name, type.code, type.description, type.icon, type.extensions, 52428800, type.sort_order);
              });
              stmt.finalize();
              console.log('已添加5个默认上传类型');
            }
          });
        });
      }
    });

    // 创建users表
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'teacher',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (err) {
        console.error('创建users表失败:', err.message);
      } else {
        console.log('users表已就绪');
        
        // 检查是否已有数据，如果没有则添加默认管理员用户
        db.get('SELECT COUNT(*) as count FROM users', [], (err, row) => {
          if (err) {
            console.error('查询用户数量失败:', err.message);
          } else if (row.count === 0) {
            const defaultUsername = 'zc1415926';
            const defaultPassword = 'zaq12wsx';
            
            bcrypt.hash(defaultPassword, 10, (err, hashedPassword) => {
              if (err) {
                console.error('密码加密失败:', err.message);
                return;
              }
              
              const stmt = db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)');
              stmt.run(defaultUsername, hashedPassword, 'teacher', (err) => {
                if (err) {
                  console.error('添加默认用户失败:', err.message);
                } else {
                  console.log('已添加默认管理员用户');
                  console.log(`  用户名: ${defaultUsername}`);
                  console.log(`  密码: ${defaultPassword}`);
                  console.log('  请在生产环境中修改默认密码！');
                }
              });
              stmt.finalize();
            });
          }
        });
      }
    });

    // 创建students表
    db.run(`CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      year INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (err) {
        console.error('创建students表失败:', err.message);
        process.exit(1);
      } else {
        console.log('students表已就绪');
        
        // 检查是否已有数据，如果没有则添加示例数据
        db.get('SELECT COUNT(*) as count FROM students', [], (err, row) => {
          if (err) {
            console.error('查询学生数量失败:', err.message);
          } else if (row.count === 0) {
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
            
            const stmt = db.prepare('INSERT INTO students (name, year) VALUES (?, ?)');
            sampleStudents.forEach(student => {
              stmt.run(student.name, student.year);
            });
            stmt.finalize();
            console.log('已添加10个示例学生数据');
          }
        });
      }
    });
  });

  return db;
};

// 统一的数据库初始化函数
const initializeDatabase = async () => {
  if (DB_TYPE === 'postgresql') {
    return await initializePostgreSQL();
  } else {
    return initializeSQLite();
  }
};

// 获取数据库实例（PostgreSQL）
const getPostgreSQLDatabase = () => {
  return pgPool;
};

// 获取数据库实例（SQLite）
const getSQLiteDatabase = () => {
  return new sqlite3.Database(sqliteDbPath);
};

// 统一的数据库获取函数
const getDatabase = () => {
  if (DB_TYPE === 'postgresql') {
    return getPostgreSQLDatabase();
  } else {
    return getSQLiteDatabase();
  }
};

// 关闭数据库连接
const closeDatabase = () => {
  if (DB_TYPE === 'postgresql') {
    pgPool.end();
    console.log('PostgreSQL连接池已关闭');
  }
  // SQLite连接自动关闭
};

module.exports = {
  initializeDatabase,
  getDatabase,
  closeDatabase,
  DB_TYPE
};
