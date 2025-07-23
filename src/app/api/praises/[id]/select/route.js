import { NextResponse } from 'next/server';
import { pool } from '../../../../../lib/database';
import { verifyToken } from '../../../../../lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
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

    const connection = await pool.getConnection();

    try {
      // 칭찬 정보 조회
      const [praises] = await connection.execute(
        'SELECT * FROM praises WHERE id = ?',
        [id]
      );

      if (praises.length === 0) {
        return NextResponse.json(
          { error: '칭찬을 찾을 수 없습니다' },
          { status: 404 }
        );
      }

      const praise = praises[0];
      if (userData.role === 'student' && praise.from_user_role === 'teacher') {
        return NextResponse.json(
          {
            error: '학생은 선생님이 작성한 칭찬에는 좋아요를 누를 수 없습니다',
          },
          { status: 403 }
        );
      }

      // 자신의 칭찬만 선택 가능하도록 확인
      if (praise.to_user_id !== userData.id) {
        return NextResponse.json(
          { error: '자신의 칭찬만 선택할 수 있습니다' },
          { status: 403 }
        );
      }

      // 현재 선택 상태를 반전 (토글)
      const newSelectionState = praise.is_selected ? 0 : 1;

      // 선택하려는 경우, 이미 선택된 칭찬 개수 확인
      if (newSelectionState === 1) {
        const [selectedCountResult] = await connection.execute(
          'SELECT COUNT(*) as count FROM praises WHERE to_user_id = ? AND is_selected = 1',
          [userData.id]
        );
        const selectedCount = selectedCountResult[0].count;

        // 선생님은 최대 1개, 학생은 최대 3개
        const maxAllowed = userData.role === 'teacher' ? 1 : 3;

        if (selectedCount >= maxAllowed) {
          return NextResponse.json(
            { error: `선택된 칭찬은 최대 ${maxAllowed}개까지 가능합니다` },
            { status: 400 }
          );
        }
      }

      // 칭찬 선택/해제 처리
      await connection.execute(
        'UPDATE praises SET is_selected = ? WHERE id = ?',
        [newSelectionState, id]
      );

      return NextResponse.json({
        success: true,
        message: newSelectionState
          ? '칭찬이 선택되었습니다'
          : '칭찬 선택이 해제되었습니다',
        is_selected: newSelectionState === 1,
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('칭찬 선택 처리 에러:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
