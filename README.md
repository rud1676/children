# 길가에교회 청소년부 수련회 칭찬릴레이

Next.js와 SQLite를 사용한 청소년부 수련회 칭찬릴레이 게임 앱입니다.

## 기능

- 학생과 선생님 역할 구분
- 칭찬 작성, 선택, 삭제
- 랭킹 시스템
- 통계 기능
- 알림 시스템
- 레트로 픽셀 스타일 UI

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```env
# API Base URL 설정
# 개발 환경에서는 빈 값으로 설정 (상대 경로 사용)
# 배포 시에는 실제 서버 URL로 설정 (예: https://your-domain.com)
NEXT_PUBLIC_API_BASE_URL=
```

### 3. 데이터베이스 초기화

```bash
node src/lib/init-db.js
```

### 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 결과를 확인하세요.

## 배포 시 주의사항

배포할 때는 반드시 `NEXT_PUBLIC_API_BASE_URL` 환경변수를 실제 서버 URL로 설정해야 합니다.

예시:

- Vercel: `https://your-app.vercel.app`
- Netlify: `https://your-app.netlify.app`
- 자체 서버: `https://your-domain.com`

## 기술 스택

- **Frontend**: Next.js 14, React, Tailwind CSS, Framer Motion
- **Backend**: Next.js API Routes
- **Database**: SQLite
- **Authentication**: JWT
- **Styling**: Tailwind CSS with custom pixel font

## 프로젝트 구조

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API 엔드포인트
│   ├── components/        # 재사용 가능한 컴포넌트
│   └── lib/              # 유틸리티 함수들
├── components/            # 공통 컴포넌트
└── lib/                  # 라이브러리 및 설정
```

## API 엔드포인트

- `POST /api/auth/login` - 로그인
- `POST /api/auth/set-password` - 비밀번호 설정
- `GET /api/students/praises` - 학생별 칭찬 조회
- `GET /api/ranking` - 랭킹 조회
- `GET /api/statistics` - 통계 조회
- `POST /api/praises` - 칭찬 작성
- `GET /api/praises/user` - 내가 작성한 칭찬
- `GET /api/praises/received` - 받은 칭찬
- `POST /api/praises/[id]/select` - 칭찬 선택/해제
- `DELETE /api/praises/[id]/delete-by-teacher` - 칭찬 삭제 (선생님만)
