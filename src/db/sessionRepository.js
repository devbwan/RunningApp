import { getDatabase } from './database';

// UUID 생성 함수
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export const saveRunningSession = async (sessionData, route) => {
  const db = getDatabase();
  const sessionId = generateUUID();

  return new Promise((resolve, reject) => {
    db.transaction(
      (tx) => {
        // 세션 저장
        tx.executeSql(
          `INSERT INTO running_sessions 
           (id, user_id, type, distance, duration, avg_pace, max_speed, calories, start_time, end_time)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            sessionId,
            sessionData.userId || null,
            sessionData.type || 'solo',
            sessionData.distance,
            sessionData.duration,
            sessionData.avgPace || null,
            sessionData.maxSpeed || null,
            sessionData.calories || null,
            sessionData.startTime,
            sessionData.endTime || null,
          ],
          () => {
            // 경로 포인트 저장
            if (route && route.length > 0) {
              const values = route.map((point) => [
                sessionId,
                point.lat,
                point.lng,
                point.timestamp || Date.now(),
              ]);

              route.forEach((point, index) => {
                tx.executeSql(
                  `INSERT INTO route_points (session_id, lat, lng, timestamp)
                   VALUES (?, ?, ?, ?)`,
                  [
                    sessionId,
                    point.lat,
                    point.lng,
                    point.timestamp || Date.now(),
                  ]
                );
              });
            }
          }
        );
      },
      (error) => reject(error),
      () => resolve(sessionId)
    );
  });
};

export const getRunningSessions = async (userId = null, limit = 100) => {
  const db = getDatabase();

  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      const query = userId
        ? `SELECT * FROM running_sessions WHERE user_id = ? ORDER BY start_time DESC LIMIT ?`
        : `SELECT * FROM running_sessions ORDER BY start_time DESC LIMIT ?`;
      const params = userId ? [userId, limit] : [limit];

      tx.executeSql(
        query,
        params,
        (_, { rows }) => {
          resolve(rows._array);
        },
        (_, error) => reject(error)
      );
    });
  });
};

export const getRoutePoints = async (sessionId) => {
  const db = getDatabase();

  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        `SELECT lat, lng, timestamp FROM route_points 
         WHERE session_id = ? ORDER BY timestamp ASC`,
        [sessionId],
        (_, { rows }) => {
          resolve(rows._array);
        },
        (_, error) => reject(error)
      );
    });
  });
};

