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

    // 사용자 정보 조회
    const connection = await pool.getConnection();
    const [users] = await connection.execute(
      'SELECT * FROM users WHERE id = ?',
      [userData.id]
    );
    connection.release();

    if (users.length === 0) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    const user = users[0];

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        phone_number: user.phone_number,
        role: user.role,
        is_king: user.is_king,
        school: user.school,
        grade: user.grade,
        class_number: user.class_number,
        student_number: user.student_number,
      },
    });
  } catch (error) {
    console.error('사용자 정보 조회 에러:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
