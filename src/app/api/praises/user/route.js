import { NextResponse } from 'next/server';
import { db } from '../../../../lib/database';
import { verifyToken } from '../../../../lib/auth';

export async function GET(request) {
  try {
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

    // URL 파라미터에서 showDeleted 확인
    const { searchParams } = new URL(request.url);
    const showDeleted = searchParams.get('showDeleted') === 'true';

    // 내가 작성한 칭찬 조회 (삭제된 것 포함 여부에 따라)
    const getPraises = db.prepare(`
      SELECT p.*, COALESCE(u.name, '알 수 없음') as to_name
      FROM praises p
      LEFT JOIN users u ON p.to_user_id = u.id
      WHERE p.from_user_id = ? ${showDeleted ? '' : 'AND p.is_deleted = 0'}
      ORDER BY p.created_at DESC
    `);

    const praises = getPraises.all(userData.id);

    return NextResponse.json({
      success: true,
      praises,
    });
  } catch (error) {
    console.error('내가 작성한 칭찬 조회 에러:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
