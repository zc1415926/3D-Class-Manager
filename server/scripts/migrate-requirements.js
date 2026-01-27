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

async function migrateRequirements() {
  console.log('开始迁移作业要求数据...\n');

  try {
    // 连接PostgreSQL
    const pgClient = await pgPool.connect();
    console.log('✓ 已连接到PostgreSQL');

    // 连接SQLite
    const sqliteDb = new sqlite3.Database(sqliteDbPath);
    console.log('✓ 已连接到SQLite\n');

    // 迁移assignment_upload_requirements
    console.log('--- 迁移 assignment_upload_requirements ---');
    const requirements = await new Promise((resolve, reject) => {
      sqliteDb.all('SELECT * FROM assignment_upload_requirements', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    console.log(`找到 ${requirements.length} 条作业要求记录`);

    for (const requirement of requirements) {
      try {
        await pgClient.query(
          `INSERT INTO assignment_upload_requirements (id, assignment_id, name, upload_type, is_required, is_published, sort_order, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (id) DO NOTHING`,
          [
            requirement.id,
            requirement.assignment_id,
            requirement.name,
            requirement.upload_type,
            requirement.is_required === 1,
            requirement.is_published === 1,
            requirement.sort_order || 0,
            requirement.created_at || new Date()
          ]
        );
        console.log(`  ✓ 已迁移作业要求: ${requirement.name} (作业ID: ${requirement.assignment_id})`);
      } catch (error) {
        console.error(`  ✗ 迁移作业要求失败: ${requirement.name}`, error.message);
      }
    }

    // 关闭连接
    pgClient.release();
    pgPool.end();
    sqliteDb.close();

    console.log('\n✓ 作业要求数据迁移完成！');
  } catch (error) {
    console.error('\n✗ 迁移失败:', error);
    process.exit(1);
  }
}

migrateRequirements();