import { NextResponse } from 'next/server';
import { pool } from '../../../../../lib/database';
import { verifyToken } from '../../../../../lib/auth';

export const dynamic = 'force-dynamic';

export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    // request body가 있는지 확인하고 안전하게 파싱
    let reason = '';
    try {
      const body = await request.json();
      reason = body.reason || '';
    } catch (parseError) {
      // request body가 없거나 잘못된 형식인 경우 빈 문자열로 처리
      reason = '';
    }

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

    // 칭찬 삭제 처리 (소프트 삭제)
    await connection.execute(
      'UPDATE praises SET is_deleted = 1, deleted_by = ?, delete_reason = ? WHERE id = ?',
      [userData.id, reason, id]
    );

    connection.release();

    return NextResponse.json({
      success: true,
      message: '칭찬이 삭제되었습니다',
    });
  } catch (error) {
    console.error('칭찬 삭제 에러:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
