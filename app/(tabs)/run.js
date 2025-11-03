import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform, Alert } from 'react-native';
import { Button, Card, Surface } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useLocationPermission } from '../../src/hooks/useLocationPermission';
import { useRunningTracker } from '../../src/hooks/useRunningTracker';
import { useRunStore } from '../../src/stores/runStore';
import { useAuthStore } from '../../src/stores/authStore';
import { RunMapView } from '../../src/components/MapView';
import { saveRunningSession } from '../../src/db/sessionRepository';
import { getUserStats } from '../../src/db/statsRepository';
import { getUserRewards, saveReward } from '../../src/db/rewardsRepository';
import { syncRunningSession } from '../../src/services/sessionSyncService';
import { checkRewards } from '../../src/utils/rewardSystem';
import { spacing, typography } from '../../src/theme';

export default function RunScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { granted, status } = useLocationPermission();
  const { start, pause, resume, stop } = useRunningTracker();
  const { isRunning, isPaused, distance, duration, pace, maxSpeed, route, startTime } = useRunStore();
  const { user } = useAuthStore();
  const [saving, setSaving] = useState(false);
  const [courseMode, setCourseMode] = useState(false);
  const [courseRoute, setCourseRoute] = useState([]);

  // 코스 모드 확인
  useEffect(() => {
    if (params.courseId) {
      // 코스 데이터 로드 (임시 데이터)
      const mockCourse = {
        id: params.courseId,
        coordinates: [
          { lat: 37.5295, lng: 126.9344 },
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
          { lat: 37.5610, lng: 126.9900 },
        ],
      };
      setCourseRoute(
        mockCourse.coordinates.map((coord, index) => ({
          lat: coord.lat,
          lng: coord.lng,
          timestamp: Date.now() + index * 1000,
        }))
      );
      setCourseMode(true);
    }
  }, [params.courseId]);

  const formatDistance = (meters) => {
    if (meters < 1000) return `${Math.round(meters)}m`;
    return `${(meters / 1000).toFixed(2)}km`;
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatPace = (secPerKm) => {
    if (!secPerKm || secPerKm === 0) return '--:--';
    const mins = Math.floor(secPerKm / 60);
    const secs = Math.round(secPerKm % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}/km`;
  };

  const calculateCalories = (distance, duration) => {
    // 간단한 칼로리 계산 공식 (몸무게 70kg 기준, 러닝 속도 10km/h 가정)
    const weight = 70; // kg
    const speed = distance / (duration / 3600); // m/s를 km/h로 변환
    const met = 6; // 러닝 MET 값
    const calories = (weight * met * duration) / 3600;
    return Math.round(calories);
  };

  const handleStart = () => {
    start();
  };

  const handlePause = () => {
    pause();
  };

  const handleResume = () => {
    resume();
  };

  const handleStop = async () => {
    // 50미터 이하는 저장하지 않고 바로 종료
    if (distance < 50) {
      Alert.alert(
        '러닝 종료',
        `${formatDistance(distance)}, ${formatTime(duration)} 러닝하셨습니다.\n거리가 50m 미만이라 저장되지 않습니다.`,
        [
          {
            text: '확인',
            onPress: () => {
              useRunStore.getState().reset();
            },
          },
        ]
      );
      return;
    }

    // 50미터 이상은 사용자에게 저장 여부 확인
    Alert.alert(
      '러닝 종료',
      `총 ${formatDistance(distance)}, ${formatTime(duration)} 러닝하셨습니다.\n저장하시겠습니까?`,
      [
        {
          text: '저장 안 함',
          style: 'destructive',
          onPress: () => {
            useRunStore.getState().reset();
          },
        },
        {
          text: '저장',
          onPress: async () => {
            setSaving(true);
            try {
              const endTime = Date.now();
              const calories = calculateCalories(distance, duration);
              
              // 로컬 저장
              const sessionId = await saveRunningSession(
                {
                  userId: user?.id || null,
                  type: 'solo',
                  distance,
                  duration,
                  avgPace: pace > 0 ? pace : null,
                  maxSpeed: maxSpeed > 0 ? maxSpeed : null,
                  calories,
                  startTime: Math.floor(startTime / 1000),
                  endTime: Math.floor(endTime / 1000),
                },
                route
              );

              // 클라우드 동기화 (로그인한 사용자만)
              if (user?.id) {
                try {
                  await syncRunningSession(
                    {
                      userId: user.id,
                      type: 'solo',
                      distance,
                      duration,
                      avgPace: pace > 0 ? pace : null,
                      maxSpeed: maxSpeed > 0 ? maxSpeed : null,
                      calories,
                      startTime: Math.floor(startTime / 1000),
                      endTime: Math.floor(endTime / 1000),
                    },
                    route
                  );
                } catch (syncError) {
                  console.warn('클라우드 동기화 실패 (로컬 저장은 완료):', syncError);
                }
              }

              // 메달 체크
              const [updatedStats, achievedRewards] = await Promise.all([
                getUserStats(user?.id || null),
                getUserRewards(user?.id || null),
              ]);
              
              const { newRewards } = checkRewards(updatedStats, achievedRewards);
              
              // 새로운 메달 저장
              if (newRewards.length > 0) {
                await Promise.all(
                  newRewards.map((reward) => saveReward(user?.id || null, reward.id))
                );
              }

              // 상태 리셋
              useRunStore.getState().reset();
              
              // 메달 획득 시 특별 메시지
              if (newRewards.length > 0) {
                const rewardTitles = newRewards.map((r) => r.title).join(', ');
                Alert.alert(
                  '메달 획득! 🎉',
                  `${rewardTitles} 메달을 획득하셨습니다!`,
                  [
                    { text: '확인', onPress: () => router.push('/(tabs)/records') },
                  ]
                );
              } else {
                Alert.alert('저장 완료', '러닝 기록이 저장되었습니다.', [
                  { text: '확인', onPress: () => router.push('/(tabs)/records') },
                ]);
              }
            } catch (error) {
              console.error('저장 실패:', error);
              Alert.alert('저장 실패', '기록 저장 중 오류가 발생했습니다.');
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {granted ? (
        <>
          <View style={styles.mapContainer}>
            <RunMapView 
              route={isRunning ? route : (courseMode ? courseRoute : [])} 
              currentLocation={isRunning} 
            />
            {courseMode && !isRunning && (
              <View style={styles.courseModeBadge}>
                <Text style={styles.courseModeText}>코스 모드</Text>
              </View>
            )}
          </View>

          <Surface style={styles.statsContainer} elevation={2}>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>거리</Text>
                <Text style={styles.statValue}>{formatDistance(distance)}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>시간</Text>
                <Text style={styles.statValue}>{formatTime(duration)}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>페이스</Text>
                <Text style={styles.statValue}>{formatPace(pace)}</Text>
              </View>
            </View>
          </Surface>

          <View style={styles.controlsContainer}>
            {!isRunning && !isPaused ? (
              <Button
                mode="contained"
                onPress={handleStart}
                style={styles.startButton}
                contentStyle={styles.buttonContent}
                disabled={saving}
              >
                러닝 시작
              </Button>
            ) : (
              <View style={styles.runningControls}>
                {isPaused ? (
                  <Button
                    mode="contained"
                    onPress={handleResume}
                    style={styles.resumeButton}
                  >
                    재개
                  </Button>
                ) : (
                  <Button
                    mode="outlined"
                    onPress={handlePause}
                    style={styles.controlButton}
                  >
                    일시정지
                  </Button>
                )}
                <Button
                  mode="contained"
                  onPress={handleStop}
                  style={styles.stopButton}
                  disabled={saving}
                  loading={saving}
                >
                  {saving ? '저장 중...' : '종료'}
                </Button>
              </View>
            )}
          </View>
        </>
      ) : (
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>
            GPS 권한이 필요합니다.{'\n'}
            설정에서 위치 권한을 허용해주세요.
          </Text>
          <Text style={styles.statusText}>상태: {status ?? '요청 중...'}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapContainer: {
    flex: 1,
    ...(Platform.OS === 'web' && { minHeight: 400 }),
  },
  statsContainer: {
    padding: spacing.lg,
    backgroundColor: '#fff',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: typography.fontSize.sm,
    color: '#666',
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: '#000',
  },
  controlsContainer: {
    padding: spacing.lg,
    backgroundColor: '#fff',
  },
  startButton: {
    height: 56,
    borderRadius: 16,
  },
  buttonContent: {
    paddingVertical: spacing.md,
  },
  runningControls: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  controlButton: {
    flex: 1,
    height: 56,
    borderRadius: 16,
  },
  resumeButton: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#4CAF50',
  },
  stopButton: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#F44336',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  permissionText: {
    fontSize: typography.fontSize.md,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  statusText: {
    fontSize: typography.fontSize.sm,
    color: '#666',
  },
  courseModeBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#FF7A00',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
  },
  courseModeText: {
    color: '#fff',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
});
