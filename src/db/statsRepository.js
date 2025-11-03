import { getDatabase } from './database';

export const getUserStats = async (userId = null) => {
  const db = getDatabase();

  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      const query = userId
        ? `SELECT 
            COUNT(*) as totalRuns,
            SUM(distance) as totalDistance,
            SUM(duration) as totalTime,
            MAX(max_speed) as maxSpeed,
            COUNT(DISTINCT date(start_time, 'unixepoch')) as streakDays
          FROM running_sessions 
          WHERE user_id = ?`
        : `SELECT 
            COUNT(*) as totalRuns,
            SUM(distance) as totalDistance,
            SUM(duration) as totalTime,
            MAX(max_speed) as maxSpeed,
            COUNT(DISTINCT date(start_time, 'unixepoch')) as streakDays
          FROM running_sessions`;

      const params = userId ? [userId] : [];

      tx.executeSql(
        query,
        params,
        (_, { rows }) => {
          const stats = rows._array[0] || {};
          resolve({
            totalRuns: stats.totalRuns || 0,
            totalDistance: stats.totalDistance || 0,
            totalTime: stats.totalTime || 0,
            maxSpeed: stats.maxSpeed || 0,
            streakDays: stats.streakDays || 0,
          });
        },
        (_, error) => reject(error)
      );
    });
  });
};

