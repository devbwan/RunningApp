import { Platform } from 'react-native';

/**
 * 환경 변수 관리
 * 웹과 Android에서 각각 다른 설정을 사용할 수 있습니다.
 */

// 환경 변수 가져오기 (EXPO_PUBLIC_ 접두사 사용)
export const getEnv = () => {
  const env = process.env.EXPO_PUBLIC_ENV || 'development';
  const platform = Platform.OS;

  return {
    // 환경
    env,
    isDevelopment: env === 'development',
    isProduction: env === 'production',
    isStaging: env === 'staging',
    
    // 플랫폼
    platform,
    isWeb: platform === 'web',
    isAndroid: platform === 'android',
    isIOS: platform === 'ios',
    
    // Firebase 설정
    firebase: {
      apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
      measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
    },
    
    // OAuth 설정
    oauth: {
      google: {
        web: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB,
        android: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID,
      },
      naver: {
        web: process.env.EXPO_PUBLIC_NAVER_CLIENT_ID_WEB,
        android: process.env.EXPO_PUBLIC_NAVER_CLIENT_ID_ANDROID,
      },
    },
    
    // 플랫폼별 Google OAuth Client ID
    getGoogleClientId: () => {
      if (platform === 'web') {
        return process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB;
      } else if (platform === 'android') {
        return process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID;
      }
      return null;
    },
    
    // 플랫폼별 Naver OAuth Client ID
    getNaverClientId: () => {
      if (platform === 'web') {
        return process.env.EXPO_PUBLIC_NAVER_CLIENT_ID_WEB;
      } else if (platform === 'android') {
        return process.env.EXPO_PUBLIC_NAVER_CLIENT_ID_ANDROID;
      }
      return null;
    },
  };
};

export default getEnv();

