// 데이터베이스 초기화 스크립트
import { initDatabase, insertSampleData } from './database.js';

initDatabase();
insertSampleData();

console.log('데이터베이스 초기화가 완료되었습니다.');
console.log('샘플 데이터가 삽입되었습니다.');
console.log('');
console.log('사용 가능한 테스트 계정:');
console.log('학생: 010-1001-0001 ~ 010-1003-0005');
console.log('선생님: 010-9999-0001 ~ 010-9999-0003');
console.log('');
console.log('최초 로그인 시 아무 비밀번호나 입력하시면 됩니다.');
