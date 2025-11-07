import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Card, Button, Chip, Divider, Surface } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getCourseById } from '../../src/services/courseService';
import { RunMapView } from '../../src/components/MapView';
import { RunMapView as RunMapViewWeb } from '../../src/components/MapView.web';
import { spacing, typography, colors } from '../../src/theme';

export default function CourseDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCourse();
  }, [id]);

  const loadCourse = async () => {
    setLoading(true);
    try {
      const courseData = await getCourseById(id);
      if (courseData) {
        setCourse(courseData);
      } else {
        // Firebase에서 가져오지 못한 경우 임시 데이터 사용
        setCourse(getMockCourse());
      }
    } catch (error) {
      console.error('코스 로드 오류:', error);
      setCourse(getMockCourse());
    } finally {
      setLoading(false);
    }
  };

  // 임시 데이터 (Firebase가 설정되지 않은 경우)
  const getMockCourse = () => ({
    id: id || '1',
    name: '한강 러닝 코스',
    description: '여의도에서 잠실까지 이어지는 서울의 대표적인 러닝 코스입니다. 한강을 따라 달리며 아름다운 풍경을 감상할 수 있습니다.',
    distance: 10000,
    difficulty: 'easy',
    runnerCount: 1250,
    rating: 4.5,
    reviewCount: 89,
    coordinates: [
      { lat: 37.5295, lng: 126.9344 }, // 여의도
      { lat: 37.5320, lng: 126.9400 },
      { lat: 37.5350, lng: 126.9450 },
      { lat: 37.5380, lng: 126.9500 },
      { lat: 37.5410, lng: 126.9550 },
      { lat: 37.5440, lng: 126.9600 },
      { lat: 37.5470, lng: 126.9650 },
      { lat: 37.5500, lng: 126.9700 },
      { lat: 37.5530, lng: 126.9750 },
      { lat: 37.5560, lng: 126.9800 },
      { lat: 37.5590, lng: 126.9850 },
      { lat: 37.5610, lng: 126.9900 }, // 잠실 근처
    ],
    startPoint: { lat: 37.5295, lng: 126.9344 },
    endPoint: { lat: 37.5610, lng: 126.9900 },
    createdAt: '2024-01-15',
    createdBy: '러너123',
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>코스를 불러오는 중...</Text>
      </View>
    );
  }

  if (!course) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>코스를 찾을 수 없습니다.</Text>
      </View>
    );
  }

  const formatDistance = (meters) => {
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

  const handleStartRun = () => {
    // 코스 좌표를 러닝 스토어에 설정하고 러닝 화면으로 이동
    router.push({
      pathname: '/(tabs)/run',
      params: { courseId: id },
    });
  };

  const route = (course.coordinates || []).map((coord, index) => ({
    lat: coord.lat,
    lng: coord.lng,
    timestamp: Date.now() + index * 1000,
  }));

  const MapComponent = Platform.OS === 'web' ? RunMapViewWeb : RunMapView;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.mapContainer}>
        <MapComponent route={route} />
      </View>

      <View style={styles.content}>
        <Card style={styles.card} mode="outlined">
          <Card.Content>
            <View style={styles.header}>
              <View style={styles.titleContainer}>
                <Text style={styles.title}>{course.name}</Text>
                <Chip
                  style={[styles.difficultyChip, { backgroundColor: getDifficultyColor(course.difficulty) }]}
                  textStyle={styles.chipText}
                >
                  {getDifficultyText(course.difficulty)}
                </Chip>
              </View>
            </View>

            <Text style={styles.description}>{course.description || ''}</Text>

            <Divider style={styles.divider} />

            <View style={styles.statsGrid}>
              <View style={styles.statBlock}>
                <Text style={styles.statValue}>{formatDistance(course.distance || 0)}</Text>
                <Text style={styles.statLabel}>거리</Text>
              </View>
              <View style={styles.statBlock}>
                <Text style={styles.statValue}>{(course.runnerCount || 0).toLocaleString()}</Text>
                <Text style={styles.statLabel}>러너 수</Text>
              </View>
              <View style={styles.statBlock}>
                <Text style={styles.statValue}>★ {course.rating || 0}</Text>
                <Text style={styles.statLabel}>평점</Text>
              </View>
              <View style={styles.statBlock}>
                <Text style={styles.statValue}>{course.reviewCount || 0}</Text>
                <Text style={styles.statLabel}>리뷰</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card} mode="outlined">
          <Card.Content>
            <Text style={styles.cardTitle}>코스 정보</Text>
            <Divider style={styles.divider} />
            
            {route.length > 0 && (
              <>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>시작점</Text>
                  <Text style={styles.infoValue}>
                    {route[0].lat.toFixed(6)}, {route[0].lng.toFixed(6)}
                  </Text>
                </View>
                
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>종료점</Text>
                  <Text style={styles.infoValue}>
                    {route[route.length - 1].lat.toFixed(6)}, {route[route.length - 1].lng.toFixed(6)}
                  </Text>
                </View>
                
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>경로 포인트</Text>
                  <Text style={styles.infoValue}>{route.length}개</Text>
                </View>
              </>
            )}

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>생성일</Text>
              <Text style={styles.infoValue}>
                {course.createdAt
                  ? new Date(course.createdAt).toLocaleDateString('ko-KR')
                  : '-'}
              </Text>
            </View>

            {course.userId && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>생성자</Text>
                <Text style={styles.infoValue}>ID: {course.userId}</Text>
              </View>
            )}
          </Card.Content>
        </Card>

        <Card style={styles.card} mode="outlined">
          <Card.Content>
            <Text style={styles.cardTitle}>리뷰</Text>
            <Divider style={styles.divider} />
            <Text style={styles.emptyText}>리뷰 시스템 준비 중...</Text>
          </Card.Content>
        </Card>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          onPress={handleStartRun}
          style={styles.startButton}
          activeOpacity={0.8}
        >
          <Text style={styles.startButtonText}>이 코스로 러닝 시작</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.light,
  },
  mapContainer: {
    height: 300,
    backgroundColor: '#e0e0e0',
  },
  content: {
    padding: spacing.lg,
  },
  card: {
    borderRadius: 16,
    marginBottom: spacing.md,
  },
  header: {
    marginBottom: spacing.md,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    flex: 1,
    marginRight: spacing.sm,
  },
  difficultyChip: {
    height: 28,
  },
  chipText: {
    fontSize: typography.fontSize.xs,
    color: '#fff',
  },
  description: {
    fontSize: typography.fontSize.md,
    color: '#666',
    lineHeight: 24,
    marginBottom: spacing.md,
  },
  divider: {
    marginVertical: spacing.md,
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
  cardTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  infoLabel: {
    fontSize: typography.fontSize.md,
    color: '#666',
  },
  infoValue: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
  },
  emptyText: {
    fontSize: typography.fontSize.md,
    color: '#666',
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  footer: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  startButton: {
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center', // 세로 정렬 중앙
    alignItems: 'center',     // 가로 정렬 중앙
    elevation: 0, // Android 그림자 제거
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    includeFontPadding: false, // Android 폰트 패딩 제거
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    fontSize: typography.fontSize.md,
    color: '#666',
    marginTop: spacing.md,
  },
  errorText: {
    fontSize: typography.fontSize.lg,
    color: colors.error,
    textAlign: 'center',
    padding: spacing.xl,
  },
});

