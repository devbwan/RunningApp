import {
  signInWithCredential,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from '../config/firebase';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';

WebBrowser.maybeCompleteAuthSession();

const USER_STORAGE_KEY = '@runwave_user';
const AUTH_PROVIDER_KEY = '@runwave_auth_provider';

// Google 로그인 설정
const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '';

// Google 로그인
export const signInWithGoogle = async () => {
  if (!auth) {
    throw new Error('Firebase Auth가 초기화되지 않았습니다.');
  }

  try {
    // Expo AuthSession을 사용한 Google 로그인
    const [request, response, promptAsync] = Google.useAuthRequest({
      clientId: GOOGLE_CLIENT_ID,
      scopes: ['openid', 'profile', 'email'],
    });

    const result = await promptAsync();

    if (result.type === 'success') {
      const { id_token } = result.params;
      const credential = GoogleAuthProvider.credential(id_token);
      const userCredential = await signInWithCredential(auth, credential);

      const user = {
        id: userCredential.user.uid,
        email: userCredential.user.email,
        name: userCredential.user.displayName,
        photoURL: userCredential.user.photoURL,
      };

      // AsyncStorage에 저장
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      await AsyncStorage.setItem(AUTH_PROVIDER_KEY, 'google');

      return user;
    } else {
      throw new Error('Google 로그인이 취소되었습니다.');
    }
  } catch (error) {
    console.error('Google 로그인 오류:', error);
    throw error;
  }
};

// 네이버 로그인 (간단한 구현)
export const signInWithNaver = async () => {
  // TODO: 네이버 OAuth 구현
  // 네이버는 커스텀 OAuth 구현이 필요합니다
  throw new Error('네이버 로그인은 아직 구현되지 않았습니다.');
};

// 로그아웃
export const signOut = async () => {
  if (auth) {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Firebase 로그아웃 오류:', error);
    }
  }

  // AsyncStorage에서 사용자 정보 제거
  await AsyncStorage.removeItem(USER_STORAGE_KEY);
  await AsyncStorage.removeItem(AUTH_PROVIDER_KEY);
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

