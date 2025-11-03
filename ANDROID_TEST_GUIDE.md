# Android Studio에서 RunWave 테스트 가이드

## 필수 사전 준비

### 1. Android Studio 설치
- [Android Studio 다운로드](https://developer.android.com/studio)
- 설치 시 Android SDK 및 에뮬레이터 포함 확인

### 2. Android SDK 구성
- Android Studio 실행
- **Tools** > **SDK Manager** 열기
- 설치 필수 항목:
  - ✅ Android SDK Platform (최신 버전, 예: Android 14/15)
  - ✅ Android SDK Platform-Tools
  - ✅ Android SDK Build-Tools
  - ✅ Android Emulator
  - ✅ Intel x86 Emulator Accelerator (HAXM installer)

### 3. 환경 변수 설정 (Windows)

**PowerShell에서 실행:**
```powershell
# ANDROID_HOME 환경 변수 설정
[System.Environment]::SetEnvironmentVariable('ANDROID_HOME', 'C:\Users\<사용자명>\AppData\Local\Android\Sdk', 'User')
[System.Environment]::SetEnvironmentVariable('Path', $env:Path + ';C:\Users\<사용자명>\AppData\Local\Android\Sdk\platform-tools', 'User')
```

또는 수동으로:
1. **제어판** > **시스템** > **고급 시스템 설정** > **환경 변수**
2. **시스템 변수**에서 **새로 만들기**:
   - 변수 이름: `ANDROID_HOME`
   - 변수 값: `C:\Users\<사용자명>\AppData\Local\Android\Sdk`
3. **Path** 변수에 추가:
   - `%ANDROID_HOME%\platform-tools`
   - `%ANDROID_HOME%\tools`

**재시작 필요**: 환경 변수 설정 후 PowerShell/터미널 재시작

### 4. Java JDK 설치
- Java JDK 17 이상 필요
- [Oracle JDK](https://www.oracle.com/java/technologies/downloads/) 또는 [OpenJDK](https://adoptium.net/)

## 단계별 테스트 방법

### Step 1: Android 에뮬레이터 생성

1. **Android Studio 실행**
2. **Tools** > **Device Manager** 열기
3. **Create Device** 클릭
4. 디바이스 선택:
   - 권장: **Pixel 5** 또는 **Pixel 6**
5. 시스템 이미지 선택:
   - 권장: **Android 13 (API 33)** 또는 **Android 14 (API 34)**
   - **x86_64** 아키텍처 선택 (가상화 지원 시)
6. **Finish** 클릭하여 에뮬레이터 생성

### Step 2: 에뮬레이터 실행

1. **Device Manager**에서 생성한 에뮬레이터 옆 **▶️ Play** 버튼 클릭
2. 에뮬레이터가 부팅될 때까지 대기 (처음에는 몇 분 소요)

### Step 3: 프로젝트 디렉토리에서 Expo 실행

**PowerShell에서:**
```powershell
# 프로젝트 디렉토리로 이동
cd "C:\랩코어\bwan\AI_RunnigApp_Cursor\ai-running-app"

# Android에서 실행
npm run android
```

또는 Expo CLI 직접 사용:
```powershell
npx expo start --android
```

### Step 4: 자동 연결 확인

- Expo 개발 서버가 시작되면 자동으로 에뮬레이터에 앱이 설치되고 실행됩니다
- 연결이 안 되면 에뮬레이터에서 수동으로 Expo Go 앱 실행:
  1. 에뮬레이터의 Google Play Store에서 "Expo Go" 검색 후 설치
  2. Expo Go 앱 실행
  3. 터미널에 표시된 QR 코드 스캔하거나 링크 입력

## 문제 해결

### 에뮬레이터가 감지되지 않는 경우

```powershell
# ADB 연결 확인
adb devices

# 에뮬레이터가 목록에 없으면 ADB 재시작
adb kill-server
adb start-server
adb devices
```

### "Unable to resolve module" 오류

```powershell
# node_modules 재설치
Remove-Item -Recurse -Force node_modules
npm install

# 캐시 삭제 후 재시작
npx expo start --android --clear
```

### Android SDK 경로 오류

```powershell
# ANDROID_HOME 확인
echo $env:ANDROID_HOME

# 올바른 경로 설정 (일반적인 위치)
$env:ANDROID_HOME = "C:\Users\$env:USERNAME\AppData\Local\Android\Sdk"
```

### 빌드 오류

```powershell
# Expo prebuild 실행 (필요 시)
npx expo prebuild --platform android

# Gradle 클린 (bare workflow인 경우)
cd android
.\gradlew clean
cd ..
```

## 개발 워크플로우

### 빠른 테스트
```powershell
# 개발 서버 시작 (에뮬레이터 자동 연결)
npm run android

# 에뮬레이터가 이미 실행 중이면 자동으로 앱 설치 및 실행
```

### 수동 연결
1. 에뮬레이터 실행 (Android Studio)
2. 터미널에서: `npm run android`
3. Expo Go 앱에서 QR 코드 스캔

### 디버깅
- **Chrome DevTools**: Expo 개발 서버에서 `j` 키 누르기
- **React Native Debugger**: 별도 설치 가능
- **Flipper**: React Native 개발 도구

## 주의사항

### GPS 테스트
- 에뮬레이터에서는 실제 GPS 신호가 없습니다
- **Extended Controls** (에뮬레이터 설정)에서 위치 시뮬레이션 사용:
  - **More** (⋮) > **Location**
  - 좌표 입력 또는 지도에서 선택

### 성능
- 에뮬레이터는 실제 기기보다 느릴 수 있습니다
- 실제 기기 테스트도 권장합니다

### 배터리
- 에뮬레이터는 배터리 소모 테스트에 부적합합니다
- 실제 기기에서 배터리 테스트 필요

## 실제 기기 연결 방법

### USB 디버깅 활성화
1. 기기에서 **설정** > **휴대전화 정보** > **빌드 번호** 7번 탭 (개발자 모드 활성화)
2. **설정** > **개발자 옵션** > **USB 디버깅** 활성화
3. USB로 PC에 연결
4. 기기에서 "USB 디버깅 허용" 확인

```powershell
# 연결 확인
adb devices

# 앱 실행
npm run android
```

## 추가 팁

### Expo Go vs Development Build
- **Expo Go**: 빠른 테스트, 일부 네이티브 모듈 제한
- **Development Build**: 모든 기능 사용 가능, 빌드 필요

### 개발 빌드 생성
```powershell
# Android Development Build
npx expo run:android

# 또는 EAS Build 사용 (클라우드 빌드)
npx eas build --platform android --profile development
```

## 요약 체크리스트

- [ ] Android Studio 설치
- [ ] Android SDK 설치 및 환경 변수 설정
- [ ] Java JDK 설치
- [ ] Android 에뮬레이터 생성
- [ ] 에뮬레이터 실행
- [ ] `npm run android` 실행
- [ ] 앱이 에뮬레이터에 설치 및 실행 확인

## 빠른 시작 명령어

```powershell
# 1. 프로젝트 디렉토리로 이동
cd "C:\랩코어\bwan\AI_RunnigApp_Cursor\ai-running-app"

# 2. Android에서 실행
npm run android

# 에뮬레이터가 실행 중이면 자동으로 연결됨
```

