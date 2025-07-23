import { NextResponse } from 'next/server';
import { pool } from '../../../../../lib/database';
import { verifyToken } from '../../../../../lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
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

    const connection = await pool.getConnection();

    try {
      // 받은 칭찬 개수
      const [receivedPraisesResult] = await connection.execute(
        'SELECT COUNT(*) as count FROM praises WHERE to_user_id = ? AND is_deleted = 0',
        [userData.id]
      );
      const receivedPraises = receivedPraisesResult[0];

      // 선택받은 칭찬 개수
      const [selectedPraisesResult] = await connection.execute(
        'SELECT COUNT(*) as count FROM praises WHERE to_user_id = ? AND is_selected = 1 AND is_deleted = 0',
        [userData.id]
      );
      const selectedPraises = selectedPraisesResult[0];

      // 작성한 칭찬 개수
      const [writtenPraisesResult] = await connection.execute(
        'SELECT COUNT(*) as count FROM praises WHERE from_user_id = ? AND is_deleted = 0',
        [userData.id]
      );
      const writtenPraises = writtenPraisesResult[0];

      // 1단계: 기본 랭킹 조회 (작성한 칭찬 중 선택받은 개수 순)
      const [allRankings] = await connection.execute(`
        SELECT 
          u.id,
          u.name,
          COUNT(CASE WHEN p.is_selected = 1 AND p.is_deleted = 0 THEN 1 END) as selected_count,
          SUM(
            CASE 
              WHEN p.is_selected = 1 AND p.is_deleted = 0 THEN
                CASE 
                  WHEN to_user.role = 'teacher' THEN 2
                  ELSE 1
                END
              ELSE 0
            END
          ) as weighted_score
        FROM users u
        LEFT JOIN praises p ON u.id = p.from_user_id AND p.is_deleted = 0
        LEFT JOIN users to_user ON p.to_user_id = to_user.id
        WHERE u.role = 'student'
        GROUP BY u.id, u.name
        HAVING weighted_score > 0
        ORDER BY weighted_score DESC, u.name ASC
      `);

      // 2단계: 조건을 만족하는 학생들만 필터링
      const validStudents = [];

      for (const student of allRankings) {
        // 받은 칭찬 중 학생이 쓴 것 개수
        const [receivedFromStudentsResult] = await connection.execute(
          `
          SELECT COUNT(*) as count
          FROM praises p
          JOIN users from_user ON p.from_user_id = from_user.id
          WHERE p.to_user_id = ? 
          AND p.is_deleted = 0 
          AND from_user.role = 'student'
        `,
          [student.id]
        );

        const receivedFromStudents = receivedFromStudentsResult[0].count;

        // 선택한 칭찬 개수
        const [selectedPraisesResult] = await connection.execute(
          `
          SELECT COUNT(*) as count
          FROM praises p
          WHERE p.to_user_id = ? 
          AND p.is_selected = 1 
          AND p.is_deleted = 0
        `,
          [student.id]
        );

        const selectedPraises = selectedPraisesResult[0].count;

        // 조건 확인: 받은 칭찬 중 학생이 쓴 것이 3개 미만이거나, 3개 이상이면 선택한 칭찬이 3개 이상이어야 함
        if (
          receivedFromStudents < 3 ||
          (receivedFromStudents >= 3 && selectedPraises >= 3)
        ) {
          validStudents.push(student);
        }
      }

      // 현재 사용자의 순위 찾기
      const userRanking =
        validStudents.findIndex((rank) => rank.id === userData.id) + 1;

      // 현재 사용자의 가중 점수 계산
      const [userWeightedScoreResult] = await connection.execute(
        `
        SELECT 
          SUM(
            CASE 
              WHEN p.is_selected = 1 AND p.is_deleted = 0 THEN
                CASE 
                  WHEN to_user.role = 'teacher' THEN 2
                  ELSE 1
                END
              ELSE 0
            END
          ) as weighted_score
        FROM praises p
        LEFT JOIN users to_user ON p.to_user_id = to_user.id
        WHERE p.from_user_id = ? AND p.is_deleted = 0
      `,
        [userData.id]
      );

      const userWeightedScore = userWeightedScoreResult[0].weighted_score || 0;

      return NextResponse.json({
        success: true,
        written_praises: writtenPraises.count,
        weighted_score: userWeightedScore,
        ranking: userRanking > 0 ? userRanking : null,
        total_students: allRankings.length,
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('개인 통계 조회 에러:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
