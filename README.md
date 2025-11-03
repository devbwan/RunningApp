# RunWave - 러닝 트래커 앱

React Native 기반의 크로스 플랫폼 러닝 트래커 애플리케이션입니다. 웹, Android, iOS에서 동작하며, GPS 기반 러닝 기록, 통계, 메달 시스템을 제공합니다.

## 📱 주요 기능

### ✅ 구현 완료
- **GPS 러닝 추적**: 실시간 위치 추적 및 경로 저장
- **러닝 세션 관리**: 시작/일시정지/재개/종료 기능
- **통계 분석**: 오늘/주간/누적 통계 표시
- **메달 시스템**: 19개 메달 및 진행도 추적
- **세션 기록**: 러닝 세션 상세 정보 및 지도 경로 표시
- **인증 시스템**: 게스트 모드 및 Google 로그인 지원
- **프로필 관리**: 사용자 통계 및 메달 표시
- **코스 추천**: 인기 코스 추천 (Firebase 연동 준비)

### 🚧 개발 중
- **네이버 로그인**: OAuth 구현 중
- **그룹 러닝**: Socket.IO 기반 실시간 위치 공유
- **음성 가이드**: 1km마다 음성 알림
- **Firebase 동기화**: 클라우드 데이터 동기화

## 🚀 빠른 시작

### 필수 요구사항
- Node.js 18+
- npm 또는 yarn
- Expo CLI (`npm install -g expo-cli`)

### 설치 및 실행

```bash
# 1. 프로젝트 클론 (또는 현재 디렉토리에서)
cd ai-running-app

# 2. 의존성 설치
npm install

# 3. 환경 변수 설정 (필수)
# .env.web 또는 .env.local 파일 생성 (ENV_SETUP.md 참고)

# 4. 웹에서 실행
npm run web:setup
# 또는
npm run web:local

# 5. Android에서 실행
npm run android:setup

# 6. iOS에서 실행
npm run ios
```

### 환경 변수 설정

웹과 Android에서 각각 다른 설정을 사용할 수 있습니다:

```bash
# 웹 환경용 설정
cp .env.web.example .env.web
# .env.web 파일 편집

# Android 환경용 설정
cp .env.android.example .env.android
# .env.android 파일 편집

# 로컬 개발용 설정
cp .env.local.example .env.local
# .env.local 파일 편집
```

자세한 내용은 [ENV_SETUP.md](./ENV_SETUP.md)를 참고하세요.

## 🌐 배포

### GitHub Pages 배포

웹 버전을 GitHub Pages에 배포합니다:

```bash
# 빌드 및 배포 (자동)
npm run deploy
```

배포 URL: **https://devbwan.github.io/**

배포 가이드: [GITHUB_PAGES_DEPLOY.md](./GITHUB_PAGES_DEPLOY.md)

## 📁 프로젝트 구조

```
ai-running-app/
├── app/                    # Expo Router 화면 파일
│   ├── (tabs)/            # 탭 네비게이션 화면
│   │   ├── index.js       # 홈 화면
│   │   ├── run.js         # 러닝 화면
│   │   ├── records.js      # 기록 화면
│   │   ├── courses.js      # 코스 화면
│   │   └── profile.js      # 프로필 화면
│   ├── login.js           # 로그인 화면
│   └── session/[id].js    # 세션 상세 화면
├── src/
│   ├── components/        # 재사용 가능한 컴포넌트
│   ├── config/            # 설정 파일 (Firebase 등)
│   ├── db/                # 데이터베이스 레포지토리
│   ├── hooks/             # 커스텀 훅
│   ├── services/          # 서비스 레이어
│   ├── stores/            # Zustand 상태 관리
│   ├── theme/             # 디자인 토큰
│   └── utils/             # 유틸리티 함수
├── scripts/               # 빌드 스크립트
├── assets/                # 이미지 및 아이콘
└── docs/                  # 문서
```

## 🔧 기술 스택

### 핵심 라이브러리
- **React Native** (0.81.5) - 크로스 플랫폼 프레임워크
- **Expo** (SDK 54.0.20) - 개발 도구 및 런타임
- **Expo Router** (v6.0.14) - 파일 기반 라우팅
- **Zustand** (v5.0.8) - 상태 관리
- **React Native Paper** (v5.14.5) - UI 컴포넌트

