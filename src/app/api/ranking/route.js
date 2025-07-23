import { NextResponse } from 'next/server';
import { pool } from '../../../lib/database';

// 동적 렌더링 강제
export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const connection = await pool.getConnection();

    try {
      // 1단계: 기본 랭킹 조회 (작성한 칭찬 중 선택받은 개수 순)
      const [basicRanking] = await connection.execute(`
        SELECT 
          u.id,
          u.name,
          u.school,
          u.grade,
          u.class_number,
          u.student_number,
          u.is_king,
          COUNT(CASE WHEN p.is_deleted = 0 THEN 1 END) as total_praises_count,
          SUM(
            CASE 
              WHEN p.is_selected = 1 AND p.is_deleted = 0 THEN
                CASE 
                  WHEN to_user.role = 'teacher' THEN 2
                  ELSE 1
                END
              ELSE 0
            END
          ) as weighted_score
        FROM users u
        LEFT JOIN praises p ON u.id = p.from_user_id AND p.is_deleted = 0
        LEFT JOIN users to_user ON p.to_user_id = to_user.id
        WHERE u.role = 'student'
        GROUP BY u.id, u.name, u.school, u.grade, u.class_number, u.student_number, u.is_king
        HAVING weighted_score > 0
        ORDER BY weighted_score DESC, u.name ASC
      `);

      // 2단계: 각 학생의 받은 칭찬 중 학생이 쓴 것 개수와 선택한 칭찬 개수 조회
      const validStudents = [];

      for (const student of basicRanking) {
        // 받은 칭찬 중 학생이 쓴 것 개수
        const [receivedFromStudentsResult] = await connection.execute(
          `
          SELECT COUNT(*) as count
          FROM praises p
          JOIN users from_user ON p.from_user_id = from_user.id
          WHERE p.to_user_id = ? 
          AND p.is_deleted = 0 
          AND from_user.role = 'student'
        `,
          [student.id]
        );

        const receivedFromStudents = receivedFromStudentsResult[0].count;

        // 선택한 칭찬 개수
        const [selectedPraisesResult] = await connection.execute(
          `
          SELECT COUNT(*) as count
          FROM praises p
          WHERE p.to_user_id = ? 
          AND p.is_selected = 1 
          AND p.is_deleted = 0
        `,
          [student.id]
        );

        const selectedPraises = selectedPraisesResult[0].count;

        // 조건 확인: 받은 칭찬 중 학생이 쓴 것이 3개 미만이거나, 3개 이상이면 선택한 칭찬이 3개 이상이어야 함
        if (
          receivedFromStudents < 3 ||
          (receivedFromStudents >= 3 && selectedPraises >= 3)
        ) {
          validStudents.push(student);
        }
      }

      return NextResponse.json({
        success: true,
        ranking: validStudents.map((student, index) => ({
          rank: index + 1,
          id: student.id,
          name: student.name,
          school: student.school,
          grade: student.grade,
          class_number: student.class_number,
          student_number: student.student_number,
          is_king: student.is_king,
          weighted_score: student.weighted_score || 0,
          total_praises_count: student.total_praises_count || 0,
        })),
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('랭킹 조회 에러:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
