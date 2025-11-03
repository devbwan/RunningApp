# Content Security Policy (CSP) 오류 해결 가이드

## 🔍 오류 메시지

```
Loading the script 'https://lc.getunicorn.org/?type=base-script&request-id=23847' 
violates the following Content Security Policy directive: "default-src ". 
Note that 'script-src-elem' was not explicitly set, so 'default-src' is used as a fallback. 
The action has been blocked.
```

## 📋 원인 분석

### 1. 브라우저 확장 프로그램 문제 (가능성 높음)

`lc.getunicorn.org`는 일반적으로:
- 브라우저 확장 프로그램에서 사용하는 분석 도구
- 광고 차단기나 개인화 도구
- 앱 코드와는 무관한 외부 스크립트

**확인 방법:**
1. 시크릿 모드(인코그니토 모드)에서 접속
2. 확장 프로그램을 모두 비활성화한 후 접속
3. 오류가 사라지면 확장 프로그램 문제

### 2. GitHub Pages의 기본 CSP 설정

GitHub Pages는 기본적으로 CSP 헤더를 설정하지 않습니다.
하지만 브라우저나 서비스 워커에서 CSP가 설정될 수 있습니다.

## ✅ 해결 방법

### 방법 1: 브라우저 확장 프로그램 확인 (권장)

1. **Chrome/Edge**
   - `chrome://extensions/` 접속
   - 각 확장 프로그램을 하나씩 비활성화하며 테스트
   - 문제가 되는 확장 프로그램 찾기

2. **Firefox**
   - `about:addons` 접속
   - 확장 프로그램 비활성화

3. **시크릿 모드 테스트**
   - 시크릿 모드에서는 확장 프로그램이 기본적으로 비활성화됨
   - 오류가 사라지면 확장 프로그램 문제

### 방법 2: CSP 헤더 명시적 설정 (필요시)

앱에서 CSP를 명시적으로 설정하려면 `index.html`에 meta 태그 추가:

```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.googleapis.com https://*.firebase.com https://*.firebaseio.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;">
```

**주의**: 이것은 개발 중에만 사용하고, 프로덕션에서는 적절한 CSP 정책을 설정해야 합니다.

### 방법 3: 오류 무시 (권장)

이 오류는 앱 기능에 영향을 주지 않습니다:
- 앱의 JavaScript 코드와 무관
- 브라우저 확장 프로그램에서 발생
- 앱 기능은 정상 작동

## 🔍 404 오류 확인

404 오류가 발생하는 리소스를 확인하려면:

1. **브라우저 개발자 도구 열기** (F12)
2. **Network 탭** 확인
3. **빨간색(실패)** 상태의 요청 확인
4. **어떤 파일이 404인지** 확인

일반적인 404 원인:
- 아이콘 폰트 파일 (이미 수정됨)
- 이미지 파일
- JavaScript 번들 파일
- CSS 파일

## 📝 확인 체크리스트

- [ ] 시크릿 모드에서 테스트 (확장 프로그램 비활성화)
- [ ] 개발자 도구 > Network 탭에서 404 파일 확인
- [ ] 콘솔에서 어떤 리소스가 404인지 확인
- [ ] 브라우저 캐시 클리어 후 재테스트

## ⚠️ 중요 사항

1. **CSP 오류는 무시해도 됩니다**
   - `lc.getunicorn.org`는 외부 도구
   - 앱 코드와 무관

2. **404 오류는 확인 필요**
   - 어떤 파일이 404인지 확인
   - 개발자 도구에서 정확한 URL 확인

3. **앱 기능 확인**
   - 아이콘이 정상 표시되는지
   - 기능이 정상 작동하는지
   - UI가 정상 렌더링되는지

## 🔧 추가 문제 해결

### 특정 파일이 계속 404인 경우

1. **파일이 실제로 존재하는지 확인:**
```bash
# 로컬 빌드 확인
Get-ChildItem web-build -Recurse -Filter "파일명"

# gh-pages 브랜치 확인
git ls-tree -r origin/gh-pages --name-only | findstr "파일명"
```

2. **경로 문제 확인:**
   - 개발자 도구 > Network 탭에서 요청 URL 확인
   - 절대 경로(`/assets/...`)로 요청되는지 확인
   - 상대 경로(`./assets/...`)로 수정 필요할 수 있음

3. **빌드 스크립트 실행:**
```bash
npm run build:web
npm run fix:gh-pages
npm run deploy
```

## 💡 참고

- CSP 오류는 대부분 브라우저 확장 프로그램에서 발생
- 앱 기능에는 영향을 주지 않음
- 404 오류는 실제 리소스 누락이므로 확인 필요

