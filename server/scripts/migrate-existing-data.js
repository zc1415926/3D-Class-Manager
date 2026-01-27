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

async function migrateData() {
  console.log('开始迁移SQLite数据到PostgreSQL...\n');

  try {
    // 连接PostgreSQL
    const pgClient = await pgPool.connect();
    console.log('✓ 已连接到PostgreSQL');

    // 连接SQLite
    const sqliteDb = new sqlite3.Database(sqliteDbPath);
    console.log('✓ 已连接到SQLite\n');

    // 迁移assignments
    console.log('\n--- 迁移 assignments ---');
    const assignments = await new Promise((resolve, reject) => {
      sqliteDb.all('SELECT * FROM assignments', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    for (const assignment of assignments) {
      try {
        await pgClient.query(
          `INSERT INTO assignments (year, name, upload_types, description, deadline, status, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT DO NOTHING`,
          [
            assignment.year,
            assignment.name,
            assignment.upload_types,
            assignment.description || null,
            assignment.deadline || null,
            assignment.status || 'active',
            assignment.created_at || new Date(),
            assignment.updated_at || new Date()
          ]
        );
        console.log(`  ✓ 已迁移作业: ${assignment.name}`);
      } catch (error) {
        console.error(`  ✗ 迁移作业失败: ${assignment.name}`, error.message);
      }
    }

    // 迁移submissions
    console.log('\n--- 迁移 submissions ---');
    const submissions = await new Promise((resolve, reject) => {
      sqliteDb.all('SELECT * FROM submissions', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    for (const submission of submissions) {
      try {
        await pgClient.query(
          `INSERT INTO submissions (id, student_name, student_year, work_name, description, filename, filepath, thumbnail_path, assignment_id, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT (id) DO NOTHING`,
          [
            submission.id,
            submission.student_name,
            submission.student_year,
            submission.work_name,
            submission.description || null,
            submission.filename,
            submission.filepath,
            submission.thumbnail_path || null,
            submission.assignment_id || null,
            submission.created_at || new Date()
          ]
        );
        console.log(`  ✓ 已迁移作品: ${submission.work_name} (${submission.student_name})`);
      } catch (error) {
        console.error(`  ✗ 迁移作品失败: ${submission.work_name}`, error.message);
      }
    }

    // 关闭连接
    pgClient.release();
    pgPool.end();
    sqliteDb.close();

    console.log('\n✓ 数据迁移完成！');
  } catch (error) {
    console.error('\n✗ 迁移失败:', error);
    process.exit(1);
  }
}

migrateData();