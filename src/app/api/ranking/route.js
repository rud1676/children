import { NextResponse } from 'next/server';
import { pool } from '../../../lib/database';

// 동적 렌더링 강제
export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const connection = await pool.getConnection();

    try {
      // 작성한 칭찬 중 선택받은 개수 순으로 랭킹 조회
      const [ranking] = await connection.execute(`
        SELECT 
          u.id,
          u.name,
          u.school,
          u.grade,
          u.class_number,
          u.student_number,
          u.is_king,
          COUNT(CASE WHEN p.is_selected = 1 AND p.is_deleted = 0 THEN 1 END) as selected_praises_count,
          COUNT(CASE WHEN p.is_deleted = 0 THEN 1 END) as total_praises_count,
          ROW_NUMBER() OVER (ORDER BY COUNT(CASE WHEN p.is_selected = 1 AND p.is_deleted = 0 THEN 1 END) DESC) as ranking_position
        FROM users u
        LEFT JOIN praises p ON u.id = p.from_user_id AND p.is_deleted = 0
        WHERE u.role = 'student'
        GROUP BY u.id
        HAVING NOT (
          COUNT(CASE WHEN p.is_deleted = 0 THEN 1 END) >= 5
          AND
          COUNT(CASE WHEN p.is_selected = 1 AND p.is_deleted = 0 THEN 1 END) < 5
        )
        AND COUNT(CASE WHEN p.is_selected = 1 AND p.is_deleted = 0 THEN 1 END) > 0
        ORDER BY selected_praises_count DESC, u.name ASC
      `);

      return NextResponse.json({
        success: true,
        ranking: ranking.map((student) => ({
          rank: student.ranking_position,
          id: student.id,
          name: student.name,
          school: student.school,
          grade: student.grade,
          class_number: student.class_number,
          student_number: student.student_number,
          is_king: student.is_king,
          selected_praises_count: student.selected_praises_count || 0,
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
