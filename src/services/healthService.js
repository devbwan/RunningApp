import { Platform } from 'react-native';

/**
 * 건강 앱 연동 서비스
 * iOS: HealthKit (react-native-health)
 * Android: Google Fit (react-native-google-fit)
 * Web: 지원하지 않음
 */

// 건강 앱 연동 상태 확인
export const isHealthAppAvailable = () => {
  return Platform.OS !== 'web';
};

// 건강 앱 권한 요청
export const requestHealthPermissions = async () => {
  if (Platform.OS === 'web') {
    return { granted: false, message: '웹에서는 건강 앱 연동을 지원하지 않습니다.' };
  }

  try {
    // iOS HealthKit 권한 요청
    if (Platform.OS === 'ios') {
      return await requestHealthKitPermissions();
    }
    
    // Android Google Fit 권한 요청
    if (Platform.OS === 'android') {
      return await requestGoogleFitPermissions();
    }

    return { granted: false, message: '지원하지 않는 플랫폼입니다.' };
  } catch (error) {
    console.error('건강 앱 권한 요청 오류:', error);
    return { granted: false, message: error.message || '권한 요청 중 오류가 발생했습니다.' };
  }
};

// iOS HealthKit 권한 요청
const requestHealthKitPermissions = async () => {
  try {
    // react-native-health 패키지 동적 로드
    let AppleHealthKit;
    try {
      AppleHealthKit = require('react-native-health').default;
    } catch (importError) {
      console.warn('react-native-health 패키지가 설치되지 않았습니다.');
      return {
        granted: false,
        message: 'HealthKit 연동을 위해서는 react-native-health 패키지 설치가 필요합니다.\n\n설치: npm install react-native-health\niOS: cd ios && pod install',
        needsSetup: true,
      };
    }

    const permissions = {
      permissions: {
        read: [
          'HKQuantityTypeIdentifierDistanceWalkingRunning',
          'HKQuantityTypeIdentifierActiveEnergyBurned',
          'HKQuantityTypeIdentifierHeartRate',
          'HKQuantityTypeIdentifierStepCount',
        ],
        write: [
          'HKWorkoutTypeIdentifierRunning',
          'HKQuantityTypeIdentifierDistanceWalkingRunning',
          'HKQuantityTypeIdentifierActiveEnergyBurned',
        ],
      },
    };

    return new Promise((resolve, reject) => {
      AppleHealthKit.initHealthKit(permissions, (error) => {
        if (error) {
          console.error('HealthKit 초기화 오류:', error);
          reject(new Error(`HealthKit 권한 요청 실패: ${error.message || '알 수 없는 오류'}`));
        } else {
          resolve({ granted: true });
        }
      });
    });
  } catch (error) {
    throw new Error(`HealthKit 권한 요청 실패: ${error.message}`);
  }
};

// Android Google Fit 권한 요청
const requestGoogleFitPermissions = async () => {
  try {
    // react-native-google-fit 패키지 동적 로드
    let GoogleFit;
    try {
      GoogleFit = require('react-native-google-fit');
    } catch (importError) {
      console.warn('react-native-google-fit 패키지가 설치되지 않았습니다.');
      return {
        granted: false,
        message: 'Google Fit 연동을 위해서는 react-native-google-fit 패키지 설치가 필요합니다.\n\n설치: npm install react-native-google-fit\nAndroid: 설정 가이드 참고',
        needsSetup: true,
      };
    }

    // react-native-google-fit의 Scopes 사용 (있는 경우)
    let Scopes;
    try {
      Scopes = require('react-native-google-fit').Scopes;
    } catch (e) {
      Scopes = null;
    }

    const options = Scopes ? {
      scopes: [
        Scopes.FITNESS_ACTIVITY_WRITE,
        Scopes.FITNESS_ACTIVITY_READ,
        Scopes.FITNESS_LOCATION_WRITE,
        Scopes.FITNESS_LOCATION_READ,
      ],
    } : {
      scopes: [
        'https://www.googleapis.com/auth/fitness.activity.write',
        'https://www.googleapis.com/auth/fitness.activity.read',
        'https://www.googleapis.com/auth/fitness.location.write',
        'https://www.googleapis.com/auth/fitness.location.read',
      ],
    };

    // react-native-google-fit의 authorize는 콜백 기반일 수 있음
    return new Promise((resolve) => {
      try {
        if (typeof GoogleFit.authorize === 'function') {
          GoogleFit.authorize(options, (authResult) => {
            if (authResult && authResult.success) {
              resolve({ granted: true });
            } else {
              resolve({ 
                granted: false, 
                message: authResult?.message || 'Google Fit 인증이 거부되었습니다.' 
              });
            }
          });
        } else {
          // Promise 기반인 경우
          GoogleFit.authorize(options)
            .then((authResult) => {
              if (authResult && authResult.success) {
                resolve({ granted: true });
              } else {
                resolve({ 
                  granted: false, 
                  message: authResult?.message || 'Google Fit 인증이 거부되었습니다.' 
                });
              }
            })
            .catch((authError) => {
              console.error('Google Fit 인증 오류:', authError);
              resolve({ 
                granted: false, 
                message: `Google Fit 인증 실패: ${authError.message || '알 수 없는 오류'}` 
              });
            });
        }
      } catch (authError) {
        console.error('Google Fit 인증 오류:', authError);
        resolve({ 
          granted: false, 
          message: `Google Fit 인증 실패: ${authError.message || '알 수 없는 오류'}` 
        });
      }
    });
  } catch (error) {
    throw new Error(`Google Fit 권한 요청 실패: ${error.message}`);
  }
};

