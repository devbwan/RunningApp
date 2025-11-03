# Google 인증 활성화 가이드

## 🔴 현재 오류 해결하기

**오류**: `CONFIGURATION_NOT_FOUND`

이 오류는 Firebase Console에서 Google Sign-in method를 활성화하지 않아서 발생합니다.

## 📝 Google 인증 활성화 방법 (단계별)

### 1단계: Firebase Console 접속

1. [Firebase Console](https://console.firebase.google.com/) 접속
2. 프로젝트 선택: **runningapp-a0bff**

### 2단계: Authentication 메뉴로 이동

1. 왼쪽 메뉴에서 **Authentication** 클릭
2. **시작하기** 버튼이 있다면 클릭 (첫 사용 시)

### 3단계: Sign-in method 설정

1. 상단 탭에서 **Sign-in method** 클릭
2. 제공업체 목록에서 **Google** 찾기
3. **Google** 행 클릭

### 4단계: Google 활성화

1. **사용 설정** 토글을 **ON**으로 변경
2. **프로젝트 공개 이름** 입력 (선택 사항, 예: "RunWave")
3. **프로젝트 지원 이메일** 선택 (필수)
   - 이메일 주소를 선택하거나 드롭다운에서 선택
4. **저장** 버튼 클릭

### 5단계: 확인

설정 완료 후:
- Google 행에 "사용" 표시 확인
- 웹 앱 새로고침 후 다시 Google 로그인 시도

## ✅ 완료 확인

Google 인증이 활성화되면:
1. Firebase Console > Authentication > Sign-in method에서
2. Google 행에 "사용" 상태 표시
3. 웹 앱에서 "Google로 로그인" 클릭 시 팝업 정상 표시

## 🔧 추가 설정 (선택)

### Firestore 데이터베이스 생성

코스 데이터를 사용하려면 Firestore를 생성해야 합니다:

1. Firebase Console에서 **Firestore Database** 클릭
2. **데이터베이스 만들기** 클릭
3. **테스트 모드로 시작** 선택
4. 위치 선택: **asia-northeast3** (서울) 권장
5. **사용 설정** 클릭

### 보안 규칙 설정 (개발 후)

프로덕션 배포 전에 Firestore 보안 규칙을 설정하세요:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /courses/{courseId} {
      allow read: if resource.data.visibility == 'public';
      allow write: if request.auth != null;
    }
    match /running_sessions/{sessionId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
  }
}
```

## ❓ 여전히 오류가 발생하는 경우

1. **브라우저 캐시 삭제**: Ctrl+Shift+Delete로 캐시 삭제 후 다시 시도
2. **앱 재시작**: 개발 서버 재시작 후 테스트
3. **Firebase Console 확인**: Google 인증이 실제로 "사용" 상태인지 확인
4. **도메인 허용 확인**: Firebase Console > Authentication > Settings > Authorized domains에서 현재 도메인 확인

## 💡 참고

- Google 인증은 즉시 활성화됩니다 (몇 초 내)
- 테스트 모드는 개발 중에만 사용하세요
- 프로덕션 배포 전에는 보안 규칙을 설정해야 합니다

