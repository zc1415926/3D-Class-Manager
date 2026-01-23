const sqlite3 = require('sqlite3').verbose();
const path = require('path');

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