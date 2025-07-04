import { NextResponse } from 'next/server';
import { db } from '../../../../lib/database';
import { verifyToken } from '../../../../lib/auth';

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

    // 알림 조회
    const getNotifications = db.prepare(`
      SELECT n.*, 
             u.name as from_name,
             p.content as praise_content
      FROM notifications n
      LEFT JOIN users u ON n.from_user_id = u.id
      LEFT JOIN praises p ON n.praise_id = p.id
      WHERE n.to_user_id = ? AND n.is_deleted = 0
      ORDER BY n.created_at DESC
    `);

    const notifications = getNotifications.all(userData.id);

    return NextResponse.json({
      success: true,
      notifications,
    });
  } catch (error) {
    console.error('알림 조회 에러:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
