import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';

const SESSIONS_COLLECTION = 'running_sessions';
const ROUTE_POINTS_COLLECTION = 'route_points';

// 러닝 세션 동기화
export const syncRunningSession = async (sessionData, route) => {
  if (!db || !sessionData.userId) {
    console.warn('Firestore가 초기화되지 않았거나 사용자 ID가 없습니다.');
    return null;
  }

  try {
    // 세션 저장
    const sessionRef = doc(collection(db, SESSIONS_COLLECTION));
    await setDoc(sessionRef, {
      userId: sessionData.userId,
      type: sessionData.type || 'solo',
      distance: sessionData.distance,
      duration: sessionData.duration,
      avgPace: sessionData.avgPace || null,
      maxSpeed: sessionData.maxSpeed || null,
      calories: sessionData.calories || null,
      startTime: sessionData.startTime
        ? new Date(sessionData.startTime * 1000)
        : serverTimestamp(),
      endTime: sessionData.endTime
        ? new Date(sessionData.endTime * 1000)
        : serverTimestamp(),
      syncedAt: serverTimestamp(),
    });

    const sessionId = sessionRef.id;

    // 경로 포인트 저장 (배치 처리)
    if (route && route.length > 0) {
      // Firestore는 한 번에 최대 500개 문서를 쓰므로 배치로 나눔
      const batchSize = 400;
      for (let i = 0; i < route.length; i += batchSize) {
        const batch = route.slice(i, i + batchSize);
        const batchPromises = batch.map((point, index) => {
          const pointRef = doc(collection(db, ROUTE_POINTS_COLLECTION));
          return setDoc(pointRef, {
            sessionId,
            lat: point.lat,
            lng: point.lng,
            timestamp: point.timestamp
              ? new Date(point.timestamp)
              : serverTimestamp(),
            index: i + index,
          });
        });
        await Promise.all(batchPromises);
      }
    }

    return sessionId;
  } catch (error) {
    console.error('세션 동기화 오류:', error);
    throw error;
  }
};

// 사용자의 클라우드 세션 조회
export const getCloudSessions = async (userId, limitCount = 50) => {
  if (!db || !userId) {
    return [];
  }

  try {
    const q = query(
      collection(db, SESSIONS_COLLECTION),
      where('userId', '==', userId),
      orderBy('startTime', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      startTime: doc.data().startTime?.toDate?.() || doc.data().startTime,
      endTime: doc.data().endTime?.toDate?.() || doc.data().endTime,
    }));
  } catch (error) {
    console.error('클라우드 세션 조회 오류:', error);
    return [];
  }
};

// 클라우드 세션의 경로 포인트 조회
export const getCloudRoutePoints = async (sessionId) => {
  if (!db) {
    return [];
  }

  try {
    const q = query(
      collection(db, ROUTE_POINTS_COLLECTION),
      where('sessionId', '==', sessionId),
      orderBy('index', 'asc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        lat: data.lat,
        lng: data.lng,
        timestamp: data.timestamp?.toDate?.() || data.timestamp,
      };
    });
  } catch (error) {
    console.error('경로 포인트 조회 오류:', error);
    return [];
  }
};

