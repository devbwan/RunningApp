import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { Button, Card, Surface } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../src/stores/authStore';
import { signInWithGoogle, signInWithNaver } from '../src/services/authService';
import { spacing, typography, colors } from '../src/theme';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const user = await signInWithGoogle();
      await signIn(user, 'google');
      router.replace('/(tabs)');
    } catch (err) {
      console.error('Google 로그인 실패:', err);
      setError('Google 로그인에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleNaverLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const user = await signInWithNaver();
      await signIn(user, 'naver');
      router.replace('/(tabs)');
    } catch (err) {
      console.error('네이버 로그인 실패:', err);
      setError('네이버 로그인이 아직 구현되지 않았습니다.');
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

          <Button
            mode="outlined"
            onPress={handleNaverLogin}
            style={styles.naverButton}
            contentStyle={styles.buttonContent}
            disabled={loading}
            textColor="#03C75A"
          >
            네이버로 로그인
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
  naverButton: {
    height: 56,
    borderRadius: 16,
    borderColor: '#03C75A',
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
});

