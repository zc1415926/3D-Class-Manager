const { getDatabase } = require('../config/database');

async function removeColumns() {
  const db = getDatabase();
  const client = await db.connect();

  try {
    console.log('开始移除upload_types表中的icon和is_active列...');

    // 检查列是否存在，如果存在则删除
    const iconColumnExists = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='upload_types' AND column_name='icon'
    `);

    if (iconColumnExists.rows.length > 0) {
      await client.query('ALTER TABLE upload_types DROP COLUMN icon');
      console.log('已移除icon列');
    } else {
      console.log('icon列不存在，跳过');
    }

    const isActiveColumnExists = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='upload_types' AND column_name='is_active'
    `);

    if (isActiveColumnExists.rows.length > 0) {
      await client.query('ALTER TABLE upload_types DROP COLUMN is_active');
      console.log('已移除is_active列');
    } else {
      console.log('is_active列不存在，跳过');
    }

    console.log('列移除完成！');
  } catch (error) {
    console.error('移除列失败:', error);
    throw error;
  } finally {
    client.release();
  }
}

// 执行函数
removeColumns()
  .then(() => {
    console.log('脚本执行完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('脚本执行失败:', error);
    process.exit(1);
  });