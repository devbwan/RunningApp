import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { Slot } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider, MD3LightTheme as DefaultTheme } from 'react-native-paper';
import { useAuthStore } from '../src/stores/authStore';

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#00D9FF',
    secondary: '#FF7A00',
  },
  roundness: 16,
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

  useEffect(() => {
    initialize();
  }, []);

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


