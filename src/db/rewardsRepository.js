import { getDatabase } from './database';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const isWeb = Platform.OS === 'web';
const REWARDS_STORAGE_KEY = '@runwave_rewards';

// 웹 환경용 localStorage 기반 메달 저장
const saveRewardToStorage = async (userId, rewardId) => {
  if (isWeb) {
    try {
      const key = `${REWARDS_STORAGE_KEY}_${userId || 'guest'}`;
      const rewards = JSON.parse(await AsyncStorage.getItem(key) || '[]');
      if (!rewards.includes(rewardId)) {
        rewards.push(rewardId);
        await AsyncStorage.setItem(key, JSON.stringify(rewards));
      }
    } catch (error) {
      console.error('메달 저장 실패:', error);
    }
  }
};

const getRewardsFromStorage = async (userId) => {
  if (isWeb) {
    try {
      const key = `${REWARDS_STORAGE_KEY}_${userId || 'guest'}`;
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('메달 조회 실패:', error);
      return [];
    }
  }
  return null;
};

export const saveReward = async (userId, rewardId) => {
  if (isWeb) {
    return await saveRewardToStorage(userId, rewardId);
  }

  const db = getDatabase();
  const achievedAt = Date.now();

  return new Promise((resolve, reject) => {
    db.transaction(
      (tx) => {
        tx.executeSql(
          `INSERT OR IGNORE INTO user_rewards (user_id, reward_id, achieved_at)
           VALUES (?, ?, ?)`,
          [userId || 'guest', rewardId, achievedAt],
          (_, result) => resolve(result),
          (_, error) => reject(error)
        );
      },
      (error) => reject(error),
      () => {}
    );
  });
};

export const getUserRewards = async (userId) => {
  if (isWeb) {
    return await getRewardsFromStorage(userId);
  }

  const db = getDatabase();

  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        `SELECT reward_id FROM user_rewards WHERE user_id = ?`,
        [userId || 'guest'],
        (_, { rows }) => {
          resolve(rows._array.map(row => row.reward_id));
        },
        (_, error) => reject(error)
      );
    });
  });
};
