// User types
export interface SessionUser {
	id: string;
	name: string;
	email: string;
	role: 'user' | 'admin';
	profile_image_url?: string;
	permissions?: {
		chat?: {
			temporary?: boolean;
			temporary_enforced?: boolean;
		};
	};
}

// Chat types
export interface Chat {
	id: string;
	title: string;
	user_id: string;
	created_at: number;
	updated_at: number;
	archived?: boolean;
	pinned?: boolean;
	folder_id?: string;
	messages: Message[];
}

export interface Message {
	id: string;
	role: 'user' | 'assistant' | 'system';
	content: string;
	timestamp: number;
	model?: string;
	metadata?: Record<string, unknown>;
}

// OpenAI API types
export interface ChatCompletionRequest {
	model: string;
	messages: Array<{
		role: 'user' | 'assistant' | 'system';
		content: string;
	}>;
	stream?: boolean;
	temperature?: number;
	max_tokens?: number;
	top_p?: number;
	frequency_penalty?: number;
	presence_penalty?: number;
}

export interface ChatCompletionResponse {
	id: string;
	object: 'chat.completion';
	created: number;
	model: string;
	choices: Array<{
		index: number;
		message: {
			role: 'assistant';
			content: string;
		};
		finish_reason: string;
	}>;
	usage: {
		prompt_tokens: number;
		completion_tokens: number;
		total_tokens: number;
	};
}

export interface ChatCompletionStreamResponse {
	id: string;
	object: 'chat.completion.chunk';
	created: number;
	model: string;
	choices: Array<{
		index: number;
		delta: {
			role?: 'assistant';
			content?: string;
		};
		finish_reason?: string;
	}>;
}

// Model types
export interface Model {
	id: string;
	name: string;
	object: 'model';
	created: number;
	owned_by: string;
}

// Settings types
export interface Settings {
	theme: 'light' | 'dark' | 'system';
	notificationEnabled: boolean;
	showChangelog: boolean;
	version: string;
	directConnections?: unknown;
	toolServers?: unknown[];
}

// Config types
export interface Config {
	name: string;
	version: string;
	features: {
		enable_websocket?: boolean;
		enable_direct_connections?: boolean;
	};
	default_locale?: string;
}

// Banner types
export interface Banner {
	id: string;
	type: 'info' | 'warning' | 'error';
	content: string;
	dismissible: boolean;
}

// Folder types
export interface Folder {
	id: string;
	name: string;
	parent_id?: string;
	user_id: string;
	created_at: number;
	updated_at: number;
}

// Tag types
export interface Tag {
	name: string;
	count: number;
}

// API Response wrapper
export interface ApiResponse<T = unknown> {
	data?: T;
	error?: string;
	message?: string;
}

// Store types
export interface UserStore {
	user: SessionUser | null;
	setUser: (user: SessionUser | null) => void;
}

export interface ViewStore {
	isLeftSidebarOpen: boolean;
	setIsLeftSidebarOpen: (isOpen: boolean) => void;
}

export interface ChatStore {
	chats: Chat[];
	currentChatId: string | null;
	isLoading: boolean;
	setChats: (chats: Chat[]) => void;
	setCurrentChatId: (id: string | null) => void;
	addChat: (chat: Chat) => void;
	updateChat: (id: string, chat: Partial<Chat>) => void;
	deleteChat: (id: string) => void;
	setLoading: (loading: boolean) => void;
}

export interface SettingsStore {
	settings: Settings;
	setSettings: (settings: Partial<Settings>) => void;
}
