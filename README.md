# 이웃집 (Iusjib)

오피스텔/원룸 거주자들을 위한 건물별 커뮤니티 앱

## 소개

이웃집은 같은 건물에 사는 이웃들이 소통하고 정보를 공유할 수 있는 모바일 커뮤니티 플랫폼입니다.

### 주요 기능

- 🏢 **건물별 커뮤니티**: 같은 건물 거주자만 접근 가능한 폐쇄형 커뮤니티
- 📢 **공지/정보 게시판**: 관리사무소 공지, 분실물, 민원 공유
- 🤝 **나눔/거래 게시판**: 중고거래, 공동구매, 나눔
- 💬 **자유게시판**: 일상 소통, 맛집 추천, 동네 이슈
- ✅ **거주 인증 시스템**: 안전한 커뮤니티를 위한 거주 확인
- 🔔 **실시간 알림**: 중요 공지 및 댓글 알림

## 기술 스택

- **Frontend**: React Native (Expo)
- **Backend**: Supabase
  - Authentication
  - PostgreSQL + Row Level Security
  - Realtime Subscriptions
  - Storage (이미지 업로드)
- **UI**: NativeWind (Tailwind CSS for React Native)
- **State Management**: Zustand

## 시작하기

### 사전 요구사항

- Node.js 18+
- npm 또는 yarn
- Expo Go 앱 (모바일 테스트용)

### 설치

```bash
# 의존성 설치
npm install

# 개발 서버 시작
npm start
```

### Supabase 설정

자세한 설정 가이드는 [SETUP.md](./SETUP.md)를 참고하세요.

1. Supabase 프로젝트 생성
2. `supabase-schema.sql` 실행
3. `.env` 파일 설정
4. 앱 실행

## 프로젝트 구조

```
iusjib/
├── src/
│   ├── components/     # 재사용 가능한 컴포넌트
│   ├── screens/        # 화면 컴포넌트
│   ├── lib/           # Supabase 클라이언트 등
│   ├── types/         # TypeScript 타입 정의
│   ├── hooks/         # Custom React Hooks
│   └── stores/        # Zustand 스토어
├── assets/            # 이미지, 폰트 등
└── supabase-schema.sql # 데이터베이스 스키마

```

## 개발 로드맵

### Phase 1: MVP (완료)
- [x] 프로젝트 초기 설정
- [x] Supabase 연동
- [x] 데이터베이스 스키마 설계
- [x] 인증 시스템 (이메일 인증)
- [x] 거주 인증 시스템 (관리자 승인)
- [x] 게시판 CRUD
- [x] 댓글 시스템
- [x] 좋아요 기능
- [x] 관리자 대시보드

### Phase 2: 추가 기능 (진행 예정)
- [ ] 푸시 알림
- [ ] 이미지 최적화
- [ ] 실시간 알림
- [ ] 게시글 검색

### Phase 3: 확장
- [ ] 신고/차단 기능
- [ ] 건물별 통계
- [ ] 공지사항 고정
- [ ] 사용자 활동 통계

## 라이선스

MIT

## 기여

기여를 환영합니다! Issue나 Pull Request를 자유롭게 등록해주세요.
