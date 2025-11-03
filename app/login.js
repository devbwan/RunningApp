import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { Button, Card, Surface } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../src/stores/authStore';
import { signInWithGoogle } from '../src/services/authService';
import { auth } from '../src/config/firebase';
import { getRedirectResult } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { spacing, typography, colors } from '../src/theme';

const USER_STORAGE_KEY = '@runwave_user';
const AUTH_PROVIDER_KEY = '@runwave_auth_provider';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 페이지 로드 시 redirect 결과만 확인 (팝업을 열지 않음)
  useEffect(() => {
    const checkRedirectResult = async () => {
      // 웹 환경이 아니면 redirect 결과 확인 스킵
      if (Platform.OS !== 'web' || !auth) {
        return;
      }

      try {
        // redirect 결과만 확인 (팝업을 열지 않음)
        const redirectResult = await getRedirectResult(auth);
        if (redirectResult) {
          setLoading(true);
          const user = {
            id: redirectResult.user.uid,
            email: redirectResult.user.email,
            name: redirectResult.user.displayName,
            photoURL: redirectResult.user.photoURL,
          };
          
          await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
          await AsyncStorage.setItem(AUTH_PROVIDER_KEY, 'google');
          
          await signIn(user, 'google');
          router.replace('/(tabs)/profile');
        }
      } catch (err) {
        // redirect 결과가 없거나 오류가 발생한 경우 무시 (정상적인 로그인 흐름)
        if (__DEV__) {
          console.log('[Login] Redirect 결과 없음 (정상)');
        }
      } finally {
        if (loading) {
          setLoading(false);
        }
      }
    };

    checkRedirectResult();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const user = await signInWithGoogle();
      await signIn(user, 'google');
      router.replace('/(tabs)/profile');
    } catch (err) {
      console.error('Google 로그인 실패:', err);
      // 에러 메시지에 따라 다른 메시지 표시
      if (err.message?.includes('Firebase 설정') || err.message?.includes('초기화')) {
        setError('Firebase 설정이 필요합니다.\n\n1. Firebase Console에서 프로젝트 생성\n2. Authentication > Sign-in method에서 Google 활성화\n3. src/config/firebase.js에 설정 정보 입력\n\n현재는 게스트 모드로 진행하세요.');
      } else if (err.message?.includes('operation-not-allowed')) {
        setError('Firebase Console에서 Google 인증을 활성화해주세요.');
      } else {
        setError(err.message || 'Google 로그인에 실패했습니다. 다시 시도해주세요.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGuestMode = () => {
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <Surface style={styles.card} elevation={2}>
        <View style={styles.header}>
          <Text style={styles.title}>RunWave</Text>
          <Text style={styles.subtitle}>러닝 트래커에 오신 것을 환영합니다</Text>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Google 로그인 처리 중...</Text>
            <Text style={styles.loadingSubtext}>팝업 창에서 계정을 선택해주세요</Text>
          </View>
        )}

        <View style={styles.buttonsContainer}>
          <Button
            mode="contained"
            onPress={handleGoogleLogin}
            style={styles.googleButton}
            contentStyle={styles.buttonContent}
            disabled={loading}
            icon="google"
          >
            {loading ? '로그인 중...' : 'Google로 로그인'}
          </Button>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>또는</Text>
            <View style={styles.dividerLine} />
          </View>

          <Button
            mode="text"
            onPress={handleGuestMode}
            style={styles.guestButton}
            disabled={loading}
          >
            게스트로 계속하기
          </Button>

          <Text style={styles.infoText}>
            게스트 모드에서는 로컬에만 저장되며, 로그인하면 클라우드에 동기화됩니다.
          </Text>
        </View>
      </Surface>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.light,
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    padding: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography.fontSize.xxxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.fontSize.md,
    color: '#666',
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  errorText: {
    color: colors.error,
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
  },
  buttonsContainer: {
    gap: spacing.md,
  },
  googleButton: {
    height: 56,
    borderRadius: 16,
    backgroundColor: '#4285F4',
  },
  guestButton: {
    height: 48,
  },
  buttonContent: {
    paddingVertical: spacing.md,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  dividerText: {
    marginHorizontal: spacing.md,
    fontSize: typography.fontSize.sm,
    color: '#666',
  },
  infoText: {
    fontSize: typography.fontSize.xs,
    color: '#666',
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 18,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    borderRadius: 24,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
    color: '#000',
  },
  loadingSubtext: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.sm,
    color: '#666',
    textAlign: 'center',
  },
});

