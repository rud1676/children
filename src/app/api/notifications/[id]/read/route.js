import { NextResponse } from 'next/server';
import { db } from '../../../../../lib/database';
import { verifyToken } from '../../../../../lib/auth';

export async function PUT(request, { params }) {
  try {
    const { id } = params;

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

    // 알림 읽음 처리
    const updateNotification = db.prepare(`
      UPDATE notifications 
      SET is_read = 1 
      WHERE id = ? AND to_user_id = ?
    `);

    const result = updateNotification.run(id, userData.id);

    if (result.changes === 0) {
      return NextResponse.json(
        { error: '알림을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '알림이 읽음 처리되었습니다',
    });
  } catch (error) {
    console.error('알림 읽음 처리 에러:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
