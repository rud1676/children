import { NextResponse } from 'next/server';
import { pool } from '../../../../lib/database';
import { getTokenFromRequest, verifyToken } from '../../../../lib/auth';

export const dynamic = 'force-dynamic';

// 세션별로 선택된 선생님들을 저장하는 Map
const sessionTeachers = new Map();

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
      // 모든 선생님 정보와 칭찬을 가져오기 (관리자 제외)
      const teachersQuery = `
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
          p.is_teacher,
          p.created_at as praise_created_at
        FROM users u
        LEFT JOIN praises p ON u.id = p.to_user_id AND p.is_deleted = 0
        WHERE u.role = 'teacher' AND u.name != '관리자'
        ORDER BY u.id, p.created_at DESC
      `;

      const [teachers] = await connection.execute(teachersQuery);

      // 선생님별로 데이터 그룹화
      const teachersMap = new Map();

      teachers.forEach((row) => {
        if (!teachersMap.has(row.id)) {
          teachersMap.set(row.id, {
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
          teachersMap.get(row.id).praises.push({
            id: row.praise_id,
            content: row.content,
            is_selected: row.is_selected,
            is_teacher: row.is_teacher,
            created_at: row.praise_created_at,
          });
        }
      });

      const allTeachers = Array.from(teachersMap.values());

      let selectedTeachers;

      if (isSpecialUser) {
        // 특정 유저(01012344321)일 때: 세션 기반으로 1명씩 교체
        let currentSelectedTeachers = sessionTeachers.get(sessionId) || [];

        // 첫 번째 호출이거나 선택된 선생님이 5명 미만인 경우
        if (currentSelectedTeachers.length === 0) {
          // 랜덤으로 5명 선택
          const shuffledTeachers = allTeachers.sort(() => Math.random() - 0.5);
          currentSelectedTeachers = shuffledTeachers
            .slice(0, 5)
            .map((t) => t.id);
        } else {
          // 기존 선택된 선생님들 중 1명을 랜덤으로 제거하고 새로운 선생님 1명 추가
          const randomIndex = Math.floor(
            Math.random() * currentSelectedTeachers.length
          );
          const teacherToRemove = currentSelectedTeachers[randomIndex];

          // 제거할 선생님을 제외한 나머지 선생님들
          const remainingTeachers = allTeachers.filter(
            (teacher) => !currentSelectedTeachers.includes(teacher.id)
          );

          // 새로운 선생님 1명 랜덤 선택
          const newTeacher =
            remainingTeachers[
              Math.floor(Math.random() * remainingTeachers.length)
            ];

          // 기존 선택된 선생님들에서 1명 제거하고 새로운 선생님 추가
          currentSelectedTeachers = [
            ...currentSelectedTeachers.slice(0, randomIndex),
            ...currentSelectedTeachers.slice(randomIndex + 1),
            newTeacher.id,
          ];
        }

        // 세션에 선택된 선생님들 저장
        sessionTeachers.set(sessionId, currentSelectedTeachers);

        // 선택된 선생님들의 정보 가져오기
        selectedTeachers = allTeachers.filter((teacher) =>
          currentSelectedTeachers.includes(teacher.id)
        );
      } else {
        // 일반 유저: 모든 선생님을 한 번에 반환
        selectedTeachers = allTeachers;
      }

      // 선택된 칭찬만 필터링
      const teachersWithSelectedPraises = selectedTeachers.map((teacher) => {
        const selectedPraises = teacher.praises
          .filter((praise) => praise.is_selected)
          .slice(0, 3); // 최대 3개까지만

        return {
          teacher_info: {
            id: teacher.id,
            name: teacher.name,
            school: teacher.school,
            grade: teacher.grade,
            class_number: teacher.class_number,
            student_number: teacher.student_number,
          },
          praises: selectedPraises,
        };
      });

      return NextResponse.json({
        success: true,
        teachers_with_praises: teachersWithSelectedPraises,
        total_teachers: allTeachers.length,
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('선생님 칭찬 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: '선생님 칭찬을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}
