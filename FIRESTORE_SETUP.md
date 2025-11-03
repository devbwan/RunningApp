# Firestore 데이터베이스 설정 가이드

## 🔴 현재 오류 해결하기

**오류**: `WebChannelConnection RPC 'Listen' stream transport errored`

이 오류는 Firestore 데이터베이스가 생성되지 않았거나 연결에 문제가 있을 때 발생합니다.

## 📝 Firestore 데이터베이스 생성 방법

### 1단계: Firebase Console 접속

1. [Firebase Console](https://console.firebase.google.com/) 접속
2. 프로젝트 선택: **runningapp-a0bff**

### 2단계: Firestore Database 생성

1. 왼쪽 메뉴에서 **Firestore Database** 클릭
2. **데이터베이스 만들기** 버튼 클릭

### 3단계: 데이터베이스 설정

1. **보안 규칙 모드 선택**:
   - 개발 중: **테스트 모드로 시작** 선택
   - 프로덕션: **프로덕션 모드로 시작** 선택 (보안 규칙 필요)
   
2. **위치 선택**:
   - 권장: **asia-northeast3 (서울)**
   - 또는 가장 가까운 위치 선택
   
3. **사용 설정** 버튼 클릭

### 4단계: 보안 규칙 설정 (테스트 모드 후)

데이터베이스 생성 후 보안 규칙을 설정하세요:

1. Firestore Database > **규칙** 탭 클릭
2. 다음 규칙 입력:

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
      allow read, write: if request.auth != null;
    }
  }
}
```

3. **게시** 버튼 클릭

## ✅ 확인 방법

설정 완료 후:
1. Firestore Database 화면에서 데이터베이스가 표시되는지 확인
2. 웹 앱 새로고침
3. 콘솔에서 Firestore 오류가 사라졌는지 확인

## ⚠️ 참고 사항

### Firestore가 없어도 앱은 작동합니다

- **로그인/로그아웃**: Firestore 없이도 작동 (Firebase Auth만 필요)
- **로컬 저장**: SQLite에 모든 데이터 저장 가능
- **코스 데이터**: Firestore가 없으면 임시 데이터 사용

### Firestore가 필요한 경우

- 코스 데이터를 클라우드에서 공유
- 다른 사용자와 코스 공유
- 러닝 기록 클라우드 동기화

## 🔧 문제 해결

### 여전히 오류가 발생하는 경우

1. **데이터베이스 생성 확인**: Firestore Database가 실제로 생성되었는지 확인
2. **위치 확인**: 데이터베이스 위치가 올바른지 확인
3. **브라우저 캐시 삭제**: Ctrl+Shift+Delete로 캐시 삭제 후 재시도
4. **앱 재시작**: 개발 서버 재시작

### 개발 중에는 테스트 모드로 충분

- 테스트 모드: 30일간 모든 읽기/쓰기 허용
- 프로덕션 배포 전에만 보안 규칙 설정 필요

## 💡 현재 상태

Firestore 오류는 무시해도 됩니다:
- 앱의 핵심 기능은 모두 작동
- 로컬 저장소에 모든 데이터 저장
- Firestore를 사용하는 기능만 제한됨

Firestore를 사용하려면 위의 단계대로 데이터베이스를 생성하세요.

