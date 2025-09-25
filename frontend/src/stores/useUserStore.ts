import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SessionUser, UserStore } from '../types';

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user: SessionUser | null) => set({ user }),
    }),
    {
      name: 'user-storage',
    }
  )
);