// 건강 앱에 러닝 세션 저장
export const saveRunningSessionToHealth = async (sessionData) => {
  if (Platform.OS === 'web') {
    return { success: false, message: '웹에서는 건강 앱 연동을 지원하지 않습니다.' };
  }

  try {
    if (Platform.OS === 'ios') {
      return await saveToHealthKit(sessionData);
    }
    
    if (Platform.OS === 'android') {
      return await saveToGoogleFit(sessionData);
    }

    return { success: false, message: '지원하지 않는 플랫폼입니다.' };
  } catch (error) {
    console.error('건강 앱 저장 오류:', error);
    return { success: false, message: error.message || '건강 앱 저장 중 오류가 발생했습니다.' };
  }
};

// iOS HealthKit에 저장
const saveToHealthKit = async (sessionData) => {
  try {
    const { distance, duration, calories, startTime, endTime, avgPace, cadence } = sessionData;
    
    // react-native-health 패키지 동적 로드
    let AppleHealthKit;
    try {
      AppleHealthKit = require('react-native-health').default;
    } catch (importError) {
      console.warn('react-native-health 패키지가 설치되지 않았습니다.');
      return {
        success: false,
        message: 'HealthKit 저장을 위해서는 react-native-health 패키지 설치가 필요합니다.',
        needsSetup: true,
      };
    }

    const workoutOptions = {
      type: 'Running',
      startDate: new Date(startTime * 1000).toISOString(),
      endDate: new Date(endTime * 1000).toISOString(),
      distance: distance / 1000, // km
      energyBurned: calories || 0, // kcal
      energyBurnedUnit: 'kilocalorie',
      metadata: {
        avgPace: avgPace || null,
        cadence: cadence || null,
      },
    };

    return new Promise((resolve, reject) => {
      AppleHealthKit.saveWorkout(workoutOptions, (error, result) => {
        if (error) {
          console.error('HealthKit 저장 오류:', error);
          reject(new Error(`HealthKit 저장 실패: ${error.message || '알 수 없는 오류'}`));
        } else {
          console.log('HealthKit 저장 성공:', result);
          resolve({ success: true, workoutId: result });
        }
      });
    });
  } catch (error) {
    throw new Error(`HealthKit 저장 실패: ${error.message}`);
  }
};

