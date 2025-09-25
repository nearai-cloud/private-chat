import type {
	ChatCompletionRequest,
	ChatCompletionResponse,
	ChatCompletionStreamResponse,
	Chat
} from '../types';

const API_BASE_URL = 'http://localhost:8000'; // This will be configurable later

// Mock data for development
export const MOCK_CHATS: Chat[] = [
	{
		id: '1',
		title: 'Hello World Chat',
		user_id: 'user1',
		created_at: Date.now() - 86400000,
		updated_at: Date.now() - 86400000,
		messages: [
			{
				id: 'msg1',
				role: 'user',
				content: 'Hello! How are you?',
				timestamp: Date.now() - 86400000
			},
			{
				id: 'msg2',
				role: 'assistant',
				content: "Hello! I'm doing well, thank you for asking. How can I help you today?",
				timestamp: Date.now() - 86400000 + 1000
			}
		]
	},
	{
		id: '2',
		title: 'React Development',
		user_id: 'user1',
		created_at: Date.now() - 43200000,
		updated_at: Date.now() - 43200000,
		messages: [
			{
				id: 'msg3',
				role: 'user',
				content: 'Can you help me with React hooks?',
				timestamp: Date.now() - 43200000
			},
			{
				id: 'msg4',
				role: 'assistant',
				content:
					'Of course! React hooks are a powerful feature that allow you to use state and other React features without writing a class component. What specific aspect of hooks would you like to learn about?',
				timestamp: Date.now() - 43200000 + 2000
			}
		]
	}
];

export class OpenAIClient {
	private apiKey: string;
	private baseURL: string;

	constructor(apiKey: string = '', baseURL: string = API_BASE_URL) {
		this.apiKey = apiKey;
		this.baseURL = baseURL;
	}

	async createChatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
		// For now, return mock data
		await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate network delay

		return {
			id: `chatcmpl-${Date.now()}`,
			object: 'chat.completion',
			created: Math.floor(Date.now() / 1000),
			model: request.model,
			choices: [
				{
					index: 0,
					message: {
						role: 'assistant',
						content: `This is a mock response to: "${request.messages[request.messages.length - 1].content}". In a real implementation, this would come from the OpenAI API.`
					},
					finish_reason: 'stop'
				}
			],
			usage: {
				prompt_tokens: 50,
				completion_tokens: 30,
				total_tokens: 80
			}
		};
	}

	async *createChatCompletionStream(
		request: ChatCompletionRequest
	): AsyncIterable<ChatCompletionStreamResponse> {
		const responseText = `This is a mock streaming response to: "${request.messages[request.messages.length - 1].content}". Each word will appear one by one to simulate streaming.`;
		const words = responseText.split(' ');

		for (let i = 0; i < words.length; i++) {
			await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate streaming delay

			yield {
				id: `chatcmpl-${Date.now()}`,
				object: 'chat.completion.chunk',
				created: Math.floor(Date.now() / 1000),
				model: request.model,
				choices: [
					{
						index: 0,
						delta: {
							role: i === 0 ? 'assistant' : undefined,
							content: (i === 0 ? '' : ' ') + words[i]
						},
						finish_reason: i === words.length - 1 ? 'stop' : undefined
					}
				]
			};
		}
	}

	// Chat management functions (these would normally be separate from OpenAI client)
	async getChats(): Promise<Chat[]> {
		await new Promise((resolve) => setTimeout(resolve, 500));
		return MOCK_CHATS;
	}

	async getChat(id: string): Promise<Chat | null> {
		await new Promise((resolve) => setTimeout(resolve, 300));
		return MOCK_CHATS.find((chat) => chat.id === id) || null;
	}

	async createChat(title: string = 'New Chat'): Promise<Chat> {
		await new Promise((resolve) => setTimeout(resolve, 300));

		const newChat: Chat = {
			id: `chat-${Date.now()}`,
			title,
			user_id: 'user1',
			created_at: Date.now(),
			updated_at: Date.now(),
			messages: []
		};

		MOCK_CHATS.unshift(newChat);
		return newChat;
	}

	async deleteChat(id: string): Promise<void> {
		await new Promise((resolve) => setTimeout(resolve, 300));
		const index = MOCK_CHATS.findIndex((chat) => chat.id === id);
		if (index !== -1) {
			MOCK_CHATS.splice(index, 1);
		}
	}
}

export const openAIClient = new OpenAIClient();
