import * as SQLite from 'expo-sqlite';

const dbName = 'runwave.db';
let db = null;

export const getDatabase = () => {
  if (!db) {
    db = SQLite.openDatabase(dbName);
    initializeDatabase();
  }
  return db;
};

const initializeDatabase = () => {
  db.transaction((tx) => {
    // RunningSession 테이블
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS running_sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        type TEXT NOT NULL DEFAULT 'solo',
        distance REAL NOT NULL DEFAULT 0,
        duration INTEGER NOT NULL DEFAULT 0,
        avg_pace REAL,
        max_speed REAL,
        calories INTEGER,
        start_time INTEGER NOT NULL,
        end_time INTEGER,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
      );`
    );

    // Route 좌표 테이블
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS route_points (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        lat REAL NOT NULL,
        lng REAL NOT NULL,
        timestamp INTEGER NOT NULL,
        FOREIGN KEY (session_id) REFERENCES running_sessions(id) ON DELETE CASCADE
      );`
    );

    // 인덱스 생성
    tx.executeSql(
      `CREATE INDEX IF NOT EXISTS idx_sessions_user ON running_sessions(user_id);`
    );
    tx.executeSql(
      `CREATE INDEX IF NOT EXISTS idx_sessions_start ON running_sessions(start_time);`
    );
    tx.executeSql(
      `CREATE INDEX IF NOT EXISTS idx_route_session ON route_points(session_id);`
    );
  });
};

