import { create } from 'zustand';
import type { Chat, ChatStore } from '../types';

export const useChatStore = create<ChatStore>((set) => ({
	chats: [],
	currentChatId: null,
	isLoading: false,

	setChats: (chats: Chat[]) => set({ chats }),

	setCurrentChatId: (id: string | null) => set({ currentChatId: id }),

	addChat: (chat: Chat) => set((state) => ({ chats: [chat, ...state.chats] })),

	updateChat: (id: string, chatUpdate: Partial<Chat>) =>
		set((state) => ({
			chats: state.chats.map((chat) => (chat.id === id ? { ...chat, ...chatUpdate } : chat))
		})),

	deleteChat: (id: string) =>
		set((state) => ({
			chats: state.chats.filter((chat) => chat.id !== id),
			currentChatId: state.currentChatId === id ? null : state.currentChatId
		})),

	setLoading: (loading: boolean) => set({ isLoading: loading })
}));
