/**
 * 게스트 데이터 병합 서비스
 * 게스트 모드에서 생성한 데이터를 로그인한 사용자 계정에 병합
 */

import { getRunningSessions, updateSessionUserId } from '../db/sessionRepository';
import { getUserRewards, saveReward } from '../db/rewardsRepository';
import { syncRunningSession } from './sessionSyncService';

/**
 * 게스트 데이터를 로그인한 사용자 계정에 병합
 * @param {string} newUserId - 로그인한 사용자 ID
 * @returns {Promise<{sessionsMerged: number, rewardsMerged: number}>}
 */
export const mergeGuestDataToUser = async (newUserId) => {
  if (!newUserId) {
    throw new Error('사용자 ID가 필요합니다.');
  }

  const results = {
    sessionsMerged: 0,
    rewardsMerged: 0,
    errors: [],
  };

  try {
    // 1. 게스트 세션 데이터 병합 (userId가 null인 세션들)
    const guestSessions = await getRunningSessions(null, 1000); // 게스트 세션 모두 가져오기
    
    if (guestSessions.length > 0) {
      console.log(`[Guest Merge] 게스트 세션 ${guestSessions.length}개 발견`);
      
      for (const session of guestSessions) {
        try {
          // 세션의 userId를 새 사용자 ID로 업데이트
          await updateSessionUserId(session.id, newUserId);
          
          // 클라우드 동기화 (세션과 경로 데이터)
          try {
            const route = await getSessionRoute(session.id);
            await syncRunningSession(
              {
                userId: newUserId,
                type: session.type || 'solo',
                distance: session.distance || 0,
                duration: session.duration || 0,
                avgPace: session.avg_pace || null,
                maxSpeed: session.max_speed || null,
                calories: session.calories || null,
                cadence: session.cadence || null,
                startTime: session.start_time || Math.floor(Date.now() / 1000),
                endTime: session.end_time || Math.floor(Date.now() / 1000),
              },
              route || []
            );
          } catch (syncError) {
            console.warn(`[Guest Merge] 세션 ${session.id} 클라우드 동기화 실패:`, syncError);
            // 로컬 병합은 성공했으므로 계속 진행
          }
          
          results.sessionsMerged++;
        } catch (error) {
          console.error(`[Guest Merge] 세션 ${session.id} 병합 실패:`, error);
          results.errors.push(`세션 ${session.id}: ${error.message}`);
        }
      }
      
      console.log(`[Guest Merge] 세션 병합 완료: ${results.sessionsMerged}개`);
    }

    // 2. 게스트 메달 데이터 병합
    const guestRewards = await getUserRewards(null); // 게스트 메달 가져오기
    
    if (guestRewards.length > 0) {
      console.log(`[Guest Merge] 게스트 메달 ${guestRewards.length}개 발견`);
      
      for (const reward of guestRewards) {
        try {
          // 새 사용자 계정에 메달 저장 (중복 체크는 saveReward에서 처리)
          await saveReward(newUserId, reward.id);
          results.rewardsMerged++;
        } catch (error) {
          console.error(`[Guest Merge] 메달 ${reward.id} 병합 실패:`, error);
          results.errors.push(`메달 ${reward.id}: ${error.message}`);
        }
      }
      
      console.log(`[Guest Merge] 메달 병합 완료: ${results.rewardsMerged}개`);
    }

    return results;
  } catch (error) {
    console.error('[Guest Merge] 데이터 병합 중 오류:', error);
    throw error;
  }
};

/**
 * 세션의 경로 데이터 가져오기
 */
const getSessionRoute = async (sessionId) => {
  try {
    const { getDatabase } = await import('../db/database');
    const { Platform } = await import('react-native');
    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
    
    const isWeb = Platform.OS === 'web';
    
    if (isWeb) {
      const routesKey = `@runwave_routes_${sessionId}`;
      const routeData = await AsyncStorage.getItem(routesKey);
      return routeData ? JSON.parse(routeData) : [];
    } else {
      const db = await getDatabase();
      return new Promise((resolve, reject) => {
        db.transaction((tx) => {
          tx.executeSql(
            'SELECT latitude, longitude, timestamp FROM route_points WHERE session_id = ? ORDER BY timestamp ASC',
            [sessionId],
            (_, { rows }) => {
              const route = [];
              for (let i = 0; i < rows.length; i++) {
                route.push({
                  lat: rows.item(i).latitude,
                  lng: rows.item(i).longitude,
                  timestamp: rows.item(i).timestamp,
                });
              }
              resolve(route);
            },
            (_, error) => {
              console.error('경로 조회 실패:', error);
              resolve([]);
            }
          );
        });
      });
    }
  } catch (error) {
    console.error('경로 데이터 가져오기 실패:', error);
    return [];
  }
};

