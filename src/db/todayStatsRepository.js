import { getDatabase } from './database';

export const getTodayStats = async (userId = null) => {
  const db = getDatabase();

  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStart = Math.floor(today.getTime() / 1000);

      const query = userId
        ? `SELECT 
            COUNT(*) as runs,
            SUM(distance) as distance,
            SUM(duration) as duration,
            AVG(avg_pace) as avgPace
          FROM running_sessions 
          WHERE user_id = ? AND start_time >= ?`
        : `SELECT 
            COUNT(*) as runs,
            SUM(distance) as distance,
            SUM(duration) as duration,
            AVG(avg_pace) as avgPace
          FROM running_sessions 
          WHERE start_time >= ?`;

      const params = userId ? [userId, todayStart] : [todayStart];

      tx.executeSql(
        query,
        params,
        (_, { rows }) => {
          const stats = rows._array[0] || {};
          resolve({
            runs: stats.runs || 0,
            distance: stats.distance || 0,
            duration: stats.duration || 0,
            avgPace: stats.avgPace || null,
          });
        },
        (_, error) => reject(error)
      );
    });
  });
};

export const getWeeklyStats = async (userId = null) => {
  const db = getDatabase();

  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const weekStart = new Date(today);
      weekStart.setDate(weekStart.getDate() - 6);
      const weekStartTimestamp = Math.floor(weekStart.getTime() / 1000);

      const query = userId
        ? `SELECT 
            date(start_time, 'unixepoch') as date,
            COUNT(*) as runs,
            SUM(distance) as distance,
            SUM(duration) as duration
          FROM running_sessions 
          WHERE user_id = ? AND start_time >= ?
          GROUP BY date(start_time, 'unixepoch')
          ORDER BY date ASC`
        : `SELECT 
            date(start_time, 'unixepoch') as date,
            COUNT(*) as runs,
            SUM(distance) as distance,
            SUM(duration) as duration
          FROM running_sessions 
          WHERE start_time >= ?
          GROUP BY date(start_time, 'unixepoch')
          ORDER BY date ASC`;

      const params = userId ? [userId, weekStartTimestamp] : [weekStartTimestamp];

      tx.executeSql(
        query,
        params,
        (_, { rows }) => {
          resolve(rows._array || []);
        },
        (_, error) => reject(error)
      );
    });
  });
};


