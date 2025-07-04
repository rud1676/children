import jwt from 'jsonwebtoken';

const JWT_SECRET =
  process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// JWT 토큰 생성
function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      phone_number: user.phone_number,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// JWT 토큰 검증
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// 요청에서 토큰 추출
function getTokenFromRequest(req) {
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

// 미들웨어: 인증 확인
function authenticateToken(req, res, next) {
  const token = getTokenFromRequest(req);

  if (!token) {
    return res.status(401).json({ error: '토큰이 필요합니다' });
  }

  const user = verifyToken(token);
  if (!user) {
    return res.status(403).json({ error: '유효하지 않은 토큰입니다' });
  }

  req.user = user;
  next();
}

// 미들웨어: 선생님 권한 확인
function requireTeacher(req, res, next) {
  if (req.user.role !== 'teacher') {
    return res.status(403).json({ error: '선생님 권한이 필요합니다' });
  }
  next();
}

// 미들웨어: 학생 권한 확인
function requireStudent(req, res, next) {
  if (req.user.role !== 'student') {
    return res.status(403).json({ error: '학생 권한이 필요합니다' });
  }
  next();
}

export {
  generateToken,
  verifyToken,
  getTokenFromRequest,
  authenticateToken,
  requireTeacher,
  requireStudent,
};
