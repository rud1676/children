import { NextResponse } from 'next/server';
import { pool } from '../../../../../lib/database';
import { verifyToken } from '../../../../../lib/auth';

export async function POST(request, { params }) {
  try {
    const { id } = params;
    const { is_selected } = await request.json();

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

    // 칭찬 정보 조회
    const connection = await pool.getConnection();
    const [praises] = await connection.execute(
      'SELECT * FROM praises WHERE id = ? AND is_deleted = 0',
      [id]
    );

    if (praises.length === 0) {
      connection.release();
      return NextResponse.json(
        { error: '칭찬을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 선택 상태 업데이트
    await connection.execute(
      'UPDATE praises SET is_selected = ? WHERE id = ?',
      [is_selected, id]
    );

    connection.release();

    return NextResponse.json({
      success: true,
      message: '칭찬 선택 상태가 업데이트되었습니다',
    });
  } catch (error) {
    console.error('칭찬 선택 에러:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
