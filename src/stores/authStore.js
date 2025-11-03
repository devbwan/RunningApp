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
      const { user, provider } = await getCurrentUser();
      set({ user, authProvider: provider || 'guest', isLoading: false });

      // Firebase Auth 상태 리스너 설정
      if (onAuthStateChange) {
        onAuthStateChange((firebaseUser) => {
          if (firebaseUser) {
            set({ user: firebaseUser });
          } else {
            // Firebase에서 로그아웃된 경우
            if (get().authProvider !== 'guest') {
              set({ user: null, authProvider: 'guest' });
            }
          }
        });
      }
    } catch (error) {
      console.error('인증 초기화 오류:', error);
      set({ user: null, authProvider: 'guest', isLoading: false });
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
    set({ user, authProvider: provider });
    await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    await AsyncStorage.setItem(AUTH_PROVIDER_KEY, provider);
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
