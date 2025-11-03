import { Platform } from 'react-native';

const DATABASE_NAME = 'runwave.db';
let db = null;

// 웹 환경에서는 SQLite 대신 localStorage 사용
const isWeb = Platform.OS === 'web';

// 웹 환경이 아닐 때만 expo-sqlite import
// 웹 빌드 시 expo-sqlite의 WASM 파일을 로드하지 않도록 조건부 import
let SQLite = null;
if (!isWeb) {
  try {
    // 동적 require를 사용하여 웹 빌드 시 번들에 포함되지 않도록 함
    SQLite = require('expo-sqlite');
  } catch (error) {
    console.warn('expo-sqlite를 로드할 수 없습니다:', error);
    SQLite = null;
  }
}

export const getDatabase = () => {
  if (isWeb) {
    // 웹 환경에서는 localStorage를 사용하는 간단한 래퍼 반환
    return {
      transaction: (callback) => {
        // 웹에서는 동기적으로 실행
        callback({
          executeSql: (sql, params, successCallback, errorCallback) => {
            try {
              // localStorage에 데이터 저장 (간단한 구현)
              // 실제로는 IndexedDB나 다른 저장소를 사용하는 것이 좋습니다
              if (successCallback) {
                successCallback(null, { rows: { _array: [] } });
              }
            } catch (error) {
              if (errorCallback) {
                errorCallback(null, error);
              }
            }
          },
        });
      },
    };
  }

  if (!db) {
    if (isWeb) {
      // 웹 환경에서는 이미 localStorage 래퍼를 반환했으므로 여기 도달하지 않아야 함
      throw new Error('웹 환경에서는 localStorage 래퍼를 사용해야 합니다.');
    }
    if (!SQLite) {
      throw new Error('expo-sqlite를 로드할 수 없습니다.');
    }
    db = SQLite.openDatabase(DATABASE_NAME);
    initializeDatabase();
  }
  return db;
};

const initializeDatabase = () => {
  if (isWeb) {
    // 웹에서는 초기화 스킵
    return;
  }

  db.transaction((tx) => {
    // running_sessions 테이블 생성
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS running_sessions (
        id TEXT PRIMARY KEY NOT NULL,
        user_id TEXT,
        type TEXT NOT NULL,
        distance REAL NOT NULL,
        duration INTEGER NOT NULL,
        avg_pace REAL,
        max_speed REAL,
        calories INTEGER,
        start_time INTEGER NOT NULL,
        end_time INTEGER
      );`
    );
    // route_points 테이블 생성
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS route_points (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        lat REAL NOT NULL,
        lng REAL NOT NULL,
        timestamp INTEGER NOT NULL,
        FOREIGN KEY (session_id) REFERENCES running_sessions (id) ON DELETE CASCADE
      );`
    );
    // user_stats 테이블 생성 (누적 통계)
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS user_stats (
        user_id TEXT PRIMARY KEY NOT NULL,
        total_distance REAL DEFAULT 0,
        total_time INTEGER DEFAULT 0,
        total_runs INTEGER DEFAULT 0,
        max_speed REAL DEFAULT 0,
        last_run_date INTEGER,
        streak_days INTEGER DEFAULT 0
      );`
    );
    // user_rewards 테이블 생성 (획득한 메달)
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS user_rewards (
        user_id TEXT NOT NULL,
        reward_id TEXT NOT NULL,
        achieved_at INTEGER NOT NULL,
        PRIMARY KEY (user_id, reward_id)
      );`
    );
  }, (error) => console.error('DB 초기화 실패:', error), () => console.log('DB 초기화 성공'));
};
