const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, '../database/stl_manager.db');

// 初始化数据库
const initializeDatabase = () => {
  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('数据库连接失败:', err.message);
      process.exit(1);
    }
    console.log('已连接到SQLite数据库');
  });

  // 创建表（同步方式）
  db.serialize(() => {
    // 先创建submissions表
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
        
        // 检查并添加 assignment_id 字段（如果不存在）
        db.all("PRAGMA table_info(submissions)", [], (err, columns) => {
          if (!err) {
            const hasAssignmentId = columns.some(col => col.name === 'assignment_id');
            if (!hasAssignmentId) {
              db.run('ALTER TABLE submissions ADD COLUMN assignment_id INTEGER', (err) => {
                if (err) {
                  console.error('添加assignment_id字段失败:', err.message);
                } else {
                  console.log('已添加assignment_id字段到submissions表');
                }
              });
            }
          }
        });
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
      }
    });

    // 创建submission_files表（存储每个上传要求对应的文件）
    db.run(`CREATE TABLE IF NOT EXISTS submission_files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      submission_id INTEGER NOT NULL,
      requirement_id INTEGER,
      filename TEXT NOT NULL,
      filepath TEXT NOT NULL,
      thumbnail_path TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE,
      FOREIGN KEY (requirement_id) REFERENCES assignment_upload_requirements(id) ON DELETE CASCADE
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

    // 创建upload_types表（上传类型管理）
    db.run(`CREATE TABLE IF NOT EXISTS upload_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      code TEXT NOT NULL UNIQUE,
      description TEXT,
      icon TEXT,
      extensions TEXT,
      is_active INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (err) {
        console.error('创建upload_types表失败:', err.message);
      } else {
        console.log('upload_types表已就绪');
        
        // 检查并添加 extensions 字段（如果不存在）
        db.all("PRAGMA table_info(upload_types)", [], (err, columns) => {
          if (!err) {
            const hasExtensions = columns.some(col => col.name === 'extensions');
            if (!hasExtensions) {
              db.run('ALTER TABLE upload_types ADD COLUMN extensions TEXT', (err) => {
                if (err) {
                  console.error('添加extensions字段失败:', err.message);
                } else {
                  console.log('已添加extensions字段到upload_types表');
                }
              });
            }
          }
        });
        
        // 检查是否已有数据，如果没有则添加默认上传类型
        db.get('SELECT COUNT(*) as count FROM upload_types', [], (err, row) => {
          if (err) {
            console.error('查询上传类型数量失败:', err.message);
          } else if (row.count === 0) {
            // 添加默认上传类型
            const defaultUploadTypes = [
              { name: 'STL模型', code: 'stl', description: '3D打印模型文件', icon: 'box', extensions: '.stl', sort_order: 1 },
              { name: 'OBJ模型', code: 'obj', description: '3D对象文件', icon: 'box', extensions: '.obj', sort_order: 2 },
              { name: '图片', code: 'image', description: '图片文件（JPG、PNG等）', icon: 'photo', extensions: '.jpg,.jpeg,.png,.gif,.webp', sort_order: 3 },
              { name: '文档', code: 'document', description: '文档文件（PDF、DOC等）', icon: 'file-text', extensions: '.pdf,.doc,.docx,.txt', sort_order: 4 },
              { name: '视频', code: 'video', description: '视频文件', icon: 'video', extensions: '.mp4,.avi,.mov,.mkv', sort_order: 5 }
            ];
            
            const stmt = db.prepare('INSERT INTO upload_types (name, code, description, icon, extensions, sort_order) VALUES (?, ?, ?, ?, ?, ?)');
            defaultUploadTypes.forEach(type => {
              stmt.run(type.name, type.code, type.description, type.icon, type.extensions, type.sort_order);
            });
            stmt.finalize();
            console.log('已添加5个默认上传类型');
          }
        });
      }
    });

    // 创建users表（用户认证）
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
            // 添加默认管理员用户
            const defaultUsername = 'zc1415926';
            const defaultPassword = 'zaq12wsx';
            
            // 加密密码
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
        console.log('数据库表已就绪');
        
        // 检查是否已有数据，如果没有则添加示例数据
        db.get('SELECT COUNT(*) as count FROM students', [], (err, row) => {
          if (err) {
            console.error('查询学生数量失败:', err.message);
          } else if (row.count === 0) {
            // 添加10个示例学生
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

// 获取数据库实例
const getDatabase = () => {
  return new sqlite3.Database(dbPath);
};

module.exports = {
  initializeDatabase,
  getDatabase
};