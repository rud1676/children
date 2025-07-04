import { NextResponse } from 'next/server';
import { db } from '../../../../../lib/database';
import { verifyToken } from '../../../../../lib/auth';

export async function GET(request, { params }) {
  try {
    const { userId } = params;

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

    // 선생님 권한 확인
    if (userData.role !== 'teacher') {
      return NextResponse.json(
        { error: '선생님만 접근할 수 있습니다' },
        { status: 403 }
      );
    }

    // 사용자 정보 조회
    const getUser = db.prepare('SELECT * FROM users WHERE id = ?');
    const user = getUser.get(userId);

    if (!user) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // URL 파라미터에서 showDeleted 확인
    const { searchParams } = new URL(request.url);
    const showDeleted = searchParams.get('showDeleted') === 'true';

    // 해당 사용자의 칭찬 조회
    const getPraises = db.prepare(`
      SELECT p.*, u.name as from_name
      FROM praises p
      LEFT JOIN users u ON p.from_user_id = u.id
      WHERE p.to_user_id = ? ${showDeleted ? '' : 'AND p.is_deleted = 0'}
      ORDER BY p.created_at DESC
    `);

    const praises = getPraises.all(userId);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        phone_number: user.phone_number,
        role: user.role,
        school: user.school,
        grade: user.grade,
        class_number: user.class_number,
        student_number: user.student_number,
      },
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
