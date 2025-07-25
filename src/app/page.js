'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  Trophy,
  Users,
  LogOut,
  User,
  MessageSquare,
  Plus,
  BookOpen,
} from 'lucide-react';
import toast from 'react-hot-toast';
import StudentCard from '../components/StudentCard';
import TeacherCard from '../components/TeacherCard';
import WritePraiseModal from '../components/WritePraiseModal';
import { apiFetch } from '../lib/config';

export default function MainPage() {
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [ranking, setRanking] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [user, setUser] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showWriteModal, setShowWriteModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // 로그인 체크
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    setUser(JSON.parse(userData));

    // 초기 데이터 로딩
    fetchData();
    fetchStaticAndRanking();

    // 특정 유저(01012344321)일 때만 3초마다 랜덤 학생 교체 및 10초마다 알림 확인
    const currentUser = JSON.parse(userData);
    if (currentUser.phone_number === '01012344321') {
      const randomInterval = setInterval(() => {
        fetchData();
      }, 3000);

      // 10초마다 알림 확인
      const notificationInterval = setInterval(() => {
        checkNotifications();
      }, 10000);

      // 30초마다 랭킹과 통계만 업데이트 (학생 목록은 제외)
      const dataInterval = setInterval(() => {
        fetchStaticAndRanking();
      }, 10000);

      return () => {
        clearInterval(randomInterval);
        clearInterval(notificationInterval);
        clearInterval(dataInterval);
      };
    }

    // 30초마다 랭킹과 통계만 업데이트 (학생 목록은 제외)
    const dataInterval = setInterval(() => {
      fetchStaticAndRanking();
    }, 30000);

    return () => {
      clearInterval(dataInterval);
    };
  }, []); // 빈 의존성 배열로 한 번만 실행

  const fetchStaticAndRanking = async () => {
    const statisticsRes = await apiFetch('/api/statistics');
    const rankingRes = await apiFetch('/api/ranking');
    const statisticsData = await statisticsRes.json();
    const rankingData = await rankingRes.json();
    setStatistics(statisticsData);
    setRanking(rankingData.ranking.slice(0, 15));
  };

  const fetchData = async () => {
    // 세션 ID 생성 (브라우저별로 고유하게)
    const sessionId =
      localStorage.getItem('sessionId') ||
      Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);
    localStorage.setItem('sessionId', sessionId);

    // 학생 데이터 가져오기
    const studentsRes = await apiFetch(
      `/api/students/praises?session=${sessionId}`
    );
    const studentsData = await studentsRes.json();
    const newStudents = Object.values(studentsData.students_with_praises);

    // 선생님 데이터 가져오기
    const teachersRes = await apiFetch(
      `/api/teachers/praises?session=${sessionId}`
    );
    const teachersData = await teachersRes.json();
    const newTeachers = Object.values(teachersData.teachers_with_praises);

    // 특정 유저일 때만 바뀐 학생 찾기
    if (user?.phone_number === '01012344321' && students.length > 0) {
      const currentIds = students.map((s) => s.student_info.id);
      const newIds = newStudents.map((s) => s.student_info.id);

      // 제거된 학생과 추가된 학생 찾기
      const removedStudent = students.find(
        (s) => !newIds.includes(s.student_info.id)
      );
      const addedStudent = newStudents.find(
        (s) => !currentIds.includes(s.student_info.id)
      );

      if (removedStudent && addedStudent) {
        // 제거된 학생의 위치를 찾아서 새 학생을 그 위치에 배치
        const removedIndex = students.findIndex(
          (s) => s.student_info.id === removedStudent.student_info.id
        );

        // 서버에서 받은 배열 순서를 유지하면서 카드 교체
        const updatedStudents = [...newStudents];
        updatedStudents[removedIndex] = addedStudent;

        setStudents(updatedStudents);
        setTeachers(newTeachers);
        return; // 여기서 함수 종료
      }
    }

    setStudents(newStudents);
    setTeachers(newTeachers);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
    toast.success('로그아웃되었습니다.');
  };

  const handleStudentClick = (student) => {
    if (user?.role === 'teacher') {
      router.push(`/student/${student.student_info.id}`);
    }
  };

  const handleTeacherClick = (teacher) => {
    if (user?.role === 'teacher') {
      router.push(`/student/${teacher.teacher_info.id}`);
    }
  };

  const handleMyPage = () => {
    router.push('/mypage');
  };

  const handleMyPraises = () => {
    router.push('/my-praises');
  };

  const handleWritePraise = () => {
    setShowWriteModal(true);
  };

  // 알림 확인 함수
  const checkNotifications = async () => {
    try {
      const token = localStorage.getItem('token');

      // 현재 시간 업데이트
      // 5초 전의 시간을 ISO 문자열로 계산
      const newTime = new Date(Date.now() - 10000).toISOString();
      const response = await apiFetch(
        `/api/notifications?lastChecked=${newTime}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (data.success && data.alertUsers && data.alertUsers.length > 0) {
        // 새로운 알림이 있으면 토스트 메시지 표시
        showNotificationToast(data.alertUsers);
      }
    } catch (error) {
      console.error('알림 확인 에러:', error);
    }
  };

  // 알림 토스트 메시지 표시 함수
  const showNotificationToast = (alertUsers) => {
    console.log(alertUsers, '알람시작');
    const toastId = toast.custom(
      (t) => (
        <div
          className={`${
            t.visible ? 'animate-enter' : 'animate-leave'
          } max-w-md w-full bg-green-50 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-green-200 ring-opacity-5`}
        >
          <div className='flex-1 w-0 p-4'>
            <div className='flex items-start'>
              <div className='flex-shrink-0'>
                <div className='w-8 h-8 bg-green-500 rounded-full flex items-center justify-center'>
                  <MessageSquare className='h-4 w-4 text-white' />
                </div>
              </div>
              <div className='ml-3 flex-1'>
                <p className='flight-font text-[20px] font-medium text-green-800'>
                  새로운 칭찬이 작성되었습니다!
                </p>
                <p className='flight-font text-[25px] text-green-600 mt-1'>
                  {alertUsers.length === 1
                    ? `${alertUsers[0]}님이 칭찬을 받았습니다.`
                    : `${alertUsers[0]} 외 ${
                        alertUsers.length - 1
                      }명이 칭찬을 받았습니다.`}
                </p>
              </div>
            </div>
            {/* 로딩 바 */}
            <div className='mt-3 h-1 bg-green-200 rounded-full overflow-hidden'>
              <div
                className='h-full bg-green-500 transition-all duration-3000 ease-linear'
                style={{
                  width: '100%',
                  animation: 'loadingBar 5s linear forwards',
                }}
              />
            </div>
          </div>
        </div>
      ),
      {
        duration: 5000,
        position: 'top-right',
        style: {
          background: 'transparent',
          boxShadow: 'none',
          padding: 0,
        },
      }
    );

    // 3초 후 자동으로 토스트 제거
    setTimeout(() => {
      toast.dismiss(toastId);
    }, 5000);
  };

  // 학교 정보와 학년을 조합하여 표시 형식 생성
  const formatGradeInfo = (school, grade) => {
    if (school.includes('고등학교')) {
      return `고${grade}`;
    } else if (school.includes('중학교')) {
      return `중${grade}`;
    }
    return `${grade}학년`;
  };

  return (
    <div className='min-h-screen nature-green relative overflow-hidden'>
      {/* 귀여운 네잎클로버 배경 */}
      <div className='absolute inset-0 overflow-hidden'>
        {/* 작은 네잎클로버들 */}
        {[...Array(12)].map((_, i) => (
          <div
            key={`small-${i}`}
            className='clover-small clover-svg'
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 8}s`,
              animationDuration: `${8 + Math.random() * 4}s`,
            }}
          />
        ))}

        {/* 중간 네잎클로버들 */}
        {[...Array(8)].map((_, i) => (
          <div
            key={`medium-${i}`}
            className='clover-medium clover-svg'
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 12}s`,
              animationDuration: `${12 + Math.random() * 6}s`,
            }}
          />
        ))}

        {/* 큰 네잎클로버들 */}
        {[...Array(6)].map((_, i) => (
          <div
            key={`large-${i}`}
            className='clover-large clover-svg'
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 15}s`,
              animationDuration: `${15 + Math.random() * 8}s`,
            }}
          />
        ))}

        {/* 추가 네잎클로버들 */}
        {[...Array(10)].map((_, i) => (
          <div
            key={`extra-${i}`}
            className='clover-extra clover-svg'
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${10 + Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      {/* 헤더 */}
      <div className='relative z-10 p-4 pb-0'>
        <div className='flex items-center justify-between mb-0'>
          {/* 랭킹 카드 (PC) */}
          <div className='hidden lg:flex items-center mr-4'>
            <div className='nature-light pixel-border rounded-lg p-2 min-w-[530px] flex flex-col items-center shadow-sm bg-white/80 backdrop-blur-sm'>
              <div className='flex items-center space-x-1 mb-1'>
                <Trophy className='h-6 w-6 lg:h-8 lg:w-8 text-yellow-500' />
                <span className='font-sans text-[20px] lg:text-[40px] font-bold text-green-800'>
                  TOP 7
                </span>
              </div>
              <div className='grid grid-cols-[repeat(7,minmax(0,1fr))] gap-1 w-full'>
                {ranking.slice(0, 7).map((student, index) => (
                  <div
                    key={student.id}
                    className='flex flex-col items-center justify-center w-12 lg:w-[100px] bg-green-100 rounded p-2 lg:p-3'
                  >
                    <p className='flight-font text-[12px] lg:text-[25px] text-green-700 truncate w-full text-center'>
                      {student.name}
                    </p>
                    <p className='flight-font text-[10px] lg:text-[20px] text-green-600'>
                      {student.weighted_score}점
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 제목 */}
          <div className=''>
            <h1 className='flight-font-title text-[30px] lg:text-[50px] text-green-800 mb-2 text-center'>
              레벨업: 리셋 에디션
            </h1>

            <div className='flex flex-col items-center mt-1'>
              <div className='flex items-center space-x-2 px-3 py-1 rounded-full bg-gradient-to-r from-green-200 via-yellow-100 to-green-100 shadow-inner border border-green-300'>
                <span className='text-green-700 font-bold text-[16px] lg:text-[25px] flight-font animate-pulse'>
                  칭찬으로 EXP 채우는 중…
                </span>
                <svg
                  className='w-4 h-4 text-yellow-400 animate-bounce'
                  fill='currentColor'
                  viewBox='0 0 20 20'
                >
                  <path d='M10 2l2.39 4.84 5.34.78-3.87 3.77.91 5.32L10 13.27l-4.77 2.51.91-5.32-3.87-3.77 5.34-.78L10 2z' />
                </svg>
              </div>
              <div className='h-1 w-32 bg-green-100 rounded-full mt-2 overflow-hidden'>
                <div
                  className='h-full bg-gradient-to-r from-green-400 to-yellow-300 animate-exp-bar'
                  style={{ width: '70%' }}
                ></div>
              </div>
              <style jsx>{`
                @keyframes exp-bar {
                  0% {
                    width: 0%;
                  }
                  100% {
                    width: 70%;
                  }
                }
                .animate-exp-bar {
                  animation: exp-bar 2s ease-in-out forwards;
                }

                @keyframes enter {
                  0% {
                    transform: translateX(100%);
                    opacity: 0;
                  }
                  100% {
                    transform: translateX(0);
                    opacity: 1;
                  }
                }

                @keyframes leave {
                  0% {
                    transform: translateX(0);
                    opacity: 1;
                  }
                  100% {
                    transform: translateX(100%);
                    opacity: 0;
                  }
                }

                .animate-enter {
                  animation: enter 0.5s ease-out forwards;
                }

                .animate-leave {
                  animation: leave 0.5s ease-in forwards;
                }

                @keyframes loadingBar {
                  0% {
                    width: 100%;
                  }
                  100% {
                    width: 0%;
                  }
                }
              `}</style>
            </div>
          </div>
          {user && user.phone_number === '01012344321' && (
            <img
              src='/qr.png'
              alt='logo'
              style={{
                width: '230px',
                height: '230px',
                objectFit: 'contain',
              }}
            />
          )}
          {/* 미칭찬 카드 (PC) */}
          <div className='hidden lg:flex items-center ml-4'>
            <div className='nature-light pixel-border rounded-lg p-2 min-w-[180px] flex flex-col items-center shadow-sm bg-white/80 backdrop-blur-sm'>
              <div className='flex items-center space-x-1 mb-1'>
                <Users className='h-6 w-6 lg:h-8 lg:w-8 text-green-600' />
                <span className='flight-font-bold text-[16px] lg:text-[40px] text-green-800'>
                  경험치 0점 목록
                </span>
              </div>
              <div className='flex flex-wrap gap-1 justify-center'>
                {statistics.students_who_havent_written &&
                statistics.students_who_havent_written.length > 0 ? (
                  <>
                    {statistics.students_who_havent_written
                      .slice(0, 4)
                      .map((student) => (
                        <span
                          key={student.id}
                          className='flight-font text-[12px] lg:text-[30px] text-green-600 bg-white/60 px-2 py-1 rounded'
                        >
                          {student.name}
                        </span>
                      ))}
                    {statistics.students_who_havent_written.length > 4 && (
                      <span className='flight-font text-[12px] lg:text-[30px] text-green-600 bg-white/60 px-2 py-1 rounded'>
                        +
                        {Math.max(
                          0,
                          statistics.students_who_havent_written.length - 4
                        )}
                        명
                      </span>
                    )}
                  </>
                ) : (
                  <span className='flight-font text-xs text-green-400'>
                    없음
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 모바일 메뉴 버튼 */}
          <div className='lg:hidden'>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className='p-2 bg-green-600 rounded-lg text-white'
            >
              <Menu className='h-5 w-5' />
            </button>
          </div>
        </div>

        {/* 모바일 메뉴 - 최상단으로 이동 */}
        <AnimatePresence>
          {showMenu && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className='lg:hidden absolute top-20 right-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-4'
              style={{ zIndex: 99999 }}
            >
              <div className='space-y-2'>
                <button
                  onClick={handleMyPage}
                  className='flex items-center space-x-2 w-full p-2 hover:bg-green-100 rounded text-black'
                >
                  <User className='h-4 w-4' />
                  <span className='flight-font text-sm'>마이페이지</span>
                </button>
                <button
                  onClick={handleMyPraises}
                  className='flex items-center space-x-2 w-full p-2 hover:bg-green-100 rounded text-green-600'
                >
                  <MessageSquare className='h-4 w-4' />
                  <span className='flight-font text-sm'>내가 작성한 칭찬</span>
                </button>
                <button
                  onClick={handleWritePraise}
                  className='flex items-center space-x-2 w-full p-2 hover:bg-green-100 rounded text-green-600'
                >
                  <Plus className='h-4 w-4' />
                  <span className='flight-font text-sm'>칭찬 작성</span>
                </button>
                <button
                  onClick={handleLogout}
                  className='flex items-center space-x-2 w-full p-2 hover:bg-red-100 rounded text-red-600'
                >
                  <LogOut className='h-4 w-4' />
                  <span className='flight-font text-sm'>로그아웃</span>
                </button>
                <button
                  onClick={() => {
                    window.open(
                      'https://www.miricanvas.com/v/1414m11',
                      '_blank'
                    );
                  }}
                  className='flex items-center space-x-2 w-full p-2 hover:bg-red-100 rounded text-blue-600'
                >
                  <BookOpen className='h-4 w-4' />
                  <span className='flight-font text-sm'>규칙확인</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 학생 카드 그리드 */}
      <div className='relative z-0 p-4'>
        <div className='grid-responsive mx-auto'>
          {students.map((student, index) => (
            <div key={student.student_info.id}>
              <StudentCard
                student={{
                  ...student,
                  student_info: {
                    ...student.student_info,
                    grade: formatGradeInfo(
                      student.student_info.school,
                      student.student_info.grade
                    ),
                  },
                }}
                isTeacher={user?.role === 'teacher'}
                onClick={() => handleStudentClick(student)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* 선생님 카드 그리드 */}
      {teachers.length > 0 && (
        <div className='relative z-0 p-4'>
          <div className='grid-responsive mx-auto'>
            {teachers.map((teacher, index) => (
              <div key={teacher.teacher_info.id}>
                <TeacherCard
                  teacher={teacher}
                  isTeacher={user?.role === 'teacher'}
                  onClick={() => handleTeacherClick(teacher)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 데스크톱 메뉴 - 화면 맨아래 오른쪽 */}
      <div className='hidden lg:block fixed bottom-4 right-4 z-50'>
        <div className='flex space-x-2'>
          <button
            onClick={handleMyPage}
            className='p-3 bg-green-600/90 backdrop-blur-sm rounded-lg text-white hover:bg-green-700 transition-colors shadow-lg'
            title='마이페이지'
          >
            <User className='h-5 w-5' />
          </button>
          <button
            onClick={handleMyPraises}
            className='p-3 bg-green-600/90 backdrop-blur-sm rounded-lg text-white hover:bg-green-700 transition-colors shadow-lg'
            title='내 칭찬'
          >
            <MessageSquare className='h-5 w-5' />
          </button>
          <button
            onClick={handleWritePraise}
            className='p-3 bg-green-600/90 backdrop-blur-sm rounded-lg text-white hover:bg-green-700 transition-colors shadow-lg'
            title='칭찬 작성'
          >
            <Plus className='h-5 w-5' />
          </button>
          <button
            onClick={handleLogout}
            className='p-3 bg-red-600/90 backdrop-blur-sm rounded-lg text-white hover:bg-red-700 transition-colors shadow-lg'
            title='로그아웃'
          >
            <LogOut className='h-5 w-5' />
          </button>
        </div>
      </div>

      {/* 칭찬 작성 모달 */}
      <WritePraiseModal
        isOpen={showWriteModal}
        onClose={() => setShowWriteModal(false)}
        onSuccess={() => {
          // 칭찬 작성 성공 시 데이터 새로고침
          fetchData();
          fetchStaticAndRanking();
        }}
      />
    </div>
  );
}
