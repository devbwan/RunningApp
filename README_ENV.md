# 🚀 빠른 시작: 환경 변수 설정

## 1단계: 환경 변수 파일 생성

프로젝트 루트에 다음 파일들을 **수동으로 생성**하세요:

### `.env.web` 파일 생성
```bash
# Windows (PowerShell)
New-Item .env.web -ItemType File

# macOS/Linux
touch .env.web
```

### `.env.android` 파일 생성
```bash
# Windows (PowerShell)
New-Item .env.android -ItemType File

# macOS/Linux
touch .env.android
```

## 2단계: 환경 변수 값 입력

### `.env.web` 파일에 다음 내용 입력:
```
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyBdk81kHK_GGuRoQoL-z4JGJNfhA9Jini8
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=runningapp-a0bff.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=runningapp-a0bff
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=runningapp-a0bff.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=184251732263
EXPO_PUBLIC_FIREBASE_APP_ID=1:184251732263:web:65a0f2d5b48e3409965902
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=G-2VG59SE6H7
EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB=your-google-client-id-web
EXPO_PUBLIC_NAVER_CLIENT_ID_WEB=your-naver-client-id-web
EXPO_PUBLIC_ENV=development
```

### `.env.android` 파일에 다음 내용 입력:
```
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyBdk81kHK_GGuRoQoL-z4JGJNfhA9Jini8
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=runningapp-a0bff.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=runningapp-a0bff
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=runningapp-a0bff.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=184251732263
EXPO_PUBLIC_FIREBASE_APP_ID=1:184251732263:android:your-android-app-id
EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID=your-google-client-id-android
EXPO_PUBLIC_NAVER_CLIENT_ID_ANDROID=your-naver-client-id-android
EXPO_PUBLIC_ENV=development
```

## 3단계: 환경 변수 활성화

### 웹 환경 실행:
```bash
npm run web:setup
```

### Android 환경 실행:
```bash
npm run android:setup
```

또는 수동으로:

```bash
# 웹
npm run env:web
npm run web

# Android
npm run env:android
npm run android
```

## 📝 참고사항

- `.env.web`와 `.env.android` 파일은 **Git에 커밋하지 마세요** (이미 `.gitignore`에 포함됨)
- 환경 변수는 `EXPO_PUBLIC_` 접두사가 필요합니다
- 환경 변수 변경 후에는 Expo 서버를 재시작해야 합니다
- 더 자세한 내용은 `ENV_SETUP.md` 파일을 참고하세요

