import { NextResponse } from 'next/server';
import { pool } from '../../../../lib/database';

// 동적 렌더링 강제
export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    // 학생 목록 조회 (선택된 칭찬 개수 포함)
    const connection = await pool.getConnection();
    const [students] = await connection.execute(`
      SELECT 
        u.id,
        u.name,
        u.school,
        u.grade,
        u.class_number,
        u.student_number,
        u.role,
        u.is_king,
        COUNT(CASE WHEN p.is_selected = 1 THEN 1 END) as selected_praises_count,
        COUNT(CASE WHEN p.is_deleted = 0 THEN 1 END) as total_praises_count
      FROM users u
      LEFT JOIN praises p ON u.id = p.to_user_id
      GROUP BY u.id
      ORDER BY u.grade, u.class_number, u.student_number
    `);
    connection.release();

    return NextResponse.json({
      success: true,
      students: students.map((student) => ({
        id: student.id,
        name: student.name,
        school: student.school,
        grade: student.grade,
        class_number: student.class_number,
        student_number: student.student_number,
        role: student.role,
        is_king: student.is_king,
        selected_praises_count: student.selected_praises_count || 0,
        total_praises_count: student.total_praises_count || 0,
      })),
    });
  } catch (error) {
    console.error('학생 목록 조회 에러:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
