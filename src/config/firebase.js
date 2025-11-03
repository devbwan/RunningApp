import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Firebase 설정 - 환경 변수로 관리 권장
// 실제 프로젝트에서는 Firebase Console에서 설정 정보를 가져와야 합니다
const firebaseConfig = {
  // TODO: Firebase Console에서 실제 설정 값으로 교체 필요
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "your-api-key",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "your-project.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "your-project-id",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "your-project.appspot.com",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:123456789:web:abcdef",
};

// Firebase 초기화
let app;
let db;
let auth;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
} catch (error) {
  console.warn('Firebase 초기화 오류:', error);
  console.warn('Firebase 설정이 완료되지 않았습니다. 환경 변수를 설정하거나 설정 파일을 업데이트하세요.');
}

export { db, auth, app };

