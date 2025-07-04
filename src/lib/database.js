import Database from 'better-sqlite3';
import path from 'path';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 데이터베이스 파일 경로
const dbPath = path.join(process.cwd(), 'student_praise.db');
const db = new Database(dbPath);

// 데이터베이스 초기화
function initDatabase() {
  // 사용자 테이블 생성
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone_number TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password TEXT,
      role TEXT NOT NULL CHECK (role IN ('student', 'teacher')),
      is_first_login BOOLEAN DEFAULT TRUE,
      
      -- 학생 전용 정보
      school TEXT,
      grade INTEGER,
      class_number INTEGER,
      student_number INTEGER,
      
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 칭찬 테이블 생성
  db.exec(`
    CREATE TABLE IF NOT EXISTS praises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_user_id INTEGER NOT NULL,
      to_user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      is_selected BOOLEAN DEFAULT FALSE,
      is_deleted BOOLEAN DEFAULT FALSE,
      deleted_by INTEGER,
      delete_reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (from_user_id) REFERENCES users(id),
      FOREIGN KEY (to_user_id) REFERENCES users(id),
      FOREIGN KEY (deleted_by) REFERENCES users(id)
    )
  `);

  // 알림 테이블 생성
  db.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      message TEXT NOT NULL,
      is_read BOOLEAN DEFAULT FALSE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  console.log('데이터베이스 초기화 완료');
}

