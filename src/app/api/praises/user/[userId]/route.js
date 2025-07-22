import { NextResponse } from 'next/server';
import { pool } from '../../../../../lib/database';

export async function GET(request, { params }) {
  try {
    const { userId } = params;

    // 특정 사용자가 받은 칭찬 조회
    const connection = await pool.getConnection();
    const [praises] = await connection.execute(
      `
      SELECT p.*, u.name as from_name
      FROM praises p
      LEFT JOIN users u ON p.from_user_id = u.id
      WHERE p.to_user_id = ? AND p.is_deleted = 0
      ORDER BY p.created_at DESC
    `,
      [userId]
    );
    connection.release();

    return NextResponse.json({
      success: true,
      praises,
    });
  } catch (error) {
    console.error('사용자 칭찬 조회 에러:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
