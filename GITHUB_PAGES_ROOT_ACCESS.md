# GitHub Pages 루트 경로 접근 가이드

## 🔍 문제 상황

- ✅ `https://devbwan.github.io/RunningApp/` - 정상 작동
- ❌ `https://devbwan.github.io/` - 에러 발생

## 📋 원인

GitHub Pages는 저장소 이름을 기반으로 URL을 생성합니다:
- 저장소 이름: `RunningApp`
- 배포 URL: `https://devbwan.github.io/RunningApp/`
- 루트 경로: `https://devbwan.github.io/` (다른 저장소 또는 사용자 페이지)

## ✅ 해결 방법

### 방법 1: 저장소 이름을 `devbwan.github.io`로 변경 (권장)

루트 경로(`https://devbwan.github.io/`)에서 직접 접근하려면:

1. **새 저장소 생성**
   - GitHub에서 새 저장소 생성: `devbwan.github.io`
   - 이 이름의 저장소는 자동으로 루트 경로에 배포됩니다

2. **코드 마이그레이션**
   ```bash
   # 새 저장소로 리모트 변경
   git remote set-url origin https://github.com/devbwan/devbwan.github.io.git
   
   # 배포 스크립트 업데이트
   # package.json의 deploy 스크립트 수정 필요
   ```

3. **배포 스크립트 수정**
   - `package.json`에서 저장소 URL 변경
   - `app.json`의 `baseUrl` 제거 (루트 경로이므로)

4. **Firebase OAuth 도메인**
   - `devbwan.github.io` 도메인 추가 필요

**장점:**
- 루트 경로에서 직접 접근 가능
- 더 짧고 깔끔한 URL

**단점:**
- 저장소 이름 변경 필요
- 기존 링크 업데이트 필요

### 방법 2: 현재 구조 유지 + 리다이렉트

`https://devbwan.github.io/`에서 `https://devbwan.github.io/RunningApp/`로 리다이렉트:

1. **사용자 페이지 저장소 생성**
   - GitHub에서 `devbwan/devbwan.github.io` 저장소 생성
   - 루트에 `index.html` 파일 생성:

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Redirecting...</title>
    <meta http-equiv="refresh" content="0; url=https://devbwan.github.io/RunningApp/">
    <link rel="canonical" href="https://devbwan.github.io/RunningApp/">
</head>
<body>
    <script>
        window.location.href = 'https://devbwan.github.io/RunningApp/';
    </script>
    <p>리다이렉트 중... <a href="https://devbwan.github.io/RunningApp/">여기를 클릭하세요</a></p>
</body>
</html>
```

**장점:**
- 기존 구조 유지
- 간단한 설정

**단점:**
- 추가 저장소 필요
- 리다이렉트 지연

### 방법 3: 커스텀 도메인 사용

커스텀 도메인을 사용하면 원하는 경로에서 접근 가능합니다:

1. **도메인 구매** (예: `runwave.app`)
2. **DNS 설정**
3. **GitHub Pages 커스텀 도메인 설정**
4. **Firebase OAuth 도메인 추가**

**장점:**
- 완전한 제어
- 전문적인 URL

**단점:**
- 도메인 비용
- DNS 설정 필요

## 🔧 현재 상태에서 임시 해결

현재 상태에서 루트 경로 접근 시 발생하는 에러를 방지하려면:

### 옵션 A: 사용자 페이지에 리다이렉트 페이지 생성

```bash
# 새 저장소 생성: devbwan/devbwan.github.io
# 루트에 index.html 배치 (위의 HTML 코드 사용)
```

### 옵션 B: 현재 저장소에 루트 접근 처리 추가

`app.json`에 설정 추가:

```json
{
  "expo": {
    "web": {
      "baseUrl": "/RunningApp",
      "bundler": "metro"
    }
  }
}
```

이미 설정되어 있으므로, 루트 경로 접근 시에도 작동하도록 추가 설정이 필요할 수 있습니다.

## 📝 추천 사항

**가장 간단한 해결책:**
- 방법 2를 사용하여 사용자 페이지에 리다이렉트 설정
- 또는 사용자에게 정확한 URL(`https://devbwan.github.io/RunningApp/`) 사용 안내

**가장 깔끔한 해결책:**
- 방법 1을 사용하여 저장소 이름을 `devbwan.github.io`로 변경
- 루트 경로에서 직접 접근 가능

## ⚠️ 주의사항

1. **Firebase OAuth 도메인**
   - 어떤 방법을 선택하든 Firebase Console에서 승인된 도메인을 업데이트해야 합니다
   
2. **기존 링크**
   - 저장소 이름을 변경하면 기존 링크가 작동하지 않을 수 있습니다
   - 리다이렉트를 사용하여 해결 가능

3. **배포 설정**
   - 저장소 이름 변경 시 `package.json`의 `deploy` 스크립트도 업데이트 필요

