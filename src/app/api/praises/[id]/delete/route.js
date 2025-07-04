import { NextResponse } from 'next/server';
import { db } from '../../../../../lib/database';
import { verifyToken } from '../../../../../lib/auth';

export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    // 요청 본문이 있는지 확인하고 안전하게 파싱
    let reason = null;
    try {
      const body = await request.json();
      reason = body.reason;
    } catch (e) {
      // body가 없거나 JSON이 아닌 경우 무시
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

    // 칭찬 정보 조회
    const getPraise = db.prepare(`
      SELECT p.*, u.name as to_name
      FROM praises p
      LEFT JOIN users u ON p.to_user_id = u.id
      WHERE p.id = ?
    `);
    const praise = getPraise.get(id);

    if (!praise) {
      return NextResponse.json(
        { error: '칭찬을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 선생님이거나 자신이 작성한 칭찬인지 확인
    if (userData.role !== 'teacher' && praise.from_user_id !== userData.id) {
      return NextResponse.json(
        { error: '선생님이거나 작성자만 삭제할 수 있습니다' },
        { status: 403 }
      );
    }

    // 삭제 사유 설정
    let deleteReason = reason;
    if (!deleteReason) {
      if (userData.role === 'teacher') {
        deleteReason = '선생님에 의해 삭제됨';
      } else {
        deleteReason = '작성자에 의해 삭제됨';
      }
    }

    // 선택된 칭찬이라면 먼저 선택 해제
    if (praise.is_selected) {
      const unselectPraise = db.prepare(`
        UPDATE praises 
        SET is_selected = 0
        WHERE id = ?
      `);
      unselectPraise.run(id);
    }

    // 칭찬 삭제 처리
    const deletePraise = db.prepare(`
      UPDATE praises 
      SET is_deleted = 1, delete_reason = ?
      WHERE id = ?
    `);

    const result = deletePraise.run(deleteReason, id);

    if (result.changes === 0) {
      return NextResponse.json(
        { error: '칭찬 삭제에 실패했습니다' },
        { status: 500 }
      );
    }

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
