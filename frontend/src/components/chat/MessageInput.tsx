import React, { useState, useRef } from 'react';
import RichTextInput, { type RichTextInputRef } from '../common/RichTextInput';

interface MessageInputProps {
	onSendMessage: (message: string) => void;
	isLoading?: boolean;
	disabled?: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({
	onSendMessage,
	isLoading = false,
	disabled = false
}) => {
	const [message, setMessage] = useState('');
	const richTextRef = useRef<RichTextInputRef>(null);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (message.trim() && !isLoading && !disabled) {
			onSendMessage(message.trim());
			setMessage('');
			richTextRef.current?.setContent('');
		}
	};

	const handleKeyDown = (event: KeyboardEvent) => {
		if (event.key === 'Enter' && !event.shiftKey && !event.ctrlKey && !event.metaKey) {
			event.preventDefault();
			handleSubmit(event as any);
		}
	};

	return (
		<div className="bg-white dark:bg-gray-900 px-4 pb-4">
			<form onSubmit={handleSubmit}>
				<div className="relative flex items-end space-x-3">
					{/* Message Input */}
					<div className="flex-1 relative">
						<div className="app-chat-input relative w-full shadow-lg rounded-3xl border border-gray-50 dark:border-gray-850 hover:border-gray-100 focus-within:border-gray-100 hover:dark:border-gray-800 focus-within:dark:border-gray-800 transition px-1 bg-white/90 dark:bg-gray-400/5 text-gray-900 dark:text-gray-100 min-h-[56px] max-h-80 overflow-y-auto">
							<RichTextInput
								ref={richTextRef}
								id="chat-input"
								value={message}
								onUpdate={setMessage}
								onKeyDown={handleKeyDown}
								placeholder="Send a message..."
								messageInput={true}
								shiftEnter={true}
								className="input-prose w-full px-4 py-3 pr-12 bg-transparent text-inherit placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none"
							/>
						</div>

						{/* Send Button */}
						<button
							type="submit"
							disabled={!message.trim() || isLoading || disabled}
							className="absolute right-2 bottom-2 p-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-200 transition-colors z-10"
						>
							{isLoading ? (
								<svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
									<circle
										className="opacity-25"
										cx="12"
										cy="12"
										r="10"
										stroke="currentColor"
										strokeWidth="4"
									></circle>
									<path
										className="opacity-75"
										fill="currentColor"
										d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
									></path>
								</svg>
							) : (
								<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
									/>
								</svg>
							)}
						</button>
					</div>
				</div>
			</form>
		</div>
	);
};

export default MessageInput;