// Android Google Fit에 저장
const saveToGoogleFit = async (sessionData) => {
  try {
    const { distance, duration, calories, startTime, endTime, avgPace, cadence } = sessionData;
    
    // react-native-google-fit 패키지 동적 로드
    let GoogleFit;
    try {
      GoogleFit = require('react-native-google-fit');
    } catch (importError) {
      console.warn('react-native-google-fit 패키지가 설치되지 않았습니다.');
      return {
        success: false,
        message: 'Google Fit 저장을 위해서는 react-native-google-fit 패키지 설치가 필요합니다.',
        needsSetup: true,
      };
    }

    // Google Fit에 워크아웃 저장
    const workoutData = {
      activityType: 'running',
      startTime: startTime * 1000, // milliseconds
      endTime: endTime * 1000, // milliseconds
      calories: calories || 0,
      distance: distance / 1000, // km
      duration: duration, // seconds
      metadata: {
        avgPace: avgPace || null,
        cadence: cadence || null,
      },
    };

    // react-native-google-fit의 saveWorkout은 콜백 기반일 수 있음
    return new Promise((resolve, reject) => {
      try {
        if (typeof GoogleFit.saveWorkout === 'function') {
          // 콜백 기반인 경우
          GoogleFit.saveWorkout(workoutData, (error, result) => {
            if (error) {
              console.error('Google Fit 저장 오류:', error);
              reject(new Error(`Google Fit 저장 실패: ${error.message || '알 수 없는 오류'}`));
            } else {
              console.log('Google Fit 저장 성공:', result);
              resolve({ success: true, workoutId: result });
            }
          });
        } else {
          // Promise 기반인 경우
          GoogleFit.saveWorkout(workoutData)
            .then((result) => {
              console.log('Google Fit 저장 성공:', result);
              resolve({ success: true, workoutId: result });
            })
            .catch((saveError) => {
              console.error('Google Fit 저장 오류:', saveError);
              reject(new Error(`Google Fit 저장 실패: ${saveError.message || '알 수 없는 오류'}`));
            });
        }
      } catch (error) {
        console.error('Google Fit 저장 오류:', error);
        reject(new Error(`Google Fit 저장 실패: ${error.message || '알 수 없는 오류'}`));
      }
    });
  } catch (error) {
    throw new Error(`Google Fit 저장 실패: ${error.message}`);
  }
};

// 건강 앱에서 데이터 읽기 (선택적)
export const readHealthData = async (startDate, endDate) => {
  if (Platform.OS === 'web') {
    return { success: false, message: '웹에서는 건강 앱 연동을 지원하지 않습니다.' };
  }

  try {
    if (Platform.OS === 'ios') {
      return await readFromHealthKit(startDate, endDate);
    }
    
    if (Platform.OS === 'android') {
      return await readFromGoogleFit(startDate, endDate);
    }

    return { success: false, message: '지원하지 않는 플랫폼입니다.' };
  } catch (error) {
    console.error('건강 앱 데이터 읽기 오류:', error);
    return { success: false, message: error.message || '건강 앱 데이터 읽기 중 오류가 발생했습니다.' };
  }
};

// iOS HealthKit에서 읽기
const readFromHealthKit = async (startDate, endDate) => {
  try {
    let AppleHealthKit;
    try {
      AppleHealthKit = require('react-native-health').default;
    } catch (importError) {
      return {
        success: false,
        message: 'HealthKit 데이터 읽기를 위해서는 react-native-health 패키지 설치가 필요합니다.',
        needsSetup: true,
        data: [],
      };
    }

    // HealthKit에서 워크아웃 데이터 읽기
    const options = {
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      type: 'Running',
    };

    return new Promise((resolve) => {
      AppleHealthKit.getWorkouts(options, (error, results) => {
        if (error) {
          console.error('HealthKit 데이터 읽기 오류:', error);
          resolve({
            success: false,
            message: `HealthKit 데이터 읽기 실패: ${error.message || '알 수 없는 오류'}`,
            data: [],
          });
        } else {
          resolve({ success: true, data: results || [] });
        }
      });
    });
  } catch (error) {
    throw new Error(`HealthKit 데이터 읽기 실패: ${error.message}`);
  }
};

