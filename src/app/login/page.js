'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Smartphone, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiFetch } from '../../lib/config';

export default function LoginPage() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone_number: phoneNumber, password }),
      });

      const data = await response.json();

      if (data.success) {
        if (data.is_first_login) {
          // 최초 로그인인 경우 비밀번호 설정 페이지로
          router.push(`/set-password?phone_number=${phoneNumber}`);
        } else {
          // 일반 로그인인 경우 메인 페이지로
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          router.push('/');
        }
        toast.success('로그인 성공!');
      } else {
        toast.error(data.error || '로그인에 실패했습니다.');
      }
    } catch (error) {
      toast.error('서버 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='h-screen nature-green relative overflow-hidden'>
      {/* 귀여운 네잎클로버 배경 */}
      <div className='absolute inset-0 overflow-hidden'>
        {/* 작은 네잎클로버들 */}
        {[...Array(8)].map((_, i) => (
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
        {[...Array(6)].map((_, i) => (
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
        {[...Array(4)].map((_, i) => (
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
        {[...Array(6)].map((_, i) => (
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

      {/* 로그인 카드 */}
      <div className='relative z-10 flex justify-start items-start h-full p-2 sm:p-4 pt-8 sm:pt-16'>
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className='w-full max-w-xs sm:max-w-sm md:max-w-md mx-auto'
        >
          <div className='nature-light pixel-border rounded-lg p-3 sm:p-6 md:p-8 shadow-2xl'>
            <div className='text-center mb-3 sm:mb-6 md:mb-8'>
              <h1 className='flight-font-title text-base sm:text-xl md:text-2xl text-green-800 mb-1 sm:mb-2'>
                길가에교회
              </h1>
              <h2 className='flight-font-bold text-sm sm:text-lg md:text-xl text-green-700 mb-1 sm:mb-3 md:mb-4'>
                청소년부 수련회
              </h2>
              <div className='w-8 h-8 sm:w-12 sm:h-12 md:w-16 md:h-16 mx-auto mb-1 sm:mb-3 md:mb-4 bg-green-500 rounded-full flex items-center justify-center'>
                <span className='flight-font text-white text-xs sm:text-sm'>
                  칭찬
                </span>
              </div>
              <h3 className='flight-font text-xs sm:text-base md:text-lg text-green-600'>
                칭찬릴레이
              </h3>
            </div>

            <form
              onSubmit={handleLogin}
              className='space-y-2 sm:space-y-4 md:space-y-6'
            >
              {/* 핸드폰 번호 입력 */}
              <div className='relative'>
                <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                  <Smartphone className='h-4 w-4 sm:h-5 sm:w-5 text-green-600' />
                </div>
                <input
                  type='tel'
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder='핸드폰 번호'
                  className='w-full pl-10 pr-4 py-2 sm:py-3 border-2 border-green-300 rounded-lg focus:border-green-500 focus:outline-none bg-white/80 backdrop-blur-sm flight-font text-sm text-green-800'
                  required
                />
              </div>

              {/* 비밀번호 입력 */}
              <div className='relative'>
                <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                  <Lock className='h-4 w-4 sm:h-5 sm:w-5 text-green-600' />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder='비밀번호'
                  className='w-full pl-10 pr-12 py-2 sm:py-3 border-2 border-green-300 rounded-lg text-green-800 focus:border-green-500 focus:outline-none bg-white/80 backdrop-blur-sm flight-font text-sm'
                  required
                />
                <button
                  type='button'
                  onClick={() => setShowPassword(!showPassword)}
                  className='absolute inset-y-0 right-0 pr-3 flex items-center'
                >
                  {showPassword ? (
                    <EyeOff className='h-4 w-4 sm:h-5 sm:w-5 text-green-600' />
                  ) : (
                    <Eye className='h-4 w-4 sm:h-5 sm:w-5 text-green-600' />
                  )}
                </button>
              </div>

              {/* 로그인 버튼 */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type='submit'
                disabled={isLoading}
                className='w-full nature-dark text-white py-2 sm:py-3 rounded-lg flight-font text-sm font-bold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50'
              >
                {isLoading ? '로그인 중...' : '로그인'}
              </motion.button>
            </form>

            <div className='mt-2 sm:mt-4 md:mt-6 text-center'>
              <p className='flight-font text-xs text-green-600'>
                최초 로그인 시 아무 비밀번호나 입력하세요
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
