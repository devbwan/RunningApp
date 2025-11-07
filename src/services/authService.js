import {
  signInWithCredential,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
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
      
      // 먼저 redirect 결과 확인 (이전에 redirect로 시작한 경우)
      try {
        const redirectResult = await getRedirectResult(auth);
        if (redirectResult) {
          const user = {
            id: redirectResult.user.uid,
            email: redirectResult.user.email,
            name: redirectResult.user.displayName,
            photoURL: redirectResult.user.photoURL,
          };
          await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
          await AsyncStorage.setItem(AUTH_PROVIDER_KEY, 'google');
          return user;
        }
      } catch (redirectError) {
        // redirect 결과가 없거나 오류가 발생한 경우 무시하고 popup 사용
        if (__DEV__) {
          console.log('[Auth] Redirect 결과 없음, popup 사용:', redirectError);
        }
      }
      
      // popup 방식 사용 (COOP 경고는 무시 - 실제 로그인은 정상 작동)
      try {
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
      } catch (popupError) {
        // popup이 차단되거나 COOP 오류가 발생한 경우 redirect 사용
        if (popupError.code === 'auth/popup-blocked' || popupError.code === 'auth/popup-closed-by-user') {
          if (__DEV__) {
            console.log('[Auth] Popup 차단됨, redirect 사용');
          }
          // redirect 방식으로 전환
          await signInWithRedirect(auth, provider);
          // redirect는 페이지를 이동하므로 여기서는 null 반환
          // 실제 로그인은 redirect 후 getRedirectResult에서 처리됨
          throw new Error('로그인을 위해 리디렉션 중입니다. 잠시 후 다시 시도해주세요.');
        }
        throw popupError;
      }
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

// 로그아웃
export const signOut = async () => {
  try {
    // AsyncStorage에서 사용자 정보 제거 (먼저 제거하여 새로고침 시 복원 방지)
    await AsyncStorage.removeItem(USER_STORAGE_KEY);
    await AsyncStorage.removeItem(AUTH_PROVIDER_KEY);
    
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
    // Firebase 로그아웃은 오류가 있어도 시도
    try {
      if (auth?.currentUser) {
        await firebaseSignOut(auth);
      }
    } catch (firebaseError) {
      console.error('Firebase 로그아웃 오류 (재시도):', firebaseError);
    }
    throw error;
  }
};

// 현재 사용자 가져오기
export const getCurrentUser = async () => {
  try {
    console.log('[AuthService] getCurrentUser 시작');
    console.log('[AuthService] auth 객체:', { hasAuth: !!auth, hasCurrentUser: !!auth?.currentUser });
    
    // Firebase Auth 상태 확인
    const firebaseUser = auth?.currentUser;
    console.log('[AuthService] Firebase 사용자:', { hasUser: !!firebaseUser, uid: firebaseUser?.uid });
    
    // AsyncStorage에서 사용자 정보 확인
    const userJson = await AsyncStorage.getItem(USER_STORAGE_KEY);
    const provider = await AsyncStorage.getItem(AUTH_PROVIDER_KEY);
    console.log('[AuthService] AsyncStorage:', { hasUserJson: !!userJson, provider });

    // Firebase Auth에 사용자가 있지만 AsyncStorage에 없는 경우 (로그아웃 후 새로고침 시나리오)
    if (firebaseUser && !userJson) {
      // Firebase Auth만 있고 AsyncStorage에는 없는 경우 - 로그아웃 처리
      // 이는 로그아웃 후 Firebase Auth 세션이 남아있는 경우를 처리
      try {
        await firebaseSignOut(auth);
      } catch (error) {
        console.warn('Firebase Auth 세션 정리 오류:', error);
      }
      return { user: null, provider: 'guest' };
    }

    // AsyncStorage에 사용자 정보가 있는 경우
    if (userJson) {
      const parsedUser = JSON.parse(userJson);
      
      // Firebase Auth와 AsyncStorage가 모두 있는 경우 동기화
      if (firebaseUser && firebaseUser.uid === parsedUser.id) {
        return {
          user: parsedUser,
          provider: provider || 'guest',
        };
      }
      
      // AsyncStorage에만 있고 Firebase Auth에는 없는 경우 (비정상 상태)
      // Firebase Auth 세션이 만료된 경우로 간주하고 AsyncStorage 정리
      if (!firebaseUser) {
        await AsyncStorage.removeItem(USER_STORAGE_KEY);
        await AsyncStorage.removeItem(AUTH_PROVIDER_KEY);
        return { user: null, provider: 'guest' };
      }
      
      return {
        user: parsedUser,
        provider: provider || 'guest',
      };
    }

    // 둘 다 없는 경우 - 게스트 모드
    return { user: null, provider: 'guest' };
  } catch (error) {
    console.error('사용자 정보 가져오기 오류:', error);
    // 오류 발생 시 AsyncStorage 정리 시도
    try {
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
      await AsyncStorage.removeItem(AUTH_PROVIDER_KEY);
    } catch (storageError) {
      console.error('AsyncStorage 정리 오류:', storageError);
    }
    return { user: null, provider: 'guest' };
  }
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
