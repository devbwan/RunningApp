// 메달 정의
export const REWARD_DEFINITIONS = {
  distance: [
    { id: 'dist_10km', threshold: 10000, title: '10km 달성', tier: 1 },
    { id: 'dist_50km', threshold: 50000, title: '50km 달성', tier: 2 },
    { id: 'dist_100km', threshold: 100000, title: '100km 달성', tier: 3 },
    { id: 'dist_500km', threshold: 500000, title: '500km 달성', tier: 4 },
  ],
  time: [
    { id: 'time_5h', threshold: 5 * 3600, title: '5시간 달성', tier: 1 },
    { id: 'time_10h', threshold: 10 * 3600, title: '10시간 달성', tier: 2 },
    { id: 'time_20h', threshold: 20 * 3600, title: '20시간 달성', tier: 3 },
    { id: 'time_50h', threshold: 50 * 3600, title: '50시간 달성', tier: 4 },
  ],
  count: [
    { id: 'count_5', threshold: 5, title: '5회 달성', tier: 1 },
    { id: 'count_20', threshold: 20, title: '20회 달성', tier: 2 },
    { id: 'count_50', threshold: 50, title: '50회 달성', tier: 3 },
    { id: 'count_100', threshold: 100, title: '100회 달성', tier: 4 },
  ],
  speed: [
    { id: 'speed_12', threshold: 12, title: '12km/h 달성', tier: 1 },
    { id: 'speed_15', threshold: 15, title: '15km/h 달성', tier: 2 },
    { id: 'speed_18', threshold: 18, title: '18km/h 달성', tier: 3 },
  ],
  streak: [
    { id: 'streak_3', threshold: 3, title: '3일 연속', tier: 1 },
    { id: 'streak_7', threshold: 7, title: '7일 연속', tier: 2 },
    { id: 'streak_14', threshold: 14, title: '14일 연속', tier: 3 },
    { id: 'streak_30', threshold: 30, title: '30일 연속', tier: 4 },
  ],
};

// 통계 기반 메달 체크
export function checkRewards(stats, achievedRewards = []) {
  const newRewards = [];
  const allRewards = [];

  // 거리 메달 체크
  REWARD_DEFINITIONS.distance.forEach((reward) => {
    const achieved = achievedRewards.includes(reward.id);
    const progress = Math.min((stats.totalDistance / reward.threshold) * 100, 100);
    
    if (!achieved && stats.totalDistance >= reward.threshold) {
      newRewards.push(reward);
    }

    allRewards.push({
      ...reward,
      type: 'distance',
      achieved,
      progress,
    });
  });

  // 시간 메달 체크
  REWARD_DEFINITIONS.time.forEach((reward) => {
    const achieved = achievedRewards.includes(reward.id);
    const progress = Math.min((stats.totalTime / reward.threshold) * 100, 100);
    
    if (!achieved && stats.totalTime >= reward.threshold) {
      newRewards.push(reward);
    }

    allRewards.push({
      ...reward,
      type: 'time',
      achieved,
      progress,
    });
  });

  // 횟수 메달 체크
  REWARD_DEFINITIONS.count.forEach((reward) => {
    const achieved = achievedRewards.includes(reward.id);
    const progress = Math.min((stats.totalRuns / reward.threshold) * 100, 100);
    
    if (!achieved && stats.totalRuns >= reward.threshold) {
      newRewards.push(reward);
    }

    allRewards.push({
      ...reward,
      type: 'count',
      achieved,
      progress,
    });
  });

  // 속도 메달 체크
  REWARD_DEFINITIONS.speed.forEach((reward) => {
    const achieved = achievedRewards.includes(reward.id);
    const progress = stats.maxSpeed >= reward.threshold ? 100 : Math.min((stats.maxSpeed / reward.threshold) * 100, 100);
    
    if (!achieved && stats.maxSpeed >= reward.threshold) {
      newRewards.push(reward);
    }

    allRewards.push({
      ...reward,
      type: 'speed',
      achieved,
      progress,
    });
  });

  // 연속 메달 체크
  REWARD_DEFINITIONS.streak.forEach((reward) => {
    const achieved = achievedRewards.includes(reward.id);
    const progress = Math.min((stats.streakDays / reward.threshold) * 100, 100);
    
    if (!achieved && stats.streakDays >= reward.threshold) {
      newRewards.push(reward);
    }

    allRewards.push({
      ...reward,
      type: 'streak',
      achieved,
      progress,
    });
  });

  return {
    newRewards,
    allRewards,
  };
}


