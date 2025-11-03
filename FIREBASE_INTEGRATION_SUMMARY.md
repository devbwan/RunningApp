# Firebase 연동 완료 요약

## ✅ 완료된 작업

### 1. Firebase SDK 설치
- ✅ `firebase` 패키지 설치 완료

### 2. Firebase 설정 파일
- ✅ `src/config/firebase.js` - Firebase 초기화 및 설정
- ✅ 환경 변수 지원 (EXPO_PUBLIC_FIREBASE_*)
- ✅ Firebase 미설정 시 안전한 폴백 처리

### 3. Firestore 서비스
- ✅ `src/services/courseService.js` - 코스 데이터 CRUD
  - `getAllCourses()` - 모든 코스 조회 (필터, 검색 지원)
  - `getTop3Courses()` - 인기 코스 TOP3
  - `getCourseById()` - 코스 상세 조회
  - `createCourse()` - 코스 생성
  - `updateCourse()` - 코스 업데이트
  - `incrementRunnerCount()` - 러너 수 증가
  - `getUserCourses()` - 사용자 코스 조회

### 4. 클라우드 동기화 서비스
- ✅ `src/services/sessionSyncService.js` - 러닝 세션 동기화
  - `syncRunningSession()` - 세션 및 경로 포인트 클라우드 저장
  - `getCloudSessions()` - 클라우드 세션 조회
  - `getCloudRoutePoints()` - 클라우드 경로 포인트 조회

### 5. 화면 연동
- ✅ `app/(tabs)/courses.js` - Firebase에서 코스 데이터 로드
- ✅ `app/(tabs)/index.js` - 홈 화면 TOP3 Firebase 연동
- ✅ `app/course/[id].js` - 코스 상세 Firebase 연동
- ✅ `app/(tabs)/run.js` - 러닝 종료 시 클라우드 동기화

## 📋 다음 단계

### Firebase 프로젝트 설정 필요
1. Firebase Console에서 프로젝트 생성
2. Firestore 데이터베이스 생성
3. 보안 규칙 설정 (FIREBASE_SETUP.md 참고)
4. 환경 변수 설정 또는 `src/config/firebase.js` 수정

### 참고 문서
- `FIREBASE_SETUP.md` - 상세한 Firebase 설정 가이드

## 🎯 현재 동작 방식

### Firebase가 설정된 경우
- 코스 데이터를 Firestore에서 실시간으로 가져옴
- 러닝 종료 시 로컬 저장 + 클라우드 동기화
- 로그인한 사용자만 클라우드 동기화

### Firebase가 설정되지 않은 경우
- 임시 데이터(mockCourses) 사용
- 로컬 SQLite 저장만 동작
- 클라우드 동기화 스킵

## ⚙️ 설정 방법

### 빠른 설정
1. `src/config/firebase.js` 파일 열기
2. Firebase Console에서 웹 앱 설정 정보 복사
3. `firebaseConfig` 객체에 실제 값 입력

또는

1. `.env` 파일 생성
2. `EXPO_PUBLIC_FIREBASE_*` 환경 변수 설정
3. 앱 재시작

자세한 내용은 `FIREBASE_SETUP.md` 참고

