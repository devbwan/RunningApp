import { useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { useRunStore } from '../stores/runStore';

export function useRunningTracker() {
  const { isRunning, start, pause, resume, stop, addPoint, addDistance, setDuration, setPace, setMaxSpeed } = useRunStore();
  const watchSubscriptionRef = useRef(null);
  const timerRef = useRef(null);
  const lastLocationRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    if (isRunning) {
      // 타이머 시작
      if (!startTimeRef.current) {
        startTimeRef.current = Date.now();
      }
      timerRef.current = setInterval(() => {
        if (startTimeRef.current) {
          const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
          setDuration(elapsed);
          
          // 페이스 계산 (거리가 있을 때)
          const { distance } = useRunStore.getState();
          if (distance > 0) {
            const pace = Math.round((elapsed / distance) * 1000); // 초/km
            setPace(pace);
          }
        }
      }, 1000);

      // 위치 추적 시작
      (async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.warn('위치 권한이 허용되지 않았습니다.');
          return;
        }

        watchSubscriptionRef.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 5000, // 5초마다 업데이트
            distanceInterval: 10, // 10m 이동 시 업데이트
          },
          (location) => {
            const { latitude, longitude, speed } = location.coords;
            const point = {
              lat: latitude,
              lng: longitude,
              timestamp: Date.now(),
            };

            addPoint(point);

            // 속도 업데이트 (m/s를 km/h로 변환)
            if (speed && speed > 0) {
              const speedKmh = speed * 3.6;
              setMaxSpeed(speedKmh);
            }

            // 거리 계산 (이전 위치가 있을 때)
            if (lastLocationRef.current) {
              const distance = calculateDistance(
                lastLocationRef.current.lat,
                lastLocationRef.current.lng,
                latitude,
                longitude
              );
              addDistance(distance);
            }

            lastLocationRef.current = { lat: latitude, lng: longitude };
          }
        );
      })();
    } else {
      // 정지 시 정리
      if (watchSubscriptionRef.current) {
        watchSubscriptionRef.current.remove();
        watchSubscriptionRef.current = null;
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (!isRunning) {
        // 완전히 종료된 경우만 시간 초기화
        lastLocationRef.current = null;
        startTimeRef.current = null;
      }
    }

    return () => {
      if (watchSubscriptionRef.current) {
        watchSubscriptionRef.current.remove();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning]);

  return {
    start: () => {
      startTimeRef.current = null;
      start();
    },
    pause: () => {
      pause();
    },
    resume: () => {
      resume();
    },
    stop: () => {
      stop();
      startTimeRef.current = null;
    },
  };
}

// 두 좌표 간 거리 계산 (Haversine 공식)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // 지구 반지름 (미터)
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // 미터 단위
}
