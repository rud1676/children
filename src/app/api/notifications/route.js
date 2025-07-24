import { NextResponse } from 'next/server';
import { pool } from '../../../lib/database';
import { verifyToken } from '../../../lib/auth';

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

    // 마지막 확인 시간 파라미터 (클라이언트에서 전송)
    const { searchParams } = new URL(request.url);
    const lastChecked = searchParams.get('lastChecked');

    if (!lastChecked) {
      return NextResponse.json({
        success: true,
        notifications: [],
        currentTime: new Date().toISOString(),
      });
    }

    connection = await pool.getConnection();

    try {
      // 마지막 확인 시간 이후 새로 추가된 칭찬 조회
      console.log(lastChecked, 'lastChecked');
      const [newPraises] = await connection.execute(
        `
        SELECT 
          p.id,
          p.content,
          p.from_user_id,
          p.to_user_id,
          p.created_at,
          from_user.name as from_user_name,
          to_user.name as to_user_name
        FROM praises p
        JOIN users from_user ON p.from_user_id = from_user.id
        JOIN users to_user ON p.to_user_id = to_user.id
        WHERE p.created_at > ? 
          AND p.is_deleted = 0
        ORDER BY p.created_at DESC
      `,
        [lastChecked]
      );

      // 알림할 사용자 이름 배열 생성 (중복 제거) - 칭찬을 받은 사람들
      const alertUsers = [
        ...new Set(newPraises.map((praise) => praise.to_user_name)),
      ];

      return NextResponse.json({
        success: true,
        alertUsers,
        currentTime: new Date().toISOString(),
      });
    } finally {
      if (connection) connection.release();
    }
  } catch (error) {
    console.error('알림 조회 에러:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}
