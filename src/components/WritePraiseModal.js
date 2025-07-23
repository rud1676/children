'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Users, Heart, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiFetch } from '../lib/config';

export default function WritePraiseModal({ isOpen, onClose, onSuccess }) {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [content, setContent] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchStudents();
      setSelectedStudent(null);
      setContent('');
      setSearchTerm('');
    }
  }, [isOpen]);

  useEffect(() => {
    // 검색어에 따라 학생 목록 필터링
    if (searchTerm.trim() === '') {
      setFilteredStudents(students);
    } else {
      const filtered = students.filter((student) => {
        const searchLower = searchTerm.toLowerCase();
        return (
          student.name.toLowerCase().includes(searchLower) ||
          (student.school &&
            student.school.toLowerCase().includes(searchLower)) ||
          (student.grade && student.grade.toString().includes(searchLower)) ||
          (student.class_number &&
            student.class_number.toString().includes(searchLower))
        );
      });
      setFilteredStudents(filtered);
    }
  }, [searchTerm, students]);

  const fetchStudents = async () => {
    try {
      setIsLoading(true);
      const response = await apiFetch('/api/users/students');
      const data = await response.json();

      if (data.success) {
        setStudents(data.students);
        setFilteredStudents(data.students);
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
      const response = await apiFetch('/api/praises', {
        method: 'POST',
        body: JSON.stringify({
          to_user_id: selectedStudent.id,
          content: content.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('칭찬이 성공적으로 작성되었습니다!');
        onSuccess?.();
        onClose();
      } else {
        toast.error(data.error || '칭찬 작성에 실패했습니다.');
      }
    } catch (error) {
      toast.error('서버 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedStudent(null);
    setContent('');
    setSearchTerm('');
    onClose();
  };

  // 학교 정보와 학년을 조합하여 표시 형식 생성
  const formatGradeInfo = (school, grade) => {
    if (school?.includes('고등학교')) {
      return `고${grade}`;
    } else if (school?.includes('중학교')) {
      return `중${grade}`;
    }
    return `선생님`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 배경 오버레이 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='fixed inset-0 bg-black/50 backdrop-blur-sm z-50'
            onClick={handleClose}
          />

          {/* 모달 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className='fixed inset-0 z-50 flex items-center justify-center p-4'
          >
            <div className='bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto'>
              {/* 헤더 */}
              <div className='flex items-center justify-between p-6 border-b border-gray-200'>
                <h2 className='flight-font-title text-xl text-green-800'>
                  칭찬 작성
                </h2>
                <button
                  onClick={handleClose}
                  className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
                >
                  <X className='h-5 w-5 text-gray-600' />
                </button>
              </div>

              {/* 내용 */}
              <div className='p-6'>
                {isLoading ? (
                  <div className='flex items-center justify-center py-8'>
                    <div className='w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin'></div>
                    <span className='ml-3 flight-font text-green-700'>
                      학생 목록을 불러오는 중...
                    </span>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className='space-y-6'>
                    {/* 받는 학생 선택 */}
                    <div>
                      <h3 className='flight-font-bold text-lg text-green-800 mb-4 flex items-center space-x-2'>
                        <Users className='h-5 w-5' />
                        <span>받는 학생 선택</span>
                      </h3>

                      {/* 검색 입력창 */}
                      <div className='relative mb-4'>
                        <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                        <input
                          type='text'
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          placeholder='이름, 학교, 학년, 조 등으로 검색...'
                          className='text-green-800 w-full pl-10 pr-4 py-3 border-2 border-green-300 rounded-lg focus:border-green-500 focus:outline-none bg-white/80 backdrop-blur-sm flight-font text-sm'
                        />
                      </div>

                      {/* 검색 결과 표시 */}
                      <div className='mb-2'>
                        <p className='flight-font text-sm text-green-600'>
                          {filteredStudents.length}명의 학생
                          {searchTerm && ` (검색어: "${searchTerm}")`}
                        </p>
                      </div>

                      <div className='grid grid-cols-2 md:grid-cols-3 gap-3 max-h-48 overflow-y-auto'>
                        {filteredStudents.map((student) => (
                          <motion.button
                            key={student.id}
                            type='button'
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
                              <p className='flight-font text-sm font-bold text-green-800'>
                                {student.name}
                              </p>
                              <p className='flight-font text-xs text-green-600'>
                                {formatGradeInfo(student.school, student.grade)}{' '}
                                {student.role === 'student' &&
                                  `/ ${student.class_number}조`}
                              </p>
                            </div>
                          </motion.button>
                        ))}
                      </div>

                      {filteredStudents.length === 0 && searchTerm && (
                        <div className='text-center py-4'>
                          <p className='flight-font text-sm text-gray-500'>
                            검색 결과가 없습니다.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* 칭찬 내용 입력 */}
                    <div>
                      <h3 className='flight-font-bold text-lg text-green-800 mb-4 flex items-center space-x-2'>
                        <Heart className='h-5 w-5' />
                        <span>칭찬 내용</span>
                      </h3>

                      <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder='친구에게 따뜻한 칭찬을 남겨주세요...'
                        className='text-green-800 w-full h-32 p-4 border-2 border-green-300 rounded-lg focus:border-green-500 focus:outline-none bg-white/80 backdrop-blur-sm flight-font text-sm resize-none'
                        maxLength={200}
                      />

                      <div className='flex justify-between items-center mt-2'>
                        <p className='flight-font text-xs text-green-600'>
                          {content.length}/200자
                        </p>
                        <p className='flight-font text-xs text-green-600'>
                          한 학생당 한 번만 칭찬을 남길 수 있어요
                        </p>
                      </div>
                    </div>

                    {/* 제출 버튼 */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type='submit'
                      disabled={
                        isSubmitting || !selectedStudent || !content.trim()
                      }
                      className='w-full bg-green-600 text-white py-4 rounded-lg flight-font text-lg font-bold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 flex items-center justify-center space-x-2'
                    >
                      <Send className='h-5 w-5' />
                      <span>{isSubmitting ? '작성 중...' : '칭찬 보내기'}</span>
                    </motion.button>
                  </form>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
