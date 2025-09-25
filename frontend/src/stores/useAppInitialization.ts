import { create } from 'zustand';
import { useUserStore } from './useUserStore';
import { useChatStore } from './useChatStore';
import { openAIClient } from '../api/openai';
import type { SessionUser } from '../types';

interface AppInitializationStore {
	isInitialized: boolean;
	isLoading: boolean;
	initializeApp: () => Promise<void>;
}

export const useAppInitialization = create<AppInitializationStore>((set, get) => ({
	isInitialized: false,
	isLoading: false,

	initializeApp: async () => {
		if (get().isInitialized || get().isLoading) return;

		set({ isLoading: true });

		try {
			// Initialize mock user
			const mockUser: SessionUser = {
				id: 'user1',
				name: 'Demo User',
				email: 'demo@example.com',
				role: 'user',
				permissions: {
					chat: {
						temporary: false,
						temporary_enforced: false
					}
				}
			};

			useUserStore.getState().setUser(mockUser);

			// Load initial chats
			const chats = await openAIClient.getChats();
			useChatStore.getState().setChats(chats);

			set({ isInitialized: true, isLoading: false });
		} catch (error) {
			console.error('Failed to initialize app:', error);
			set({ isLoading: false });
		}
	}
}));