// 샘플 데이터 삽입 (개발용)
function insertSampleData() {
  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users (phone_number, name, role, school, grade, class_number, student_number)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  // 학생 데이터 (고3)
  const students = [
    ['01053873362', '경건', 'student', '도농고등학교', 3, null, null],
    ['01039534788', '양승철', 'student', '도농고등학교', 3, null, null],
    ['01037735323', '김찬솔', 'student', '동화고등학교', 3, null, null],
    ['01064732420', '안이찬', 'student', '가운중학교', 3, null, null],

    // 고2
    ['01041234221', '강준혁', 'student', '도농고등학교', 2, null, null],
    ['01021730173', '임수아', 'student', '도농고등학교', 2, null, null],
    ['01047375309', '장윤성', 'student', '도농고등학교', 2, null, null],
    ['01062932809', '정시은', 'student', '도농고등학교', 2, null, null],
    ['01027315812', '이규연', 'student', '도농고등학교', 2, null, null],
    ['01099544003', '김상훈', 'student', '도농고등학교', 2, null, null],
    ['01000000000', '서하영', 'student', '도농고등학교', 2, null, null],

    // 고1
    ['01076134766', '송제니', 'student', '교문중학교', 1, null, null],
    ['01000000001', '정다솜', 'student', '도농고등학교', 1, null, null],
    ['01093089386', '전혜인', 'student', '오남중학교', 1, null, null],
    ['01080621022', '김단우', 'student', '다산한강중학교', 1, null, null],
    ['01055227145', '이민지', 'student', '도농고등학교', 1, null, null],
    ['01000000002', '조예령', 'student', '도농고등학교', 1, null, null],

    // 중3
    ['01096207292', '권율', 'student', '다산중학교', 3, null, null],
    ['01032048785', '이태연', 'student', '인창중학교', 3, null, null],
    ['01084274788', '양승규', 'student', '동화중학교', 3, null, null],
    ['01099772809', '정주원', 'student', '인창중학교', 3, null, null],
    ['01046793362', '경하영', 'student', '가운중학교', 3, null, null],
    ['01021299669', '허윤재', 'student', '동화중학교', 3, null, null],
    ['01049043626', '김지환', 'student', '동화중학교', 3, null, null],
    ['01031156740', '곽용태', 'student', '다산중학교', 3, null, null],
    ['01046741602', '서태웅', 'student', '다산중학교', 3, null, null],
    ['01000000003', '안하선', 'student', '도농중학교', 3, null, null],
    ['01090763845', '원은석', 'student', '동화중학교', 3, null, null],

    // 중2
    ['01075420844', '배성현', 'student', '도농중학교', 2, null, null],
    ['01082734766', '송혜니', 'student', '도농중학교', 2, null, null],
    ['01098787251', '이하랑', 'student', '도농중학교', 2, null, null],
    ['01094367885', '서주아', 'student', '도농중학교', 2, null, null],
    ['01096237292', '권담의', 'student', '도농중학교', 2, null, null],
    ['01075466537', '문주희', 'student', '도농중학교', 2, null, null],
    ['01065478990', '김산', 'student', '도농중학교', 2, null, null],
    ['01092486585', '김주하', 'student', '도농중학교', 2, null, null],
    ['01091256542', '유이', 'student', '도농중학교', 2, null, null],
  ];

  students.forEach((student) => {
    insertUser.run(student);
  });

  // 선생님 데이터
  const teachers = [
    ['01012344321', '관리자', 'teacher'],
    ['01084412248', '오현준', 'teacher'],
    ['01032341334', '나리', 'teacher'],
    ['01047342088', '원인숙', 'teacher'],
    ['01087310534', '임대현', 'teacher'],
    ['01042405264', '이성봉', 'teacher'],
    ['01000000004', '신한나', 'teacher'],
    ['01049609603', '주경진', 'teacher'],
    ['01072209917', '윤지성', 'teacher'],
    ['01041302088', '장서영', 'teacher'],
    ['01028346025', '권빈', 'teacher'],
  ];

  teachers.forEach((teacher) => {
    insertUser.run([
      teacher[0],
      teacher[1],
      teacher[2],
      null,
      null,
      null,
      null,
    ]);
  });

  // 칭찬 데이터 삽입
  const insertPraise = db.prepare(`
    INSERT OR IGNORE INTO praises (from_user_id, to_user_id, content, is_selected)
    VALUES (?, ?, ?, ?)
  `);

  // 테스트 칭찬 데이터 (몇 명 학생들에게만)
  const praises = [
    // 경건에게 받은 칭찬들 (8개)
    [2, 1, '경건이는 항상 찬양할 때 열심히 참여해주고 있어서 정말 감사해!', 1],
    [3, 1, '경건이의 섬김하는 마음이 정말 아름다워', 1],
    [4, 1, '경건이가 찬양팀에서 하는 모습이 너무 멋져', 1],
    [5, 1, '경건이는 항상 다른 사람을 먼저 생각하는 마음이 있어', 0],
    [6, 1, '경건이의 리더십이 정말 대단해', 1],
    [7, 1, '경건이는 항상 예의 바르고 매너가 좋아', 0],
    [8, 1, '경건이의 긍정적인 마인드가 정말 좋아', 1],
    [9, 1, '경건이는 항상 웃음이 많아서 주변 사람들도 행복해져', 0],

    // 양승철에게 받은 칭찬들 (3개)
    [1, 2, '승철이는 항상 밝은 에너지로 분위기를 밝게 만들어줘', 1],
    [3, 2, '승철이의 긍정적인 마인드가 정말 좋아', 0],
    [4, 2, '승철이는 항상 웃음이 많아서 주변 사람들도 행복해져', 1],

    // 김찬솔에게 받은 칭찬들 (2개)
    [1, 3, '찬솔이는 항상 진지하게 말씀을 듣는 모습이 인상적이야', 0],
    [2, 3, '찬솔이의 성실함이 정말 대단해', 1],

    // 안이찬에게 받은 칭찬들 (3개)
    [1, 4, '이찬이는 항상 도움이 필요할 때 먼저 나서주는 마음이 있어', 1],
    [2, 4, '이찬이의 섬김하는 마음이 정말 아름다워', 0],
    [3, 4, '이찬이는 항상 겸손하고 예의 바른 모습이 보기 좋아', 1],

    // 강준혁에게 받은 칭찬들 (2개)
    [6, 5, '준혁이는 회장으로서 정말 책임감 있게 일해주고 있어', 1],
    [7, 5, '준혁이의 리더십이 정말 대단해', 0],

    // 임수아에게 받은 칭찬들 (2개)
    [5, 6, '수아는 부회장으로서 정말 열심히 일해주고 있어', 1],
    [7, 6, '수아의 섬김하는 마음이 정말 아름다워', 0],
  ];

  praises.forEach((praise) => {
    insertPraise.run(praise);
  });

  console.log('샘플 데이터 삽입 완료');
}

// 데이터베이스 초기화 실행
// initDatabase();
// insertSampleData();

// 데이터베이스 초기화와 샘플 데이터 삽입 함수만 export (직접 실행 X)
export { db, bcrypt, initDatabase, insertSampleData };
