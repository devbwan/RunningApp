import { create } from 'zustand';

export const useRunStore = create((set) => ({
  isRunning: false,
  isPaused: false,
  distance: 0, // meters
  duration: 0, // seconds
  pace: 0, // sec/km
  maxSpeed: 0, // km/h
  route: [], // { lat, lng, timestamp }
  startTime: null,
  cadence: 0, // steps per minute
  stepCount: 0, // 총 걸음 수
  lastStepTime: null,
  start: () => set({ 
    isRunning: true, 
    isPaused: false,
    distance: 0, 
    duration: 0, 
    pace: 0, 
    maxSpeed: 0,
    route: [],
    startTime: Date.now(),
    cadence: 0,
    stepCount: 0,
    lastStepTime: null,
  }),
  pause: () => set({ isRunning: false, isPaused: true }),
  resume: () => set({ isRunning: true, isPaused: false }),
  stop: () => set({ isRunning: false, isPaused: false }),
  reset: () => set({ 
    isRunning: false, 
    isPaused: false,
    distance: 0, 
    duration: 0, 
    pace: 0, 
    maxSpeed: 0,
    route: [],
    startTime: null,
    cadence: 0,
    stepCount: 0,
    lastStepTime: null,
  }),
  addPoint: (p) => set((s) => ({ route: [...s.route, p] })),
  addDistance: (d) => set((s) => ({ distance: s.distance + d })),
  setDuration: (sec) => set({ duration: sec }),
  setPace: (secPerKm) => set({ pace: secPerKm }),
  setMaxSpeed: (speed) => set((s) => ({ maxSpeed: Math.max(s.maxSpeed, speed) })),
  addStep: () => {
    const now = Date.now();
    set((s) => {
      const newStepCount = s.stepCount + 1;
      // 최근 60초 동안의 걸음 수로 캐던스 계산
      let cadence = 0;
      if (s.lastStepTime && now - s.lastStepTime < 60000) {
        // 간단한 추정: 거리와 속도 기반으로 걸음 수 추정
        // 일반적으로 1km당 약 1200-1500보
        const stepsPerKm = 1350; // 평균
        const estimatedSteps = Math.round((s.distance / 1000) * stepsPerKm);
        const minutes = s.duration / 60;
        cadence = minutes > 0 ? Math.round(estimatedSteps / minutes) : 0;
      }
      return {
        stepCount: newStepCount,
        cadence: cadence > 0 ? cadence : Math.round((newStepCount / (s.duration / 60)) || 0),
        lastStepTime: now,
      };
    });
  },
  updateCadence: () => {
    // 거리 기반 캐던스 추정 (더 정확한 방법)
    set((s) => {
      if (s.duration > 0 && s.distance > 0) {
        // 일반적으로 1km당 약 1200-1500보
        const stepsPerKm = 1350; // 평균
        const estimatedSteps = Math.round((s.distance / 1000) * stepsPerKm);
        const minutes = s.duration / 60;
        const cadence = minutes > 0 ? Math.round(estimatedSteps / minutes) : 0;
        return { cadence, stepCount: estimatedSteps };
      }
      return {};
    });
  },
}));
