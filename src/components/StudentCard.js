'use client';

import { motion } from 'framer-motion';

export default function StudentCard({ student, isTeacher = false, onClick }) {
  const { student_info, praises } = student;

  // 5개의 칭찬 공간을 확보 (빈 칭찬은 null로 채움)
  const displayPraises = [...praises];
  while (displayPraises.length < 5) {
    displayPraises.push(null);
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      className='nature-light pixel-border rounded-lg p-6 cursor-pointer card-hover bg-white/80 backdrop-blur-sm min-w-0 w-full'
      onClick={onClick}
    >
      {/* 학생 정보 헤더 */}
      <div className='mb-4'>
        <h3 className='text-lg font-bold text-green-800 flight-font'>
          {student_info.name} / {student_info.grade}
        </h3>
      </div>

      {/* 칭찬 목록 - 5개 공간 고정 */}
      <div className='space-y-3'>
        {displayPraises.slice(0, 3).map((praise, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`h-16 flex flex-col justify-center ${
              praise
                ? 'bg-white/70 backdrop-blur-sm rounded p-3 border-l-4 border-green-400'
                : 'bg-gray-50/50 backdrop-blur-sm rounded p-3 border-l-4 border-gray-200'
            }`}
          >
            {praise ? (
              <p className='flight-font text-xs text-green-800 leading-relaxed line-clamp-2'>
                {praise.content}
              </p>
            ) : (
              <div className='flex items-center justify-center h-full'>
                <p className='flight-font text-xs text-gray-400'>칭찬 없음</p>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
