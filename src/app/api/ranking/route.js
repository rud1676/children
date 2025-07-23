import { NextResponse } from 'next/server';
import { pool } from '../../../lib/database';

// 동적 렌더링 강제
export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const connection = await pool.getConnection();

    try {
      // 작성한 칭찬 중 선택받은 개수 순으로 랭킹 조회 (선생님 선택은 2점)
      const [ranking] = await connection.execute(`
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
                  WHEN EXISTS (
                    SELECT 1 FROM praises p2 
                    WHERE p2.id = p.id 
                    AND p2.is_selected = 1 
                    AND p2.is_deleted = 0
                    AND EXISTS (
                      SELECT 1 FROM users u2 
                      WHERE u2.id = p2.from_user_id 
                      AND u2.role = 'teacher'
                    )
                  ) THEN 2
                  ELSE 1
                END
              ELSE 0
            END
          ) as weighted_score,
          ROW_NUMBER() OVER (ORDER BY 
            SUM(
              CASE 
                WHEN p.is_selected = 1 AND p.is_deleted = 0 THEN
                  CASE 
                    WHEN EXISTS (
                      SELECT 1 FROM praises p2 
                      WHERE p2.id = p.id 
                      AND p2.is_selected = 1 
                      AND p2.is_deleted = 0
                      AND EXISTS (
                        SELECT 1 FROM users u2 
                        WHERE u2.id = p2.from_user_id 
                        AND u2.role = 'teacher'
                      )
                    ) THEN 2
                    ELSE 1
                  END
                ELSE 0
              END
            ) DESC
          ) as ranking_position
        FROM users u
        LEFT JOIN praises p ON u.id = p.from_user_id AND p.is_deleted = 0
        WHERE u.role = 'student'
        GROUP BY u.id
        HAVING NOT (
          COUNT(CASE WHEN p.is_deleted = 0 THEN 1 END) >= 5
          AND
          SUM(
            CASE 
              WHEN p.is_selected = 1 AND p.is_deleted = 0 THEN
                CASE 
                  WHEN EXISTS (
                    SELECT 1 FROM praises p2 
                    WHERE p2.id = p.id 
                    AND p2.is_selected = 1 
                    AND p2.is_deleted = 0
                    AND EXISTS (
                      SELECT 1 FROM users u2 
                      WHERE u2.id = p2.from_user_id 
                      AND u2.role = 'teacher'
                    )
                  ) THEN 2
                  ELSE 1
                END
              ELSE 0
            END
          ) < 5
        )
        AND SUM(
          CASE 
            WHEN p.is_selected = 1 AND p.is_deleted = 0 THEN
              CASE 
                WHEN EXISTS (
                  SELECT 1 FROM praises p2 
                  WHERE p2.id = p.id 
                  AND p2.is_selected = 1 
                  AND p2.is_deleted = 0
                  AND EXISTS (
                    SELECT 1 FROM users u2 
                    WHERE u2.id = p2.from_user_id 
                    AND u2.role = 'teacher'
                  )
                ) THEN 2
                ELSE 1
              END
            ELSE 0
          END
        ) > 0
        ORDER BY weighted_score DESC, u.name ASC
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
