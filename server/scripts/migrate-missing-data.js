const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');
const path = require('path');

// SQLite数据库路径
const sqliteDbPath = path.join(__dirname, '../database/stl_manager.db');

// PostgreSQL连接
const pgPool = new Pool({
  host: process.env.PG_HOST || 'localhost',
  port: process.env.PG_PORT || 5432,
  database: process.env.PG_DATABASE || 'stl_manager',
  user: process.env.PG_USER || 'stl_user',
  password: process.env.PG_PASSWORD || 'stl_password_2024',
});

async function migrateMissingData() {
  console.log('开始迁移缺失的数据...\n');

  try {
    // 连接PostgreSQL
    const pgClient = await pgPool.connect();
    console.log('✓ 已连接到PostgreSQL');

    // 连接SQLite
    const sqliteDb = new sqlite3.Database(sqliteDbPath);
    console.log('✓ 已连接到SQLite\n');

    // 迁移缺失的students
    console.log('--- 迁移缺失的Students ---');
    const sqliteStudents = await new Promise((resolve, reject) => {
      sqliteDb.all('SELECT * FROM students', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    const pgStudents = await pgClient.query('SELECT name FROM students');
    const pgStudentNames = new Set(pgStudents.rows.map(s => s.name));

    const missingStudents = sqliteStudents.filter(s => !pgStudentNames.has(s.name));
    console.log(`找到 ${missingStudents.length} 个缺失的学生`);

    for (const student of missingStudents) {
      try {
        await pgClient.query(
          `INSERT INTO students (name, year, created_at)
           VALUES ($1, $2, $3)`,
          [
            student.name,
            student.year,
            student.created_at || new Date()
          ]
        );
        console.log(`  ✓ 已迁移学生: ${student.name} (年级: ${student.year})`);
      } catch (error) {
        console.error(`  ✗ 迁移学生失败: ${student.name}`, error.message);
      }
    }

    // 迁移缺失的upload_types
    console.log('\n--- 迁移缺失的Upload Types ---');
    const sqliteUploadTypes = await new Promise((resolve, reject) => {
      sqliteDb.all('SELECT * FROM upload_types', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    const pgUploadTypes = await pgClient.query('SELECT code FROM upload_types');
    const pgUploadTypeCodes = new Set(pgUploadTypes.rows.map(t => t.code));

    const missingUploadTypes = sqliteUploadTypes.filter(t => !pgUploadTypeCodes.has(t.code));
    console.log(`找到 ${missingUploadTypes.length} 个缺失的上传类型`);

    for (const uploadType of missingUploadTypes) {
      try {
        await pgClient.query(
          `INSERT INTO upload_types (name, code, description, icon, extensions, is_active, sort_order, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            uploadType.name,
            uploadType.code,
            uploadType.description || null,
            uploadType.icon || null,
            uploadType.extensions || null,
            uploadType.is_active === 1,
            uploadType.sort_order || 0,
            uploadType.created_at || new Date()
          ]
        );
        console.log(`  ✓ 已迁移上传类型: ${uploadType.name} (代码: ${uploadType.code})`);
      } catch (error) {
        console.error(`  ✗ 迁移上传类型失败: ${uploadType.name}`, error.message);
      }
    }

    // 关闭连接
    pgClient.release();
    pgPool.end();
    sqliteDb.close();

    console.log('\n✓ 缺失数据迁移完成！');
  } catch (error) {
    console.error('\n✗ 迁移失败:', error);
    process.exit(1);
  }
}

migrateMissingData();