import { NextResponse } from 'next/server';
import { pool } from '../../../../lib/database';
import { verifyToken } from '../../../../lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
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
    const connection = await pool.getConnection();

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
        ) as total_weighted_score
      FROM praises p
      WHERE p.to_user_id = ? AND p.is_deleted = 0
    `,
      [userData.id]
    );
    connection.release();

    return NextResponse.json({
      success: true,
      praises,
      stats: {
        total_praises: statsResult[0].total_praises || 0,
        selected_praises: statsResult[0].selected_praises || 0,
        total_weighted_score: statsResult[0].total_weighted_score || 0,
      },
    });
  } catch (error) {
    connection.release();

    console.error('받은 칭찬 조회 에러:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  } finally {
  }
}
