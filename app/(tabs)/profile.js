import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Card, Surface, Avatar, Divider, Chip, Button } from 'react-native-paper';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuthStore } from '../../src/stores/authStore';
import { getUserStats } from '../../src/db/statsRepository';
import { getUserRewards } from '../../src/db/rewardsRepository';
import { checkRewards } from '../../src/utils/rewardSystem';
import { spacing, typography, colors } from '../../src/theme';

export default function ProfileScreen() {
  const router = useRouter();
  // Zustand 스토어에서 상태 구독 (변경 시 자동 리렌더링)
  const user = useAuthStore((state) => state.user);
  const authProvider = useAuthStore((state) => state.authProvider);
  const signOutStore = useAuthStore((state) => state.signOut);
  const [stats, setStats] = useState({
    totalRuns: 0,
    totalDistance: 0,
    totalTime: 0,
    maxSpeed: 0,
    streakDays: 0,
  });
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);

  // 데이터 로드 함수 (Zustand 스토어에서 최신 상태 가져오기)
  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      // 현재 Zustand 스토어에서 최신 user 값 가져오기
      const currentUser = useAuthStore.getState().user;
      const [statsData, achievedRewards] = await Promise.all([
        getUserStats(currentUser?.id || null),
        getUserRewards(currentUser?.id || null),
      ]);
      setStats(statsData);
      
      // 메달 체크
      const { allRewards } = checkRewards(statsData, achievedRewards);
      setRewards(allRewards);
    } catch (error) {
      console.error('데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 사용자 변경 시 데이터 재로드
  useEffect(() => {
    loadData();
  }, [user, authProvider, loadData]);

  // 화면 포커스 시 상태 확인 및 데이터 로드
  useFocusEffect(
    React.useCallback(() => {
      // AsyncStorage에서 최신 상태 확인하여 Zustand와 동기화
      const syncAuthState = async () => {
        try {
          const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
          const USER_STORAGE_KEY = '@runwave_user';
          const AUTH_PROVIDER_KEY = '@runwave_auth_provider';
          
          const userJson = await AsyncStorage.getItem(USER_STORAGE_KEY);
          const provider = await AsyncStorage.getItem(AUTH_PROVIDER_KEY);
          const currentState = useAuthStore.getState();
          
          // AsyncStorage에 사용자 정보가 없는데 Zustand에 있으면 강제로 게스트 모드
          if (!userJson && currentState.user) {
            console.log('[Profile] AsyncStorage에 사용자 정보 없음 - 강제 게스트 모드로 전환');
            useAuthStore.setState({ user: null, authProvider: 'guest' });
          }
          // AsyncStorage에 사용자 정보가 있으면 Zustand 상태와 동기화
          else if (userJson) {
            try {
              const parsedUser = JSON.parse(userJson);
              const currentUser = currentState.user;
              
              // Zustand의 user와 AsyncStorage의 user가 다르면 동기화
              if (!currentUser || currentUser.id !== parsedUser.id) {
                console.log('[Profile] 사용자 정보 동기화:', parsedUser);
                useAuthStore.setState({ user: parsedUser, authProvider: provider || 'guest' });
              }
            } catch (parseError) {
              console.error('[Profile] 사용자 정보 파싱 오류:', parseError);
              // 파싱 오류 시 AsyncStorage 정리
              await AsyncStorage.removeItem(USER_STORAGE_KEY);
              await AsyncStorage.removeItem(AUTH_PROVIDER_KEY);
              useAuthStore.setState({ user: null, authProvider: 'guest' });
            }
          }
        } catch (error) {
          console.error('[Profile] 상태 동기화 오류:', error);
        }
      };
      
      syncAuthState();
      loadData();
    }, [loadData])
  );

  const formatDistance = (meters) => {
    if (!meters || meters < 1000) return `${Math.round(meters || 0)}m`;
    return `${((meters || 0) / 1000).toFixed(2)}km`;
  };

  const formatTime = (seconds) => {
    if (!seconds) return '0시간';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hrs > 0) return `${hrs}시간 ${mins}분`;
    return `${mins}분`;
  };

  const formatSpeed = (kmh) => {
    if (!kmh || kmh === 0) return '-- km/h';
    return `${kmh.toFixed(1)} km/h`;
  };

  const handleSignOut = async () => {
    // 웹 환경에서는 window.confirm 사용 (Alert가 작동하지 않을 수 있음)
    const Platform = require('react-native').Platform;
    let confirmed = false;
    
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.confirm) {
      confirmed = window.confirm('정말 로그아웃하시겠습니까?');
      if (!confirmed) return;
    } else {
      // 모바일 환경에서는 Alert 사용
      const result = await new Promise((resolve) => {
        Alert.alert(
          '로그아웃',
          '정말 로그아웃하시겠습니까?',
          [
            { 
              text: '취소', 
              style: 'cancel',
              onPress: () => resolve(false)
            },
            {
              text: '로그아웃',
              style: 'destructive',
              onPress: () => resolve(true)
            },
          ],
          { cancelable: true, onDismiss: () => resolve(false) }
        );
      });
      if (!result) return;
      confirmed = true;
    }
    
    if (confirmed) {
      try {
        console.log('[Profile] 로그아웃 시작 - 현재 user:', user);
        
        // 1. 먼저 Zustand 스토어 상태를 강제로 게스트로 설정 (즉시 UI 업데이트)
        useAuthStore.setState({ user: null, authProvider: 'guest' });
        
        // 2. authStore의 signOut이 authService의 signOut도 호출합니다
        await signOutStore();
        
        // 3. AsyncStorage도 직접 확인하여 확실히 정리
        try {
          const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
          await AsyncStorage.removeItem('@runwave_user');
          await AsyncStorage.removeItem('@runwave_auth_provider');
          console.log('[Profile] AsyncStorage 정리 완료');
        } catch (storageError) {
          console.error('[Profile] AsyncStorage 정리 오류:', storageError);
        }
        
        // 4. 다시 한번 확인하여 확실히 게스트 모드로 설정
        useAuthStore.setState({ user: null, authProvider: 'guest' });
        
        // 5. 상태 업데이트 확인
        const currentState = useAuthStore.getState();
        console.log('[Profile] 로그아웃 후 최종 상태:', currentState);
        
        // 6. 즉시 데이터 재로드 (게스트 모드로)
        setLoading(true);
        await loadData();
        setLoading(false);
        
        console.log('[Profile] 로그아웃 완료 및 데이터 재로드 완료');
      } catch (error) {
        console.error('[Profile] 로그아웃 오류:', error);
        // 오류가 발생해도 강제로 게스트 모드로 설정
        useAuthStore.setState({ user: null, authProvider: 'guest' });
        
        // AsyncStorage 강제 정리
        try {
          const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
          await AsyncStorage.removeItem('@runwave_user');
          await AsyncStorage.removeItem('@runwave_auth_provider');
        } catch (storageError) {
          console.error('[Profile] AsyncStorage 강제 정리 오류:', storageError);
        }
        
        setLoading(true);
        await loadData();
        setLoading(false);
      }
    }
  };

  const handleLogin = () => {
    router.push('/login');
  };

  // user 상태가 변경될 때마다 재계산되도록 변수로 유지
  // Zustand에서 user가 변경되면 자동으로 재렌더링됨
  // user가 null이거나 없으면 게스트 모드로 강제 설정
  const isGuest = !user || authProvider === 'guest';
  const userName = isGuest ? '게스트' : (user?.name || '게스트');
  const userEmail = isGuest ? '' : (user?.email || '');
  const userPhoto = isGuest ? null : (user?.photoURL || null);
  
  // 디버깅: 상태 확인
  React.useEffect(() => {
    console.log('[Profile] user 상태 변경:', { user, authProvider, isGuest, userName, userEmail });
  }, [user, authProvider]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Avatar.Icon 
          size={80} 
          icon="account" 
          style={styles.avatar}
          {...(userPhoto && { source: { uri: userPhoto } })}
        />
        <Text style={styles.userName}>{userName}</Text>
        {userEmail ? (
          <Text style={styles.userEmail}>{userEmail}</Text>
        ) : (
          <Text style={styles.guestText}>게스트 모드</Text>
        )}
        <View style={styles.authBadge}>
          <Text style={styles.authText}>
            {authProvider === 'google' ? 'Google' : authProvider === 'naver' ? '네이버' : '게스트'}
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        <Card style={styles.statsCard} mode="outlined">
          <Card.Content>
            <Text style={styles.cardTitle}>누적 통계</Text>
            <Divider style={styles.divider} />
            
            <View style={styles.statsGrid}>
              <View style={styles.statBlock}>
                <Text style={styles.statValue}>{stats.totalRuns}</Text>
                <Text style={styles.statLabel}>러닝 횟수</Text>
              </View>
              <View style={styles.statBlock}>
                <Text style={styles.statValue}>{formatDistance(stats.totalDistance)}</Text>
                <Text style={styles.statLabel}>총 거리</Text>
              </View>
              <View style={styles.statBlock}>
                <Text style={styles.statValue}>{formatTime(stats.totalTime)}</Text>
                <Text style={styles.statLabel}>총 시간</Text>
              </View>
              <View style={styles.statBlock}>
                <Text style={styles.statValue}>{formatSpeed(stats.maxSpeed)}</Text>
                <Text style={styles.statLabel}>최고 속도</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card} mode="outlined">
          <Card.Content>
            <Text style={styles.cardTitle}>연속 러닝</Text>
            <Text style={styles.streakValue}>{stats.streakDays}일</Text>
          </Card.Content>
        </Card>

        <Card style={styles.card} mode="outlined">
          <Card.Content>
            <Text style={styles.cardTitle}>획득한 메달</Text>
            <Divider style={styles.divider} />
            {rewards.length > 0 ? (
              <View style={styles.rewardsContainer}>
                {rewards
                  .filter((r) => r.achieved)
                  .map((reward) => (
                    <Chip
                      key={reward.id}
                      style={[styles.rewardChip, { backgroundColor: colors.secondary }]}
                      textStyle={styles.rewardChipText}
                    >
                      {reward.title}
                    </Chip>
                  ))}
                {rewards.filter((r) => r.achieved).length === 0 && (
                  <Text style={styles.emptyText}>아직 획득한 메달이 없습니다.</Text>
                )}
              </View>
            ) : (
              <Text style={styles.emptyText}>메달 로딩 중...</Text>
            )}
          </Card.Content>
        </Card>

        <Card style={styles.card} mode="outlined">
          <Card.Content>
            <Text style={styles.cardTitle}>메달 진행도</Text>
            <Divider style={styles.divider} />
            {rewards.length > 0 ? (
              <ScrollView style={styles.progressContainer}>
                {rewards.slice(0, 10).map((reward) => (
                  <View key={reward.id} style={styles.progressItem}>
                    <View style={styles.progressHeader}>
                      <Text style={styles.progressLabel}>{reward.title}</Text>
                      <Text style={styles.progressPercent}>{reward.progress.toFixed(0)}%</Text>
                    </View>
                    <View style={styles.progressBarContainer}>
                      <View
                        style={[
                          styles.progressBar,
                          {
                            width: `${reward.progress}%`,
                            backgroundColor: reward.achieved ? colors.secondary : colors.primary,
                          },
                        ]}
                      />
                    </View>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <Text style={styles.emptyText}>진행도 로딩 중...</Text>
            )}
          </Card.Content>
        </Card>

            <Card style={styles.card} mode="outlined">
              <Card.Content>
                <Text style={styles.cardTitle}>업로드한 코스</Text>
                <Text style={styles.courseText}>업로드한 코스가 없습니다.</Text>
              </Card.Content>
            </Card>

            {authProvider !== 'guest' ? (
              <Card style={styles.card} mode="outlined">
                <Card.Content>
                  <Button
                    mode="outlined"
                    onPress={() => {
                      console.log('[Profile] 로그아웃 버튼 클릭됨');
                      handleSignOut();
                    }}
                    style={styles.signOutButton}
                    textColor={colors.error}
                  >
                    로그아웃
                  </Button>
                </Card.Content>
              </Card>
            ) : (
              <Card style={styles.card} mode="outlined">
                <Card.Content>
                  <Text style={styles.cardTitle}>로그인</Text>
                  <Text style={styles.loginText}>
                    로그인하여 기록을 클라우드에 동기화하고 더 많은 기능을 이용하세요.
                  </Text>
                  <Button
                    mode="contained"
                    onPress={handleLogin}
                    style={styles.loginButton}
                    contentStyle={styles.loginButtonContent}
                  >
                    로그인하기
                  </Button>
                </Card.Content>
              </Card>
            )}
          </View>
        </ScrollView>
      );
    }

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.light,
  },
  header: {
    alignItems: 'center',
    padding: spacing.xl,
    paddingTop: spacing.xl + 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  avatar: {
    backgroundColor: colors.primary,
    marginBottom: spacing.md,
  },
  userName: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: '#000',
    marginBottom: spacing.xs,
  },
  userEmail: {
    fontSize: typography.fontSize.sm,
    color: '#666',
    marginBottom: spacing.sm,
  },
  guestText: {
    fontSize: typography.fontSize.sm,
    color: '#666',
    marginBottom: spacing.sm,
  },
  authBadge: {
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  authText: {
    fontSize: typography.fontSize.xs,
    color: '#fff',
    fontWeight: typography.fontWeight.medium,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  statsCard: {
    borderRadius: 16,
  },
  card: {
    borderRadius: 16,
  },
  cardTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.md,
  },
  divider: {
    marginBottom: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statBlock: {
    width: '48%',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    marginBottom: spacing.sm,
  },
  statValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: typography.fontSize.sm,
    color: '#666',
  },
  streakValue: {
    fontSize: typography.fontSize.xxxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.secondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  medalText: {
    fontSize: typography.fontSize.md,
    color: '#666',
    marginTop: spacing.sm,
  },
  courseText: {
    fontSize: typography.fontSize.md,
    color: '#666',
    marginTop: spacing.sm,
  },
  rewardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  rewardChip: {
    marginBottom: spacing.xs,
  },
  rewardChipText: {
    fontSize: typography.fontSize.sm,
    color: '#fff',
  },
  progressContainer: {
    maxHeight: 300,
  },
  progressItem: {
    marginBottom: spacing.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  progressLabel: {
    fontSize: typography.fontSize.sm,
    color: '#666',
  },
  progressPercent: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.primary,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
      emptyText: {
        fontSize: typography.fontSize.md,
        color: '#666',
        textAlign: 'center',
        paddingVertical: spacing.md,
      },
      signOutButton: {
        marginTop: spacing.md,
        borderColor: colors.error,
      },
      loginButton: {
        marginTop: spacing.md,
        borderRadius: 16,
      },
      loginButtonContent: {
        paddingVertical: spacing.sm,
      },
      loginText: {
        fontSize: typography.fontSize.sm,
        color: '#666',
        marginTop: spacing.sm,
        lineHeight: 20,
      },
    });
