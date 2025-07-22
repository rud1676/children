import { NextResponse } from 'next/server';
import { pool } from '../../../lib/database';
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

    const connection = await pool.getConnection();

    try {
      // 받는 사용자 확인
      const [toUsers] = await connection.execute(
        "SELECT * FROM users WHERE id = ? AND role = 'student'",
        [to_user_id]
      );

      if (toUsers.length === 0) {
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
      const [existing] = await connection.execute(
        'SELECT id FROM praises WHERE from_user_id = ? AND to_user_id = ? AND is_deleted = 0',
        [userData.id, to_user_id]
      );

      if (existing.length > 0) {
        return NextResponse.json(
          { error: '이미 해당 학생에게 칭찬을 달았습니다' },
          { status: 400 }
        );
      }

      // 칭찬 작성
      const [result] = await connection.execute(
        'INSERT INTO praises (from_user_id, to_user_id, content, is_teacher, is_myteam) VALUES (?, ?, ?, ?, ?)',
        [
          userData.id,
          to_user_id,
          content,
          userData.role === 'teacher' ? 1 : 0,
          userData.class_number === toUsers[0].class_number ? 1 : 0,
        ]
      );

      // 받는 학생의 칭찬 개수 확인
      const [praiseCountResult] = await connection.execute(
        'SELECT COUNT(*) as count FROM praises WHERE to_user_id = ? AND is_deleted = 0',
        [to_user_id]
      );

      const praiseCount = praiseCountResult[0].count;

      // 최초 3개 칭찬은 자동 선택
      if (praiseCount <= 3) {
        await connection.execute(
          'UPDATE praises SET is_selected = 1 WHERE id = ?',
          [result.insertId]
        );
      }

      return NextResponse.json({
        success: true,
        message: '칭찬이 성공적으로 작성되었습니다',
        praise_id: result.insertId,
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('칭찬 작성 에러:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
