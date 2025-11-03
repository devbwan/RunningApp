# Firebase 설정 가이드

## Firebase 프로젝트 생성 및 설정

### 1. Firebase Console에서 프로젝트 생성

1. [Firebase Console](https://console.firebase.google.com/) 접속
2. **프로젝트 추가** 클릭
3. 프로젝트 이름 입력 (예: `runwave`)
4. Google Analytics 설정 (선택 사항)

### 2. 웹 앱 등록

1. Firebase Console → 프로젝트 설정 (⚙️)
2. **내 앱** 섹션에서 웹 아이콘 (</>) 클릭
3. 앱 닉네임 입력
4. Firebase 설정 정보 복사

### 3. 환경 변수 설정

프로젝트 루트에 `.env` 파일 생성:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
```

또는 `src/config/firebase.js` 파일을 직접 수정:

```javascript
const firebaseConfig = {
  apiKey: "실제-API-키",
  authDomain: "프로젝트-ID.firebaseapp.com",
  projectId: "프로젝트-ID",
  storageBucket: "프로젝트-ID.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef",
};
```

### 4. Firestore 데이터베이스 생성

1. Firebase Console → **Firestore Database**
2. **데이터베이스 만들기** 클릭
3. **테스트 모드로 시작** 선택 (개발 중)
4. 위치 선택 (예: `asia-northeast3` - 서울)

### 5. Firestore 보안 규칙 설정

Firebase Console → Firestore Database → **규칙** 탭:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 코스 컬렉션 - 모든 사용자가 공개 코스 읽기 가능
    match /courses/{courseId} {
      allow read: if resource.data.visibility == 'public';
      allow write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null;
    }
    
    // 러닝 세션 컬렉션 - 본인만 읽기/쓰기
    match /running_sessions/{sessionId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    
    // 경로 포인트 컬렉션 - 본인만 읽기/쓰기
    match /route_points/{pointId} {
      allow read, write: if request.auth != null && request.auth.uid == get(/databases/$(database)/documents/running_sessions/$(resource.data.sessionId)).data.userId;
    }
  }
}
```

### 6. Android/iOS 앱 등록 (선택 사항)

#### Android
1. Firebase Console → 프로젝트 설정
2. **내 앱** → Android 아이콘 클릭
3. 패키지 이름 입력: `com.runwave.app` (app.json의 package와 동일)
4. `google-services.json` 다운로드
5. `app.json`에 Android 설정 추가:

```json
{
  "expo": {
    "android": {
      "googleServicesFile": "./google-services.json"
    }
  }
}
```

#### iOS
1. Firebase Console → 프로젝트 설정
2. **내 앱** → iOS 아이콘 클릭
3. 번들 ID 입력: `com.runwave.app`
4. `GoogleService-Info.plist` 다운로드
5. Expo 프로젝트에 추가

## 테스트 데이터 추가

Firebase Console → Firestore Database에서 수동으로 테스트 코스 추가:

```javascript
{
  name: "한강 러닝 코스",
  description: "여의도에서 잠실까지 약 10km 코스",
  distance: 10000,
  difficulty: "easy",
  visibility: "public",
  runnerCount: 1250,
  rating: 4.5,
  reviewCount: 89,
  coordinates: [
    { lat: 37.5295, lng: 126.9344 },
    { lat: 37.5320, lng: 126.9400 },
    // ... 더 많은 좌표
  ],
  userId: null, // 또는 실제 사용자 ID
  createdAt: new Date(),
  updatedAt: new Date()
}
```

## 확인 사항

- [ ] Firebase 프로젝트 생성 완료
- [ ] 웹 앱 등록 완료
- [ ] 환경 변수 설정 완료
- [ ] Firestore 데이터베이스 생성 완료
- [ ] 보안 규칙 설정 완료
- [ ] 테스트 데이터 추가 완료

## 주의사항

- 실제 프로덕션 환경에서는 보안 규칙을 더 엄격하게 설정해야 합니다
- API 키는 공개되어도 되지만, Firestore 보안 규칙으로 보호됩니다
- `.env` 파일은 `.gitignore`에 추가하는 것을 권장합니다

