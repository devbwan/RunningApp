import { getDatabase } from './database';

export const getUserRewards = async (userId = null) => {
  const db = getDatabase();

  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      // rewards 테이블이 없으면 생성
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS user_rewards (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT,
          reward_id TEXT NOT NULL,
          achieved_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
          UNIQUE(user_id, reward_id)
        );`
      );

      const query = userId
        ? `SELECT reward_id FROM user_rewards WHERE user_id = ?`
        : `SELECT reward_id FROM user_rewards WHERE user_id IS NULL`;

      const params = userId ? [userId] : [];

      tx.executeSql(
        query,
        params,
        (_, { rows }) => {
          resolve(rows._array.map((r) => r.reward_id));
        },
        (_, error) => reject(error)
      );
    });
  });
};

export const saveReward = async (userId, rewardId) => {
  const db = getDatabase();

  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        `INSERT OR IGNORE INTO user_rewards (user_id, reward_id, achieved_at)
         VALUES (?, ?, strftime('%s', 'now'))`,
        [userId || null, rewardId],
        (_, result) => {
          resolve(result.insertId);
        },
        (_, error) => reject(error)
      );
    });
  });
};


