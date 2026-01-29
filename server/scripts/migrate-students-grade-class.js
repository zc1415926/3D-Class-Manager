#!/usr/bin/env node

/**
 * 学生数据迁移脚本
 * 为旧的学生数据生成随机的年级和班级
 */

// 加载环境变量
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const { getDatabase } = require('../config/database');

async function migrateStudents() {
  const db = getDatabase();
  const client = await db.connect();

  try {
    console.log('开始迁移学生数据...');

    // 检查是否需要迁移（查找grade为null或不存在grade字段的学生）
    const checkResult = await client.query(`
      SELECT COUNT(*) as count 
      FROM students 
      WHERE grade IS NULL OR class_number IS NULL
    `);

    const needMigrateCount = parseInt(checkResult.rows[0].count);

    if (needMigrateCount === 0) {
      console.log('所有学生数据已包含年级和班级信息，无需迁移。');
      client.release();
      return;
    }

    console.log(`找到 ${needMigrateCount} 条需要迁移的学生记录。`);

    // 年级选项
    const grades = ['一', '二', '三', '四', '五', '六'];

    // 获取需要迁移的学生
    const studentsResult = await client.query(`
      SELECT id, name 
      FROM students 
      WHERE grade IS NULL OR class_number IS NULL
    `);

    let migratedCount = 0;

    for (const student of studentsResult.rows) {
      // 随机生成年级（1-6年级）
      const randomGrade = grades[Math.floor(Math.random() * grades.length)];
      
      // 随机生成班级（1-10班）
      const randomClass = Math.floor(Math.random() * 10) + 1;

      // 更新学生数据
      await client.query(`
        UPDATE students 
        SET grade = $1, class_number = $2 
        WHERE id = $3
      `, [randomGrade, randomClass, student.id]);

      migratedCount++;
      console.log(`已迁移: ${student.name} -> ${randomGrade}年级${randomClass}班`);
    }

    console.log(`\n迁移完成！共迁移 ${migratedCount} 条学生记录。`);

  } catch (error) {
    console.error('迁移失败:', error);
  } finally {
    client.release();
  }
}

// 执行迁移
migrateStudents()
  .then(() => {
    console.log('数据迁移脚本执行完成。');
    process.exit(0);
  })
  .catch((error) => {
    console.error('执行失败:', error);
    process.exit(1);
  });