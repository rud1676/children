// 데이터베이스 초기화 스크립트
import { initDatabase, insertSampleData } from './database.js';

async function main() {
  try {
    await initDatabase();
    console.log('테이블 정보 초기화 완료!');
    await insertSampleData();
    console.log('샘플 데이터 삽입 완료!');
    process.exit(0);
  } catch (err) {
    console.error('샘플 데이터 삽입 중 오류:', err);
    process.exit(1);
  }
}

main();
