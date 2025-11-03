import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList, ActivityIndicator } from 'react-native';
import { Card, Button, Searchbar, Chip } from 'react-native-paper';
import { useRouter, useFocusEffect } from 'expo-router';
import { getAllCourses, getTop3Courses } from '../../src/services/courseService';
import { spacing, typography, colors } from '../../src/theme';

export default function CoursesScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'nearby', 'popular', 'difficulty'
  const [courses, setCourses] = useState([]);
  const [top3Courses, setTop3Courses] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      loadCourses();
    }, [filter])
  );

  const loadCourses = async () => {
    setLoading(true);
    try {
      const [allCourses, top3] = await Promise.all([
        getAllCourses({ filter, searchQuery }),
        getTop3Courses(),
      ]);
      setCourses(allCourses);
      setTop3Courses(top3);
    } catch (error) {
      console.error('코스 로드 오류:', error);
      // Firebase가 설정되지 않은 경우 임시 데이터 사용
      setCourses(getMockCourses());
      setTop3Courses(getMockCourses().slice(0, 3));
    } finally {
      setLoading(false);
    }
  };

  // Firebase가 설정되지 않은 경우 임시 데이터
  const getMockCourses = () => [
    {
      id: '1',
      name: '한강 러닝 코스',
      description: '여의도에서 잠실까지 약 10km 코스',
      distance: 10000,
      difficulty: 'easy',
      runnerCount: 1250,
      rating: 4.5,
    },
    {
      id: '2',
      name: '북한산 트레일',
      description: '도심 속 자연을 느낄 수 있는 코스',
      distance: 5000,
      difficulty: 'hard',
      runnerCount: 850,
      rating: 4.8,
    },
    {
      id: '3',
      name: '올림픽공원 루프',
      description: '편안하게 즐길 수 있는 5km 루프 코스',
      distance: 5000,
      difficulty: 'easy',
      runnerCount: 2100,
      rating: 4.7,
    },
  ];

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

  const renderCourse = ({ item }) => (
    <Card style={styles.card} mode="outlined" onPress={() => {}}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <Text style={styles.courseName}>{item.name}</Text>
          <Chip
            style={[styles.difficultyChip, { backgroundColor: getDifficultyColor(item.difficulty) }]}
            textStyle={styles.chipText}
          >
            {getDifficultyText(item.difficulty)}
          </Chip>
        </View>
        <Text style={styles.courseDescription}>{item.description}</Text>
        <View style={styles.courseStats}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>거리</Text>
            <Text style={styles.statValue}>{formatDistance(item.distance)}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>러너 수</Text>
            <Text style={styles.statValue}>{item.runnerCount.toLocaleString()}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>평점</Text>
            <Text style={styles.statValue}>★ {item.rating}</Text>
          </View>
        </View>
      </Card.Content>
      <Card.Actions>
        <Button 
          onPress={() => {
            router.push(`/course/${item.id}`);
          }}
        >
          상세보기
        </Button>
        <Button 
          mode="contained" 
          onPress={() => {
            router.push({
              pathname: '/(tabs)/run',
              params: { courseId: item.id },
            });
          }}
        >
          코스로 시작
        </Button>
      </Card.Actions>
    </Card>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>코스</Text>
        <Text style={styles.subtitle}>인기 코스와 추천 코스를 만나보세요</Text>
      </View>

      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="코스 검색..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <Chip
            selected={filter === 'all'}
            onPress={() => setFilter('all')}
            style={styles.filterChip}
          >
            전체
          </Chip>
          <Chip
            selected={filter === 'popular'}
            onPress={() => setFilter('popular')}
            style={styles.filterChip}
          >
            인기
          </Chip>
          <Chip
            selected={filter === 'nearby'}
            onPress={() => setFilter('nearby')}
            style={styles.filterChip}
          >
            근처
          </Chip>
          <Chip
            selected={filter === 'difficulty'}
            onPress={() => setFilter('difficulty')}
            style={styles.filterChip}
          >
            난이도
          </Chip>
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>코스를 불러오는 중...</Text>
        </View>
      ) : (
        <>
          <View style={styles.top3Section}>
            <Text style={styles.sectionTitle}>인기 코스 TOP3</Text>
            {top3Courses.length > 0 ? (
              <FlatList
                data={top3Courses}
                renderItem={renderCourse}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                scrollEnabled={false}
              />
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>인기 코스가 없습니다.</Text>
              </View>
            )}
          </View>

          <View style={styles.allCoursesSection}>
            <Text style={styles.sectionTitle}>모든 코스</Text>
            <FlatList
              data={courses}
              renderItem={renderCourse}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.list}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>코스가 없습니다.</Text>
                </View>
              }
              refreshing={loading}
              onRefresh={loadCourses}
            />
          </View>
        </>
      )}
    </View>
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
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
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
  searchContainer: {
    padding: spacing.lg,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchbar: {
    borderRadius: 12,
  },
  filterContainer: {
    padding: spacing.md,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterChip: {
    marginRight: spacing.sm,
  },
  top3Section: {
    padding: spacing.lg,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  allCoursesSection: {
    flex: 1,
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.md,
    color: '#000',
  },
  list: {
    gap: spacing.md,
  },
  card: {
    borderRadius: 16,
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  courseName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    flex: 1,
  },
  difficultyChip: {
    height: 24,
  },
  chipText: {
    fontSize: typography.fontSize.xs,
    color: '#fff',
  },
  courseDescription: {
    fontSize: typography.fontSize.sm,
    color: '#666',
    marginBottom: spacing.md,
  },
  courseStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    color: '#666',
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: typography.fontSize.md,
    color: '#666',
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
});
