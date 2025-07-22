import { NextResponse } from 'next/server';
import { pool } from '../../../../lib/database';
import { getTokenFromRequest, verifyToken } from '../../../../lib/auth';

// 세션별로 선택된 학생들을 저장하는 Map
const sessionStudents = new Map();

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session') || 'default';

    // 토큰에서 유저 정보 가져오기
    const token = getTokenFromRequest(request);
    const user = token ? verifyToken(token) : null;
    const userPhone = user?.phone_number || '';

    // 특정 유저(01012344321)인지 확인
    const isSpecialUser = userPhone === '01012344321';

    const connection = await pool.getConnection();

    try {
      // 모든 학생 정보와 칭찬을 가져오기
      const studentsQuery = `
        SELECT 
          u.id,
          u.name,
          u.school,
          u.grade,
          u.class_number,
          u.student_number,
          p.id as praise_id,
          p.content,
          p.is_selected,
          p.created_at as praise_created_at
        FROM users u
        LEFT JOIN praises p ON u.id = p.to_user_id AND p.is_deleted = 0
        WHERE u.role = 'student'
        ORDER BY u.id, p.created_at DESC
      `;

      const [students] = await connection.execute(studentsQuery);

      // 학생별로 데이터 그룹화
      const studentsMap = new Map();

      students.forEach((row) => {
        if (!studentsMap.has(row.id)) {
          studentsMap.set(row.id, {
            id: row.id,
            name: row.name,
            school: row.school,
            grade: row.grade,
            class_number: row.class_number,
            student_number: row.student_number,
            praises: [],
          });
        }

        if (row.praise_id) {
          studentsMap.get(row.id).praises.push({
            id: row.praise_id,
            content: row.content,
            is_selected: row.is_selected,
            created_at: row.praise_created_at,
          });
        }
      });

      const allStudents = Array.from(studentsMap.values());

      let selectedStudents;

      if (isSpecialUser) {
        // 특정 유저(01084412248)일 때: 세션 기반으로 1명씩 교체
        let currentSelectedStudents = sessionStudents.get(sessionId) || [];

        // 첫 번째 호출이거나 선택된 학생이 8명 미만인 경우
        if (currentSelectedStudents.length === 0) {
          // 랜덤으로 8명 선택
          const shuffledStudents = allStudents.sort(() => Math.random() - 0.5);
          currentSelectedStudents = shuffledStudents
            .slice(0, 8)
            .map((s) => s.id);
        } else {
          // 기존 선택된 학생들 중 1명을 랜덤으로 제거하고 새로운 학생 1명 추가
          const randomIndex = Math.floor(
            Math.random() * currentSelectedStudents.length
          );
          const studentToRemove = currentSelectedStudents[randomIndex];

          // 제거할 학생을 제외한 나머지 학생들
          const remainingStudents = allStudents.filter(
            (student) => !currentSelectedStudents.includes(student.id)
          );

          // 새로운 학생 1명 랜덤 선택
          const newStudent =
            remainingStudents[
              Math.floor(Math.random() * remainingStudents.length)
            ];

          // 기존 선택된 학생들에서 1명 제거하고 새로운 학생 추가
          currentSelectedStudents = [
            ...currentSelectedStudents.slice(0, randomIndex),
            ...currentSelectedStudents.slice(randomIndex + 1),
            newStudent.id,
          ];
        }

        // 세션에 선택된 학생들 저장
        sessionStudents.set(sessionId, currentSelectedStudents);

        // 선택된 학생들의 정보 가져오기
        selectedStudents = allStudents.filter((student) =>
          currentSelectedStudents.includes(student.id)
        );
      } else {
        // 일반 유저: 모든 학생을 한 번에 반환
        selectedStudents = allStudents;
      }

      // 선택된 칭찬만 필터링
      const studentsWithSelectedPraises = selectedStudents.map((student) => ({
        student_info: {
          id: student.id,
          name: student.name,
          school: student.school,
          grade: student.grade,
          class_number: student.class_number,
          student_number: student.student_number,
        },
        praises: student.praises
          .filter((praise) => praise.is_selected)
          .slice(0, 5), // 최대 5개까지만
      }));

      return NextResponse.json({
        success: true,
        students_with_praises: studentsWithSelectedPraises,
        total_students: allStudents.length,
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('학생 칭찬 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: '학생 칭찬을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}
