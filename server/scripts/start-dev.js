#!/usr/bin/env node

/**
 * 开发环境启动脚本
 * 功能：
 * 1. 检查并启动PostgreSQL服务
 * 2. 检查数据库连接
 * 3. 启动Express服务器
 */

require('dotenv').config();
const { exec } = require('child_process');
const path = require('path');

console.log('🚀 启动开发服务器...\n');

// 检测数据库类型
const DB_TYPE = process.env.DB_TYPE || 'sqlite';

// 启动PostgreSQL服务（如果使用PostgreSQL）
if (DB_TYPE === 'postgresql') {
  startPostgreSQL();
} else {
  startServer();
}

/**
 * 启动PostgreSQL服务
 */
function startPostgreSQL() {
  console.log('📦 检查 PostgreSQL 服务...');
  
  // 检查PostgreSQL服务状态
  const checkCommand = process.platform === 'win32' 
    ? 'sc query postgresql-x64-16'
    : 'systemctl is-active postgresql';
  
  exec(checkCommand, (error, stdout, stderr) => {
    if (error) {
      console.log('⚠️  无法检测PostgreSQL服务状态');
      console.log('请确保PostgreSQL服务正在运行');
      startServer();
      return;
    }
    
    const isActive = stdout.includes('active') || stdout.includes('RUNNING');
    
    if (isActive) {
      console.log('✅ PostgreSQL 服务已运行\n');
      testDatabaseConnection();
    } else {
      console.log('🔄 启动 PostgreSQL 服务...');
      
      const startCommand = process.platform === 'win32'
        ? 'net start postgresql-x64-16'
        : 'sudo systemctl start postgresql';
      
      exec(startCommand, (error, stdout, stderr) => {
        if (error) {
          console.error('❌ 启动PostgreSQL失败:', error.message);
          console.log('\n请手动启动PostgreSQL服务:');
          console.log('  Linux: sudo systemctl start postgresql');
          console.log('  macOS: brew services start postgresql@16');
          console.log('  Windows: net start postgresql-x64-16\n');
          console.log('或切换回SQLite数据库:');
          console.log('  在 .env 文件中设置: DB_TYPE=sqlite\n');
          process.exit(1);
        } else {
          console.log('✅ PostgreSQL 服务已启动\n');
          // 等待服务完全启动
          setTimeout(() => {
            testDatabaseConnection();
          }, 2000);
        }
      });
    }
  });
}

/**
 * 测试数据库连接
 */
function testDatabaseConnection() {
  console.log('🔗 测试数据库连接...');
  
  const testScript = path.join(__dirname, 'test-postgresql.js');
  
  const testProcess = exec(`node ${testScript}`, (error, stdout, stderr) => {
    if (error) {
      console.error('❌ 数据库连接测试失败');
      console.error(stderr);
      
      // 如果是PostgreSQL，提示用户配置
      if (DB_TYPE === 'postgresql') {
        console.log('\n请检查PostgreSQL配置:');
        console.log('1. PostgreSQL服务是否运行');
        console.log('2. 数据库是否已创建');
        console.log('3. .env文件配置是否正确');
        console.log('\n运行测试脚本查看详细信息:');
        console.log(`  node ${testScript}\n`);
      }
      
      // 继续启动服务器（可能使用SQLite）
      startServer();
    } else {
      console.log(stdout);
      console.log('✅ 数据库连接测试通过\n');
      startServer();
    }
  });
}

/**
 * 启动Express服务器
 */
function startServer() {
  console.log('🌐 启动 Express 服务器...');
  console.log(`   端口: ${process.env.PORT || 5000}`);
  console.log(`   数据库: ${DB_TYPE === 'postgresql' ? 'PostgreSQL' : 'SQLite'}`);
  console.log(`   环境: ${process.env.NODE_ENV || 'development'}\n`);
  
  // 启动nodemon
  const nodemon = require('nodemon');
  
  const config = {
    script: 'server.js',
    watch: ['routes/', 'models/', 'config/', 'middleware/'],
    ext: 'js,json',
    ignore: ['uploads/', 'thumbnails/', 'node_modules/', '.git/'],
    env: process.env
  };
  
  nodemon(config);
  
  console.log('✅ 开发服务器已启动\n');
  console.log('📝 提示:');
  console.log('   - 访问: http://localhost:5000/api/health');
  console.log('   - 前端: http://localhost:3000');
  console.log('   - 日志文件: server/server.log');
  
  if (DB_TYPE === 'postgresql') {
    console.log('   - 数据库: PostgreSQL');
    console.log('   - 测试连接: npm run test:pg');
  }
}

// 处理退出信号
process.on('SIGINT', () => {
  console.log('\n\n⏸️  正在停止服务器...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n⏸️  正在停止服务器...');
  process.exit(0);
});