### 기능별 라이브러리
- **expo-location** - GPS 위치 추적
- **react-native-maps** - 지도 표시
- **expo-sqlite** - 로컬 데이터베이스
- **firebase** - 인증 및 클라우드 데이터
- **@react-native-async-storage/async-storage** - 로컬 저장소

## 📱 플랫폼 지원

### ✅ 지원 플랫폼
- **웹**: Chrome, Firefox, Safari, Edge (GitHub Pages 배포)
- **Android**: 5.0+ (실제 기기 권장)
- **iOS**: 13.0+ (개발 중)

### 플랫폼별 특징
- **웹**: 로컬 저장소 사용 (SQLite 대신 AsyncStorage), GPS 제한적
- **Android**: 완전한 GPS 추적 및 백그라운드 실행 지원
- **iOS**: 개발 예정

## 🔐 인증 시스템

### 지원하는 로그인 방식
1. **게스트 모드**: 로그인 없이 로컬에서만 사용
2. **Google 로그인**: Firebase Auth 연동
3. **네이버 로그인**: 구현 중

### 인증 설정
- Firebase Console에서 Authentication 활성화 필요
- Google OAuth 클라이언트 ID 설정 필요
- 자세한 내용: [GOOGLE_AUTH_ENABLE.md](./GOOGLE_AUTH_ENABLE.md)

## 📊 데이터 저장

### 로컬 저장소
- **SQLite** (모바일): 러닝 세션 및 통계 저장
- **AsyncStorage** (웹): 웹 환경에서 SQLite 대신 사용

### 클라우드 동기화 (Firebase)
- Firestore: 코스 데이터 저장 (구현 중)
- 사용자 데이터 동기화 (구현 예정)

## 🐛 문제 해결

### 일반적인 문제

#### 1. 환경 변수 오류
```bash
# .env.web 파일이 있는지 확인
ls .env.web

# 없다면 생성
cp .env.web.example .env.web
# 파일 편집하여 실제 값 입력
```

#### 2. Firebase 설정 오류
- Firebase Console에서 프로젝트 설정 확인
- 환경 변수에 올바른 값이 설정되어 있는지 확인
- 자세한 내용: [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)

#### 3. GitHub Pages 배포 오류
- CSP 오류: 브라우저 확장 프로그램 문제일 수 있음 (무시 가능)
- 아이콘 표시 오류: 브라우저 캐시 클리어 후 재접속
- 자세한 내용: [GITHUB_PAGES_TROUBLESHOOTING.md](./GITHUB_PAGES_TROUBLESHOOTING.md)

#### 4. 로그아웃 후 새로고침 문제
- 최신 버전으로 수정됨 (Firebase Auth 동기화 개선)

## 📚 문서

- [환경 변수 설정](./ENV_SETUP.md)
- [Firebase 설정](./FIREBASE_SETUP.md)
- [Google 로그인 설정](./GOOGLE_AUTH_ENABLE.md)
- [GitHub Pages 배포](./GITHUB_PAGES_DEPLOY.md)
- [프로젝트 상태](./PROJECT_STATUS.md)
- [테스트 가이드](./TEST_REPORT.md)
- [Android 테스트](./ANDROID_TEST_GUIDE.md)

## 🧪 테스트

### 웹 테스트
```bash
npm run web:local
# http://localhost:8081 접속
```

### Android 테스트
```bash
npm run android:setup
# Android Studio 에뮬레이터 또는 실제 기기
```

### 테스트 체크리스트
- [x] 탭 네비게이션
- [x] GPS 추적
- [x] 러닝 세션 저장
- [x] 통계 표시
- [x] 메달 시스템
- [x] 인증 (Google 로그인)
- [ ] 그룹 러닝
- [ ] 음성 가이드

## 🤝 기여

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 개인 프로젝트입니다.

## 📞 문의

문제가 발생하거나 제안사항이 있으시면 이슈를 생성해주세요.

---

**최종 업데이트**: 2024년
**버전**: 1.0.0
**상태**: ✅ 개발 중 - 핵심 기능 완료, 추가 기능 개발 중
