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

    // 작성한 칭찬 조회
    const connection = await pool.getConnection();
    const [praises] = await connection.execute(
      `
      SELECT p.*, u.name as to_name
      FROM praises p
      LEFT JOIN users u ON p.to_user_id = u.id
      WHERE p.from_user_id = ? AND p.is_deleted = 0
      ORDER BY p.created_at DESC
    `,
      [userData.id]
    );
    connection.release();

    return NextResponse.json({
      success: true,
      praises,
    });
  } catch (error) {
    console.error('작성한 칭찬 조회 에러:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
