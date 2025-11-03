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
  start: () => set({ 
    isRunning: true, 
    isPaused: false,
    distance: 0, 
    duration: 0, 
    pace: 0, 
    maxSpeed: 0,
    route: [],
    startTime: Date.now(),
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
  }),
  addPoint: (p) => set((s) => ({ route: [...s.route, p] })),
  addDistance: (d) => set((s) => ({ distance: s.distance + d })),
  setDuration: (sec) => set({ duration: sec }),
  setPace: (secPerKm) => set({ pace: secPerKm }),
  setMaxSpeed: (speed) => set((s) => ({ maxSpeed: Math.max(s.maxSpeed, speed) })),
}));
