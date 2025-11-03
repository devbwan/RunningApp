import { getDatabase } from './database';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const isWeb = Platform.OS === 'web';
const SESSIONS_STORAGE_KEY = '@runwave_sessions';

// 웹 환경용 오늘 통계 계산
const getTodayStatsFromStorage = async (userId) => {
  if (isWeb) {
    try {
      const key = `${SESSIONS_STORAGE_KEY}_${userId || 'guest'}`;
      const sessions = JSON.parse(await AsyncStorage.getItem(key) || '[]');
      
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() / 1000;

      const todaySessions = sessions.filter(session => {
        const sessionDate = session.start_time * 1000; // convert to ms
        return sessionDate >= startOfDay;
      });

      const stats = {
        totalDistance: todaySessions.reduce((sum, s) => sum + (s.distance || 0), 0),
        totalTime: todaySessions.reduce((sum, s) => sum + (s.duration || 0), 0),
        totalRuns: todaySessions.length,
        maxSpeed: Math.max(...todaySessions.map(s => s.max_speed || 0), 0),
      };

      // 평균 페이스 계산
      if (stats.totalDistance > 0 && stats.totalTime > 0) {
        stats.avgPace = Math.round((stats.totalTime / stats.totalDistance) * 1000);
      } else {
        stats.avgPace = null;
      }

      return stats;
    } catch (error) {
      console.error('오늘 통계 조회 실패:', error);
      return { totalDistance: 0, totalTime: 0, totalRuns: 0, maxSpeed: 0, avgPace: null };
    }
  }
  return null;
};

// 웹 환경용 주간 통계 계산
const getWeeklyStatsFromStorage = async (userId) => {
  if (isWeb) {
    try {
      const key = `${SESSIONS_STORAGE_KEY}_${userId || 'guest'}`;
      const sessions = JSON.parse(await AsyncStorage.getItem(key) || '[]');
      
      const now = new Date();
      const dayOfWeek = now.getDay();
      const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek).getTime() / 1000;

      const weeklySessions = sessions.filter(session => {
        const sessionDate = session.start_time * 1000;
        return sessionDate >= startOfWeek;
      });

      // 일별 거리 집계
      const weeklyData = {};
      for (let i = 0; i < 7; i++) {
        const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek + i);
        const dateString = date.toISOString().split('T')[0];
        weeklyData[dateString] = { date: dateString, distance: 0 };
      }

      weeklySessions.forEach(session => {
        const sessionDate = new Date(session.start_time * 1000);
        const dateString = sessionDate.toISOString().split('T')[0];
        if (weeklyData[dateString]) {
          weeklyData[dateString].distance += session.distance || 0;
        }
      });

      return Object.values(weeklyData);
    } catch (error) {
      console.error('주간 통계 조회 실패:', error);
      return [];
    }
  }
  return null;
};

export const getTodayStats = async (userId) => {
  if (isWeb) {
    return await getTodayStatsFromStorage(userId);
  }

  const db = getDatabase();
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() / 1000; // seconds

  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        `SELECT
           SUM(distance) as totalDistance,
           SUM(duration) as totalTime,
           COUNT(id) as totalRuns,
           MAX(max_speed) as maxSpeed
         FROM running_sessions
         WHERE user_id = ? AND start_time >= ?`,
        [userId || 'guest', startOfDay],
        (_, { rows }) => {
          const stats = rows._array[0];
          const result = {
            totalDistance: stats.totalDistance || 0,
            totalTime: stats.totalTime || 0,
            totalRuns: stats.totalRuns || 0,
            maxSpeed: stats.maxSpeed || 0,
          };

          // 평균 페이스 계산
          if (result.totalDistance > 0 && result.totalTime > 0) {
            result.avgPace = Math.round((result.totalTime / result.totalDistance) * 1000);
          } else {
            result.avgPace = null;
          }

          resolve(result);
        },
        (_, error) => reject(error)
      );
    });
  });
};

export const getWeeklyStats = async (userId) => {
  if (isWeb) {
    return await getWeeklyStatsFromStorage(userId);
  }

  const db = getDatabase();
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 for Sunday, 1 for Monday, etc.
  const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek).getTime() / 1000; // seconds

  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        `SELECT
           strftime('%Y-%m-%d', start_time, 'unixepoch') as date,
           SUM(distance) as dailyDistance
         FROM running_sessions
         WHERE user_id = ? AND start_time >= ?
         GROUP BY date
         ORDER BY date ASC`,
        [userId || 'guest', startOfWeek],
        (_, { rows }) => {
          const weeklyData = {};
          for (let i = 0; i < 7; i++) {
            const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek + i);
            const dateString = date.toISOString().split('T')[0];
            weeklyData[dateString] = { date: dateString, distance: 0 };
          }

          rows._array.forEach(row => {
            weeklyData[row.date] = { date: row.date, distance: row.dailyDistance };
          });

          resolve(Object.values(weeklyData));
        },
        (_, error) => reject(error)
      );
    });
  });
};
