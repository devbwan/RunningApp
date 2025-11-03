import { getDatabase } from './database';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const isWeb = Platform.OS === 'web';
const STATS_STORAGE_KEY = '@runwave_stats';
const REWARDS_STORAGE_KEY = '@runwave_rewards';

// 웹 환경용 localStorage 기반 통계 저장
const saveStatsToStorage = async (userId, stats) => {
  if (isWeb) {
    try {
      const key = `${STATS_STORAGE_KEY}_${userId || 'guest'}`;
      await AsyncStorage.setItem(key, JSON.stringify(stats));
    } catch (error) {
      console.error('통계 저장 실패:', error);
    }
  }
};

const getStatsFromStorage = async (userId) => {
  if (isWeb) {
    try {
      const key = `${STATS_STORAGE_KEY}_${userId || 'guest'}`;
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : getDefaultStats(userId);
    } catch (error) {
      console.error('통계 조회 실패:', error);
      return getDefaultStats(userId);
    }
  }
  return null;
};

const getDefaultStats = (userId) => ({
  userId: userId || 'guest',
  totalDistance: 0,
  totalTime: 0,
  totalRuns: 0,
  maxSpeed: 0,
  lastRunDate: null,
  streakDays: 0,
});

export const updateUserStats = async (userId, sessionData) => {
  if (isWeb) {
    // 웹 환경에서는 localStorage 사용
    const currentStats = await getStatsFromStorage(userId);
    const { distance, duration, maxSpeed, startTime } = sessionData;
    const runDate = new Date(startTime * 1000);
    runDate.setHours(0, 0, 0, 0);
    const runDateMs = runDate.getTime();

    const updatedStats = {
      ...currentStats,
      totalDistance: (currentStats.totalDistance || 0) + distance,
      totalTime: (currentStats.totalTime || 0) + duration,
      totalRuns: (currentStats.totalRuns || 0) + 1,
      maxSpeed: Math.max(currentStats.maxSpeed || 0, maxSpeed || 0),
      lastRunDate: runDateMs,
      streakDays: calculateStreak(currentStats.lastRunDate, runDateMs, currentStats.streakDays || 0),
    };

    await saveStatsToStorage(userId, updatedStats);
    return;
  }

  // 모바일 환경에서는 SQLite 사용
  const db = getDatabase();
  const { distance, duration, maxSpeed, startTime } = sessionData;
  const runDate = new Date(startTime * 1000);
  runDate.setHours(0, 0, 0, 0); // Normalize to start of day

  return new Promise((resolve, reject) => {
    db.transaction(
      (tx) => {
        tx.executeSql(
          `INSERT INTO user_stats (user_id, total_distance, total_time, total_runs, max_speed, last_run_date, streak_days)
           VALUES (?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(user_id) DO UPDATE SET
             total_distance = total_distance + ?,
             total_time = total_time + ?,
             total_runs = total_runs + 1,
             max_speed = MAX(max_speed, ?),
             last_run_date = ?,
             streak_days = CASE
                             WHEN last_run_date IS NULL THEN 1
                             WHEN ? - last_run_date = 86400000 THEN streak_days + 1 -- 1 day in ms
                             WHEN ? - last_run_date > 86400000 THEN 1
                             ELSE streak_days
                           END;`,
          [
            userId || 'guest', distance, duration, 1, maxSpeed || 0, runDate.getTime(), 1, // Initial insert values
            distance, duration, maxSpeed || 0, runDate.getTime(), // Update values
            runDate.getTime(), runDate.getTime() // Streak calculation
          ],
          (_, result) => resolve(result),
          (_, error) => reject(error)
        );
      },
      (error) => reject(error),
      () => {}
    );
  });
};

const calculateStreak = (lastRunDate, currentRunDate, currentStreak) => {
  if (!lastRunDate) return 1;
  const diff = currentRunDate - lastRunDate;
  if (diff === 86400000) return currentStreak + 1; // 1 day in ms
  if (diff > 86400000) return 1;
  return currentStreak;
};

export const getUserStats = async (userId) => {
  if (isWeb) {
    return await getStatsFromStorage(userId);
  }

  const db = getDatabase();

  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        `SELECT * FROM user_stats WHERE user_id = ?`,
        [userId || 'guest'],
        (_, { rows }) => {
          const stats = rows._array.length > 0 ? rows._array[0] : {
            user_id: userId || 'guest',
            total_distance: 0,
            total_time: 0,
            total_runs: 0,
            max_speed: 0,
            last_run_date: null,
            streak_days: 0,
          };

          // Convert to camelCase for consistency
          resolve({
            userId: stats.user_id,
            totalDistance: stats.total_distance,
            totalTime: stats.total_time,
            totalRuns: stats.total_runs,
            maxSpeed: stats.max_speed,
            lastRunDate: stats.last_run_date,
            streakDays: stats.streak_days,
          });
        },
        (_, error) => reject(error)
      );
    });
  });
};
