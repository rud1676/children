import { NextResponse } from 'next/server';
import { pool } from '../../../lib/database';

// 동적 렌더링 강제
export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const connection = await pool.getConnection();

    try {
      // 전체 통계 조회
      const [totalStatsResult] = await connection.execute(`
        SELECT 
          COUNT(DISTINCT u.id) as total_students,
          COUNT(p.id) as total_praises,
          COUNT(DISTINCT CASE WHEN p.id IS NULL THEN u.id END) as students_without_praises
        FROM users u
        LEFT JOIN praises p ON u.id = p.to_user_id AND p.is_deleted = 0
        WHERE u.role = 'student'
      `);

      const totalStats = totalStatsResult[0];

      // 학년별 통계
      const [gradeStats] = await connection.execute(`
        SELECT 
          u.grade,
          COUNT(DISTINCT u.id) as student_count
        FROM users u
        WHERE u.role = 'student'
        GROUP BY u.grade
        ORDER BY u.grade
      `);

      const studentsByGrade = {};
      gradeStats.forEach((stat) => {
        studentsByGrade[stat.grade] = stat.student_count;
      });

      // 반별 통계
      const [classStats] = await connection.execute(`
        SELECT 
          u.class_number,
          COUNT(DISTINCT u.id) as student_count
        FROM users u
        WHERE u.role = 'student'
        GROUP BY u.class_number
        ORDER BY u.class_number
      `);

      const studentsByClass = {};
      classStats.forEach((stat) => {
        studentsByClass[stat.class_number] = stat.student_count;
      });

      // 아직 칭찬을 받지 않은 학생들 (랜덤 5명)
      const [randomStudents] = await connection.execute(`
        SELECT 
          u.id,
          u.name,
          u.school,
          u.grade,
          u.class_number
        FROM users u
        LEFT JOIN praises p ON u.id = p.to_user_id AND p.is_deleted = 0
        WHERE u.role = 'student' AND p.id IS NULL
        ORDER BY RAND()
        LIMIT 5
      `);

      // 아직 칭찬을 작성하지 않은 학생들 (랜덤 5명)
      const [studentsWhoHaventWritten] = await connection.execute(`
        SELECT 
          u.id,
          u.name,
          u.school,
          u.grade,
          u.class_number
        FROM users u
        LEFT JOIN praises p ON u.id = p.from_user_id AND p.is_deleted = 0
        WHERE u.role = 'student' AND p.id IS NULL
        ORDER BY RAND()
      `);

      return NextResponse.json({
        success: true,
        total_students: totalStats.total_students,
        total_praises: totalStats.total_praises,
        students_without_praises: totalStats.students_without_praises,
        students_by_grade: studentsByGrade,
        students_by_class: studentsByClass,
        random_students: randomStudents.map((student) => ({
          id: student.id,
          name: student.name,
          school: student.school,
          grade: student.grade,
          class_number: student.class_number,
        })),
        students_who_havent_written: studentsWhoHaventWritten.map(
          (student) => ({
            id: student.id,
            name: student.name,
            school: student.school,
            grade: student.grade,
            class_number: student.class_number,
          })
        ),
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('통계 조회 에러:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
