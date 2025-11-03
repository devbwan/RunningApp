# 환경 변수 설정 가이드

웹과 Android 환경에서 각각 다른 설정을 사용할 수 있도록 환경 변수를 설정하는 방법입니다.

## 📁 환경 변수 파일 구조

프로젝트 루트에 다음 파일들을 생성하세요:

```
ai-running-app/
├── .env.example          # 환경 변수 예시 파일 (Git에 포함)
├── .env.web              # 웹 환경 설정 (Git에 포함하지 않음)
└── .env.android          # Android 환경 설정 (Git에 포함하지 않음)
```

## 🔧 환경 변수 파일 생성 방법

### 1. `.env.example` 파일 (이미 생성됨)
환경 변수 예시가 담긴 템플릿 파일입니다. Git에 포함됩니다.

### 2. `.env.web` 파일 생성

프로젝트 루트에 `.env.web` 파일을 생성하고 다음 내용을 입력하세요:

```bash
# 웹 환경 Firebase 설정
EXPO_PUBLIC_FIREBASE_API_KEY=your-web-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
EXPO_PUBLIC_FIREBASE_APP_ID=1:xxx:web:xxx
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=G-xxxxx

# Google OAuth Client ID (웹용)
EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB=your-google-client-id-web.apps.googleusercontent.com

# Naver OAuth Client ID (웹용)
EXPO_PUBLIC_NAVER_CLIENT_ID_WEB=your-naver-client-id-web

EXPO_PUBLIC_ENV=development
```

### 3. `.env.android` 파일 생성

프로젝트 루트에 `.env.android` 파일을 생성하고 다음 내용을 입력하세요:

```bash
# Android 환경 Firebase 설정
EXPO_PUBLIC_FIREBASE_API_KEY=your-android-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
EXPO_PUBLIC_FIREBASE_APP_ID=1:xxx:android:xxx

# Google OAuth Client ID (Android용)
EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID=your-google-client-id-android.apps.googleusercontent.com

# Naver OAuth Client ID (Android용)
EXPO_PUBLIC_NAVER_CLIENT_ID_ANDROID=your-naver-client-id-android

EXPO_PUBLIC_ENV=development
```

## 🚀 사용 방법

### 환경 변수 자동 로드

Expo는 자동으로 `.env`, `.env.local`, `.env.development`, `.env.production` 등의 파일을 로드합니다.
플랫폼별로 다른 파일을 사용하려면 다음과 같이 수동으로 설정할 수 있습니다:

### Windows (PowerShell)

**웹 환경 실행:**
```powershell
# .env.web 파일을 .env로 복사
Copy-Item .env.web .env
npm run web
```

**Android 환경 실행:**
```powershell
# .env.android 파일을 .env로 복사
Copy-Item .env.android .env
npm run android
```

### macOS/Linux

**웹 환경 실행:**
```bash
# .env.web 파일을 .env로 복사
cp .env.web .env
npm run web
```

**Android 환경 실행:**
```bash
# .env.android 파일을 .env로 복사
cp .env.android .env
npm run android
```

## 📝 코드에서 환경 변수 사용

### 1. Firebase 설정 자동 로드

`src/config/firebase.js`에서 환경 변수를 자동으로 로드합니다:

```javascript
import { firebaseConfig } from '../config/firebase';

// 플랫폼별로 다른 Firebase 설정이 자동으로 로드됩니다
```

### 2. 환경 변수 직접 사용

`src/config/env.js`에서 환경 변수를 사용할 수 있습니다:

```javascript
import env from '../config/env';

// 플랫폼 확인
console.log('Platform:', env.platform); // 'web' 또는 'android'

// Firebase 설정 접근
console.log('Project ID:', env.firebase.projectId);

// 플랫폼별 Google OAuth Client ID
const googleClientId = env.getGoogleClientId();

// 환경 확인
if (env.isDevelopment) {
  console.log('개발 모드');
}
```

## 🔐 보안 주의사항

1. **`.env.web`와 `.env.android` 파일은 Git에 커밋하지 마세요**
   - `.gitignore`에 이미 포함되어 있습니다.

2. **환경 변수 이름 규칙**
   - Expo에서 환경 변수를 사용하려면 `EXPO_PUBLIC_` 접두사가 필요합니다.
   - 예: `EXPO_PUBLIC_FIREBASE_API_KEY`

3. **프로덕션 환경**
   - 프로덕션 빌드에서는 환경 변수가 번들에 포함됩니다.
   - 민감한 정보는 환경 변수에 넣지 마세요.
   - Firebase 설정은 공개되어도 괜찮지만, 실제 비밀 키는 서버에서 관리하세요.

## 🔍 환경 변수 확인

개발 모드에서 환경 변수가 제대로 로드되었는지 확인하려면:

1. `src/config/firebase.js`의 콘솔 로그 확인
2. `src/config/env.js`를 import해서 값 확인

```javascript
import env from './config/env';

console.log('Environment:', env);
```

## 📚 관련 문서

- [Expo Environment Variables](https://docs.expo.dev/guides/environment-variables/)
- [Firebase 설정 가이드](./FIREBASE_SETUP.md)
- [인증 설정 가이드](./AUTH_SETUP.md)

## ❓ 문제 해결

### 환경 변수가 로드되지 않는 경우

1. 파일 이름 확인: `.env.web`, `.env.android` 또는 `.env`
2. 변수 이름 확인: `EXPO_PUBLIC_` 접두사 필수
3. 앱 재시작: 환경 변수 변경 후 Expo 서버 재시작 필요
4. 캐시 클리어: `npx expo start --clear`

### 플랫폼별 다른 값 사용하기

코드에서 플랫폼을 확인하여 다른 설정을 사용할 수 있습니다:

```javascript
import { Platform } from 'react-native';

const config = Platform.OS === 'web' 
  ? webConfig 
  : androidConfig;
```

