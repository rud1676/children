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

    // 최초 로그인인 경우 (비밀번호가 설정되지 않음)
    if (!user.password) {
      return NextResponse.json({
        success: true,
        is_first_login: true,
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
    }

    // 비밀번호 확인
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: '비밀번호가 올바르지 않습니다' },
        { status: 401 }
      );
    }

    // 토큰 생성
    const token = generateToken(user);

    return NextResponse.json({
      success: true,
      is_first_login: false,
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
    console.error('로그인 에러:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}
