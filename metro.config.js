// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// expo-sqlite의 WASM 파일을 웹 빌드에서 제외
config.resolver.sourceExts.push('wasm');
config.resolver.platforms = ['web', 'native', 'ios', 'android'];

// 웹 환경에서 expo-sqlite 관련 모듈 제외
config.resolver.blockList = [
  ...(config.resolver.blockList || []),
  // 웹 빌드 시 SQLite WASM 파일 제외 (선택사항)
];

module.exports = config;

