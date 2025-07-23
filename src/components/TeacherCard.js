import { motion } from 'framer-motion';
import { Heart, MessageSquare, Star } from 'lucide-react';

export default function TeacherCard({ teacher, isTeacher, onClick }) {
  const { teacher_info, praises } = teacher;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className={`nature-light pixel-border rounded-lg p-4 shadow-sm bg-white/80 backdrop-blur-sm cursor-pointer hover:shadow-md transition-all duration-200 ${
        isTeacher ? 'hover:bg-green-50' : ''
      }`}
      onClick={onClick}
    >
      {/* 선생님 정보 */}
      <div className='flex items-center justify-between mb-3'>
        <div className='flex items-center space-x-2'>
          <div className='w-10 h-10 bg-green-500 rounded-full flex items-center justify-center'>
            <span className='flight-font text-white font-bold text-sm'>
              선생님
            </span>
          </div>
          <div>
            <h3 className='flight-font-bold text-lg text-green-800'>
              {teacher_info.name}
            </h3>
            <p className='flight-font text-sm text-green-600'>
              {teacher_info.school || '선생님'}
            </p>
          </div>
        </div>
        {isTeacher === 1 && (
          <div className='flex items-center space-x-1'>
            <Star className='h-4 w-4 text-yellow-500' />
            <span className='flight-font text-xs text-yellow-600'>선생님</span>
          </div>
        )}
      </div>

      {/* 칭찬 목록 */}
      <div className='space-y-2'>
        {praises.length > 0 ? (
          praises.map((praise, index) => (
            <motion.div
              key={praise.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-3 rounded-lg border-l-4 ${
                praise.is_selected
                  ? 'bg-yellow-50 border-yellow-400'
                  : praise.is_teacher
                  ? 'bg-green-50 border-green-400'
                  : 'bg-gray-50 border-gray-300'
              }`}
            >
              <div className='flex items-start justify-between'>
                <p className='flight-font text-sm text-gray-700 flex-1'>
                  {praise.content}
                </p>
              </div>
            </motion.div>
          ))
        ) : (
          <div className='text-center py-4'>
            <MessageSquare className='h-8 w-8 text-gray-400 mx-auto mb-2' />
            <p className='flight-font text-sm text-gray-500'>
              아직 칭찬이 없어요
            </p>
          </div>
        )}
      </div>

      {/* 칭찬 개수 표시 */}
      {praises.length > 0 && (
        <div className='mt-3 pt-3 border-t border-green-200'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-2'>
              <MessageSquare className='h-4 w-4 text-green-600' />
              <span className='flight-font text-sm text-green-700'>
                {praises.length}개의 칭찬
              </span>
            </div>
            <div className='flex items-center space-x-1'>
              {praises.filter((p) => p.is_selected).length > 0 && (
                <div className='flex items-center space-x-1'>
                  <Heart className='h-3 w-3 text-yellow-500 fill-current' />
                  <span className='flight-font text-xs text-yellow-600'>
                    {praises.filter((p) => p.is_selected).length}
                  </span>
                </div>
              )}
              {praises.filter((p) => p.is_teacher).length > 0 && (
                <div className='flex items-center space-x-1'>
                  <Star className='h-3 w-3 text-green-500' />
                  <span className='flight-font text-xs text-green-600'>
                    {praises.filter((p) => p.is_teacher).length}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
