import React from 'react';
import type { Message } from '../../types';

interface MessagesProps {
  messages: Message[];
  isLoading?: boolean;
}

const Messages: React.FC<MessagesProps> = ({ messages, isLoading = false }) => {
  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
      {messages.length === 0 && !isLoading ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-lg font-medium">Start a conversation</p>
            <p className="text-sm mt-1">Send a message to begin chatting</p>
          </div>
        </div>
      ) : (
        messages.map((message) => (
          <div key={message.id} className="group flex space-x-3">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-green-500 text-white'
              }`}>
                {message.role === 'user' ? 'U' : 'AI'}
              </div>
            </div>

            {/* Message Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {message.role === 'user' ? 'You' : 'Assistant'}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <div
                className="markdown-prose text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap"
                dangerouslySetInnerHTML={{
                  __html: message.content.replace(/\n/g, '<br>')
                }}
              />
            </div>

            {/* Actions */}
            <div className="flex-shrink-0 flex items-start space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                onClick={() => navigator.clipboard.writeText(message.content)}
                title="Copy message"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>
        ))
      )}

      {isLoading && (
        <div className="flex space-x-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-sm font-medium text-white">
              AI
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Assistant</span>
            </div>
            <div className="text-sm text-gray-700 dark:text-gray-300">
              <div className="flex items-center space-x-1">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-xs text-gray-500">Thinking...</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Messages;