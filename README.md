# 🧠 마인드 트레이더

AI가 분석하는 나의 투자 심리 패턴

## 📋 프로젝트 소개

**마인드 트레이더**는 개인 투자자들이 자신의 매매 기록을 관리하고, AI를 통해 투자 심리 패턴을 분석할 수 있는 MVP 서비스입니다.

### 🎯 핵심 기능

1. **매매 기록 입력 폼**: 종목명, 매수/매도, 날짜, 가격, 수량과 함께 "매매의 순간, 나의 생각은?" 저널링
2. **AI 감성 분석**: OpenAI API를 통한 매매 심리 분석 및 태깅 (FOMO, 공포, 기술적분석 등)
3. **시장 데이터 자동 수집**: 매매 날짜 기준 코스피/나스닥 지수 자동 저장
4. **복기 대시보드**: 매매 기록 + 수익률 + AI 감성 태그 한눈에 보기

## 🛠️ 기술 스택

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **UI**: shadcn/ui + Tailwind CSS
- **Authentication**: NextAuth.js (Google OAuth)
- **Database**: SQLite (MVP용, 추후 PostgreSQL 마이그레이션 예정)
- **Package Manager**: pnpm
- **Architecture**: FSD (Feature-Sliced Design)

## 🚀 시작하기

### 1. 프로젝트 클론 및 의존성 설치

\`\`\`bash
git clone [repository-url]
cd mind-trader
pnpm install
\`\`\`

### 2. 환경 변수 설정

\`env.example\`을 \`.env.local\`로 복사하고 필요한 값들을 설정하세요:

\`\`\`bash
cp env.example .env.local
\`\`\`

#### 구글 OAuth 설정

1. [Google Cloud Console](https://console.developers.google.com/)에 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. "API 및 서비스" > "사용자 인증 정보"로 이동
4. "사용자 인증 정보 만들기" > "OAuth 2.0 클라이언트 ID" 선택
5. 애플리케이션 유형: "웹 애플리케이션"
6. 승인된 리디렉션 URI에 추가:
   - \`http://localhost:3000/api/auth/callback/google\` (개발용)
   - \`https://your-domain.com/api/auth/callback/google\` (배포용)
7. 생성된 클라이언트 ID와 클라이언트 보안 비밀을 \`.env.local\`에 추가

#### NEXTAUTH_SECRET 생성

\`\`\`bash
openssl rand -base64 32
\`\`\`

생성된 값을 \`.env.local\`의 \`NEXTAUTH_SECRET\`에 추가하세요.

### 3. 개발 서버 실행

\`\`\`bash
pnpm dev
\`\`\`

[http://localhost:3000](http://localhost:3000)에서 애플리케이션을 확인할 수 있습니다.

## 📁 프로젝트 구조 (FSD)

\`\`\`
mind-trader/
├── 📁 app/ # Next.js App Router
│ ├── 📁 api/ # API Routes (백엔드)
│ ├── 📁 auth/ # 인증 관련 페이지
│ ├── layout.tsx # 루트 레이아웃
│ ├── page.tsx # 홈페이지
│ └── providers.tsx # Context Providers
├── 📁 shared/ # 공유 레이어
│ └── 📁 types/ # 공통 타입 정의
├── 📁 entities/ # 엔티티 레이어
│ └── 📁 trade/ # Trade 엔티티
│ └── 📁 model/
│ └── types.ts # Trade 관련 타입
├── 📁 features/ # 기능 레이어
│ ├── 📁 trade-form/ # 매매 기록 입력 폼
│ └── 📁 trade-list/ # 매매 기록 목록
├── 📁 widgets/ # 위젯 레이어
│ └── 📁 trade-dashboard/ # 메인 대시보드
├── 📁 components/ # shadcn/ui 컴포넌트
└── 📁 lib/ # 유틸리티 및 설정
└── auth.ts # NextAuth 설정
\`\`\`

## 🔧 개발 로드맵

### Phase 1: MVP 완성 ✅

- [x] 기본 UI 컴포넌트 (shadcn/ui)
- [x] 매매 기록 입력 폼
- [x] 매매 기록 목록 표시
- [x] Google OAuth 인증
- [x] FSD 아키텍처 적용

### Phase 2: 백엔드 & 데이터베이스

- [ ] SQLite 데이터베이스 스키마 구현
- [ ] 매매 기록 CRUD API
- [ ] 사용자별 데이터 분리

### Phase 3: AI 분석 기능

- [ ] OpenAI API 연동
- [ ] 감성 분석 프롬프트 최적화
- [ ] 태그 시스템 구현

### Phase 4: 시장 데이터 연동

- [ ] 금융 API 연동 (Alpha Vantage 등)
- [ ] 자동 시장 데이터 수집
- [ ] 수익률 계산 로직

### Phase 5: 고도화

- [ ] 패턴 분석 대시보드
- [ ] 통계 및 인사이트
- [ ] 데이터 내보내기
- [ ] 모바일 최적화

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (\`git checkout -b feature/AmazingFeature\`)
3. Commit your Changes (\`git commit -m 'Add some AmazingFeature'\`)
4. Push to the Branch (\`git push origin feature/AmazingFeature\`)
5. Open a Pull Request

## 📝 라이선스

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## 📞 문의

프로젝트에 대한 문의사항이나 제안이 있으시면 이슈를 생성해주세요.

---

**Happy Trading & Self-Reflection! 🚀💭**
