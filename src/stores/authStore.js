import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentUser, onAuthStateChange, signOut as authServiceSignOut } from '../services/authService';

const USER_STORAGE_KEY = '@runwave_user';
const AUTH_PROVIDER_KEY = '@runwave_auth_provider';

export const useAuthStore = create((set, get) => ({
  user: null,
  authProvider: 'guest', // 'guest' | 'google' | 'naver'
  isLoading: true,

  // 초기화
  initialize: async () => {
    try {
      console.log('[AuthStore] 초기화 시작');
      const { user, provider } = await getCurrentUser();
      console.log('[AuthStore] getCurrentUser 완료:', { hasUser: !!user, provider });
      set({ user, authProvider: provider || 'guest', isLoading: false });
      console.log('[AuthStore] 상태 업데이트 완료');

      // Firebase Auth 상태 리스너 설정
      if (onAuthStateChange) {
        console.log('[AuthStore] Firebase Auth 리스너 설정');
        onAuthStateChange((firebaseUser) => {
          console.log('[AuthStore] Firebase Auth 상태 변경:', { hasUser: !!firebaseUser });
          if (firebaseUser) {
            set({ user: firebaseUser });
          } else {
            // Firebase에서 로그아웃된 경우
            if (get().authProvider !== 'guest') {
              set({ user: null, authProvider: 'guest' });
            }
          }
        });
      } else {
        console.log('[AuthStore] onAuthStateChange 함수 없음');
      }
      console.log('[AuthStore] 초기화 완료');
    } catch (error) {
      console.error('[AuthStore] 인증 초기화 오류:', error);
      set({ user: null, authProvider: 'guest', isLoading: false });
      throw error; // 오류를 다시 throw하여 상위에서 처리할 수 있도록
    }
  },

  setUser: (user) => {
    set({ user });
    if (user) {
      AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    }
  },

  setAuthProvider: (provider) => {
    set({ authProvider: provider });
    AsyncStorage.setItem(AUTH_PROVIDER_KEY, provider);
  },

  signIn: async (user, provider) => {
    const previousUser = get().user;
    const wasGuest = !previousUser || get().authProvider === 'guest';
    
    set({ user, authProvider: provider });
    await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    await AsyncStorage.setItem(AUTH_PROVIDER_KEY, provider);
    
    // 게스트 모드에서 로그인한 경우 데이터 병합
    if (wasGuest && user && user.id) {
      try {
        const { mergeGuestDataToUser } = await import('../services/guestDataMergeService');
        const mergeResult = await mergeGuestDataToUser(user.id);
        console.log('[Auth] 게스트 데이터 병합 완료:', mergeResult);
        return mergeResult;
      } catch (error) {
        console.error('[Auth] 게스트 데이터 병합 실패:', error);
        // 병합 실패해도 로그인은 성공한 것으로 처리
      }
    }
    
    return null;
  },

  signOut: async () => {
    try {
      // Firebase 로그아웃 및 AsyncStorage 정리
      await authServiceSignOut();
    } catch (error) {
      console.error('authService 로그아웃 오류:', error);
      // 오류가 발생해도 로컬 상태는 초기화
      try {
        await AsyncStorage.removeItem(USER_STORAGE_KEY);
        await AsyncStorage.removeItem(AUTH_PROVIDER_KEY);
      } catch (storageError) {
        console.error('AsyncStorage 정리 오류:', storageError);
      }
    }
    // Zustand 스토어 상태 초기화
    set({ user: null, authProvider: 'guest' });
  },
}));
