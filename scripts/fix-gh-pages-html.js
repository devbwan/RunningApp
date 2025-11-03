// GitHub Pages 배포를 위한 index.html 및 JavaScript 번들 파일 수정 스크립트
// 절대 경로를 상대 경로로 변경

const fs = require('fs');
const path = require('path');

const webBuildDir = path.join(__dirname, '..', 'web-build');
const indexHtmlPath = path.join(webBuildDir, 'index.html');
const expoJsDir = path.join(webBuildDir, '_expo', 'static', 'js', 'web');

// 1. index.html 수정
if (!fs.existsSync(indexHtmlPath)) {
  console.error('index.html을 찾을 수 없습니다:', indexHtmlPath);
  process.exit(1);
}

let htmlContent = fs.readFileSync(indexHtmlPath, 'utf8');

// 절대 경로를 상대 경로로 변경
// /favicon.ico -> ./favicon.ico
htmlContent = htmlContent.replace(/href="\/([^"]+)"/g, 'href="./$1"');
// /_expo/... -> ./_expo/... (src 속성)
htmlContent = htmlContent.replace(/src="\/([^"]+)"/g, 'src="./$1"');

// 모든 절대 경로를 상대 경로로 변경 (예외: // 시작하는 외부 URL)
// href="/..." 또는 src="/..." -> href="./..." 또는 src="./..."
htmlContent = htmlContent.replace(/(href|src)="\/([^\/"])/g, '$1="./$2');

fs.writeFileSync(indexHtmlPath, htmlContent, 'utf8');
console.log('✅ index.html 경로 수정 완료');

// 2. JavaScript 번들 파일 내부의 절대 경로 수정
if (fs.existsSync(expoJsDir)) {
  const jsFiles = fs.readdirSync(expoJsDir).filter(file => file.endsWith('.js'));
  let fixedCount = 0;
  
  jsFiles.forEach(file => {
    const filePath = path.join(expoJsDir, file);
    let jsContent = fs.readFileSync(filePath, 'utf8');
    const originalContent = jsContent;
    
    // URI 경로 수정: "/assets/..." -> "./assets/..."
    // 하지만 이미 상대 경로인 경우는 건드리지 않음
    jsContent = jsContent.replace(/uri:"\/assets\//g, 'uri:"./assets/');
    jsContent = jsContent.replace(/uri:'\/assets\//g, "uri:'./assets/");
    
    // URL 함수 내부 경로 수정: url("/assets/...") -> url("./assets/...")
    jsContent = jsContent.replace(/url\(["']\/assets\//g, (match) => {
      return match.replace(/url\(["']\//, 'url("').replace(/url\(['']\//, "url('");
    });
    
    // @font-face의 src: url() 수정
    jsContent = jsContent.replace(/src:\s*url\(["']\/assets\//g, 'src:url("./assets/');
    
    if (jsContent !== originalContent) {
      fs.writeFileSync(filePath, jsContent, 'utf8');
      fixedCount++;
    }
  });
  
  if (fixedCount > 0) {
    console.log(`✅ JavaScript 번들 파일 ${fixedCount}개 수정 완료 (절대 경로 -> 상대 경로)`);
  }
}

// 3. .nojekyll 파일 생성 (GitHub Pages에서 _로 시작하는 파일/폴더를 숨기지 않도록)
const nojekyllPath = path.join(webBuildDir, '.nojekyll');
fs.writeFileSync(nojekyllPath, '', 'utf8');
console.log('✅ .nojekyll 파일 생성 완료 (GitHub Pages Jekyll 처리 비활성화)');

