import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList, ActivityIndicator, Alert, TextInput } from 'react-native';
import { Card, Button, Searchbar, Chip, Dialog, Portal, RadioButton, Divider } from 'react-native-paper';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { getAllCourses, getTop3Courses, createCourse } from '../../src/services/courseService';
import { useAuthStore } from '../../src/stores/authStore';
import { spacing, typography, colors } from '../../src/theme';

export default function CoursesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'nearby', 'popular', 'difficulty'
  const [courses, setCourses] = useState([]);
  const [top3Courses, setTop3Courses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadDialogVisible, setUploadDialogVisible] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [courseName, setCourseName] = useState('');
  const [courseDescription, setCourseDescription] = useState('');
  const [courseDifficulty, setCourseDifficulty] = useState('medium');
  const [courseVisibility, setCourseVisibility] = useState('public');
  const [uploadRoute, setUploadRoute] = useState(null);
  const [uploadDistance, setUploadDistance] = useState(0);

  // 러닝 종료 후 코스 업로드 파라미터 처리
  useEffect(() => {
    if (params?.uploadRoute) {
      try {
        const route = JSON.parse(params.uploadRoute);
        const distance = parseFloat(params.uploadDistance || '0');
        if (route && route.length > 0) {
          setUploadRoute(route);
          setUploadDistance(distance);
          setUploadDialogVisible(true);
          // 거리 기반 기본 이름 설정
          const distanceKm = (distance / 1000).toFixed(2);
          setCourseName(`내 러닝 코스 ${distanceKm}km`);
          setCourseDescription(`러닝 기록에서 생성된 코스입니다.`);
        }
      } catch (error) {
        console.error('코스 업로드 파라미터 파싱 오류:', error);
      }
    }
  }, [params?.uploadRoute]);

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

  const handleUploadCourse = async () => {
    if (!courseName.trim()) {
      Alert.alert('오류', '코스 이름을 입력해주세요.');
      return;
    }

    if (!user) {
      Alert.alert('오류', '로그인이 필요합니다.');
      return;
    }

    setUploading(true);
    try {
      // 저장된 업로드 경로 사용
      const route = uploadRoute || [];
      const distance = uploadDistance || 0;

      if (route.length === 0) {
        Alert.alert('오류', '업로드할 경로가 없습니다. 먼저 러닝을 완료해주세요.');
        setUploading(false);
        return;
      }

      // 좌표 배열로 변환
      const coordinates = route.map((point) => ({
        lat: point.lat,
        lng: point.lng,
      }));

      // 코스 데이터 생성
      const courseData = {
        userId: user.id,
        name: courseName.trim(),
        description: courseDescription.trim() || '',
        coordinates,
        distance,
        difficulty: courseDifficulty,
        visibility: courseVisibility,
        runnerCount: 0,
        rating: 0,
        reviewCount: 0,
      };

      // Firestore에 코스 저장
      const courseId = await createCourse(courseData);
      
      Alert.alert(
        '업로드 완료',
        '코스가 성공적으로 업로드되었습니다!',
        [
          {
            text: '확인',
            onPress: () => {
              setUploadDialogVisible(false);
              setCourseName('');
              setCourseDescription('');
              setCourseDifficulty('medium');
              setCourseVisibility('public');
              setUploadRoute(null);
              setUploadDistance(0);
              loadCourses();
            },
          },
        ]
      );
    } catch (error) {
      console.error('코스 업로드 오류:', error);
      Alert.alert(
        '업로드 실패',
        error.message || '코스 업로드 중 오류가 발생했습니다. 다시 시도해주세요.'
      );
    } finally {
      setUploading(false);
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
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <Text style={styles.title}>코스</Text>
            <Text style={styles.subtitle}>인기 코스와 추천 코스를 만나보세요</Text>
          </View>
          {user && (
            <Button
              mode="contained"
              icon="upload"
              onPress={() => setUploadDialogVisible(true)}
              style={styles.uploadButton}
              compact
            >
              업로드
            </Button>
          )}
        </View>
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

      <Portal>
        <Dialog visible={uploadDialogVisible} onDismiss={() => setUploadDialogVisible(false)}>
          <Dialog.Title>코스 업로드</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="코스 이름"
              value={courseName}
              onChangeText={setCourseName}
              style={styles.dialogInput}
              mode="outlined"
            />
            <TextInput
              label="설명 (선택)"
              value={courseDescription}
              onChangeText={setCourseDescription}
              style={styles.dialogInput}
              mode="outlined"
              multiline
              numberOfLines={3}
            />
            <Text style={styles.dialogLabel}>난이도</Text>
            <RadioButton.Group
              onValueChange={setCourseDifficulty}
              value={courseDifficulty}
            >
              <RadioButton.Item label="쉬움" value="easy" />
              <RadioButton.Item label="보통" value="medium" />
              <RadioButton.Item label="어려움" value="hard" />
            </RadioButton.Group>
            <Divider style={styles.dialogDivider} />
            <Text style={styles.dialogLabel}>공개 설정</Text>
            <RadioButton.Group
              onValueChange={setCourseVisibility}
              value={courseVisibility}
            >
              <RadioButton.Item label="공개" value="public" />
              <RadioButton.Item label="비공개" value="private" />
            </RadioButton.Group>
            <Text style={styles.dialogHint}>
              현재 러닝 중인 경로를 코스로 업로드할 수 있습니다. 러닝 화면에서 "코스 업로드"를 선택하세요.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setUploadDialogVisible(false)}>취소</Button>
            <Button
              mode="contained"
              onPress={handleUploadCourse}
              loading={uploading}
              disabled={!courseName.trim() || uploading}
            >
              업로드
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  uploadButton: {
    marginLeft: spacing.md,
  },
  dialogInput: {
    marginBottom: spacing.md,
  },
  dialogLabel: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  dialogDivider: {
    marginVertical: spacing.md,
  },
  dialogHint: {
    fontSize: typography.fontSize.sm,
    color: '#666',
    marginTop: spacing.md,
    fontStyle: 'italic',
  },
});
