import { NextResponse } from 'next/server';
import { pool, bcrypt } from '../../../../lib/database';
import { generateToken } from '../../../../lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  let connection;
  try {
    const { phone_number, password } = await request.json();

    if (!phone_number || !password) {
      return NextResponse.json(
        { error: '핸드폰 번호와 비밀번호를 입력해주세요' },
        { status: 400 }
      );
    }

    // 사용자 조회
    connection = await pool.getConnection();
    const [users] = await connection.execute(
      'SELECT * FROM users WHERE phone_number = ?',
      [phone_number]
    );

    if (users.length === 0) {
      return NextResponse.json(
        { error: '등록되지 않은 핸드폰 번호입니다' },
        { status: 404 }
      );
    }

    const user = users[0];

    // 이미 비밀번호가 설정되어 있는지 확인
    if (user.password) {
      return NextResponse.json(
        { error: '이미 비밀번호가 설정되어 있습니다' },
        { status: 400 }
      );
    }

    // 비밀번호 해시화
    const hashedPassword = await bcrypt.hash(password, 10);

    // 비밀번호 업데이트
    await connection.execute(
      'UPDATE users SET password = ?, is_first_login = FALSE WHERE phone_number = ?',
      [hashedPassword, phone_number]
    );

    // 토큰 생성
    const token = generateToken(user);

    return NextResponse.json({
      success: true,
      message: '비밀번호가 성공적으로 설정되었습니다',
      token,
      user: {
        id: user.id,
        phone_number: user.phone_number,
        name: user.name,
        role: user.role,
        school: user.school,
        grade: user.grade,
        class_number: user.class_number,
        student_number: user.student_number,
      },
    });
  } catch (error) {
    console.error('비밀번호 설정 에러:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}
