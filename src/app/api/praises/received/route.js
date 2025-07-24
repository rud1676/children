import { NextResponse } from 'next/server';
import { pool } from '../../../../lib/database';
import { verifyToken } from '../../../../lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  let connection;
  try {
    // 토큰에서 사용자 정보 추출
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: '토큰이 필요합니다' }, { status: 401 });
    }

    const userData = verifyToken(token);

    if (!userData) {
      return NextResponse.json(
        { error: '유효하지 않은 토큰입니다' },
        { status: 403 }
      );
    }

    // 받은 칭찬 조회 (선택된 칭찬과 가중 점수 포함)
    connection = await pool.getConnection();

    // 받은 칭찬 목록
    const [praises] = await connection.execute(
      `
      SELECT 
        p.*, 
        u.name as from_name,
        u.role as from_role,
        CASE 
          WHEN p.is_selected = 1 AND p.is_deleted = 0 THEN
            CASE 
              WHEN u.role = 'teacher' THEN 2
              ELSE 1
            END
          ELSE 0
        END as weighted_score
      FROM praises p
      LEFT JOIN users u ON p.from_user_id = u.id
      WHERE p.to_user_id = ? AND p.is_deleted = 0
      ORDER BY p.created_at DESC
    `,
      [userData.id]
    );

    // 받은 칭찬 통계
    const [statsResult] = await connection.execute(
      `
  SELECT 
    COUNT(*) as total_praises,
    COUNT(CASE WHEN p.is_selected = 1 THEN 1 END) as selected_praises,
    SUM(
      CASE 
        WHEN p.is_selected = 1 AND p.is_deleted = 0 THEN
          CASE 
            WHEN EXISTS (
              SELECT 1 FROM users u2 
              WHERE u2.id = p.from_user_id 
              AND u2.role = 'teacher'
            ) THEN 2
            ELSE 1
          END
        ELSE 0
      END
    ) as total_weighted_score,
    COUNT(
      CASE 
        WHEN u.role = 'student' THEN 1 
        ELSE NULL 
      END
    ) as student_praise_count,
    COUNT(
      CASE 
        WHEN u.role = 'student' AND p.is_selected = 1 THEN 1 
        ELSE NULL 
      END
    ) as selected_student_praise_count
  FROM praises p
  LEFT JOIN users u ON p.from_user_id = u.id
  WHERE p.to_user_id = ? AND p.is_deleted = 0
  `,
      [userData.id]
    );

    const {
      total_praises = 0,
      selected_praises = 0,
      total_weighted_score = 0,
      student_praise_count = 0,
      selected_student_praise_count = 0,
    } = statsResult[0];

    // 로직: 학생에게 3개 이상 받았고, 학생 칭찬 중 3개 미만 선택했다면 점수 무효화
    const final_weighted_score =
      student_praise_count >= 3 && selected_student_praise_count < 3
        ? 0
        : total_weighted_score;

    return NextResponse.json({
      success: true,
      praises,
      stats: {
        total_praises,
        selected_praises,
        total_weighted_score: final_weighted_score,
        student_praise_count,
        selected_student_praise_count,
      },
    });
  } catch (error) {
    console.error('받은 칭찬 조회 에러:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}
