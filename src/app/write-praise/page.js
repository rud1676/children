'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, Users, Heart } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiFetch } from '../../lib/config';

export default function WritePraisePage() {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    const user = JSON.parse(userData);
    if (user.role !== 'student') {
      router.push('/');
      return;
    }

    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await apiFetch('/api/users/students');
      const data = await response.json();

      if (data.success) {
        setStudents(data.students);
      } else {
        toast.error('학생 목록을 불러오는데 실패했습니다.');
      }
    } catch (error) {
      toast.error('서버 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedStudent) {
      toast.error('받는 학생을 선택해주세요.');
      return;
    }

    if (!content.trim()) {
      toast.error('칭찬 내용을 입력해주세요.');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const response = await apiFetch('/api/praises', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          to_user_id: selectedStudent.id,
          content: content.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('칭찬이 성공적으로 작성되었습니다!');
        router.push('/');
      } else {
        toast.error(data.error || '칭찬 작성에 실패했습니다.');
      }
    } catch (error) {
      toast.error('서버 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
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
          <h1 className='pixel-font text-2xl text-green-800'>칭찬 작성</h1>
        </div>

        <form onSubmit={handleSubmit} className='space-y-6'>
          {/* 받는 학생 선택 */}
          <div className='nature-light pixel-border rounded-lg p-6'>
            <h3 className='pixel-font text-lg text-green-800 mb-4 flex items-center space-x-2'>
              <Users className='h-5 w-5' />
              <span>받는 학생 선택</span>
            </h3>

            <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3'>
              {students.map((student) => (
                <motion.button
                  key={student.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedStudent(student)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    selectedStudent?.id === student.id
                      ? 'border-green-500 bg-green-100'
                      : 'border-green-300 bg-white hover:border-green-400'
                  }`}
                >
                  <div className='text-center'>
                    <p className='pixel-font text-sm font-bold text-green-800'>
                      {student.name}
                    </p>
                    <p className='pixel-font text-xs text-green-600'>
                      {student.grade}학년 {student.class_number}반
                    </p>
                    <div className='flex items-center justify-center space-x-1 mt-1'>
                      <Heart className='h-3 w-3 text-red-500' />
                      <span className='pixel-font text-xs text-green-600'>
                        {student.selected_praises_count}
                      </span>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* 칭찬 내용 입력 */}
          <div className='nature-light pixel-border rounded-lg p-6'>
            <h3 className='pixel-font text-lg text-green-800 mb-4 flex items-center space-x-2'>
              <Heart className='h-5 w-5' />
              <span>칭찬 내용</span>
            </h3>

            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder='친구에게 따뜻한 칭찬을 남겨주세요...'
              className='w-full h-32 p-4 border-2 border-green-300 rounded-lg focus:border-green-500 focus:outline-none bg-white/80 backdrop-blur-sm pixel-font text-sm resize-none'
              maxLength={200}
            />

            <div className='flex justify-between items-center mt-2'>
              <p className='pixel-font text-xs text-green-600'>
                {content.length}/200자
              </p>
              <p className='pixel-font text-xs text-green-600'>
                한 학생당 한 번만 칭찬을 남길 수 있어요
              </p>
            </div>
          </div>

          {/* 제출 버튼 */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type='submit'
            disabled={isSubmitting || !selectedStudent || !content.trim()}
            className='w-full nature-dark text-white py-4 rounded-lg pixel-font text-lg font-bold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 flex items-center justify-center space-x-2'
          >
            <Send className='h-5 w-5' />
            <span>{isSubmitting ? '작성 중...' : '칭찬 보내기'}</span>
          </motion.button>
        </form>
      </div>
    </div>
  );
}
