# 배포 업데이트: devbwan.github.io로 변경

## ✅ 완료된 변경 사항

저장소 이름이 `RunningApp`에서 `devbwan.github.io`로 변경되었습니다.

### 변경된 설정

1. **`package.json`**
   - `homepage`: `https://devbwan.github.io/` (루트 경로)
   - `deploy` 스크립트: 저장소 URL 업데이트
   - `build:web` 스크립트: `EXPO_PUBLIC_BASE_PATH` 제거 (루트 경로이므로 불필요)

2. **`app.json`**
   - `web.baseUrl` 제거 (루트 경로이므로 불필요)

3. **Git Remote**
   - Origin URL 업데이트: `https://github.com/devbwan/devbwan.github.io.git`

## 🌐 새로운 URL

- ✅ **루트 경로**: `https://devbwan.github.io/`
- ✅ **서브 경로**: 더 이상 필요 없음 (루트에서 직접 접근)

## 🔧 추가 설정 필요 사항

### 1. Firebase OAuth 도메인 추가

Firebase Console에서 새로운 도메인을 승인해야 합니다:

1. https://console.firebase.google.com/ 접속
2. 프로젝트 선택: `runningapp-a0bff`
3. **Authentication** > **Settings** > **Authorized domains**
4. **Add domain** 클릭
5. `devbwan.github.io` 입력
6. **Add** 클릭

**참고**: 기존 `devbwan.github.io` 도메인이 이미 추가되어 있다면 변경할 필요 없습니다.

### 2. GitHub Pages 설정 확인

1. https://github.com/devbwan/devbwan.github.io 접속
2. **Settings** > **Pages** 확인
3. **Source**: `gh-pages` 브랜치 선택
4. **Folder**: `/ (root)` 선택

### 3. 배포 확인

배포 완료 후 1-2분 후에 다음 URL에서 확인:

- **https://devbwan.github.io/**

## 📝 다음 배포 시

이제 `npm run deploy`를 실행하면:
- 빌드 시 base path 설정 없이 루트 경로용으로 빌드됩니다
- `gh-pages` 브랜치에 배포됩니다
- `https://devbwan.github.io/`에서 직접 접근 가능합니다

## ⚠️ 주의사항

1. **기존 링크**: `https://devbwan.github.io/RunningApp/` 링크는 더 이상 작동하지 않습니다.
   - 필요시 리다이렉트 설정을 추가할 수 있습니다.

2. **캐시**: 브라우저 캐시를 클리어해야 변경사항이 반영될 수 있습니다.

3. **Firebase OAuth**: 도메인 추가 전까지 OAuth 로그인이 작동하지 않을 수 있습니다.

## ✅ 체크리스트

- [x] `package.json` 업데이트
- [x] `app.json` 업데이트
- [x] Git remote 업데이트
- [x] 새 빌드 실행
- [x] 배포 완료
- [ ] Firebase OAuth 도메인 추가 확인
- [ ] GitHub Pages 설정 확인
- [ ] 루트 경로 접근 테스트

