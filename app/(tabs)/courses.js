import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList, ActivityIndicator, Alert, TextInput, TouchableOpacity, Platform } from 'react-native';
import { Card, Button, Searchbar, Chip, Dialog, Portal, RadioButton, Divider } from 'react-native-paper';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { getAllCourses, getTop3Courses, createCourse } from '../../src/services/courseService';
import { useAuthStore } from '../../src/stores/authStore';
import { spacing, typography, colors } from '../../src/theme';
import { getRunningRoutesFromOSM, getPopularRoutesFromOSM } from '../../src/services/openStreetMapService';
import { parseGPXSimple, parseGPXFromURL } from '../../src/utils/gpxParser';

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
  const [importDialogVisible, setImportDialogVisible] = useState(false);
  const [importingOSM, setImportingOSM] = useState(false);
  const [importingGPX, setImportingGPX] = useState(false);
  const [gpxUrl, setGpxUrl] = useState('');
  const [gpxFileContent, setGpxFileContent] = useState('');

  // 다이얼로그 상태 디버깅
  useEffect(() => {
    console.log('[Courses] importDialogVisible 상태 변경:', importDialogVisible);
  }, [importDialogVisible]);

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

  // OpenStreetMap에서 코스 가져오기
  const handleImportFromOSM = async () => {
    setImportingOSM(true);
    try {
      console.log('[Courses] OpenStreetMap에서 코스 가져오기 시작');
      
      // Location 모듈 동적 import (Android 호환성)
      const LocationModule = await import('expo-location');
      const Location = LocationModule.default || LocationModule;
      
      // 현재 위치 가져오기
      console.log('[Courses] 위치 권한 요청 중...');
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('권한 필요', '위치 정보 접근 권한이 필요합니다.');
        setImportingOSM(false);
        return;
      }

      console.log('[Courses] 현재 위치 가져오는 중...');
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = location.coords;
      console.log('[Courses] 현재 위치:', latitude, longitude);

      // OpenStreetMap에서 경로 가져오기
      console.log('[Courses] OpenStreetMap API 호출 중...');
      const routes = await getPopularRoutesFromOSM(latitude, longitude, 5);
      console.log('[Courses] 찾은 경로 수:', routes.length);

      if (routes.length === 0) {
        Alert.alert(
          '알림', 
          '주변에 러닝 경로를 찾을 수 없습니다.\n\n다른 방법을 시도해보세요:\n- GPX 파일 가져오기\n- 수동으로 코스 업로드'
        );
        setImportingOSM(false);
        return;
      }

      // 첫 번째 경로를 코스로 업로드
      const route = routes[0];
      console.log('[Courses] 선택한 경로:', route.name, route.distance, 'm');
      
      if (!user) {
        Alert.alert('오류', '코스를 저장하려면 로그인이 필요합니다.');
        setImportingOSM(false);
        return;
      }

      const courseData = {
        userId: user.id,
        name: route.name,
        description: route.description,
        coordinates: route.coordinates,
        distance: route.distance,
        difficulty: route.difficulty,
        visibility: 'public',
        runnerCount: 0,
        rating: 0,
        reviewCount: 0,
      };

      console.log('[Courses] Firestore에 코스 저장 중...');
      try {
        await createCourse(courseData);
        console.log('[Courses] 코스 저장 완료');
        
        Alert.alert(
          '가져오기 완료',
          `${route.name} 코스(${(route.distance / 1000).toFixed(2)}km)를 성공적으로 가져왔습니다!`,
          [
            {
              text: '확인',
              onPress: () => {
                setImportDialogVisible(false);
                loadCourses();
              },
            },
          ]
        );
      } catch (createError) {
        console.error('[Courses] 코스 저장 오류:', createError);
        Alert.alert(
          '저장 실패',
          `코스를 가져왔지만 저장에 실패했습니다.\n\n오류: ${createError.message || '알 수 없는 오류'}\n\nFirestore가 설정되지 않았을 수 있습니다.`
        );
      }
    } catch (error) {
      console.error('[Courses] OSM 가져오기 오류:', error);
      Alert.alert(
        '오류', 
        `코스를 가져오는 중 오류가 발생했습니다.\n\n${error.message || '알 수 없는 오류'}\n\n다른 방법을 시도해보세요:\n- GPX 파일 가져오기\n- 수동으로 코스 업로드`
      );
    } finally {
      setImportingOSM(false);
    }
  };

  // GPX 파일에서 코스 가져오기
  const handleImportFromGPX = async () => {
    if (!gpxUrl.trim() && !gpxFileContent.trim()) {
      Alert.alert('오류', 'GPX URL 또는 파일 내용을 입력해주세요.');
      return;
    }

    setImportingGPX(true);
    try {
      console.log('[Courses] GPX 파일 가져오기 시작');
      let courseData;

      if (gpxUrl.trim()) {
        console.log('[Courses] GPX URL에서 가져오기:', gpxUrl);
        // URL에서 GPX 파일 가져오기
        courseData = await parseGPXFromURL(gpxUrl);
      } else if (gpxFileContent.trim()) {
        console.log('[Courses] GPX 파일 내용 파싱 중...');
        // 파일 내용 파싱
        courseData = parseGPXSimple(gpxFileContent);
      }

      console.log('[Courses] GPX 파싱 완료:', courseData.name, courseData.distance, 'm');

      if (!user) {
        Alert.alert('오류', '코스를 저장하려면 로그인이 필요합니다.');
        setImportingGPX(false);
        return;
      }

      const finalCourseData = {
        userId: user.id,
        ...courseData,
        visibility: 'public',
      };

      console.log('[Courses] Firestore에 코스 저장 중...');
      try {
        await createCourse(finalCourseData);
        console.log('[Courses] 코스 저장 완료');
        
        Alert.alert(
          '가져오기 완료',
          `${courseData.name} 코스(${(courseData.distance / 1000).toFixed(2)}km)를 성공적으로 가져왔습니다!`,
          [
            {
              text: '확인',
              onPress: () => {
                setImportDialogVisible(false);
                setGpxUrl('');
                setGpxFileContent('');
                loadCourses();
              },
            },
          ]
        );
      } catch (createError) {
        console.error('[Courses] 코스 저장 오류:', createError);
        Alert.alert(
          '저장 실패',
          `GPX 파일을 파싱했지만 저장에 실패했습니다.\n\n오류: ${createError.message || '알 수 없는 오류'}\n\nFirestore가 설정되지 않았을 수 있습니다.`
        );
      }
    } catch (error) {
      console.error('[Courses] GPX 가져오기 오류:', error);
      Alert.alert(
        '오류', 
        `GPX 파일을 파싱하는 중 오류가 발생했습니다.\n\n${error.message || '알 수 없는 오류'}\n\nGPX 파일 형식이 올바른지 확인해주세요.`
      );
    } finally {
      setImportingGPX(false);
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
          <View style={styles.headerButtons}>
            <TouchableOpacity
              onPress={() => {
                console.log('=== 가져오기 버튼 클릭 시작 ===');
                Alert.alert('테스트', '가져오기 버튼이 클릭되었습니다!');
                
                console.log('[Courses] 가져오기 버튼 클릭됨');
                console.log('[Courses] 현재 user:', user);
                console.log('[Courses] 현재 importDialogVisible:', importDialogVisible);
                
                if (!user) {
                  console.log('[Courses] 로그인 필요 - Alert 표시');
                  Alert.alert('로그인 필요', '코스를 가져오려면 로그인이 필요합니다.');
                  return;
                }
                
                console.log('[Courses] 다이얼로그 열기 시도');
                setImportDialogVisible(true);
                console.log('[Courses] setImportDialogVisible(true) 호출 완료');
              }}
              style={[styles.importButtonTouchable, styles.importButton]}
            >
              <Text style={styles.importButtonText}>가져오기</Text>
            </TouchableOpacity>
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

        <Dialog 
          visible={importDialogVisible} 
          onDismiss={() => {
            console.log('[Courses] 다이얼로그 닫기');
            if (!importingOSM && !importingGPX) {
              setImportDialogVisible(false);
              setGpxUrl('');
              setGpxFileContent('');
            }
          }}
        >
          <Dialog.Title>코스 가져오기</Dialog.Title>
          <Dialog.Content>
            {(importingOSM || importingGPX) && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>
                  {importingOSM ? 'OpenStreetMap에서 경로를 찾는 중...' : 'GPX 파일을 처리하는 중...'}
                </Text>
              </View>
            )}
            <Text style={styles.dialogLabel}>방법 선택</Text>
            <View style={styles.importMethods}>
              <Button
                mode="outlined"
                icon="map"
                onPress={() => {
                  console.log('[Courses] OpenStreetMap 가져오기 버튼 클릭');
                  handleImportFromOSM();
                }}
                style={styles.importMethodButton}
                loading={importingOSM}
                disabled={importingOSM || importingGPX}
              >
                OpenStreetMap에서 가져오기
              </Button>
              <Text style={styles.methodDescription}>
                현재 위치 주변의 러닝 경로를 자동으로 찾아 가져옵니다.
              </Text>
            </View>

            <Divider style={styles.dialogDivider} />

            <Text style={styles.dialogLabel}>GPX 파일 가져오기</Text>
            <TextInput
              label="GPX 파일 URL"
              value={gpxUrl}
              onChangeText={setGpxUrl}
              style={styles.dialogInput}
              mode="outlined"
              placeholder="https://example.com/running-course.gpx"
            />
            <Text style={styles.dialogHint}>또는</Text>
            <TextInput
              label="GPX 파일 내용 (XML)"
              value={gpxFileContent}
              onChangeText={setGpxFileContent}
              style={styles.dialogInput}
              mode="outlined"
              multiline
              numberOfLines={5}
              placeholder="<gpx>...</gpx>"
            />
            <Button
              mode="contained"
              icon="file-upload"
              onPress={() => {
                console.log('[Courses] GPX 가져오기 버튼 클릭');
                handleImportFromGPX();
              }}
              style={styles.importGPXButton}
              loading={importingGPX}
              disabled={importingGPX || importingOSM || (!gpxUrl.trim() && !gpxFileContent.trim())}
            >
              GPX 파일 가져오기
            </Button>
            <Text style={styles.dialogHint}>
              GPX 파일은 Wikiloc, AllTrails 등에서 다운로드할 수 있습니다.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button 
              onPress={() => {
                if (!importingOSM && !importingGPX) {
                  setImportDialogVisible(false);
                  setGpxUrl('');
                  setGpxFileContent('');
                }
              }}
              disabled={importingOSM || importingGPX}
            >
              취소
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
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  uploadButton: {
    marginLeft: spacing.sm,
  },
  importButton: {
    marginLeft: 0,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: 'transparent',
  },
  importButtonTouchable: {
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  importButtonText: {
    color: colors.primary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  importMethods: {
    marginBottom: spacing.md,
  },
  importMethodButton: {
    marginBottom: spacing.xs,
  },
  methodDescription: {
    fontSize: typography.fontSize.sm,
    color: '#666',
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  importGPXButton: {
    marginTop: spacing.md,
  },
  loadingOverlay: {
    alignItems: 'center',
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.sm,
    color: '#666',
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
