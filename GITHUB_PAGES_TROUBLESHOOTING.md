# GitHub Pages 문제 해결 가이드

## 🔍 일반적인 문제들

### 1. `_expo` 폴더를 찾을 수 없음 (404 오류)

**증상:**
```
Failed to load resource: the server responded with a status of 404
https://devbwan.github.io/RunningApp/_expo/static/js/web/...
```

**원인:**
GitHub Pages는 기본적으로 Jekyll을 사용하여 `_`로 시작하는 파일/폴더를 숨깁니다. `_expo` 폴더도 이에 해당합니다.

**해결 방법:**
1. **`.nojekyll` 파일 추가** (자동 처리됨)
   - `scripts/fix-gh-pages-html.js` 스크립트가 자동으로 생성합니다
   - `web-build` 디렉토리의 루트에 빈 `.nojekyll` 파일이 생성되어야 합니다

2. **확인 방법:**
```bash
# 로컬 빌드 확인
Test-Path web-build\.nojekyll

# gh-pages 브랜치 확인
git ls-tree origin/gh-pages | findstr nojekyll
```

3. **수동 생성 (필요시):**
```bash
# web-build 디렉토리에 빈 파일 생성
echo. > web-build\.nojekyll
```

### 2. 파일 경로 문제 (절대 경로 vs 상대 경로)

**증상:**
- `index.html`에서 절대 경로(`/_expo/...`)를 사용하여 서브 경로에서 작동하지 않음

**해결 방법:**
- `scripts/fix-gh-pages-html.js` 스크립트가 자동으로 상대 경로로 변환합니다
- 배포 전에 `npm run fix:gh-pages`가 자동으로 실행됩니다

### 3. GitHub Pages Source 설정이 잘못됨

**증상:**
- README만 표시됨
- 앱이 로드되지 않음

**해결 방법:**
1. GitHub 저장소 > **Settings** > **Pages**
2. **Source**: `gh-pages` 브랜치 선택
3. **Folder**: `/ (root)` 선택
4. **Save** 클릭

### 4. 배포 후 변경사항이 반영되지 않음

**해결 방법:**
1. **브라우저 캐시 클리어**
   - `Ctrl + Shift + R` (Windows)
   - `Cmd + Shift + R` (Mac)
   - 또는 시크릿 모드로 접속

2. **배포 상태 확인**
   - GitHub 저장소 > **Actions** 탭에서 배포 진행 상황 확인
   - 일반적으로 1-2분 소요

3. **강제 새로고침**
   - 개발자 도구 (F12) > Network 탭 > "Disable cache" 체크
   - 페이지 새로고침

## 📝 배포 확인 체크리스트

### 로컬 빌드 확인
```bash
# 1. 빌드 실행
npm run build:web

# 2. 빌드 파일 확인
Get-ChildItem web-build -Recurse -File | Select-Object -First 10

# 3. _expo 폴더 확인
Test-Path web-build\_expo\static\js\web

# 4. .nojekyll 파일 확인
Test-Path web-build\.nojekyll

# 5. index.html 경로 확인
Get-Content web-build\index.html | Select-String "_expo"
```

### gh-pages 브랜치 확인
```bash
# 1. gh-pages 브랜치 fetch
git fetch origin gh-pages

# 2. 파일 목록 확인
git ls-tree -r origin/gh-pages --name-only | Select-Object -First 20

# 3. _expo 폴더 확인
git ls-tree -r origin/gh-pages | findstr "_expo"

# 4. .nojekyll 파일 확인
git ls-tree origin/gh-pages | findstr "nojekyll"

# 5. index.html 내용 확인
git show origin/gh-pages:index.html | Select-String "_expo"
```

## 🔧 문제 해결 명령어

### 빌드 문제
```bash
# 캐시 클리어 후 재빌드
Remove-Item -Recurse -Force web-build
npm run build:web
```

### 배포 문제
```bash
# gh-pages 캐시 삭제 (필요시)
Remove-Item -Recurse -Force node_modules\.cache\gh-pages -ErrorAction SilentlyContinue

# 재배포
npm run deploy
```

### 전체 재배포
```bash
# 1. 빌드 디렉토리 삭제
Remove-Item -Recurse -Force web-build

# 2. 빌드 및 배포
npm run deploy
```

## 📚 참고 자료

- [GitHub Pages Jekyll 문서](https://docs.github.com/en/pages/setting-up-a-github-pages-site-with-jekyll)
- [.nojekyll 파일 설명](https://github.blog/2009-12-29-bypassing-jekyll-on-github-pages/)
- [gh-pages 패키지](https://github.com/tschaub/gh-pages)

## ⚠️ 주의사항

1. **`.nojekyll` 파일은 반드시 필요합니다**
   - `_expo` 폴더가 숨겨지지 않도록 합니다
   - `fix-gh-pages-html.js` 스크립트가 자동으로 생성합니다

2. **경로는 항상 상대 경로여야 합니다**
   - GitHub Pages는 서브 경로(`/RunningApp/`)에서 실행됩니다
   - 절대 경로(`/`)는 루트를 가리키므로 작동하지 않습니다

3. **배포 후 약간의 지연 시간이 있습니다**
   - 변경사항 반영에 1-2분 소요될 수 있습니다
   - GitHub Actions에서 배포 상태를 확인할 수 있습니다

