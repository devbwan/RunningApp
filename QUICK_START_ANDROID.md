# Android Studio에서 RunWave 빠른 시작 가이드

## 🚀 빠른 시작 (3단계)

### Step 1: Android Studio 설치 및 설정

1. **Android Studio 다운로드 및 설치**
   - https://developer.android.com/studio
   - 설치 시 Android SDK, Android SDK Platform, Android Emulator 체크

2. **Android Studio 실행 후 SDK 설정**
   - **More Actions** > **SDK Manager** 클릭
   - **SDK Platforms** 탭: **Android 14 (API 34)** 또는 **Android 13 (API 33)** 체크
   - **SDK Tools** 탭: 다음 항목 체크
     - ✅ Android SDK Build-Tools
     - ✅ Android SDK Platform-Tools
     - ✅ Android Emulator
     - ✅ Intel x86 Emulator Accelerator (HAXM installer) - AMD인 경우 제외
   - **Apply** 클릭하여 설치

### Step 2: 에뮬레이터 생성

1. **Device Manager 열기**
   - Android Studio에서 **Tools** > **Device Manager**

2. **디바이스 생성**
   - **Create Device** 클릭
   - **Phone** 카테고리에서 **Pixel 5** 또는 **Pixel 6** 선택
   - **Next** 클릭

3. **시스템 이미지 선택**
   - **Release Name** 선택 (예: Android 13, Android 14)
   - **x86_64** 아키텍처 선택 (가상화 지원 시)
   - **Download** 클릭 (처음 설치 시)
   - 설치 완료 후 **Next** > **Finish**

4. **에뮬레이터 실행**
   - Device Manager에서 생성한 에뮬레이터 옆 **▶️ Play** 버튼 클릭
   - 첫 실행은 2-5분 소요 (부팅 완료까지 대기)

### Step 3: Expo 앱 실행

**PowerShell에서:**
```powershell
# 1. 프로젝트 디렉토리로 이동
cd "C:\랩코어\bwan\AI_RunnigApp_Cursor\ai-running-app"

# 2. Android에서 실행
npm run android
```

**또는:**
```powershell
npx expo start --android
```

## ✅ 자동 연결 확인

에뮬레이터가 실행 중이면 Expo가 자동으로:
1. Expo Go 앱 설치 (없는 경우)
2. 앱 실행
3. 개발 서버에 연결

터미널에 다음이 표시되면 성공:
```
› Metro waiting on exp://192.168.x.x:8081
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)
```

## 📱 Expo Go 앱 설치 (수동 방법)

자동 설치가 안 되면:

1. **에뮬레이터에서 Google Play Store 열기**
2. **"Expo Go" 검색 후 설치**
3. **Expo Go 앱 실행**
4. **터미널에 표시된 QR 코드 스캔** 또는 **링크 입력**

## 🔧 환경 변수 설정 (필요한 경우)

Android SDK가 감지되지 않으면:

### PowerShell에서 실행:
```powershell
# 사용자명 확인
$username = $env:USERNAME

# ANDROID_HOME 설정 (일반적인 경로)
[System.Environment]::SetEnvironmentVariable('ANDROID_HOME', "C:\Users\$username\AppData\Local\Android\Sdk", 'User')

# Path에 platform-tools 추가
$currentPath = [System.Environment]::GetEnvironmentVariable('Path', 'User')
$newPath = $currentPath + ";C:\Users\$username\AppData\Local\Android\Sdk\platform-tools"
[System.Environment]::SetEnvironmentVariable('Path', $newPath, 'User')
```

**⚠️ 중요**: 환경 변수 설정 후 PowerShell 재시작 필요

### 또는 수동 설정:
1. **제어판** > **시스템** > **고급 시스템 설정** > **환경 변수**
2. **사용자 변수** 섹션에서:
   - **새로 만들기**:
     - 변수 이름: `ANDROID_HOME`
     - 변수 값: `C:\Users\<사용자명>\AppData\Local\Android\Sdk`
   - **Path** 선택 > **편집** > **새로 만들기**:
     - `%ANDROID_HOME%\platform-tools`
     - `%ANDROID_HOME%\tools`

## 🎯 GPS 테스트 (에뮬레이터)

에뮬레이터에서는 실제 GPS가 없으므로 위치를 시뮬레이션해야 합니다:

1. **에뮬레이터에서 더보기 (⋮) 버튼 클릭**
2. **Location** 메뉴 선택
3. **단일 위치 설정**:
   - 위도/경도 입력 또는 지도에서 선택
   - 예: 서울 - 위도: 37.5665, 경도: 126.978
4. **Send** 클릭

또는 **GPX/KML 파일** 사용 가능

## 🐛 문제 해결

### 문제: "adb: command not found"
**해결**: Android SDK platform-tools가 Path에 없음
- 환경 변수 설정 확인
- PowerShell 재시작

### 문제: "No devices found"
**해결**:
```powershell
# ADB 서버 재시작
adb kill-server
adb start-server
adb devices
```

### 문제: 에뮬레이터가 느림
**해결**:
- **Virtualization** 확인 (BIOS에서 Intel VT-x 또는 AMD-V 활성화)
- 에뮬레이터 설정에서 **Graphics**: **Hardware - GLES 2.0** 선택
- 시스템 이미지: **x86_64** 선택 (ARM보다 빠름)

### 문제: "Unable to resolve module"
**해결**:
```powershell
# 캐시 삭제 후 재시작
npx expo start --android --clear
```

## 📋 체크리스트

- [ ] Android Studio 설치 완료
- [ ] Android SDK 설치 완료
- [ ] 에뮬레이터 생성 및 실행 완료
- [ ] `npm run android` 실행 성공
- [ ] 앱이 에뮬레이터에 설치 및 실행 확인
- [ ] GPS 위치 시뮬레이션 설정 (필요 시)

## 🎉 성공 확인

에뮬레이터에서 RunWave 앱이 실행되고 다음이 보이면 성공:
- ✅ 5개 탭 (홈/러닝/기록/코스/프로필)
- ✅ 홈 화면에 "러닝 시작" 버튼
- ✅ 각 탭 전환 가능

## 📞 다음 단계

1. **러닝 기능 테스트**: 러닝 탭에서 GPS 권한 허용 후 테스트
2. **GPS 위치 변경**: 에뮬레이터 Extended Controls에서 위치 변경
3. **실제 기기 테스트**: USB 디버깅으로 실제 안드로이드 기기 연결

## 💡 팁

- **개발 중**: Expo 개발 서버를 실행한 상태로 두고 코드 변경 시 자동 리로드
- **Hot Reload**: 코드 저장 시 자동으로 앱이 새로고침됨
- **디버깅**: Expo 개발 서버에서 `j` 키를 누르면 Chrome DevTools 열림

