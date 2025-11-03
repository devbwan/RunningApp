import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Button, Card, Surface, ProgressBar, Chip } from 'react-native-paper';
import { Link, useFocusEffect, useRouter } from 'expo-router';
import { useAuthStore } from '../../src/stores/authStore';
import { getTodayStats, getWeeklyStats } from '../../src/db/todayStatsRepository';
import { getTop3Courses } from '../../src/services/courseService';
import { spacing, typography, colors } from '../../src/theme';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [todayStats, setTodayStats] = useState({
    runs: 0,
    distance: 0,
    duration: 0,
    avgPace: null,
  });
  const [weeklyStats, setWeeklyStats] = useState([]);
  const [top3Courses, setTop3Courses] = useState([]);
  const [loading, setLoading] = useState(true);

  // 임시 데이터 (Firebase가 설정되지 않은 경우)
  const getMockTop3Courses = () => [
    {
      id: '1',
      name: '한강 러닝 코스',
      description: '여의도에서 잠실까지',
      distance: 10000,
      difficulty: 'easy',
      runnerCount: 1250,
      rating: 4.5,
    },
    {
      id: '2',
      name: '올림픽공원 루프',
      description: '편안한 5km 루프',
      distance: 5000,
      difficulty: 'easy',
      runnerCount: 2100,
      rating: 4.7,
    },
    {
      id: '3',
      name: '북한산 트레일',
      description: '자연 속 러닝',
      distance: 5000,
      difficulty: 'hard',
      runnerCount: 850,
      rating: 4.8,
    },
  ];

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      const [today, weekly, top3] = await Promise.all([
        getTodayStats(user?.id || null),
        getWeeklyStats(user?.id || null),
        getTop3Courses().catch(() => getMockTop3Courses()), // Firebase 실패 시 임시 데이터
      ]);
      setTodayStats(today);
      setWeeklyStats(weekly);
      setTop3Courses(top3);
    } catch (error) {
      console.error('데이터 로드 실패:', error);
      // 오류 시 임시 데이터 사용
      setTop3Courses(getMockTop3Courses());
    } finally {
      setLoading(false);
    }
  };

  const formatDistance = (meters) => {
    if (!meters || meters < 1000) return `${Math.round(meters || 0)}m`;
    return `${((meters || 0) / 1000).toFixed(2)}km`;
  };

  const formatTime = (seconds) => {
    if (!seconds) return '0분';
    const mins = Math.floor(seconds / 60);
    return `${mins}분`;
  };

  const formatPace = (secPerKm) => {
    if (!secPerKm || secPerKm === 0) return '--:--';
    const mins = Math.floor(secPerKm / 60);
    const secs = Math.round(secPerKm % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}/km`;
  };

  const formatCourseDistance = (meters) => {
    if (meters < 1000) return `${Math.round(meters)}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy':
        return '#4CAF50';
      case 'medium':
        return '#FF9800';
      case 'hard':
        return '#F44336';
      default:
        return '#666';
    }
  };

  const getDifficultyText = (difficulty) => {
    switch (difficulty) {
      case 'easy':
        return '쉬움';
      case 'medium':
        return '보통';
      case 'hard':
        return '어려움';
      default:
        return '';
    }
  };

  // 주간 통계에서 최대값 찾기 (그래프용)
  const maxWeeklyDistance = Math.max(
    ...weeklyStats.map((s) => s.distance || 0),
    1
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>RunWave</Text>
        <Text style={styles.subtitle}>오늘도 화이팅!</Text>
      </View>

      <View style={styles.content}>
        <Link href="/(tabs)/run" asChild>
          <Button mode="contained" style={styles.startButton} contentStyle={styles.buttonContent}>
            러닝 시작
          </Button>
        </Link>

        {/* 오늘의 기록 */}
        <Card style={styles.card} mode="outlined">
          <Card.Content>
            <Text style={styles.cardTitle}>오늘의 기록</Text>
            {todayStats.runs > 0 ? (
              <View style={styles.todayStats}>
                <View style={styles.todayStatItem}>
                  <Text style={styles.todayStatValue}>{todayStats.runs}회</Text>
                  <Text style={styles.todayStatLabel}>러닝</Text>
                </View>
                <View style={styles.todayStatItem}>
                  <Text style={styles.todayStatValue}>{formatDistance(todayStats.distance)}</Text>
                  <Text style={styles.todayStatLabel}>거리</Text>
                </View>
                <View style={styles.todayStatItem}>
                  <Text style={styles.todayStatValue}>{formatTime(todayStats.duration)}</Text>
                  <Text style={styles.todayStatLabel}>시간</Text>
                </View>
                {todayStats.avgPace && (
                  <View style={styles.todayStatItem}>
                    <Text style={styles.todayStatValue}>{formatPace(todayStats.avgPace)}</Text>
                    <Text style={styles.todayStatLabel}>평균 페이스</Text>
                  </View>
                )}
              </View>
            ) : (
              <Text style={styles.emptyText}>오늘 아직 러닝 기록이 없습니다.</Text>
            )}
          </Card.Content>
        </Card>

        {/* 주간 활동 그래프 */}
        <Card style={styles.card} mode="outlined">
          <Card.Content>
            <Text style={styles.cardTitle}>주간 활동</Text>
            {weeklyStats.length > 0 ? (
              <View style={styles.weeklyChart}>
                {weeklyStats.map((day, index) => {
                  const percentage = (day.distance || 0) / maxWeeklyDistance;
                  const date = new Date(day.date);
                  const dayName = date.toLocaleDateString('ko-KR', { weekday: 'short' });
                  const dayNum = date.getDate();

                  return (
                    <View key={index} style={styles.chartBar}>
                      <View style={styles.barContainer}>
                        <View
                          style={[
                            styles.bar,
                            { height: `${Math.max(percentage * 100, 10)}%` },
                          ]}
                        />
                      </View>
                      <Text style={styles.chartLabel}>{dayName}</Text>
                      <Text style={styles.chartValue}>{dayNum}일</Text>
                      <Text style={styles.chartDistance}>
                        {formatDistance(day.distance)}
                      </Text>
                    </View>
                  );
                })}
              </View>
            ) : (
              <Text style={styles.emptyText}>주간 기록이 없습니다.</Text>
            )}
          </Card.Content>
        </Card>

        {/* 인기 코스 TOP3 */}
        <Card style={styles.card} mode="outlined">
          <Card.Content>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>인기 코스 TOP3</Text>
              <Link href="/(tabs)/courses" asChild>
                <Button mode="text" style={styles.moreButton} compact>
                  전체 보기 →
                </Button>
              </Link>
            </View>
            
            {top3Courses.map((course, index) => (
              <View key={course.id} style={styles.courseItem}>
                <View style={styles.courseRank}>
                  <Text style={styles.rankText}>{index + 1}</Text>
                </View>
                <View style={styles.courseInfo}>
                  <View style={styles.courseHeader}>
                    <Text style={styles.courseName}>{course.name}</Text>
                    <Chip
                      style={[styles.difficultyChip, { backgroundColor: getDifficultyColor(course.difficulty) }]}
                      textStyle={styles.chipText}
                      compact
                    >
                      {getDifficultyText(course.difficulty)}
                    </Chip>
                  </View>
                  <Text style={styles.courseDescription}>{course.description}</Text>
                  <View style={styles.courseStats}>
                    <Text style={styles.courseStatText}>{formatCourseDistance(course.distance)}</Text>
                    <Text style={styles.courseStatText}>•</Text>
                    <Text style={styles.courseStatText}>{course.runnerCount.toLocaleString()}명</Text>
                    <Text style={styles.courseStatText}>•</Text>
                    <Text style={styles.courseStatText}>★ {course.rating}</Text>
                  </View>
                </View>
                <Button
                  mode="text"
                  compact
                  onPress={() => router.push(`/course/${course.id}`)}
                  style={styles.courseButton}
                >
                  →
                </Button>
              </View>
            ))}
          </Card.Content>
        </Card>

        {/* 추천 코스 */}
        <Card style={styles.card} mode="outlined">
          <Card.Content>
            <Text style={styles.cardTitle}>추천 코스</Text>
            <Text style={styles.emptyText}>위치 기반 추천 코스가 여기에 표시됩니다.</Text>
            <Link href="/(tabs)/courses" asChild>
              <Button mode="text" style={styles.moreButton}>
                코스 둘러보기 →
              </Button>
            </Link>
          </Card.Content>
        </Card>
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
    padding: spacing.xl,
    paddingTop: spacing.xl + 20,
  },
  title: {
    fontSize: typography.fontSize.xxxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.md,
    color: '#666',
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  startButton: {
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.primary,
    marginBottom: spacing.md,
  },
  buttonContent: {
    paddingVertical: spacing.md,
  },
  card: {
    borderRadius: 16,
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.md,
  },
  todayStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  todayStatItem: {
    width: '48%',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    marginBottom: spacing.sm,
  },
  todayStatValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  todayStatLabel: {
    fontSize: typography.fontSize.sm,
    color: '#666',
  },
  weeklyChart: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    marginTop: spacing.md,
    minHeight: 150,
  },
  chartBar: {
    alignItems: 'center',
    flex: 1,
  },
  barContainer: {
    width: 30,
    height: 100,
    justifyContent: 'flex-end',
    marginBottom: spacing.xs,
  },
  bar: {
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
    minHeight: 4,
  },
  chartLabel: {
    fontSize: typography.fontSize.xs,
    color: '#666',
    marginTop: spacing.xs,
  },
  chartValue: {
    fontSize: typography.fontSize.xs,
    color: '#999',
  },
  chartDistance: {
    fontSize: typography.fontSize.xs,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
    marginTop: spacing.xs,
  },
  emptyText: {
    fontSize: typography.fontSize.md,
    color: '#666',
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  courseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  courseRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  rankText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: '#fff',
  },
  courseInfo: {
    flex: 1,
  },
  courseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  courseName: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    flex: 1,
    marginRight: spacing.xs,
  },
  difficultyChip: {
    height: 20,
  },
  chipText: {
    fontSize: typography.fontSize.xs,
    color: '#fff',
  },
  courseDescription: {
    fontSize: typography.fontSize.sm,
    color: '#666',
    marginBottom: spacing.xs,
  },
  courseStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  courseStatText: {
    fontSize: typography.fontSize.xs,
    color: '#666',
  },
  courseButton: {
    minWidth: 40,
  },
  moreButton: {
    marginTop: 0,
  },
});
