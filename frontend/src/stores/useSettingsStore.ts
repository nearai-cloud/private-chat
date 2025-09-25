import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Settings, SettingsStore } from '../types';

const defaultSettings: Settings = {
  theme: 'dark',
  notificationEnabled: false,
  showChangelog: true,
  version: '0.6.5',
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      settings: defaultSettings,
      setSettings: (settingsUpdate: Partial<Settings>) =>
        set((state) => ({
          settings: { ...state.settings, ...settingsUpdate },
        })),
    }),
    {
      name: 'settings-storage',
    }
  )
);