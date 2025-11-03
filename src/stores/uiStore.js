import { create } from 'zustand';

export const useUiStore = create((set) => ({
  themeMode: 'auto', // 'light' | 'dark' | 'auto'
  setThemeMode: (mode) => set({ themeMode: mode }),
}));


