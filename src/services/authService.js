import {
  signInWithCredential,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  signInWithPopup,
  OAuthProvider,
} from 'firebase/auth';
import { auth, isValidFirebaseConfig } from '../config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

const USER_STORAGE_KEY = '@runwave_user';
const AUTH_PROVIDER_KEY = '@runwave_auth_provider';

// Google 로그인 (웹 환경)
export const signInWithGoogle = async () => {
  // Firebase 설정 확인
  if (!isValidFirebaseConfig()) {
    throw new Error('Firebase 설정이 완료되지 않았습니다.\n\n1. Firebase Console에서 프로젝트 생성\n2. src/config/firebase.js에 실제 설정 정보 입력\n3. Authentication > Sign-in method에서 Google 활성화');
  }

  if (!auth) {
    throw new Error('Firebase Auth가 초기화되지 않았습니다. Firebase 설정을 확인하세요.');
  }

  try {
    if (Platform.OS === 'web') {
      // 웹에서는 Firebase Auth의 직접적인 Google 로그인 사용
      const provider = new GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');
      
      const result = await signInWithPopup(auth, provider);
      const user = {
        id: result.user.uid,
        email: result.user.email,
        name: result.user.displayName,
        photoURL: result.user.photoURL,
      };

      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      await AsyncStorage.setItem(AUTH_PROVIDER_KEY, 'google');
      
      return user;
    } else {
      // 모바일 환경에서는 expo-auth-session 사용 필요
      // 현재는 기본 구조만 제공
      throw new Error('모바일에서는 Firebase 설정 후 Google 로그인이 활성화됩니다.');
    }
  } catch (error) {
    console.error('Google 로그인 오류:', error);
    
    // Firebase API 키 오류
    if (error.code === 'auth/api-key-not-valid' || error.message?.includes('api-key')) {
      throw new Error('Firebase API 키가 유효하지 않습니다.\n\nsrc/config/firebase.js 파일에 Firebase Console에서 복사한 실제 API 키를 입력하세요.');
    }
    
    // CONFIGURATION_NOT_FOUND 오류 처리
    if (error.code === 400 || error.message?.includes('CONFIGURATION_NOT_FOUND')) {
      throw new Error('Firebase Console에서 Google 인증을 활성화해주세요.\n\n1. Firebase Console 접속\n2. Authentication 메뉴 클릭\n3. Sign-in method 탭 클릭\n4. Google 제공업체 클릭\n5. "사용 설정" 토글 켜기\n6. 저장 클릭');
    }
    
    // Firebase 설정이 안 된 경우 더 친절한 메시지
    if (error.message?.includes('Firebase') || error.code === 'auth/operation-not-allowed') {
      throw new Error('Firebase Console에서 Google 인증을 활성화해주세요.');
    }
    
    throw error;
  }
};

// 네이버 로그인
export const signInWithNaver = async () => {
  if (!auth) {
    throw new Error('Firebase Auth가 초기화되지 않았습니다.');
  }

  try {
    // 네이버는 Firebase Auth에서 직접 지원하지 않으므로
    // 커스텀 OAuth 구현이 필요합니다
    // 간단한 구현: 웹뷰를 사용한 OAuth 플로우
    
    if (Platform.OS === 'web') {
      throw new Error('네이버 로그인은 Firebase Custom Auth 또는 네이버 SDK를 통한 별도 구현이 필요합니다.');
    } else {
      // 모바일에서는 네이버 SDK 사용 필요
      throw new Error('네이버 로그인은 네이버 SDK 설치 및 설정이 필요합니다.');
    }
  } catch (error) {
    console.error('네이버 로그인 오류:', error);
    throw error;
  }
};

// 로그아웃
export const signOut = async () => {
  try {
    // Firebase 로그아웃
    if (auth) {
      try {
        const currentUser = auth.currentUser;
        if (currentUser) {
          await firebaseSignOut(auth);
        }
      } catch (error) {
        console.error('Firebase 로그아웃 오류:', error);
        // Firebase 오류가 있어도 로컬 로그아웃은 진행
      }
    }

    // AsyncStorage에서 사용자 정보 제거
    await AsyncStorage.removeItem(USER_STORAGE_KEY);
    await AsyncStorage.removeItem(AUTH_PROVIDER_KEY);
    
    console.log('로그아웃 완료');
  } catch (error) {
    console.error('로그아웃 중 오류:', error);
    // 오류가 발생해도 AsyncStorage는 정리 시도
    try {
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
      await AsyncStorage.removeItem(AUTH_PROVIDER_KEY);
    } catch (storageError) {
      console.error('AsyncStorage 정리 오류:', storageError);
    }
    throw error;
  }
};

// 현재 사용자 가져오기
export const getCurrentUser = async () => {
  try {
    const userJson = await AsyncStorage.getItem(USER_STORAGE_KEY);
    const provider = await AsyncStorage.getItem(AUTH_PROVIDER_KEY);

    if (userJson) {
      return {
        user: JSON.parse(userJson),
        provider: provider || 'guest',
      };
    }
  } catch (error) {
    console.error('사용자 정보 가져오기 오류:', error);
  }

  return { user: null, provider: 'guest' };
};

// 인증 상태 리스너 설정
export const onAuthStateChange = (callback) => {
  if (!auth) {
    return () => {};
  }

  return onAuthStateChanged(auth, (firebaseUser) => {
    if (firebaseUser) {
      const user = {
        id: firebaseUser.uid,
        email: firebaseUser.email,
        name: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
      };
      callback(user);
    } else {
      callback(null);
    }
  });
};
