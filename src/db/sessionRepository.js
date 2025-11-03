import { getDatabase } from './database';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const isWeb = Platform.OS === 'web';
const SESSIONS_STORAGE_KEY = '@runwave_sessions';
const ROUTES_STORAGE_KEY = '@runwave_routes';

// UUID 생성 함수
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// 웹 환경용 localStorage 기반 세션 저장
const saveSessionToStorage = async (sessionData, route) => {
  if (isWeb) {
    try {
      const sessionId = generateUUID();
      const sessionsKey = `${SESSIONS_STORAGE_KEY}_${sessionData.userId || 'guest'}`;
      const routesKey = `${ROUTES_STORAGE_KEY}_${sessionId}`;

      const sessions = JSON.parse(await AsyncStorage.getItem(sessionsKey) || '[]');
      sessions.push({ id: sessionId, ...sessionData });
      await AsyncStorage.setItem(sessionsKey, JSON.stringify(sessions));
      await AsyncStorage.setItem(routesKey, JSON.stringify(route || []));

      return sessionId;
    } catch (error) {
      console.error('세션 저장 실패:', error);
      throw error;
    }
  }
  return null;
};

const getSessionsFromStorage = async (userId, limit) => {
  if (isWeb) {
    try {
      const key = `${SESSIONS_STORAGE_KEY}_${userId || 'guest'}`;
      const data = await AsyncStorage.getItem(key);
      const sessions = data ? JSON.parse(data) : [];
      return sessions.slice(0, limit).reverse(); // 최신순
    } catch (error) {
      console.error('세션 조회 실패:', error);
      return [];
    }
  }
  return null;
};

const getSessionFromStorage = async (sessionId) => {
  if (isWeb) {
    try {
      // 모든 사용자의 세션에서 찾기
      const allKeys = await AsyncStorage.getAllKeys();
      const sessionKeys = allKeys.filter(key => key.startsWith(SESSIONS_STORAGE_KEY));
      
      for (const key of sessionKeys) {
        const sessions = JSON.parse(await AsyncStorage.getItem(key) || '[]');
        const session = sessions.find(s => s.id === sessionId);
        if (session) return session;
      }
      return null;
    } catch (error) {
      console.error('세션 조회 실패:', error);
      return null;
    }
  }
  return null;
};

const getRoutePointsFromStorage = async (sessionId) => {
  if (isWeb) {
    try {
      const key = `${ROUTES_STORAGE_KEY}_${sessionId}`;
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('경로 조회 실패:', error);
      return [];
    }
  }
  return null;
};

export const saveRunningSession = async (sessionData, route) => {
  if (isWeb) {
    return await saveSessionToStorage(sessionData, route);
  }

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
          (_, result) => {
            // 경로 포인트 저장
            if (route && route.length > 0) {
              route.forEach((point) => {
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
  if (isWeb) {
    return await getSessionsFromStorage(userId, limit);
  }

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

export const getRunningSession = async (sessionId) => {
  if (isWeb) {
    return await getSessionFromStorage(sessionId);
  }

  const db = getDatabase();

  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        `SELECT * FROM running_sessions WHERE id = ?`,
        [sessionId],
        (_, { rows }) => {
          resolve(rows._array.length > 0 ? rows._array[0] : null);
        },
        (_, error) => reject(error)
      );
    });
  });
};

export const getRoutePoints = async (sessionId) => {
  if (isWeb) {
    return await getRoutePointsFromStorage(sessionId);
  }

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
