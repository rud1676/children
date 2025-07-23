'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Heart, Star, User, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiFetch } from '../../lib/config';

export default function MyPage() {
  const [user, setUser] = useState(null);
  const [praises, setPraises] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    setUser(JSON.parse(userData));
    fetchMyPraises();
    fetchUserStats();
  }, []);

  const fetchMyPraises = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await apiFetch('/api/praises/received', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setPraises(data.praises);
      } else {
        toast.error('칭찬을 불러오는데 실패했습니다.');
      }
    } catch (error) {
      toast.error('서버 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      const response = await apiFetch('/api/users/me/stats');
      const data = await response.json();

      if (data.success) {
        setStats(data);
      } else {
        console.error('통계 조회 실패:', data.error);
      }
    } catch (error) {
      console.error('통계 조회 오류:', error);
    }
  };

  const handlePraiseSelect = async (praiseId) => {
    try {
      const response = await apiFetch(`/api/praises/${praiseId}/select`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        fetchMyPraises(); // 데이터 새로고침
        fetchUserStats(); // 통계도 새로고침
      } else {
        toast.error(data.error || '칭찬 선택에 실패했습니다.');
      }
    } catch (error) {
      toast.error('서버 오류가 발생했습니다.');
    }
  };

  if (isLoading) {
    return (
      <div className='min-h-screen nature-green flex items-center justify-center'>
        <div className='text-center'>
          <div className='w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4'></div>
          <p className='pixel-font text-green-700'>로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen nature-green relative overflow-hidden'>
      {/* 네잎클로버 배경 */}
      <div className='absolute inset-0 overflow-hidden'>
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className='clover'
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${10 + Math.random() * 10}s`,
            }}
          />
        ))}
      </div>

      {/* 헤더 */}
      <div className='relative z-10 p-4'>
        <div className='flex items-center space-x-4 mb-6'>
          <button
            onClick={() => router.back()}
            className='p-2 bg-green-600 rounded-lg text-white hover:bg-green-700 transition-colors'
          >
            <ArrowLeft className='h-5 w-5' />
          </button>
          <h1 className='pixel-font text-2xl text-green-800'>마이페이지</h1>
        </div>

        {/* 사용자 정보 */}
        <div className='nature-light pixel-border rounded-lg p-6 mb-6'>
          <div className='space-y-4'>
            {/* 기본 정보 */}
            <div>
              <h2 className='flight-font-title text-2xl text-green-800 mb-2'>
                {user?.name}
              </h2>
              {user?.role === 'student' && (
                <div className='space-y-1'>
                  <p className='flight-font text-lg text-green-700'>
                    {user?.school}
                  </p>
                  <p className='flight-font text-lg text-green-600'>
                    {user?.grade}학년 {user?.class_number}반
                  </p>
                </div>
              )}
            </div>

            {/* 통계 정보 */}
            {user?.role === 'student' && stats && (
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-green-200'>
                <div className='text-center'>
                  <p className='flight-font text-sm text-green-600 mb-1'>
                    받은 점수
                  </p>
                  <p className='flight-font-bold text-2xl text-green-800'>
                    {stats.weighted_score}점
                  </p>
                </div>
                <div className='text-center'>
                  <p className='flight-font text-sm text-green-600 mb-1'>
                    순위
                  </p>
                  <p className='flight-font-bold text-2xl text-green-800'>
                    {stats.ranking ? `${stats.ranking}위` : '-'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 칭찬 목록 */}
        <div className='space-y-4'>
          <h3 className='pixel-font text-lg text-green-800 flex items-center space-x-2'>
            <MessageSquare className='h-5 w-5' />
            <span>받은 칭찬 ({praises.length}개)</span>
          </h3>

          {praises.length > 0 ? (
            <div className='grid gap-4'>
              {praises.map((praise, index) => (
                <motion.div
                  key={praise.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className='nature-light pixel-border rounded-lg p-4'
                >
                  <div className='flex items-start justify-between'>
                    <div className='flex-1'>
                      <p className='pixel-font text-sm text-green-800 leading-relaxed mb-2'>
                        {praise.content}
                      </p>
                      <div className='flex items-center space-x-4'>
                        <span className='pixel-font text-xs text-green-600'>
                          {user?.role === 'student' ? '익명' : praise.from_name}
                        </span>
                        <span className='pixel-font text-xs text-green-500'>
                          {(() => {
                            const date = new Date(praise.created_at);
                            const koreanTime = new Date(
                              date.getTime() + 9 * 60 * 60 * 1000
                            ); // UTC+9 (한국 시간)

                            return `${
                              koreanTime.getMonth() + 1
                            }월 ${koreanTime.getDate()}일 ${koreanTime.getHours()}시 ${koreanTime.getMinutes()}분`;
                          })()}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handlePraiseSelect(praise.id)}
                      className={`ml-4 p-2 rounded-lg transition-colors ${
                        praise.is_selected
                          ? 'bg-red-500 text-white hover:bg-red-600'
                          : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                      }`}
                      title={praise.is_selected ? '선택 해제' : '선택'}
                    >
                      <Heart
                        className={`h-4 w-4 ${
                          praise.is_selected ? 'fill-current' : ''
                        }`}
                      />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className='text-center py-8'>
              <p className='pixel-font text-green-600'>
                아직 받은 칭찬이 없어요
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
