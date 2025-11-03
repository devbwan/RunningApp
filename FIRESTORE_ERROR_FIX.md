# Firestore 오류 해결 가이드

## 🔍 발생하는 오류

### 1. `GET https://firestore.googleapis.com/... 400 (Bad Request)`

이 오류는 다음과 같은 원인으로 발생할 수 있습니다:

- Firestore 데이터베이스가 생성되지 않음
- Firestore 보안 규칙이 잘못 설정됨
- Firestore 복합 인덱스가 필요함
- 네트워크 연결 문제

## ✅ 해결 방법

### 1단계: Firestore 데이터베이스 생성

1. [Firebase Console](https://console.firebase.google.com/) 접속
2. 프로젝트 선택
3. 왼쪽 메뉴에서 **Firestore Database** 클릭
4. **데이터베이스 만들기** 클릭
5. **프로덕션 모드에서 시작** 또는 **테스트 모드에서 시작** 선택
   - **테스트 모드**: 개발 중에는 테스트 모드로 시작해도 됩니다
   - **프로덕션 모드**: 프로덕션 배포 전에는 보안 규칙을 설정해야 합니다
6. 위치 선택 (가장 가까운 리전 선택, 예: `asia-northeast3`)
7. **사용 설정** 클릭

### 2단계: Firestore 보안 규칙 설정

Firestore Database > **규칙** 탭에서 다음 규칙을 설정:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 코스 데이터: 공개 읽기, 인증된 사용자만 쓰기
    match /courses/{courseId} {
      allow read: if true;  // 모든 사용자가 읽기 가능
      allow write: if request.auth != null;  // 인증된 사용자만 쓰기 가능
    }
    
    // 러닝 세션: 사용자 자신의 데이터만 접근
    match /running_sessions/{sessionId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    
    // 경로 포인트: 세션의 사용자와 일치하는 경우만 접근
    match /route_points/{pointId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == get(/databases/$(database)/documents/running_sessions/$(resource.data.sessionId)).data.userId;
    }
  }
}
```

**주의**: 프로덕션 배포 전에 보안 규칙을 더 엄격하게 설정하세요!

### 3단계: Firestore 복합 인덱스 생성

일부 쿼리에서는 복합 인덱스가 필요합니다. 오류 메시지에 인덱스 생성 링크가 포함되어 있을 수 있습니다.

#### 필요한 인덱스

1. **코스 조회 인덱스**
   - Collection: `courses`
   - Fields:
     - `visibility` (Ascending)
     - `runnerCount` (Descending)

2. **코스 조회 인덱스 (생성일 기준)**
   - Collection: `courses`
   - Fields:
     - `visibility` (Ascending)
     - `createdAt` (Descending)

3. **사용자 코스 조회 인덱스**
   - Collection: `courses`
   - Fields:
     - `userId` (Ascending)
     - `createdAt` (Descending)

#### 인덱스 생성 방법

방법 1: 오류 메시지에서 링크 클릭
- Firestore 쿼리 오류 발생 시 콘솔에 인덱스 생성 링크가 표시됩니다
- 링크를 클릭하면 Firebase Console에서 자동으로 인덱스 생성 페이지로 이동합니다

방법 2: 수동 생성
1. Firebase Console > Firestore Database > **Indexes** 탭 클릭
2. **인덱스 만들기** 클릭
3. Collection ID 입력: `courses`
4. 필드 추가:
   - `visibility` (Ascending)
   - `runnerCount` (Descending)
5. **만들기** 클릭
6. 인덱스 생성 완료까지 몇 분 소요될 수 있습니다

### 4단계: 네트워크 및 설정 확인

1. **환경 변수 확인**
   - `.env.web` 파일에 `EXPO_PUBLIC_FIREBASE_*` 변수가 올바르게 설정되어 있는지 확인
   - Firebase Console에서 프로젝트 설정 확인

2. **Firebase 프로젝트 확인**
   - Firebase Console에서 프로젝트가 활성화되어 있는지 확인
   - 결제 계정이 연결되어 있는지 확인 (Firestore는 무료 할당량 제공)

3. **브라우저 콘솔 확인**
   - 개발자 도구에서 정확한 오류 메시지 확인
   - 네트워크 탭에서 Firestore 요청 상태 확인

## 🐛 오류 코드별 해결 방법

### `failed-precondition`
- **원인**: 복합 인덱스가 필요함
- **해결**: Firebase Console에서 인덱스 생성

### `not-found`
- **원인**: Firestore 데이터베이스가 없음
- **해결**: Firestore 데이터베이스 생성 (1단계 참조)

### `permission-denied`
- **원인**: Firestore 보안 규칙이 접근을 차단함
- **해결**: 보안 규칙 확인 및 수정 (2단계 참조)

### `unavailable`
- **원인**: Firestore 서비스 사용 불가 (네트워크 문제 또는 서비스 중단)
- **해결**: 네트워크 연결 확인 및 Firebase 상태 페이지 확인

### `invalid-argument`
- **원인**: 쿼리 인자가 잘못됨
- **해결**: 쿼리 코드 확인 (개발자에게 문의)

## 📝 참고

### Firestore가 없어도 앱은 작동합니다

- **로그인/로그아웃**: Firestore 없이도 작동 (Firebase Auth만 필요)
- **로컬 데이터**: SQLite/localStorage에 저장되므로 로컬 기능은 정상 작동
- **코스 데이터**: Firestore가 없으면 임시 데이터(mock data) 사용

### Firestore가 필요한 경우

- 코스 데이터를 클라우드에 저장하고 싶을 때
- 여러 기기 간 데이터 동기화가 필요할 때
- 사용자 간 코스 공유 기능을 사용할 때

## 🔗 관련 문서

- [Firebase Firestore 문서](https://firebase.google.com/docs/firestore)
- [Firestore 보안 규칙](https://firebase.google.com/docs/firestore/security/get-started)
- [Firestore 인덱스](https://firebase.google.com/docs/firestore/query-data/indexing)
- [FIRESTORE_SETUP.md](./FIRESTORE_SETUP.md) - 상세한 Firestore 설정 가이드

