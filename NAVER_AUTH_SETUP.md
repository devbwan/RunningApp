# 네이버 로그인 설정 가이드

## 📋 개요

네이버 로그인은 OAuth 2.0 프로토콜을 사용하여 구현되었습니다. 웹 환경에서만 지원됩니다.

## 🔧 네이버 개발자 센터 설정

### 1단계: 네이버 개발자 센터에서 애플리케이션 등록

1. [네이버 개발자 센터](https://developers.naver.com/) 접속
2. **내 애플리케이션** 메뉴 클릭
3. **애플리케이션 등록** 버튼 클릭
4. 애플리케이션 정보 입력:
   - **애플리케이션 이름**: RunWave (또는 원하는 이름)
   - **사용 API**: 네이버 로그인
   - **로그인 오픈 API 서비스 환경**: PC 웹
   - **서비스 URL**: `https://devbwan.github.io` (GitHub Pages 도메인)
   - **Callback URL**: 
     - 로컬 개발: `http://localhost:8081/auth/naver/callback`
     - 프로덕션: `https://devbwan.github.io/auth/naver/callback`

5. **등록** 클릭

### 2단계: 클라이언트 ID 및 시크릿 확인

1. 등록한 애플리케이션 클릭
2. **Client ID** 복사
3. **Client Secret** 복사 (⚠️ **보안 주의**: 시크릿은 절대 공개 저장소에 커밋하지 마세요!)

### 3단계: 환경 변수 설정

#### `.env.web` 파일에 추가

```bash
# 네이버 로그인 설정
EXPO_PUBLIC_NAVER_CLIENT_ID_WEB=your_naver_client_id_here
EXPO_PUBLIC_NAVER_CLIENT_SECRET_WEB=your_naver_client_secret_here
```

#### `.env.local.example`에 예시 추가 (선택사항)

```bash
# 네이버 로그인 설정 (로컬 개발용)
EXPO_PUBLIC_NAVER_CLIENT_ID_WEB=your_local_naver_client_id
EXPO_PUBLIC_NAVER_CLIENT_SECRET_WEB=your_local_naver_client_secret
```

## ⚠️ 보안 주의사항

### 클라이언트 시크릿 보안

**중요**: 클라이언트 시크릿은 프론트엔드에 노출되면 안 됩니다. 현재 구현은 개발/테스트용입니다.

**프로덕션 환경에서는:**
1. 백엔드 API를 통해 토큰 교환 처리 (권장)
2. 또는 클라이언트 시크릿을 환경 변수로 관리하고 `.gitignore`에 추가

### 환경 변수 파일 보안

```bash
# .gitignore에 이미 포함되어 있어야 함
.env
.env.web
.env.android
.env.local
```

## 🔄 네이버 로그인 플로우

1. 사용자가 "네이버로 로그인" 버튼 클릭
2. 네이버 OAuth 2.0 인증 페이지로 리디렉션
3. 사용자가 네이버 계정으로 로그인 및 동의
4. `https://devbwan.github.io/auth/naver/callback?code=...&state=...` 로 리디렉션
5. 콜백 페이지에서 인증 코드로 액세스 토큰 교환
6. 액세스 토큰으로 사용자 정보 조회
7. 사용자 정보를 AsyncStorage에 저장
8. 프로필 화면으로 이동

## 📝 Callback URL 설정 예시

### 로컬 개발 환경

```
http://localhost:8081/auth/naver/callback
```

### 프로덕션 환경 (GitHub Pages)

```
https://devbwan.github.io/auth/naver/callback
```

### 중요

- Callback URL은 네이버 개발자 센터에 정확히 등록되어 있어야 합니다
- URL 끝에 슬래시(`/`) 포함 여부도 정확히 일치해야 합니다
- 여러 URL을 등록하려면 각각 별도로 추가해야 합니다

## 🧪 테스트

1. `.env.web` 파일에 네이버 클라이언트 ID와 시크릿 설정
2. 웹 서버 시작: `npm run web:local`
3. 로그인 화면에서 "네이버로 로그인" 버튼 클릭
4. 네이버 로그인 페이지로 리디렉션되는지 확인
5. 네이버 계정으로 로그인
6. 프로필 화면으로 이동하는지 확인

## 🐛 문제 해결

### "클라이언트 ID가 설정되지 않았습니다"

- `.env.web` 파일에 `EXPO_PUBLIC_NAVER_CLIENT_ID_WEB` 추가 확인
- 파일 이름이 정확한지 확인 (`.env.web`)
- 웹 서버 재시작

### "State 검증 실패"

- 브라우저 쿠키/세션 문제일 수 있음
- 브라우저 캐시 삭제 후 재시도
- Private/Incognito 모드에서 테스트

### "토큰 요청 실패"

- 클라이언트 시크릿이 올바른지 확인
- Callback URL이 네이버 개발자 센터에 정확히 등록되어 있는지 확인
- 인증 코드가 만료되지 않았는지 확인 (재시도)

### "사용자 정보 조회 실패"

- 네이버 API 서버 문제일 수 있음
- 잠시 후 재시도
- 네이버 개발자 센터에서 API 사용량 확인

## 📚 참고 자료

- [네이버 개발자 센터 - 네이버 로그인 API 가이드](https://developers.naver.com/docs/login/overview/)
- [OAuth 2.0 인증 플로우](https://developers.naver.com/docs/login/oauth/)
- [네이버 로그인 API 레퍼런스](https://developers.naver.com/docs/login/api/)

## 🔐 백엔드 통합 (권장)

프로덕션 환경에서는 백엔드 API를 통해 토큰 교환을 처리하는 것이 좋습니다:

```javascript
// 프론트엔드에서 인증 코드만 백엔드로 전송
const response = await fetch('https://your-api.com/auth/naver', {
  method: 'POST',
  body: JSON.stringify({ code, state }),
  headers: { 'Content-Type': 'application/json' },
});
const { user } = await response.json();
```

이렇게 하면 클라이언트 시크릿이 프론트엔드에 노출되지 않습니다.

