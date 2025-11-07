import React, { useEffect, useState } from 'react';
import { Platform, View, ActivityIndicator, Text } from 'react-native';
import { Slot } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider, MD3LightTheme as DefaultTheme } from 'react-native-paper';
import { useAuthStore } from '../src/stores/authStore';
import { spacing, colors } from '../src/theme';

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#00D9FF',
    secondary: '#FF7A00',
  },
  roundness: 16,
  fonts: {
    ...DefaultTheme.fonts,
    // 전체 앱 폰트를 Noto Sans KR로 통일
    default: Platform.select({
      android: {
        fontFamily: 'sans-serif-medium', // Android 기본 한글 폰트 (Noto Sans KR 기반)
      },
      ios: {
        fontFamily: 'Apple SD Gothic Neo', // iOS 한글 폰트
      },
      web: {
        fontFamily: '"Noto Sans KR", "Apple SD Gothic Neo", sans-serif',
      },
    }) || DefaultTheme.fonts.default,
    // Button 텍스트 폰트 설정
    labelLarge: {
      ...DefaultTheme.fonts.labelLarge,
      fontFamily: Platform.select({
        android: 'sans-serif-medium',
        ios: 'Apple SD Gothic Neo',
        web: '"Noto Sans KR", "Apple SD Gothic Neo", sans-serif',
      }) || DefaultTheme.fonts.labelLarge.fontFamily,
    },
    labelMedium: {
      ...DefaultTheme.fonts.labelMedium,
      fontFamily: Platform.select({
        android: 'sans-serif-medium',
        ios: 'Apple SD Gothic Neo',
        web: '"Noto Sans KR", "Apple SD Gothic Neo", sans-serif',
      }) || DefaultTheme.fonts.labelMedium.fontFamily,
    },
    labelSmall: {
      ...DefaultTheme.fonts.labelSmall,
      fontFamily: Platform.select({
        android: 'sans-serif-medium',
        ios: 'Apple SD Gothic Neo',
        web: '"Noto Sans KR", "Apple SD Gothic Neo", sans-serif',
      }) || DefaultTheme.fonts.labelSmall.fontFamily,
    },
    // 추가 폰트 스타일
    bodyLarge: {
      ...DefaultTheme.fonts.bodyLarge,
      fontFamily: Platform.select({
        android: 'sans-serif-medium',
        ios: 'Apple SD Gothic Neo',
        web: '"Noto Sans KR", "Apple SD Gothic Neo", sans-serif',
      }) || DefaultTheme.fonts.bodyLarge.fontFamily,
    },
    bodyMedium: {
      ...DefaultTheme.fonts.bodyMedium,
      fontFamily: Platform.select({
        android: 'sans-serif-medium',
        ios: 'Apple SD Gothic Neo',
        web: '"Noto Sans KR", "Apple SD Gothic Neo", sans-serif',
      }) || DefaultTheme.fonts.bodyMedium.fontFamily,
    },
    bodySmall: {
      ...DefaultTheme.fonts.bodySmall,
      fontFamily: Platform.select({
        android: 'sans-serif-medium',
        ios: 'Apple SD Gothic Neo',
        web: '"Noto Sans KR", "Apple SD Gothic Neo", sans-serif',
      }) || DefaultTheme.fonts.bodySmall.fontFamily,
    },
    titleLarge: {
      ...DefaultTheme.fonts.titleLarge,
      fontFamily: Platform.select({
        android: 'sans-serif-medium',
        ios: 'Apple SD Gothic Neo',
        web: '"Noto Sans KR", "Apple SD Gothic Neo", sans-serif',
      }) || DefaultTheme.fonts.titleLarge.fontFamily,
    },
    titleMedium: {
      ...DefaultTheme.fonts.titleMedium,
      fontFamily: Platform.select({
        android: 'sans-serif-medium',
        ios: 'Apple SD Gothic Neo',
        web: '"Noto Sans KR", "Apple SD Gothic Neo", sans-serif',
      }) || DefaultTheme.fonts.titleMedium.fontFamily,
    },
    titleSmall: {
      ...DefaultTheme.fonts.titleSmall,
      fontFamily: Platform.select({
        android: 'sans-serif-medium',
        ios: 'Apple SD Gothic Neo',
        web: '"Noto Sans KR", "Apple SD Gothic Neo", sans-serif',
      }) || DefaultTheme.fonts.titleSmall.fontFamily,
    },
  },
};

// 웹 환경에서 개발 모드 경고 억제 (라이브러리 내부 경고)
if (Platform.OS === 'web' && typeof __DEV__ !== 'undefined' && __DEV__) {
  const originalWarn = console.warn;
  console.warn = (...args) => {
    const message = args[0];
    if (
      typeof message === 'string' &&
      (message.includes('props.pointerEvents is deprecated') ||
       (message.includes('shadow') && message.includes('boxShadow')) ||
       message.includes('Cross-Origin-Opener-Policy') ||
       message.includes('window.closed'))
    ) {
      // react-native-paper 내부 경고 및 COOP 경고는 무시 (로그인은 정상 작동)
      return;
    }
    originalWarn(...args);
  };
}

export default function RootLayout() {
  const initialize = useAuthStore((state) => state.initialize);
  const isLoading = useAuthStore((state) => state.isLoading);
  const [initError, setInitError] = useState(null);

  useEffect(() => {
    console.log('[RootLayout] 초기화 시작');
    const init = async () => {
      try {
        await initialize();
        console.log('[RootLayout] 초기화 완료');
      } catch (error) {
        console.error('[RootLayout] 초기화 오류:', error);
        setInitError(error.message || '앱 초기화 중 오류가 발생했습니다.');
      }
    };
    init();
  }, [initialize]);

  // 초기화 중이면 로딩 화면 표시
  if (isLoading) {
    console.log('[RootLayout] 로딩 중...');
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <PaperProvider theme={theme}>
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={{ marginTop: spacing.md, color: '#666' }}>앱을 시작하는 중...</Text>
            </View>
          </PaperProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  // 초기화 오류가 있으면 오류 화면 표시
  if (initError) {
    console.error('[RootLayout] 초기화 오류 화면 표시:', initError);
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <PaperProvider theme={theme}>
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', padding: spacing.lg }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: spacing.md, color: '#F44336' }}>
                오류 발생
              </Text>
              <Text style={{ color: '#666', textAlign: 'center' }}>{initError}</Text>
            </View>
          </PaperProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  console.log('[RootLayout] 정상 렌더링');
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <Slot />
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}


