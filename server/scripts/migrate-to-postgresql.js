#!/usr/bin/env node

/**
 * SQLite 到 PostgreSQL 数据迁移脚本
 * 
 * 使用方法：
 * 1. 确保已安装 PostgreSQL 并创建了数据库
 * 2. 配置 .env 文件中的 PostgreSQL 连接信息
 * 3. 运行脚本: node scripts/migrate-to-postgresql.js
 */

require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { Pool } = require('pg');

// SQLite数据库路径
const sqliteDbPath = path.join(__dirname, '../database/stl_manager.db');

// PostgreSQL连接池
const pgPool = new Pool({
  host: process.env.PG_HOST || 'localhost',
  port: process.env.PG_PORT || 5432,
  database: process.env.PG_DATABASE || 'stl_manager',
  user: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD || '',
});

console.log('开始数据迁移...\n');

// 迁移函数
async function migrate() {
  const sqlite = new Promise((resolve, reject) => {
    const db = new sqlite3.Database(sqliteDbPath, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(db);
      }
    });
  });

  try {
    const db = await sqlite;
    
    // 1. 迁移 users 表
    console.log('迁移 users 表...');
    await migrateTable(db, 'users', {
      columns: ['username', 'password', 'role'],
      transform: (row) => ({
        username: row.username,
        password: row.password,
        role: row.role
      })
    });

    // 2. 迁移 students 表
    console.log('迁移 students 表...');
    await migrateTable(db, 'students', {
      columns: ['name', 'year'],
      transform: (row) => ({
        name: row.name,
        year: row.year
      })
    });

    // 3. 迁移 upload_types 表
    console.log('迁移 upload_types 表...');
    await migrateTable(db, 'upload_types', {
      columns: ['name', 'code', 'description', 'icon', 'extensions', 'is_active', 'sort_order'],
      transform: (row) => ({
        name: row.name,
        code: row.code,
        description: row.description,
        icon: row.icon,
        extensions: row.extensions,
        is_active: row.is_active === 1,
        sort_order: row.sort_order
      })
    });

    // 4. 迁移 assignments 表
    console.log('迁移 assignments 表...');
    await migrateTable(db, 'assignments', {
      columns: ['year', 'name', 'upload_types', 'description', 'deadline', 'status'],
      transform: (row) => ({
        year: row.year,
        name: row.name,
        upload_types: row.upload_types,
        description: row.description,
        deadline: row.deadline,
        status: row.status
      })
    });

    // 5. 迁移 submissions 表
    console.log('迁移 submissions 表...');
    await migrateTable(db, 'submissions', {
      columns: ['student_name', 'student_year', 'work_name', 'description', 'filename', 'filepath', 'thumbnail_path', 'assignment_id'],
      transform: (row) => ({
        student_name: row.student_name,
        student_year: row.student_year,
        work_name: row.work_name,
        description: row.description,
        filename: row.filename,
        filepath: row.filepath,
        thumbnail_path: row.thumbnail_path,
        assignment_id: row.assignment_id
      })
    });

    // 6. 迁移 assignment_upload_requirements 表
    console.log('迁移 assignment_upload_requirements 表...');
    await migrateTable(db, 'assignment_upload_requirements', {
      columns: ['assignment_id', 'name', 'upload_type', 'is_required', 'is_published', 'sort_order'],
      transform: (row) => ({
        assignment_id: row.assignment_id,
        name: row.name,
        upload_type: row.upload_type,
        is_required: row.is_required === 1,
        is_published: row.is_published === 1,
        sort_order: row.sort_order
      })
    });

    // 7. 迁移 submission_files 表
    console.log('迁移 submission_files 表...');
    await migrateTable(db, 'submission_files', {
      columns: ['submission_id', 'requirement_id', 'filename', 'filepath', 'thumbnail_path'],
      transform: (row) => ({
        submission_id: row.submission_id,
        requirement_id: row.requirement_id,
        filename: row.filename,
        filepath: row.filepath,
        thumbnail_path: row.thumbnail_path
      })
    });

    console.log('\n✅ 数据迁移完成！');
    
    // 显示统计信息
    await showStatistics();

  } catch (error) {
    console.error('迁移失败:', error);
    process.exit(1);
  } finally {
    // 关闭连接
    (await sqlite).close();
    await pgPool.end();
  }
}

// 迁移单个表
async function migrateTable(sqliteDb, tableName, options) {
  return new Promise((resolve, reject) => {
    sqliteDb.all(`SELECT * FROM ${tableName}`, [], async (err, rows) => {
      if (err) {
        reject(err);
        return;
      }

      if (rows.length === 0) {
        console.log(`  ${tableName}: 无数据`);
        resolve();
        return;
      }

      try {
        const client = await pgPool.connect();
        
        // 获取列名
        const columns = options.columns.join(', ');
        const placeholders = options.columns.map((_, i) => `$${i + 1}`).join(', ');
        
        // 构建插入语句
        const insertSQL = `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders})`;
        
        // 批量插入
        for (const row of rows) {
          const transformedRow = options.transform(row);
          const values = options.columns.map(col => transformedRow[col]);
          
          await client.query(insertSQL, values);
        }

        client.release();
        console.log(`  ${tableName}: 迁移了 ${rows.length} 条记录`);
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  });
}

// 显示统计信息
async function showStatistics() {
  try {
    const client = await pgPool.connect();
    
    const tables = ['users', 'students', 'upload_types', 'assignments', 'submissions', 'assignment_upload_requirements', 'submission_files'];
    
    console.log('\n📊 数据统计:');
    
    for (const table of tables) {
      const result = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
      console.log(`  ${table}: ${result.rows[0].count} 条记录`);
    }
    
    client.release();
  } catch (error) {
    console.error('获取统计信息失败:', error);
  }
}

// 执行迁移
migrate();
