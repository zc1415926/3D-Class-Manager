/**
 * 迁移脚本：将评分字段从 submissions 表移到 submission_files 表
 *
 * 这个脚本会：
 * 1. 在 submission_files 表中添加 score, grade, grader_id, graded_at 字段
 * 2. 将 submissions 表中的评分数据迁移到 submission_files 表的 primary 文件
 * 3. 从 submissions 表中删除评分字段
 */

const { getDatabase } = require('../config/database');

async function migrate() {
  const db = getDatabase();
  const client = await db.connect();

  try {
    console.log('开始迁移评分字段...');

    // 1. 检查 submission_files 表是否已有评分字段
    const checkColumns = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'submission_files'
      AND column_name IN ('score', 'grade', 'grader_id', 'graded_at')
    `);

    if (checkColumns.rows.length === 4) {
      console.log('submission_files 表已包含评分字段，跳过字段添加步骤');
    } else {
      console.log('正在添加评分字段到 submission_files 表...');
      await client.query(`
        ALTER TABLE submission_files
        ADD COLUMN IF NOT EXISTS score INTEGER,
        ADD COLUMN IF NOT EXISTS grade VARCHAR(2),
        ADD COLUMN IF NOT EXISTS grader_id INTEGER,
        ADD COLUMN IF NOT EXISTS graded_at TIMESTAMP
      `);
      console.log('评分字段添加完成');
    }

    // 2. 迁移评分数据：将 submissions 表中的评分复制到 primary 文件
    console.log('正在迁移评分数据...');
    const migrateResult = await client.query(`
      UPDATE submission_files sf
      SET
        score = s.score,
        grade = s.grade,
        grader_id = s.grader_id,
        graded_at = s.graded_at
      FROM submissions s
      WHERE sf.submission_id = s.id
        AND sf.is_primary = true
        AND s.score IS NOT NULL
    `);
    console.log(`已迁移 ${migrateResult.rowCount} 条评分记录`);

    // 3. 从 submissions 表中删除评分字段
    console.log('正在从 submissions 表中删除评分字段...');
    try {
      await client.query(`
        ALTER TABLE submissions
        DROP COLUMN IF EXISTS score,
        DROP COLUMN IF EXISTS grade,
        DROP COLUMN IF EXISTS grader_id,
        DROP COLUMN IF EXISTS graded_at
      `);
      console.log('submissions 表中的评分字段已删除');
    } catch (error) {
      console.error('删除 submissions 表评分字段失败:', error.message);
      // 如果删除失败，可能是因为字段不存在，继续执行
    }

    console.log('迁移完成！');
  } catch (error) {
    console.error('迁移失败:', error);
    throw error;
  } finally {
    client.release();
  }
}

// 执行迁移
migrate()
  .then(() => {
    console.log('迁移成功完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('迁移失败:', error);
    process.exit(1);
  });