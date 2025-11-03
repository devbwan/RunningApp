# Firebase OAuth 도메인 설정 가이드

GitHub Pages 배포 후 OAuth 로그인이 작동하지 않는 경우, Firebase Console에서 승인된 도메인을 추가해야 합니다.

## 🔴 오류 메시지

```
Info: The current domain is not authorized for OAuth operations. 
This will prevent signInWithPopup, signInWithRedirect, linkWithPopup and linkWithRedirect from working. 
Add your domain (devbwan.github.io) to the OAuth redirect domains list in the Firebase console -> Authentication -> Settings -> Authorized domains tab.
```

## ✅ 해결 방법

### 1. Firebase Console 접속

1. https://console.firebase.google.com/ 접속
2. 프로젝트 선택: `runningapp-a0bff` (또는 해당 프로젝트)

### 2. Authentication 설정 열기

1. 왼쪽 사이드바에서 **Authentication** 클릭
2. **Settings** (⚙️) 탭 클릭
3. **Authorized domains** 섹션으로 스크롤

### 3. 승인된 도메인 추가

**추가해야 할 도메인:**

1. **`devbwan.github.io`**
   - GitHub Pages 프로덕션 도메인
   - 전체 URL: `https://devbwan.github.io`

2. **`localhost`** (이미 있을 수 있음)
   - 로컬 개발용

3. **`127.0.0.1`** (이미 있을 수 있음)
   - 로컬 개발용

### 4. 도메인 추가 단계

1. **Add domain** 버튼 클릭
2. `devbwan.github.io` 입력
3. **Add** 버튼 클릭
4. 저장 완료 확인

### 5. 스크린샷 참고

```
Firebase Console > Authentication > Settings > Authorized domains

기본 도메인 (자동 추가됨):
- localhost
- runningapp-a0bff.firebaseapp.com
- runningapp-a0bff.web.app

추가해야 할 도메인:
+ devbwan.github.io  ← 이것을 추가!
```

## 🔍 현재 승인된 도메인 확인

### Firebase Console에서 확인
1. Firebase Console > Authentication > Settings
2. **Authorized domains** 섹션 확인

### 코드에서 확인 (선택사항)
```javascript
// src/config/firebase.js
console.log('Auth Domain:', firebaseConfig.authDomain);
```

## ⚠️ 중요 사항

### 1. 도메인 형식
- **올바른 형식**: `devbwan.github.io` (프로토콜 제외)
- **잘못된 형식**: `https://devbwan.github.io` (프로토콜 포함하면 안 됨)

### 2. 서브 도메인
- GitHub Pages는 기본적으로 서브 경로(`/RunningApp/`)를 사용하지만
- 도메인은 루트 도메인(`devbwan.github.io`)만 추가하면 됩니다
- 서브 경로는 자동으로 처리됩니다

### 3. 커스텀 도메인 사용 시
- 나중에 커스텀 도메인을 사용하면 해당 도메인도 추가해야 합니다
- 예: `runwave.app`, `www.runwave.app` 등

## 🔄 설정 후 확인

### 1. 브라우저 캐시 클리어
- `Ctrl + Shift + R` (강제 새로고침)
- 또는 시크릿 모드로 접속

### 2. OAuth 로그인 테스트
- https://devbwan.github.io/RunningApp/ 접속
- Google 로그인 버튼 클릭
- 로그인 창이 정상적으로 표시되는지 확인

### 3. 개발자 도구 확인
- 브라우저 개발자 도구 (F12) > Console
- OAuth 관련 오류가 사라졌는지 확인

## 🐛 추가 문제 해결

### 여전히 오류가 발생하는 경우

1. **Firebase 설정 확인**
   - Authentication > Settings > Authorized domains에서 도메인이 정확히 추가되었는지 확인
   - 오타가 없는지 확인 (`devbwan.github.io`)

2. **캐시 문제**
   - 브라우저 캐시 완전 클리어
   - Firebase Console에서 설정 변경 후 몇 분 대기

3. **환경 변수 확인**
   - `.env.web` 파일의 Firebase 설정이 올바른지 확인
   - `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` 확인

4. **GitHub Pages 배포 확인**
   - 최신 빌드가 배포되었는지 확인
   - GitHub 저장소 > Actions에서 배포 상태 확인

### OAuth 제공자별 설정

#### Google OAuth
- Firebase Console > Authentication > Sign-in method
- **Google** 제공자 확인
- **Authorized domains**에 `devbwan.github.io` 포함 확인

#### Naver OAuth (향후 추가 예정)
- Naver Developer Console에서도 승인된 도메인 설정 필요
- `devbwan.github.io` 도메인 추가

## 📚 참고 자료

- [Firebase Authentication 도메인 승인](https://firebase.google.com/docs/auth/web/custom-domain)
- [GitHub Pages 커스텀 도메인](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site)

## ✅ 체크리스트

- [ ] Firebase Console 접속
- [ ] Authentication > Settings > Authorized domains 확인
- [ ] `devbwan.github.io` 도메인 추가
- [ ] 저장 완료 확인
- [ ] 브라우저에서 로그인 테스트
- [ ] 개발자 도구에서 오류 확인

