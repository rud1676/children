import { NextResponse } from 'next/server';
import { pool } from '../../../../lib/database';
import { verifyToken } from '../../../../lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  let connection;
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
    // 선생님 권한 확인
    if (userData.role !== 'teacher') {
      return NextResponse.json(
        { error: '선생님만 접근할 수 있습니다' },
        { status: 403 }
      );
    }

    // 모든 학생 조회
    connection = await pool.getConnection();

    try {
      const [students] = await connection.execute(`
        SELECT id, name, school, grade, class_number, student_number
        FROM users 
        WHERE role = 'student'
        ORDER BY school, grade, class_number, student_number
      `);

      return NextResponse.json({
        success: true,
        students,
      });
    } finally {
      if (connection) connection.release();
    }
  } catch (error) {
    console.error('학생 목록 조회 에러:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}
