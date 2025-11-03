# GitHub Pages 배포 가이드

이 프로젝트를 GitHub Pages (https://devbwan.github.io/RunningApp/)에 배포하는 방법입니다.

## 📋 사전 준비

1. GitHub 저장소에 이미 코드가 푸시되어 있어야 합니다.
2. `devbwan/RunningApp` 저장소가 존재해야 합니다.

## 🚀 배포 방법

### 방법 1: npm 스크립트 사용 (권장)

```bash
# 웹 빌드 + GitHub Pages 배포 (한 번에)
npm run deploy
```

이 명령은 다음을 자동으로 수행합니다:
1. `predeploy` 스크립트 실행 → 웹 빌드
2. `deploy` 스크립트 실행 → GitHub Pages에 배포

### 방법 2: 단계별 실행

```bash
# 1. 웹 빌드만 실행
npm run build:web

# 2. GitHub Pages에 배포
npm run deploy
```

## 📝 배포 프로세스

1. **환경 변수 로드**: `.env.web` 파일을 `.env`로 복사
2. **웹 빌드**: `expo export --output-dir web-build --platform web` 실행하여 정적 파일 생성
3. **GitHub Pages 배포**: `gh-pages`를 사용하여 `web-build` 디렉토리를 `gh-pages` 브랜치에 배포

## ⚙️ 설정 정보

- **배포 URL**: https://devbwan.github.io/RunningApp/
- **빌드 디렉토리**: `web-build`
- **GitHub 브랜치**: `gh-pages` (자동 생성)

## 🔧 문제 해결

### 빌드 실패 시

```bash
# 캐시 클리어 후 다시 빌드
npx expo export --clear --output-dir web-build --platform web
```

### 배포 실패 시

```bash
# gh-pages 캐시 삭제 후 재배포
rm -rf node_modules/.cache/gh-pages
npm run deploy
```

### 환경 변수 오류

`.env.web` 파일이 제대로 설정되어 있는지 확인:

```bash
# .env.web 파일 확인
cat .env.web
```

## 📌 주의사항

1. **환경 변수**: `.env.web` 파일에 실제 Firebase 설정이 있어야 합니다.
2. **빌드 시간**: 첫 빌드는 시간이 걸릴 수 있습니다.
3. **GitHub 권한**: GitHub 저장소에 푸시 권한이 있어야 합니다.
4. **배포 후**: 배포 완료 후 1-2분 후에 변경사항이 반영됩니다.

## 🔄 업데이트 배포

코드 변경 후 다시 배포하려면:

```bash
npm run deploy
```

## 📚 참고 링크

- [GitHub Pages 문서](https://pages.github.com/)
- [gh-pages 패키지](https://github.com/tschaub/gh-pages)
- [Expo Web 빌드](https://docs.expo.dev/workflow/web/)

