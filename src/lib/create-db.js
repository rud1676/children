import mysql from 'mysql2/promise';

async function main() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: 'password',
    });

    await connection.query('CREATE DATABASE IF NOT EXISTS gilgae');
    console.log('gilgae 데이터베이스 생성 완료!');
    await connection.end();
    process.exit(0);
  } catch (err) {
    console.error('DB 생성 중 오류:', err);
    process.exit(1);
  }
}

main();