// Android Google Fit에서 읽기
const readFromGoogleFit = async (startDate, endDate) => {
  try {
    let GoogleFit;
    try {
      GoogleFit = require('react-native-google-fit');
    } catch (importError) {
      return {
        success: false,
        message: 'Google Fit 데이터 읽기를 위해서는 react-native-google-fit 패키지 설치가 필요합니다.',
        needsSetup: true,
        data: [],
      };
    }

    // Google Fit에서 워크아웃 데이터 읽기
    const options = {
      startTime: new Date(startDate).getTime(),
      endTime: new Date(endDate).getTime(),
      activityType: 'running',
    };

    // react-native-google-fit의 getWorkouts는 콜백 기반일 수 있음
    return new Promise((resolve) => {
      try {
        if (typeof GoogleFit.getWorkouts === 'function') {
          // 콜백 기반인 경우
          GoogleFit.getWorkouts(options, (error, workouts) => {
            if (error) {
              console.error('Google Fit 데이터 읽기 오류:', error);
              resolve({
                success: false,
                message: `Google Fit 데이터 읽기 실패: ${error.message || '알 수 없는 오류'}`,
                data: [],
              });
            } else {
              resolve({ success: true, data: workouts || [] });
            }
          });
        } else {
          // Promise 기반인 경우
          GoogleFit.getWorkouts(options)
            .then((workouts) => {
              resolve({ success: true, data: workouts || [] });
            })
            .catch((readError) => {
              console.error('Google Fit 데이터 읽기 오류:', readError);
              resolve({
                success: false,
                message: `Google Fit 데이터 읽기 실패: ${readError.message || '알 수 없는 오류'}`,
                data: [],
              });
            });
        }
      } catch (error) {
        console.error('Google Fit 데이터 읽기 오류:', error);
        resolve({
          success: false,
          message: `Google Fit 데이터 읽기 실패: ${error.message || '알 수 없는 오류'}`,
          data: [],
        });
      }
    });
  } catch (error) {
    throw new Error(`Google Fit 데이터 읽기 실패: ${error.message}`);
  }
};

// 건강 앱 연동 상태 확인
export const checkHealthAppStatus = async () => {
  if (Platform.OS === 'web') {
    return { available: false, connected: false };
  }

  try {
    if (Platform.OS === 'ios') {
      return await checkHealthKitStatus();
    }
    
    if (Platform.OS === 'android') {
      return await checkGoogleFitStatus();
    }

    return { available: false, connected: false };
  } catch (error) {
    console.error('건강 앱 상태 확인 오류:', error);
    return { available: false, connected: false };
  }
};

// iOS HealthKit 상태 확인
const checkHealthKitStatus = async () => {
  try {
    let AppleHealthKit;
    try {
      AppleHealthKit = require('react-native-health').default;
    } catch (importError) {
      return {
        available: true,
        connected: false,
        platform: 'ios',
        needsSetup: true,
      };
    }

    // HealthKit 권한 상태 확인
    return new Promise((resolve) => {
      AppleHealthKit.getAuthStatus(
        {
          permissions: {
            read: ['HKQuantityTypeIdentifierDistanceWalkingRunning'],
            write: ['HKWorkoutTypeIdentifierRunning'],
          },
        },
        (error, result) => {
          if (error) {
            resolve({
              available: true,
              connected: false,
              platform: 'ios',
            });
          } else {
            const hasPermission = Object.values(result).some((status) => status === 2); // 2 = authorized
            resolve({
              available: true,
              connected: hasPermission,
              platform: 'ios',
            });
          }
        }
      );
    });
  } catch (error) {
    console.error('HealthKit 상태 확인 오류:', error);
    return { available: true, connected: false, platform: 'ios' };
  }
};

// Android Google Fit 상태 확인
const checkGoogleFitStatus = async () => {
  try {
    let GoogleFit;
    try {
      GoogleFit = require('react-native-google-fit');
    } catch (importError) {
      return {
        available: true,
        connected: false,
        platform: 'android',
        needsSetup: true,
      };
    }

    // Google Fit 인증 상태 확인
    try {
      if (typeof GoogleFit.isAuthorized === 'function') {
        // 콜백 기반인 경우
        return new Promise((resolve) => {
          GoogleFit.isAuthorized((isAuthorized) => {
            resolve({
              available: true,
              connected: Boolean(isAuthorized),
              platform: 'android',
            });
          });
        });
      } else {
        // Promise 기반이거나 직접 값인 경우
        const isAuthorized = await (GoogleFit.isAuthorized ? GoogleFit.isAuthorized() : Promise.resolve(false));
        return {
          available: true,
          connected: Boolean(isAuthorized),
          platform: 'android',
        };
      }
    } catch (error) {
      return {
        available: true,
        connected: false,
        platform: 'android',
      };
    }
  } catch (error) {
    console.error('Google Fit 상태 확인 오류:', error);
    return { available: true, connected: false, platform: 'android' };
  }
};
