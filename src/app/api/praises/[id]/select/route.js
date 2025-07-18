import { NextResponse } from 'next/server';
import { db } from '../../../../../lib/database';
import { verifyToken } from '../../../../../lib/auth';

export async function POST(request, { params }) {
  return await handleSelectRequest(request, { params });
}

async function handleSelectRequest(request, { params }) {
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

    // 학생 권한 확인 (자신의 칭찬만 선택 가능)
    if (userData.role !== 'student') {
      return NextResponse.json(
        { error: '학생만 접근할 수 있습니다' },
        { status: 403 }
      );
    }

    // 칭찬 정보 조회
    const getPraise = db.prepare('SELECT * FROM praises WHERE id = ?');
    const praise = getPraise.get(id);

    if (!praise) {
      return NextResponse.json(
        { error: '칭찬을 찾을 수 없습니다' },
        { status: 404 }
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

    // 선택하려는 경우, 이미 선택된 칭찬이 5개 이상인지 확인
    if (newSelectionState === 1) {
      const getSelectedCount = db.prepare(`
        SELECT COUNT(*) as count 
        FROM praises 
        WHERE to_user_id = ? AND is_selected = 1
      `);
      const selectedCount = getSelectedCount.get(userData.id);

      if (selectedCount.count >= 5) {
        return NextResponse.json(
          { error: '선택된 칭찬은 최대 5개까지 가능합니다' },
          { status: 400 }
        );
      }
    }

    // 칭찬 선택/해제 처리
    const updateSelection = db.prepare(`
      UPDATE praises 
      SET is_selected = ?
      WHERE id = ?
    `);

    const result = updateSelection.run(newSelectionState, id);

    if (result.changes === 0) {
      return NextResponse.json(
        { error: '칭찬 선택 상태 변경에 실패했습니다' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: newSelectionState
        ? '칭찬이 선택되었습니다'
        : '칭찬 선택이 해제되었습니다',
      is_selected: newSelectionState === 1,
    });
  } catch (error) {
    console.error('칭찬 선택 처리 에러:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
