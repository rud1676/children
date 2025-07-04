import { NextResponse } from 'next/server';
import { db } from '../../../../../lib/database';
import { verifyToken } from '../../../../../lib/auth';

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

    // 받은 칭찬 개수
    const getReceivedPraises = db.prepare(`
      SELECT COUNT(*) as count 
      FROM praises 
      WHERE to_user_id = ? AND is_deleted = 0
    `);
    const receivedPraises = getReceivedPraises.get(userData.id);

    // 선택받은 칭찬 개수
    const getSelectedPraises = db.prepare(`
      SELECT COUNT(*) as count 
      FROM praises 
      WHERE to_user_id = ? AND is_selected = 1 AND is_deleted = 0
    `);
    const selectedPraises = getSelectedPraises.get(userData.id);

    // 작성한 칭찬 개수
    const getWrittenPraises = db.prepare(`
      SELECT COUNT(*) as count 
      FROM praises 
      WHERE from_user_id = ? AND is_deleted = 0
    `);
    const writtenPraises = getWrittenPraises.get(userData.id);

    // 전체 랭킹에서의 순위
    const getRanking = db.prepare(`
      SELECT 
        u.id,
        u.name,
        COUNT(CASE WHEN p.is_selected = 1 THEN 1 END) as selected_count
      FROM users u
      LEFT JOIN praises p ON u.id = p.to_user_id AND p.is_deleted = 0
      WHERE u.role = 'student'
      GROUP BY u.id, u.name
      ORDER BY selected_count DESC, u.name ASC
    `);
    const allRankings = getRanking.all();

    // 현재 사용자의 순위 찾기
    const userRanking =
      allRankings.findIndex((rank) => rank.id === userData.id) + 1;

    return NextResponse.json({
      success: true,
      received_praises: receivedPraises.count,
      selected_praises: selectedPraises.count,
      written_praises: writtenPraises.count,
      ranking: userRanking > 0 ? userRanking : null,
      total_students: allRankings.length,
    });
  } catch (error) {
    console.error('개인 통계 조회 에러:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
