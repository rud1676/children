'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiFetch } from '../../lib/config';

export default function SetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const router = useRouter();

  useEffect(() => {
    // URL에서 phone_number 파라미터 가져오기
    const urlParams = new URLSearchParams(window.location.search);
    const phone = urlParams.get('phone_number');
    if (phone) {
      setPhoneNumber(phone);
    }
  }, []);

  const handleSetPassword = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (password.length < 4) {
      toast.error('비밀번호는 4자 이상이어야 합니다.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiFetch('/api/auth/set-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone_number: phoneNumber, password }),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        toast.success('비밀번호가 설정되었습니다!');
        router.push('/');
      } else {
        toast.error(data.error || '비밀번호 설정에 실패했습니다.');
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

      {/* 비밀번호 설정 카드 */}
      <div className='relative z-10 flex justify-start items-start h-full p-2 sm:p-4 pt-8 sm:pt-16'>
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className='w-full max-w-xs sm:max-w-sm md:max-w-md mx-auto'
        >
          <div className='nature-light pixel-border rounded-lg p-3 sm:p-6 md:p-8 shadow-2xl'>
            <div className='text-center mb-3 sm:mb-6 md:mb-8'>
              <div className='w-8 h-8 sm:w-12 sm:h-12 md:w-16 md:h-16 mx-auto mb-1 sm:mb-3 md:mb-4 bg-green-500 rounded-full flex items-center justify-center'>
                <CheckCircle className='h-4 w-4 sm:h-6 sm:w-6 md:h-8 md:w-8 text-white' />
              </div>
              <h1 className='flight-font-title text-base sm:text-xl md:text-2xl text-green-800 mb-1 sm:mb-2'>
                비밀번호 설정
              </h1>
              <p className='flight-font text-xs sm:text-sm text-green-600'>
                새로운 비밀번호를 설정해주세요
              </p>
            </div>

            <form
              onSubmit={handleSetPassword}
              className='space-y-2 sm:space-y-4 md:space-y-6'
            >
              {/* 새 비밀번호 입력 */}
              <div className='relative'>
                <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                  <Lock className='h-4 w-4 sm:h-5 sm:w-5 text-green-600' />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder='새 비밀번호'
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

              {/* 비밀번호 확인 입력 */}
              <div className='relative'>
                <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                  <Lock className='h-4 w-4 sm:h-5 sm:w-5 text-green-600' />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder='비밀번호 확인'
                  className='w-full pl-10 pr-12 py-2 sm:py-3 border-2 border-green-300 text-green-800 rounded-lg focus:border-green-500 focus:outline-none bg-white/80 backdrop-blur-sm flight-font text-sm'
                  required
                />
                <button
                  type='button'
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className='absolute inset-y-0 right-0 pr-3 flex items-center'
                >
                  {showConfirmPassword ? (
                    <EyeOff className='h-4 w-4 sm:h-5 sm:w-5 text-green-600' />
                  ) : (
                    <Eye className='h-4 w-4 sm:h-5 sm:w-5 text-green-600' />
                  )}
                </button>
              </div>

              {/* 설정 버튼 */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type='submit'
                disabled={isLoading}
                className='w-full nature-dark text-white py-2 sm:py-3 rounded-lg flight-font text-sm font-bold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50'
              >
                {isLoading ? '설정 중...' : '비밀번호 설정'}
              </motion.button>
            </form>

            <div className='mt-2 sm:mt-4 md:mt-6 text-center'>
              <p className='pixel-font text-xs text-green-600'>
                비밀번호는 4자 이상이어야 합니다
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
