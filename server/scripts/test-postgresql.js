#!/usr/bin/env node

/**
 * PostgreSQL 连接测试脚本
 * 
 * 使用方法：
 * 1. 配置 .env 文件中的 PostgreSQL 连接信息
 * 2. 运行脚本: node scripts/test-postgresql.js
 */

require('dotenv').config();
const { Pool } = require('pg');

console.log('测试 PostgreSQL 连接...\n');

// 创建连接池
const pool = new Pool({
  host: process.env.PG_HOST || 'localhost',
  port: process.env.PG_PORT || 5432,
  database: process.env.PG_DATABASE || 'stl_manager',
  user: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD || '',
});

async function testConnection() {
  try {
    // 测试连接
    const client = await pool.connect();
    console.log('✅ PostgreSQL 连接成功');
    console.log(`   主机: ${process.env.PG_HOST || 'localhost'}`);
    console.log(`   端口: ${process.env.PG_PORT || 5432}`);
    console.log(`   数据库: ${process.env.PG_DATABASE || 'stl_manager'}`);
    console.log(`   用户: ${process.env.PG_USER || 'postgres'}`);

    // 查询数据库版本
    const versionResult = await client.query('SELECT version()');
    console.log(`\n📊 数据库版本:`);
    console.log(`   ${versionResult.rows[0].version}`);

    // 查询所有表
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log(`\n📋 数据库表:`);
    tablesResult.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });

    // 查询每张表的记录数
    console.log(`\n📈 数据统计:`);
    for (const row of tablesResult.rows) {
      const countResult = await client.query(`SELECT COUNT(*) as count FROM ${row.table_name}`);
      console.log(`   ${row.table_name}: ${countResult.rows[0].count} 条记录`);
    }

    // 测试查询性能
    console.log(`\n⚡ 性能测试:`);
    
    const startTime = Date.now();
    const performanceResult = await client.query(`
      SELECT 
        COUNT(*) as total_submissions,
        COUNT(DISTINCT student_name) as unique_students,
        COUNT(DISTINCT assignment_id) as unique_assignments
      FROM submissions
    `);
    const endTime = Date.now();
    
    console.log(`   复杂查询耗时: ${endTime - startTime}ms`);
    console.log(`   总作品数: ${performanceResult.rows[0].total_submissions}`);
    console.log(`   唯一学生数: ${performanceResult.rows[0].unique_students}`);
    console.log(`   唯一作业数: ${performanceResult.rows[0].unique_assignments}`);

    client.release();
    console.log('\n✅ 所有测试通过！PostgreSQL 配置正确。');
    
    await pool.end();
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    console.error('\n请检查：');
    console.error('1. PostgreSQL 服务是否运行');
    console.error('2. 数据库是否已创建');
    console.error('3. 用户名和密码是否正确');
    console.error('4. .env 文件配置是否正确');
    
    await pool.end();
    process.exit(1);
  }
}

// 执行测试
testConnection();
