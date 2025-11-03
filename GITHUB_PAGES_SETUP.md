# GitHub Pages 배포 설정 가이드

## 📋 사전 준비

### 1. Git 저장소 확인 및 설정

```bash
# 현재 디렉토리 확인
pwd

# Git 저장소 초기화 (아직 안 되어 있다면)
git init

# GitHub 저장소를 remote origin으로 추가
git remote add origin https://github.com/devbwan/RunningApp.git

# 또는 이미 remote가 있다면 확인
git remote -v

# remote가 다르다면 변경
git remote set-url origin https://github.com/devbwan/RunningApp.git
```

### 2. GitHub 저장소 생성

GitHub에서 `devbwan/RunningApp` 저장소가 존재해야 합니다.

1. GitHub에 로그인
2. 새 저장소 생성: `devbwan/RunningApp`
3. 저장소 URL 확인: `https://github.com/devbwan/RunningApp.git`

### 3. 첫 커밋 및 푸시 (처음 설정하는 경우)

```bash
# 파일 추가
git add .

# 첫 커밋
git commit -m "Initial commit"

# main 브랜치로 푸시
git branch -M main
git push -u origin main
```

## 🚀 배포 방법

### 방법 1: package.json 스크립트 사용 (권장)

```bash
npm run deploy
```

`package.json`의 `deploy` 스크립트에 이미 `-r` 옵션으로 저장소 URL이 설정되어 있습니다:

```json
"deploy": "gh-pages -d web-build -r https://github.com/devbwan/RunningApp.git"
```

### 방법 2: 수동으로 배포

```bash
# 웹 빌드
npm run build:web

# GitHub Pages에 배포
npx gh-pages -d web-build -r https://github.com/devbwan/RunningApp.git
```

## 🔧 문제 해결

### 오류: "Failed to get remote.origin.url"

이 오류가 발생하면 다음을 확인하세요:

1. **Git 저장소가 초기화되어 있는지 확인:**
```bash
git status
```

2. **remote origin이 설정되어 있는지 확인:**
```bash
git remote -v
```

3. **remote origin이 없으면 추가:**
```bash
git remote add origin https://github.com/devbwan/RunningApp.git
```

4. **package.json의 deploy 스크립트에 `-r` 옵션이 있는지 확인:**
```json
"deploy": "gh-pages -d web-build -r https://github.com/devbwan/RunningApp.git"
```

### 오류: "Permission denied"

GitHub 인증이 필요한 경우:

1. **Personal Access Token 사용:**
   - GitHub Settings > Developer settings > Personal access tokens
   - `repo` 권한이 있는 토큰 생성
   - Git에 저장:
   ```bash
   git remote set-url origin https://YOUR_TOKEN@github.com/devbwan/RunningApp.git
   ```

2. **SSH 키 사용:**
   ```bash
   git remote set-url origin git@github.com:devbwan/RunningApp.git
   ```

## 📝 배포 프로세스

1. **환경 변수 로드**: `.env.web` → `.env`
2. **웹 빌드**: `expo export --output-dir web-build --platform web`
3. **GitHub Pages 배포**: `gh-pages`가 `web-build` 디렉토리를 `gh-pages` 브랜치에 배포

## 🌐 배포 후 확인

배포 완료 후 1-2분 후에 다음 URL에서 확인:

**https://devbwan.github.io/RunningApp/**

## ⚙️ GitHub Pages 설정

GitHub 저장소에서 다음 설정을 확인하세요:

1. **Settings** > **Pages**
2. **Source**: `gh-pages` 브랜치 선택
3. **Custom domain**: 필요시 설정

## 📚 참고 링크

- [GitHub Pages 문서](https://docs.github.com/en/pages)
- [gh-pages 패키지](https://github.com/tschaub/gh-pages)
- [Git 설정 가이드](https://git-scm.com/book/ko/v2/%EC%8B%9C%EC%9E%91%ED%95%98%EA%B8%B0-Git-%EC%B5%9C%EC%B4%88-%EC%84%A4%EC%A0%95)

