# 우리동네 - 설정 가이드

## 1. Supabase 프로젝트 생성

1. [Supabase](https://supabase.com) 접속 후 로그인
2. "New Project" 클릭
3. 프로젝트 정보 입력:
   - Name: `woori-dongne`
   - Database Password: 안전한 비밀번호 입력 (저장 필수!)
   - Region: `Northeast Asia (Seoul)`
   - Pricing Plan: `Free`

## 2. 데이터베이스 스키마 생성

1. Supabase 대시보드에서 **SQL Editor** 메뉴 클릭
2. `supabase-schema.sql` 파일의 내용을 복사
3. SQL Editor에 붙여넣기
4. "Run" 버튼 클릭하여 실행

## 3. 환경 변수 설정

1. Supabase 대시보드에서 **Settings** > **API** 메뉴로 이동
2. 다음 값들을 복사:
   - Project URL
   - anon public (public key)

3. 프로젝트 루트에 `.env` 파일 생성:

```bash
cp .env.example .env
```

4. `.env` 파일을 열어 값 입력:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## 4. 앱 실행

### 의존성 설치 (이미 완료됨)
```bash
npm install
```

### 개발 서버 시작
```bash
npm start
```

### 플랫폼별 실행
- iOS 시뮬레이터: `i` 입력
- Android 에뮬레이터: `a` 입력
- 웹 브라우저: `w` 입력

### 실제 기기에서 테스트
1. App Store/Play Store에서 "Expo Go" 앱 다운로드
2. QR 코드 스캔

## 5. Supabase Storage 설정 (이미지 업로드용)

1. Supabase 대시보드에서 **Storage** 메뉴 클릭
2. "Create bucket" 클릭
3. Bucket 정보 입력:
   - Name: `verification-documents`
   - Public: `false` (비공개)
4. "Create bucket" 클릭

5. 또 다른 bucket 생성:
   - Name: `post-images`
   - Public: `true` (공개)

## 6. 테스트 계정 생성

1. 앱 실행 후 회원가입 진행
2. Supabase 대시보드에서 **Authentication** > **Users** 확인
3. 생성된 사용자의 이메일 인증 (테스트 환경에서는 자동 인증됨)

## 7. 다음 단계

- [ ] 인증 시스템 구현
- [ ] 게시판 기능 구현
- [ ] 실시간 기능 추가
- [ ] 푸시 알림 설정

## 문제 해결

### Supabase 연결 오류
- `.env` 파일의 URL과 Key가 정확한지 확인
- 앱을 재시작 (`npm start`)

### 데이터베이스 오류
- SQL 스키마가 제대로 실행되었는지 확인
- Supabase 대시보드의 Table Editor에서 테이블 확인

### 빌드 오류
```bash
# 캐시 클리어 후 재시작
npx expo start -c
```
