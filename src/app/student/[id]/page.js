'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  User,
  Heart,
  Star,
  Trash2,
  MessageSquare,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { apiFetch } from '../../../lib/config';

export default function StudentDetailPage() {
  const [student, setStudent] = useState(null);
  const [praises, setPraises] = useState([]);
  const [writtenStats, setWrittenStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showDeleted, setShowDeleted] = useState(false);
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    const currentUser = JSON.parse(userData);
    if (currentUser.role !== 'teacher') {
      router.push('/');
      return;
    }

    setUser(currentUser);
    fetchStudentData();
    fetchWrittenStats();
  }, [params.id, showDeleted]);

  const fetchStudentData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await apiFetch(
        `/api/praises/user/${params.id}?showDeleted=${showDeleted}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setStudent(data.user);
        setPraises(data.praises);
      } else {
        toast.error('학생 정보를 불러오는데 실패했습니다.');
        router.push('/');
      }
    } catch (error) {
      toast.error('서버 오류가 발생했습니다.');
      router.push('/');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWrittenStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await apiFetch(
        `/api/users/students/${params.id}/written-stats`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        setWrittenStats(data);
      } else {
        console.error('작성 칭찬 통계 조회 실패:', data.error);
      }
    } catch (error) {
      console.error('작성 칭찬 통계 조회 오류:', error);
    }
  };

  const handleDeletePraise = async (praiseId) => {
    const reason = prompt('삭제 사유를 입력하세요 (필수)');
    if (!reason || reason.trim() === '') {
      toast.error('삭제 사유를 입력해야 합니다.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await apiFetch(`/api/praises/${praiseId}/delete`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('칭찬이 삭제되었습니다.');
        fetchStudentData(); // 데이터 새로고침
      } else {
        toast.error(data.error || '칭찬 삭제에 실패했습니다.');
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

  if (!student) {
    return (
      <div className='min-h-screen nature-green flex items-center justify-center'>
        <div className='text-center'>
          <p className='pixel-font text-green-700'>학생을 찾을 수 없습니다.</p>
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
          <h1 className='pixel-font text-2xl text-green-800'>학생 상세</h1>
        </div>

        {/* 학생 정보 */}
        <div className='nature-light pixel-border rounded-lg p-6 mb-6'>
          <div className='flex items-center space-x-4'>
            <div>
              <h2 className='pixel-font text-xl text-green-800'>
                {student.name}
              </h2>
              <p className='pixel-font text-sm text-green-600'>
                {student.school} {student.grade}학년 {student.class_number}반
              </p>

              {/* 작성한 칭찬 통계 */}
              {writtenStats && (
                <div className='flex items-center space-x-4 mt-2 pt-2 border-t border-green-200'>
                  <div className='flex items-center space-x-1'>
                    <MessageSquare className='h-4 w-4 ' />
                    <span className='pixel-font text-[10px] '>
                      쓴 칭찬: {writtenStats.totalCount}개
                    </span>
                  </div>
                  <div className='flex items-center space-x-1'>
                    <Heart className='h-4 w-4' />
                    <span className='pixel-font text-[10px] '>
                      선택받은 칭찬: {writtenStats.selectedCount}개
                    </span>
                  </div>
                  <div className='flex items-center space-x-1'>
                    <span className='pixel-font text-[10px] '>
                      선택받은비율: {writtenStats.selectionRate}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 칭찬 목록 */}
        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <h3 className='pixel-font text-lg text-green-800 flex items-center space-x-2'>
              <Heart className='h-5 w-5' />
              <span>
                {' '}
                {student.name}이 받은 칭찬 ({praises.length}개)
              </span>
            </h3>
            {/* 삭제된 칭찬 보기 토글 */}
            <div className='flex items-center space-x-2'>
              <label className='flight-font text-sm text-green-700'>
                삭제 댓글
              </label>
              <button
                onClick={() => setShowDeleted(!showDeleted)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  showDeleted ? 'bg-green-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    showDeleted ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {praises.length > 0 ? (
            <div className='grid gap-4'>
              {praises.map((praise, index) => (
                <motion.div
                  key={praise.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`nature-light pixel-border rounded-lg p-4 ${
                    praise.is_deleted ? 'opacity-60 bg-gray-100' : ''
                  }`}
                >
                  <div className='flex items-start justify-between'>
                    <div className='flex-1'>
                      <p className='pixel-font text-sm text-green-800 leading-relaxed mb-2'>
                        {praise.content}
                      </p>
                      <div className='flex items-center space-x-4'>
                        <span className='pixel-font text-xs text-green-600'>
                          {praise.from_name}
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
                        {praise.is_selected === 1 && (
                          <div className='flex items-center space-x-1'>
                            <Heart className='h-3 w-3 text-red-500 fill-current' />
                            <span className='pixel-font text-xs text-red-600'>
                              선택됨
                            </span>
                          </div>
                        )}
                      </div>
                      {praise.is_deleted === 1 && (
                        <div className='flex items-center space-x-1'>
                          <Trash2 className='h-3 w-3 text-gray-500' />
                          <span className='pixel-font text-xs text-gray-500'>
                            삭제됨
                          </span>
                          {praise.delete_reason && (
                            <span className='pixel-font text-xs text-gray-500'>
                              {praise.delete_reason.length > 20
                                ? praise.delete_reason.substring(0, 20) + '...'
                                : praise.delete_reason}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {praise.is_deleted === 0 && (
                      <button
                        onClick={() => handleDeletePraise(praise.id)}
                        className='ml-4 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors'
                        title='삭제'
                      >
                        <Trash2 className='h-4 w-4' />
                      </button>
                    )}
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
