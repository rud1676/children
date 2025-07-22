import { NextResponse } from 'next/server';
import { pool } from '../../../../../../lib/database';
import { verifyToken } from '../../../../../../lib/auth';

export async function GET(request, { params }) {
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

    // 선생님만 접근 가능
    if (userData.role !== 'teacher') {
      return NextResponse.json(
        { error: '선생님만 접근할 수 있습니다' },
        { status: 403 }
      );
    }

    const studentId = params.id;

    const connection = await pool.getConnection();

    try {
      // 해당 학생이 작성한 칭찬 중 선택받은 칭찬 개수
      const [selectedWrittenPraisesResult] = await connection.execute(
        'SELECT COUNT(*) as count FROM praises WHERE from_user_id = ? AND is_selected = 1 AND is_deleted = 0',
        [studentId]
      );
      const selectedWrittenPraises = selectedWrittenPraisesResult[0];

      // 해당 학생이 작성한 총 칭찬 개수
      const [totalWrittenPraisesResult] = await connection.execute(
        'SELECT COUNT(*) as count FROM praises WHERE from_user_id = ? AND is_deleted = 0',
        [studentId]
      );
      const totalWrittenPraises = totalWrittenPraisesResult[0];

      const totalCount = totalWrittenPraises.count;
      const selectedCount = selectedWrittenPraises.count;
      const selectionRate =
        totalCount > 0 ? Math.round((selectedCount / totalCount) * 100) : 0;

      return NextResponse.json({
        success: true,
        totalCount,
        selectedCount,
        selectionRate,
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('학생 작성 칭찬 통계 조회 에러:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
