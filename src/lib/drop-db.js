import { pool } from './database.js';

async function main() {
  try {
    const connection = await pool.getConnection();
    // 외래키 제약 해제
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    await connection.query('DROP TABLE IF EXISTS notifications');
    await connection.query('DROP TABLE IF EXISTS praises');
    await connection.query('DROP TABLE IF EXISTS users');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    connection.release();
    console.log('DB 모든 테이블 삭제 완료!');
    process.exit(0);
  } catch (err) {
    console.error('DB 삭제 중 오류:', err);
    process.exit(1);
  }
}

main();
