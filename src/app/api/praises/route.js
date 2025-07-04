import { NextResponse } from 'next/server';
import { db } from '../../../lib/database';
import { verifyToken } from '../../../lib/auth';

export async function POST(request) {
  try {
    const { to_user_id, content } = await request.json();

    if (!to_user_id || !content) {
      return NextResponse.json(
        { error: '받는 사람과 칭찬 내용을 입력해주세요' },
        { status: 400 }
      );
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

    // 받는 사용자 확인
    const getToUser = db.prepare(
      "SELECT * FROM users WHERE id = ? AND role = 'student'"
    );
    const toUser = getToUser.get(to_user_id);

    if (!toUser) {
      return NextResponse.json(
        { error: '받는 학생을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 자기 자신에게 칭찬을 달 수 없음
    if (userData.id === to_user_id) {
      return NextResponse.json(
        { error: '자기 자신에게는 칭찬을 달 수 없습니다' },
        { status: 400 }
      );
    }

    // 이미 칭찬을 달았는지 확인
    const checkExisting = db.prepare(`
      SELECT id FROM praises 
      WHERE from_user_id = ? AND to_user_id = ? AND is_deleted = 0
    `);
    const existing = checkExisting.get(userData.id, to_user_id);

    if (existing) {
      return NextResponse.json(
        { error: '이미 해당 학생에게 칭찬을 달았습니다' },
        { status: 400 }
      );
    }

    // 칭찬 작성
    const insertPraise = db.prepare(`
      INSERT INTO praises (from_user_id, to_user_id, content)
      VALUES (?, ?, ?)
    `);

    const result = insertPraise.run(userData.id, to_user_id, content);

    // 받는 학생의 칭찬 개수 확인
    const getPraiseCount = db.prepare(`
      SELECT COUNT(*) as count FROM praises 
      WHERE to_user_id = ? AND is_deleted = 0
    `);
    const praiseCount = getPraiseCount.get(to_user_id);

    // 최초 5개 칭찬은 자동 선택
    if (praiseCount.count <= 5) {
      const updateSelection = db.prepare(`
        UPDATE praises 
        SET is_selected = 1 
        WHERE id = ?
      `);
      updateSelection.run(result.lastInsertRowid);
    }

    return NextResponse.json({
      success: true,
      message: '칭찬이 성공적으로 작성되었습니다',
      praise_id: result.lastInsertRowid,
    });
  } catch (error) {
    console.error('칭찬 작성 에러:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
