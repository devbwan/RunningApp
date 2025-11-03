import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Card, Surface, Avatar, Divider, Chip, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/stores/authStore';
import { getUserStats } from '../../src/db/statsRepository';
import { getUserRewards } from '../../src/db/rewardsRepository';
import { checkRewards } from '../../src/utils/rewardSystem';
import { spacing, typography, colors } from '../../src/theme';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, authProvider, signOut: signOutStore } = useAuthStore();
  const [stats, setStats] = useState({
    totalRuns: 0,
    totalDistance: 0,
    totalTime: 0,
    maxSpeed: 0,
    streakDays: 0,
  });
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsData, achievedRewards] = await Promise.all([
        getUserStats(user?.id || null),
        getUserRewards(user?.id || null),
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
  };

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
    Alert.alert(
      '로그아웃',
      '정말 로그아웃하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '로그아웃',
          style: 'destructive',
          onPress: async () => {
            try {
              // authStore의 signOut이 authService의 signOut도 호출합니다
              await signOutStore();
              // 로그인 화면으로 이동
              router.replace('/login');
            } catch (error) {
              console.error('로그아웃 오류:', error);
              // 오류가 발생해도 로컬 상태는 초기화
              Alert.alert('로그아웃', '로그아웃되었습니다.', [
                { text: '확인', onPress: () => router.replace('/login') }
              ]);
            }
          },
        },
      ]
    );
  };

  const handleLogin = () => {
    router.push('/login');
  };

  const userName = user?.name || '게스트';
  const userEmail = user?.email || '';
  const userPhoto = user?.photoURL || null;

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
                    onPress={handleSignOut}
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
