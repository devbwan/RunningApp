# 건강 앱 연동 설정 가이드

RunWave 앱을 iOS HealthKit 및 Android Google Fit과 연동하는 방법을 안내합니다.

## 📦 패키지 설치

### 필수 패키지 설치

```bash
# iOS HealthKit
npm install react-native-health

# Android Google Fit
npm install react-native-google-fit

# iOS CocoaPods 설치 (iOS만)
cd ios && pod install && cd ..
```

## 📱 iOS - HealthKit 연동

### 1. 패키지 설치

```bash
npm install react-native-health
```

### 2. iOS 네이티브 설정

#### 2.1 Expo Prebuild 실행

Expo managed workflow를 사용하는 경우:

```bash
npx expo prebuild
```

이 명령은 `ios/` 및 `android/` 폴더를 생성합니다.

#### 2.2 CocoaPods 설치

```bash
cd ios
pod install
cd ..
```

#### 2.3 Xcode에서 HealthKit Capability 추가

1. Xcode에서 `ios/RunWave.xcworkspace` 열기
2. 프로젝트 네비게이터에서 프로젝트 선택
3. Target 선택 → "Signing & Capabilities" 탭
4. "+ Capability" 클릭
5. "HealthKit" 추가

#### 2.4 Info.plist 확인

`app.json`에 이미 HealthKit 권한 설명이 추가되어 있습니다:

```json
{
  "ios": {
    "infoPlist": {
      "NSHealthShareUsageDescription": "RunWave는 건강 앱에서 러닝 데이터를 읽기 위해 권한이 필요합니다.",
      "NSHealthUpdateUsageDescription": "RunWave는 건강 앱에 러닝 데이터를 저장하기 위해 권한이 필요합니다."
    }
  }
}
```

### 3. 구현 상태

`src/services/healthService.js`에 이미 실제 HealthKit API를 사용한 구현이 포함되어 있습니다. 패키지만 설치하면 바로 사용할 수 있습니다.

## 🤖 Android - Google Fit 연동

### 1. 패키지 설치

```bash
npm install react-native-google-fit
```

### 2. Android 네이티브 설정

#### 2.1 Expo Prebuild 실행

```bash
npx expo prebuild
```

#### 2.2 Google Fit API 설정

1. [Google Cloud Console](https://console.cloud.google.com/)에서 프로젝트 생성
2. **Google Fit API** 활성화
3. **OAuth 2.0 클라이언트 ID** 생성 (Android 앱)
4. **SHA-1 인증서 지문** 등록

#### 2.3 SHA-1 인증서 지문 확인

```bash
# 디버그 키스토어
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android

# 또는 릴리즈 키스토어
keytool -list -v -keystore android/app/my-release-key.keystore
```

#### 2.4 OAuth 클라이언트 ID 생성

1. Google Cloud Console → APIs & Services → Credentials
2. "Create Credentials" → "OAuth client ID"
3. Application type: "Android"
4. Package name: `com.runwave.app` (app.json의 package 값)
5. SHA-1 인증서 지문 입력
6. 생성된 클라이언트 ID를 `android/app/build.gradle`에 추가:

```gradle
android {
    defaultConfig {
        // ... 기존 설정
        resValue "string", "google_fit_client_id", "YOUR_CLIENT_ID.apps.googleusercontent.com"
    }
}
```

#### 2.5 app.json 설정

Android 권한은 이미 추가되어 있습니다:

```json
{
  "android": {
    "permissions": [
      "ACCESS_FINE_LOCATION",
      "ACCESS_COARSE_LOCATION",
      "ACCESS_BACKGROUND_LOCATION",
      "android.permission.ACTIVITY_RECOGNITION"
    ]
  }
}
```

### 3. 구현 상태

`src/services/healthService.js`에 이미 실제 Google Fit API를 사용한 구현이 포함되어 있습니다. 패키지 설치 및 OAuth 설정만 완료하면 바로 사용할 수 있습니다.

## 🔧 빠른 시작 가이드

### 전체 설치 및 설정

```bash
# 1. 패키지 설치
npm install react-native-health react-native-google-fit

# 2. Expo Prebuild (네이티브 폴더 생성)
npx expo prebuild

# 3. iOS CocoaPods 설치
cd ios && pod install && cd ..

# 4. iOS: Xcode에서 HealthKit Capability 추가
# 5. Android: Google Fit API 설정 및 OAuth 클라이언트 ID 생성
```

### 앱 재빌드 필요

네이티브 모듈을 추가했으므로 앱을 재빌드해야 합니다:

```bash
# iOS
npx expo run:ios

# Android
npx expo run:android
```

## 📝 테스트

### iOS
1. 실제 iOS 디바이스에서 테스트 (시뮬레이터는 HealthKit 지원 안 함)
2. 설정 > 건강 > 데이터 소스 및 액세스에서 RunWave 확인
3. 러닝 완료 후 건강 앱에서 데이터 확인

### Android
1. Google 계정 로그인 필요
2. Google Fit 앱 설치 확인
3. 러닝 완료 후 Google Fit에서 데이터 확인

## ⚠️ 주의사항

1. **웹 환경**: 웹에서는 건강 앱 연동을 지원하지 않습니다.
2. **권한**: 사용자가 건강 앱 권한을 거부할 수 있습니다.
3. **네이티브 모듈**: HealthKit과 Google Fit은 네이티브 모듈이 필요하므로 Expo Go에서 작동하지 않습니다.
4. **빌드**: 네이티브 모듈을 사용하려면 `expo prebuild` 실행 후 네이티브 빌드가 필요합니다.

## 📚 참고 자료

- [Apple HealthKit Documentation](https://developer.apple.com/documentation/healthkit)
- [Google Fit API Documentation](https://developers.google.com/fit)
- [react-native-health](https://github.com/agencyenterprise/react-native-health)
- [@react-native-google-fit/google-fit](https://github.com/StasDoskalenko/react-native-google-fit)

## 🚀 다음 단계

1. 필요한 패키지 설치
2. 네이티브 모듈 설정
3. `healthService.js`의 실제 API 구현
4. 테스트 및 검증

