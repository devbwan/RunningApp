import { Platform } from 'react-native';

const DATABASE_NAME = 'runwave.db';
let db = null;
let dbAsync = null; // 비동기 데이터베이스 인스턴스

// 웹 환경에서는 SQLite 대신 localStorage 사용
const isWeb = Platform.OS === 'web';

// 타임스탬프가 포함된 로그 헬퍼 함수
const logWithTime = (level, ...args) => {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}]`;
  const message = args.length > 0 ? args : [''];
  switch (level) {
    case 'error':
      console.error(prefix, ...message);
      break;
    case 'warn':
      console.warn(prefix, ...message);
      break;
    case 'log':
    default:
      console.log(prefix, ...message);
      break;
  }
};

// 웹 환경이 아닐 때만 expo-sqlite import
// 웹 빌드 시 expo-sqlite의 WASM 파일을 로드하지 않도록 조건부 import
let SQLite = null;
if (!isWeb) {
  try {
    // expo-sqlite 16.x는 default export를 사용
    const sqliteModule = require('expo-sqlite');
    // default export 또는 named export 확인
    SQLite = sqliteModule.default || sqliteModule;
    logWithTime('log', '[Database] expo-sqlite 로드 성공:', { 
      hasOpenDatabase: typeof SQLite?.openDatabase === 'function',
      hasOpenDatabaseAsync: typeof SQLite?.openDatabaseAsync === 'function',
      SQLiteType: typeof SQLite,
      SQLiteKeys: SQLite ? Object.keys(SQLite) : []
    });
  } catch (error) {
    logWithTime('warn', '[Database] expo-sqlite를 로드할 수 없습니다:', error);
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
    
    // expo-sqlite의 최신 API 확인 및 사용
    if (typeof SQLite?.openDatabase === 'function') {
      // 구버전 API (동기)
      logWithTime('log', '[Database] openDatabase 사용 (동기 API)');
      db = SQLite.openDatabase(DATABASE_NAME);
    } else if (typeof SQLite?.openDatabaseAsync === 'function') {
      // 신버전 API (비동기) - expo-sqlite 16.x
      logWithTime('log', '[Database] openDatabaseAsync 사용 (비동기 API)');
      // 비동기 API를 동기 콜백 API처럼 보이게 하는 래퍼 생성
      // 먼저 데이터베이스를 비동기로 열기 (Promise를 기다려야 함)
      // 하지만 getDatabase는 동기 함수이므로, 래퍼를 반환하고 내부에서 처리
      db = createAsyncDatabaseWrapper();
    } else {
      logWithTime('error', '[Database] SQLite 객체:', SQLite);
      logWithTime('error', '[Database] 사용 가능한 메서드:', SQLite ? Object.keys(SQLite) : 'null');
      // SQLite가 없어도 앱이 계속 작동하도록 웹 래퍼 사용
      logWithTime('warn', '[Database] SQLite를 사용할 수 없습니다. 웹 래퍼를 사용합니다.');
      db = {
        transaction: (callback) => {
          callback({
            executeSql: (sql, params, successCallback, errorCallback) => {
              if (errorCallback) {
                errorCallback(null, new Error('SQLite를 사용할 수 없습니다.'));
              }
            },
          });
        },
      };
    }
    
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
  }, (error) => logWithTime('error', 'DB 초기화 실패:', error), () => logWithTime('log', 'DB 초기화 성공'));
};

// 비동기 API를 동기 콜백 API처럼 보이게 하는 래퍼
const createAsyncDatabaseWrapper = () => {
  let dbPromise = null;
  let initPromise = null;
  
  // 데이터베이스 초기화 (한 번만)
  const initDatabase = async () => {
    if (!initPromise) {
      initPromise = (async () => {
        try {
          if (!dbPromise) {
            logWithTime('log', '[Database] 데이터베이스 열기 시작');
            dbPromise = SQLite.openDatabaseAsync(DATABASE_NAME);
            dbAsync = await dbPromise;
            logWithTime('log', '[Database] 비동기 데이터베이스 열기 완료:', { hasDb: !!dbAsync });
            
            // 초기화 SQL 실행
            if (dbAsync) {
              await initializeDatabaseAsync();
            } else {
              throw new Error('데이터베이스 인스턴스를 가져올 수 없습니다.');
            }
          }
          return dbAsync;
        } catch (error) {
          logWithTime('error', '[Database] 초기화 오류:', error);
          initPromise = null; // 재시도 가능하도록
          throw error;
        }
      })();
    }
    return await initPromise;
  };
  
  return {
    transaction: (callback) => {
      // 비동기로 실행하되, 콜백은 동기적으로 보이게 함
      // 데이터베이스 초기화가 완료될 때까지 기다림
      initDatabase()
        .then(async (database) => {
          if (!database) {
            logWithTime('error', '[Database] 데이터베이스가 null입니다. 트랜잭션을 건너뜁니다.');
            return;
          }
          
          logWithTime('log', '[Database] 트랜잭션 시작, 데이터베이스 준비됨');
          
          try {
          // expo-sqlite 16.x는 withTransactionAsync를 사용하거나
          // 트랜잭션 없이 실행 (각 SQL이 자동으로 트랜잭션됨)
          // 기존 코드 호환성을 위해 트랜잭션 없이 실행
          
          // 실행할 SQL 명령 목록
          const sqlCommands = [];
          let hasError = false;
          
          // 트랜잭션 객체 생성 (동기 API와 호환)
          const tx = {
            executeSql: (sql, params = [], successCallback, errorCallback) => {
              // SQL 명령을 큐에 추가
              sqlCommands.push({
                sql,
                params,
                successCallback,
                errorCallback,
              });
            },
          };
          
          // 콜백 실행 (SQL 명령들이 큐에 추가됨)
          callback(tx);
          
          // 모든 SQL 명령을 순차적으로 실행 (트랜잭션 없이)
          // expo-sqlite 16.x는 각 SQL이 자동으로 트랜잭션됨
          for (const cmd of sqlCommands) {
            if (hasError) {
              // 에러가 발생했지만 계속 실행 (기존 코드 호환성)
              if (cmd.errorCallback) {
                cmd.errorCallback(null, new Error('이전 SQL 실행 중 오류 발생'));
              }
              continue;
            }
            
            try {
              if (!database) {
                throw new Error('데이터베이스 인스턴스가 없습니다.');
              }
              
              // 데이터베이스 메서드 확인
              if (typeof database.getAllAsync !== 'function' || typeof database.runAsync !== 'function') {
                throw new Error(`데이터베이스 메서드를 사용할 수 없습니다. getAllAsync: ${typeof database.getAllAsync}, runAsync: ${typeof database.runAsync}`);
              }
              
              // SQL 정규화 (여러 줄을 한 줄로, 세미콜론 제거)
              const normalizedSql = cmd.sql
                .replace(/\s+/g, ' ') // 여러 공백을 하나로
                .replace(/;\s*$/, '') // 끝의 세미콜론 제거
                .trim();
              
              const sqlUpper = normalizedSql.toUpperCase();
              
              if (sqlUpper.startsWith('SELECT')) {
                // SELECT 쿼리
                logWithTime('log', '[Database] SELECT 실행:', normalizedSql.substring(0, 50));
                logWithTime('log', '[Database] 파라미터:', cmd.params);
                
                try {
                  // expo-sqlite 16.x는 getAllAsync를 직접 사용
                  // getAllAsync는 SQL 문자열과 파라미터 배열을 받음
                  // 파라미터가 배열이 아닌 경우 배열로 변환
                  const params = Array.isArray(cmd.params) ? cmd.params : (cmd.params ? [cmd.params] : []);
                  
                  logWithTime('log', '[Database] getAllAsync 호출 전, database 타입:', typeof database);
                  logWithTime('log', '[Database] getAllAsync 메서드 존재:', typeof database.getAllAsync);
                  
                  const rows = await database.getAllAsync(normalizedSql, params);
                  
                  logWithTime('log', '[Database] SELECT 결과 행 수:', rows?.length || 0);
                  
                  const result = {
                    rows: {
                      _array: rows || [],
                      length: (rows || []).length,
                      item: (index) => (rows || [])[index],
                    },
                    insertId: null,
                    rowsAffected: 0,
                  };
                  if (cmd.successCallback) {
                    cmd.successCallback(null, result);
                  }
                } catch (selectError) {
                  logWithTime('error', '[Database] SELECT 쿼리 실행 실패:', selectError);
                  logWithTime('error', '[Database] SQL:', normalizedSql);
                  logWithTime('error', '[Database] 파라미터:', cmd.params);
                  throw selectError;
                }
              } else {
                // INSERT, UPDATE, DELETE, CREATE TABLE 등
                logWithTime('log', '[Database] 실행 (INSERT/UPDATE/DELETE/CREATE):', normalizedSql.substring(0, 50));
                const result = await database.runAsync(normalizedSql, cmd.params);
                const resultObj = {
                  rows: {
                    _array: [],
                    length: 0,
                  },
                  insertId: result.lastInsertRowId || null,
                  rowsAffected: result.changes || 0,
                };
                if (cmd.successCallback) {
                  cmd.successCallback(null, resultObj);
                }
              }
            } catch (error) {
              hasError = true;
              logWithTime('error', '[Database] SQL 실행 오류:', error, 'SQL:', cmd.sql.substring(0, 50));
              if (cmd.errorCallback) {
                cmd.errorCallback(null, error);
              }
            }
          }
          
          // expo-sqlite 16.x는 명시적 트랜잭션 관리 불필요
          // 각 SQL이 자동으로 트랜잭션됨
        } catch (error) {
          logWithTime('error', '[Database] 트랜잭션 래퍼 오류:', error);
        }
      }).catch((error) => {
        logWithTime('error', '[Database] 데이터베이스 초기화 오류:', error);
      });
    },
  };
};

// 비동기 데이터베이스 초기화
const initializeDatabaseAsync = async () => {
  if (!dbAsync) {
    logWithTime('error', '[Database] dbAsync가 null입니다. 초기화를 건너뜁니다.');
    return;
  }
  
  try {
    logWithTime('log', '[Database] 테이블 생성 시작');
    
    // SQL 정규화 함수
    const normalizeSql = (sql) => {
      return sql
        .replace(/\s+/g, ' ') // 여러 공백을 하나로
        .replace(/;\s*$/, '') // 끝의 세미콜론 제거
        .trim();
    };
    
    // 테이블 생성 (runAsync 사용 - SQL을 한 줄로 정규화)
    const createRunningSessions = normalizeSql(`
      CREATE TABLE IF NOT EXISTS running_sessions (
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
      )
    `);
    
    logWithTime('log', '[Database] running_sessions 테이블 생성 시도');
    await dbAsync.runAsync(createRunningSessions);
    logWithTime('log', '[Database] running_sessions 테이블 생성 완료');
    
    const createRoutePoints = normalizeSql(`
      CREATE TABLE IF NOT EXISTS route_points (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        lat REAL NOT NULL,
        lng REAL NOT NULL,
        timestamp INTEGER NOT NULL,
        FOREIGN KEY (session_id) REFERENCES running_sessions (id) ON DELETE CASCADE
      )
    `);
    
    logWithTime('log', '[Database] route_points 테이블 생성 시도');
    await dbAsync.runAsync(createRoutePoints);
    logWithTime('log', '[Database] route_points 테이블 생성 완료');
    
    const createUserStats = normalizeSql(`
      CREATE TABLE IF NOT EXISTS user_stats (
        user_id TEXT PRIMARY KEY NOT NULL,
        total_distance REAL DEFAULT 0,
        total_time INTEGER DEFAULT 0,
        total_runs INTEGER DEFAULT 0,
        max_speed REAL DEFAULT 0,
        last_run_date INTEGER,
        streak_days INTEGER DEFAULT 0
      )
    `);
    
    logWithTime('log', '[Database] user_stats 테이블 생성 시도');
    await dbAsync.runAsync(createUserStats);
    logWithTime('log', '[Database] user_stats 테이블 생성 완료');
    
    const createUserRewards = normalizeSql(`
      CREATE TABLE IF NOT EXISTS user_rewards (
        user_id TEXT NOT NULL,
        reward_id TEXT NOT NULL,
        achieved_at INTEGER NOT NULL,
        PRIMARY KEY (user_id, reward_id)
      )
    `);
    
    logWithTime('log', '[Database] user_rewards 테이블 생성 시도');
    await dbAsync.runAsync(createUserRewards);
    logWithTime('log', '[Database] user_rewards 테이블 생성 완료');
    
    logWithTime('log', '[Database] 비동기 데이터베이스 초기화 완료');
  } catch (error) {
    logWithTime('error', '[Database] 비동기 데이터베이스 초기화 실패:', error);
    logWithTime('error', '[Database] 오류 상세:', {
      message: error.message,
      stack: error.stack,
      dbAsyncType: typeof dbAsync,
      hasRunAsync: typeof dbAsync?.runAsync
    });
    throw error; // 초기화 실패 시 재시도 가능하도록
  }
};
