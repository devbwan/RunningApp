# 환경 변수 파일 가이드

프로젝트에서 사용하는 환경 변수 파일에 대한 설명입니다.

## 📁 환경 변수 파일 구조

```
ai-running-app/
├── .env.example              # 환경 변수 템플릿 (Git에 포함)
├── .env.local.example        # 로컬 개발 환경 예제
├── .env.web.example          # 웹 프로덕션 환경 예제
├── .env.local                # 로컬 개발 환경 (Git에 포함하지 않음) ⚠️
├── .env.web                  # 웹 프로덕션 환경 (Git에 포함하지 않음) ⚠️
└── .env.android              # Android 환경 (Git에 포함하지 않음) ⚠️
```

## 🚀 빠른 시작

### 1. 로컬 개발 환경 설정

```bash
# .env.local.example을 .env.local로 복사
cp .env.local.example .env.local

# .env.local 파일을 열어서 실제 값으로 수정
# Firebase 설정 정보를 Firebase Console에서 복사하여 입력
```

### 2. 웹 프로덕션 환경 설정

```bash
# .env.web.example을 .env.web로 복사
cp .env.web.example .env.web

# .env.web 파일을 열어서 실제 값으로 수정
# GitHub Pages 배포용 Firebase 설정 정보 입력
```

### 3. Android 환경 설정

```bash
# .env.example을 .env.android로 복사
cp .env.example .env.android

# .env.android 파일을 열어서 실제 값으로 수정
# Android 앱용 Firebase 설정 정보 입력
```

## 📝 파일별 설명

### `.env.example`
- **용도**: 환경 변수 템플릿
- **Git**: 포함됨 ✅
- **설명**: 모든 환경에서 공통으로 사용하는 변수들의 템플릿

### `.env.local.example`
- **용도**: 로컬 개발 환경 예제
- **Git**: 포함됨 ✅
- **설명**: 
  - `npm start` 또는 `npm run web` 실행 시 사용
  - 개발 모드 (`EXPO_PUBLIC_ENV=development`)
  - 로컬 개발 서버용 OAuth 리다이렉트 URI 사용

### `.env.web.example`
- **용도**: 웹 프로덕션 환경 예제
- **Git**: 포함됨 ✅
- **설명**:
  - GitHub Pages 배포 시 사용
  - 프로덕션 모드 (`EXPO_PUBLIC_ENV=production`)
  - OAuth 리다이렉트 URI: `https://devbwan.github.io/RunningApp/`

### `.env.local` ⚠️
- **용도**: 로컬 개발 환경 실제 설정
- **Git**: 포함하지 않음 (`.gitignore`에 있음)
- **생성**: `.env.local.example`를 복사하여 생성

### `.env.web` ⚠️
- **용도**: 웹 프로덕션 환경 실제 설정
- **Git**: 포함하지 않음 (`.gitignore`에 있음)
- **생성**: `.env.web.example`를 복사하여 생성

### `.env.android` ⚠️
- **용도**: Android 앱 환경 실제 설정
- **Git**: 포함하지 않음 (`.gitignore`에 있음)
- **생성**: `.env.example`를 복사하여 생성

## 🔧 사용 방법

### 로컬 개발 (개발 서버)

```bash
# 방법 1: 스크립트 사용 (권장)
npm run web:local

# 방법 2: 수동
cp .env.local .env
npm run web
```

### 웹 프로덕션 (GitHub Pages 배포)

```bash
# 방법 1: 스크립트 사용 (권장)
npm run build:web
npm run deploy

# 방법 2: 수동
cp .env.web .env
npm run build:web
npm run deploy
```

### Android 개발

```bash
# 방법 1: 스크립트 사용 (권장)
npm run android:setup

# 방법 2: 수동
cp .env.android .env
npm run android
```

## 🔑 필요한 환경 변수

### 필수 Firebase 설정
- `EXPO_PUBLIC_FIREBASE_API_KEY`
- `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
- `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `EXPO_PUBLIC_FIREBASE_APP_ID`

### 선택 Firebase 설정
- `EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID` (Analytics 사용 시)

### OAuth 설정 (선택사항)
- `EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB`
- `EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID`
- `EXPO_PUBLIC_NAVER_CLIENT_ID_WEB`
- `EXPO_PUBLIC_NAVER_CLIENT_ID_ANDROID`

### 환경 설정
- `EXPO_PUBLIC_ENV` (development / staging / production)

## ⚠️ 중요 주의사항

1. **`.env.local`, `.env.web`, `.env.android` 파일은 Git에 커밋하지 마세요!**
   - 이미 `.gitignore`에 포함되어 있습니다.

2. **환경 변수 이름은 `EXPO_PUBLIC_` 접두사가 필수입니다.**
   - Expo에서 환경 변수를 번들에 포함하려면 이 접두사가 필요합니다.

3. **OAuth 리다이렉트 URI 설정**
   - 로컬: `http://localhost:8081` 또는 Expo 개발 서버 URL
   - 웹: `https://devbwan.github.io/RunningApp/`
   - Android: `com.runwave.app://` 또는 커스텀 스킴

4. **프로덕션 배포 전 확인**
   - Firebase 프로덕션 프로젝트 사용 확인
   - OAuth 리다이렉트 URI 정확히 설정 확인
   - `EXPO_PUBLIC_ENV=production` 설정 확인

## 📚 관련 문서

- [환경 변수 설정 가이드](./ENV_SETUP.md)
- [Firebase 설정 가이드](./FIREBASE_SETUP.md)
- [GitHub Pages 배포 가이드](./GITHUB_PAGES_DEPLOY.md)

