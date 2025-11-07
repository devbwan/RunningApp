import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Platform, Alert, TouchableOpacity } from 'react-native';
import { Button, Card, Surface, IconButton } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Speech from 'expo-speech';
import { useLocationPermission } from '../../src/hooks/useLocationPermission';
import { useRunningTracker } from '../../src/hooks/useRunningTracker';
import { useRunStore } from '../../src/stores/runStore';
import { useAuthStore } from '../../src/stores/authStore';
import { RunMapView } from '../../src/components/MapView';
import { saveRunningSession } from '../../src/db/sessionRepository';
import { getUserStats } from '../../src/db/statsRepository';
import { getUserRewards, saveReward } from '../../src/db/rewardsRepository';
import { syncRunningSession } from '../../src/services/sessionSyncService';
import { saveRunningSessionToHealth } from '../../src/services/healthService';
import { checkRewards } from '../../src/utils/rewardSystem';
import { spacing, typography, colors } from '../../src/theme';

export default function RunScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { granted, status } = useLocationPermission();
  const { start, pause, resume, stop } = useRunningTracker();
  const { isRunning, isPaused, distance, duration, pace, maxSpeed, route, startTime, cadence } = useRunStore();
  const [avgPace, setAvgPace] = useState(0);
  const [calories, setCalories] = useState(0);
  const { user } = useAuthStore();
  const [saving, setSaving] = useState(false);
  const [courseMode, setCourseMode] = useState(false);
  const [courseRoute, setCourseRoute] = useState([]);
  const [voiceGuideEnabled, setVoiceGuideEnabled] = useState(true);
  const lastAnnouncedKm = useRef(0);

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
    const speed = duration > 0 ? (distance / 1000) / (duration / 3600) : 0; // km/h
    // MET 값은 속도에 따라 달라짐 (5km/h: 8, 8km/h: 11.5, 10km/h: 14.5)
    let met = 6;
    if (speed < 6) met = 8;
    else if (speed < 8) met = 9.5;
    else if (speed < 10) met = 11.5;
    else met = 14.5;
    
    const calories = (weight * met * duration) / 3600;
    return Math.round(calories);
  };

  const formatCadence = (stepsPerMin) => {
    if (!stepsPerMin || stepsPerMin === 0) return '--';
    return `${stepsPerMin}`;
  };

  // 평균 페이스 및 칼로리 실시간 업데이트
  useEffect(() => {
    if (isRunning && duration > 0 && distance > 0) {
      // 평균 페이스 계산
      const avgPaceValue = Math.round((duration / distance) * 1000);
      setAvgPace(avgPaceValue);
      
      // 칼로리 계산
      const cal = calculateCalories(distance, duration);
      setCalories(cal);
      
      // 캐던스 업데이트
      useRunStore.getState().updateCadence();
    } else if (!isRunning) {
      setAvgPace(0);
      setCalories(0);
      lastAnnouncedKm.current = 0; // 러닝 종료 시 초기화
    }
  }, [isRunning, distance, duration]);

  // 음성 가이드: 1km마다 알림
  useEffect(() => {
    if (!isRunning || !voiceGuideEnabled || distance < 1000) {
      return;
    }

    const currentKm = Math.floor(distance / 1000);
    const lastKm = lastAnnouncedKm.current;

    // 1km 단위로 증가했을 때만 알림
    if (currentKm > lastKm) {
      lastAnnouncedKm.current = currentKm;
      
      // 음성 알림 생성
      const paceInKm = avgPace > 0 ? avgPace : (pace > 0 ? pace : 0);
      const paceMin = Math.floor(paceInKm / 60);
      const paceSec = Math.round(paceInKm % 60);
      const paceText = paceInKm > 0 ? `${paceMin}분 ${paceSec}초` : '';
      
      const message = `현재 ${currentKm}킬로미터를 달렸습니다. ${paceText ? `페이스 ${paceText} 킬로미터` : ''}`;
      
      // expo-speech 사용 (웹에서는 Web Speech API 사용)
      if (Platform.OS === 'web') {
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(message);
          utterance.lang = 'ko-KR';
          utterance.rate = 1.0;
          utterance.pitch = 1.0;
          window.speechSynthesis.speak(utterance);
        }
      } else {
        Speech.speak(message, {
          language: 'ko-KR',
          pitch: 1.0,
          rate: 1.0,
        });
      }
    }
  }, [isRunning, distance, voiceGuideEnabled, avgPace, pace]);

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
    console.log('[Run] 종료 버튼 클릭됨');
    console.log('[Run] 현재 상태:', { distance, duration, isRunning, isPaused, saving });
    
    // 저장 중이면 무시
    if (saving) {
      console.log('[Run] 저장 중이므로 종료 무시');
      return;
    }
    
    try {
      // 50미터 이하는 저장하지 않고 바로 종료
      if (distance < 50) {
        console.log('[Run] 거리 50m 미만 - 바로 종료');
        
        // Android 호환성을 위해 Promise로 래핑
        const result = await new Promise((resolve) => {
          if (Platform.OS === 'web' && typeof window !== 'undefined' && window.confirm) {
            const confirmed = window.confirm(
              `${formatDistance(distance)}, ${formatTime(duration)} 러닝하셨습니다.\n거리가 50m 미만이라 저장되지 않습니다.\n종료하시겠습니까?`
            );
            resolve(confirmed);
          } else {
            Alert.alert(
              '러닝 종료',
              `${formatDistance(distance)}, ${formatTime(duration)} 러닝하셨습니다.\n거리가 50m 미만이라 저장되지 않습니다.`,
              [
                {
                  text: '확인',
                  onPress: () => resolve(true),
                },
                {
                  text: '취소',
                  style: 'cancel',
                  onPress: () => resolve(false),
                },
              ],
              { cancelable: true, onDismiss: () => resolve(false) }
            );
          }
        });
        
        if (result) {
          console.log('[Run] 상태 리셋');
          stop(); // useRunningTracker의 stop 호출
          useRunStore.getState().reset();
        }
        return;
      }

      // 50미터 이상은 사용자에게 저장 여부 확인
      console.log('[Run] 거리 50m 이상 - 저장 여부 확인');
      
      const saveResult = await new Promise((resolve) => {
        if (Platform.OS === 'web' && typeof window !== 'undefined' && window.confirm) {
          const shouldSave = window.confirm(
            `총 ${formatDistance(distance)}, ${formatTime(duration)} 러닝하셨습니다.\n저장하시겠습니까?`
          );
          resolve(shouldSave ? 'save' : 'discard');
        } else {
          Alert.alert(
            '러닝 종료',
            `총 ${formatDistance(distance)}, ${formatTime(duration)} 러닝하셨습니다.\n저장하시겠습니까?`,
            [
              {
                text: '저장 안 함',
                style: 'destructive',
                onPress: () => resolve('discard'),
              },
              {
                text: '저장',
                onPress: () => resolve('save'),
              },
              {
                text: '취소',
                style: 'cancel',
                onPress: () => resolve('cancel'),
              },
            ],
            { cancelable: true, onDismiss: () => resolve('cancel') }
          );
        }
      });
      
      if (saveResult === 'cancel') {
        console.log('[Run] 사용자가 취소');
        return;
      }
      
      if (saveResult === 'discard') {
        console.log('[Run] 저장 안 함 - 상태 리셋');
        stop(); // useRunningTracker의 stop 호출
        useRunStore.getState().reset();
        return;
      }
      
      // 저장하기
      console.log('[Run] 저장 시작');
      setSaving(true);
      
      try {
        const endTime = Date.now();
              const caloriesValue = calculateCalories(distance, duration);
              const finalAvgPace = avgPace > 0 ? avgPace : (pace > 0 ? pace : null);
              
              // 로컬 저장
              const sessionId = await saveRunningSession(
                {
                  userId: user?.id || null,
                  type: 'solo',
                  distance,
                  duration,
                  avgPace: finalAvgPace,
                  maxSpeed: maxSpeed > 0 ? maxSpeed : null,
                  calories: caloriesValue,
                  cadence: cadence > 0 ? cadence : null,
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
                      avgPace: finalAvgPace,
                      maxSpeed: maxSpeed > 0 ? maxSpeed : null,
                      calories: caloriesValue,
                      cadence: cadence > 0 ? cadence : null,
                      startTime: Math.floor(startTime / 1000),
                      endTime: Math.floor(endTime / 1000),
                    },
                    route
                  );
                } catch (syncError) {
                  console.warn('클라우드 동기화 실패 (로컬 저장은 완료):', syncError);
                }
              }

              // 건강 앱 동기화 (선택적)
              try {
                const healthResult = await saveRunningSessionToHealth({
                  distance,
                  duration,
                  calories: caloriesValue,
                  startTime: Math.floor(startTime / 1000),
                  endTime: Math.floor(endTime / 1000),
                  avgPace: finalAvgPace,
                  cadence: cadence > 0 ? cadence : null,
                });
                if (healthResult.success) {
                  console.log('건강 앱 동기화 완료');
                } else if (healthResult.needsSetup) {
                  console.log('건강 앱 연동 설정 필요:', healthResult.message);
                }
              } catch (healthError) {
                console.warn('건강 앱 동기화 실패 (로컬 저장은 완료):', healthError);
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
              stop(); // useRunningTracker의 stop 호출
              useRunStore.getState().reset();
              
              console.log('[Run] 저장 완료, 메달 체크:', newRewards.length);
              
              // 메달 획득 시 특별 메시지
              if (newRewards.length > 0) {
                const rewardTitles = newRewards.map((r) => r.title).join(', ');
                
                const medalResult = await new Promise((resolve) => {
                  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.confirm) {
                    const upload = window.confirm(
                      `${rewardTitles} 메달을 획득하셨습니다!\n\n코스로 업로드하시겠습니까?`
                    );
                    resolve(upload ? 'upload' : 'ok');
                  } else {
                    Alert.alert(
                      '메달 획득! 🎉',
                      `${rewardTitles} 메달을 획득하셨습니다!`,
                      [
                        { 
                          text: '코스로 업로드', 
                          onPress: () => resolve('upload'),
                        },
                        { text: '확인', onPress: () => resolve('ok') },
                      ],
                      { cancelable: false }
                    );
                  }
                });
                
                if (medalResult === 'upload') {
                  router.push({
                    pathname: '/(tabs)/courses',
                    params: { 
                      uploadRoute: JSON.stringify(route),
                      uploadDistance: distance.toString(),
                    },
                  });
                } else {
                  router.push('/(tabs)/records');
                }
              } else {
                const saveCompleteResult = await new Promise((resolve) => {
                  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.confirm) {
                    const upload = window.confirm(
                      '러닝 기록이 저장되었습니다.\n\n코스로 업로드하시겠습니까?'
                    );
                    resolve(upload ? 'upload' : 'ok');
                  } else {
                    Alert.alert(
                      '저장 완료', 
                      '러닝 기록이 저장되었습니다.',
                      [
                        { 
                          text: '코스로 업로드', 
                          onPress: () => resolve('upload'),
                        },
                        { text: '확인', onPress: () => resolve('ok') },
                      ],
                      { cancelable: false }
                    );
                  }
                });
                
                if (saveCompleteResult === 'upload') {
                  router.push({
                    pathname: '/(tabs)/courses',
                    params: { 
                      uploadRoute: JSON.stringify(route),
                      uploadDistance: distance.toString(),
                    },
                  });
                } else {
                  router.push('/(tabs)/records');
                }
              }
      } catch (error) {
        console.error('[Run] 저장 실패:', error);
        Alert.alert('저장 실패', `기록 저장 중 오류가 발생했습니다.\n\n${error.message || '알 수 없는 오류'}`);
      } finally {
        setSaving(false);
        stop(); // useRunningTracker의 stop 호출
      }
    } catch (error) {
      console.error('[Run] 종료 처리 오류:', error);
      Alert.alert('오류', `러닝 종료 중 오류가 발생했습니다.\n\n${error.message || '알 수 없는 오류'}`);
      setSaving(false);
    }
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
            <View style={styles.voiceGuideToggle}>
              <IconButton
                icon={voiceGuideEnabled ? 'volume-high' : 'volume-off'}
                size={24}
                onPress={() => setVoiceGuideEnabled(!voiceGuideEnabled)}
                style={styles.voiceButton}
                iconColor={voiceGuideEnabled ? '#fff' : '#999'}
              />
            </View>
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
            {isRunning && (
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>평균 페이스</Text>
                  <Text style={styles.statValue}>{formatPace(avgPace)}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>칼로리</Text>
                  <Text style={styles.statValue}>{calories} kcal</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>캐던스</Text>
                  <Text style={styles.statValue}>{formatCadence(cadence)} spm</Text>
                </View>
              </View>
            )}
          </Surface>

          <View style={styles.controlsContainer}>
            {!isRunning && !isPaused ? (
              <TouchableOpacity
                onPress={handleStart}
                style={[styles.startButton, saving && styles.buttonDisabled]}
                disabled={saving}
                activeOpacity={0.8}
              >
                <Text style={styles.startButtonText}>러닝 시작</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.runningControls}>
                {isPaused ? (
                  <TouchableOpacity
                    onPress={handleResume}
                    style={styles.resumeButton}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.controlButtonText}>재개</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={handlePause}
                    style={styles.controlButton}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.controlButtonOutlinedText}>일시정지</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={() => {
                    console.log('[Run] 종료 버튼 클릭 - handleStop 호출');
                    handleStop();
                  }}
                  style={[styles.stopButton, saving && styles.buttonDisabled]}
                  disabled={saving}
                  activeOpacity={0.8}
                >
                  {saving ? (
                    <Text style={styles.stopButtonText}>저장 중...</Text>
                  ) : (
                    <Text style={styles.stopButtonText}>종료</Text>
                  )}
                </TouchableOpacity>
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
    marginBottom: spacing.sm,
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
  buttonDisabled: {
    opacity: 0.6,
  },
  runningControls: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  controlButton: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonOutlinedText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
    includeFontPadding: false,
  },
  resumeButton: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 0,
  },
  controlButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    includeFontPadding: false,
  },
  stopButton: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#F44336',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 0,
  },
  stopButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    includeFontPadding: false,
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
  voiceGuideToggle: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 24,
    overflow: 'hidden',
  },
  voiceButton: {
    margin: 0,
  },
});
