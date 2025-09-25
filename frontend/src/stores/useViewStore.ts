import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ViewStore } from '../types';

export const useViewStore = create<ViewStore>()(
	persist(
		(set) => ({
			isLeftSidebarOpen: true,
			setIsLeftSidebarOpen: (isOpen: boolean) => set({ isLeftSidebarOpen: isOpen })
		}),
		{
			name: 'view-storage'
		}
	)
);
