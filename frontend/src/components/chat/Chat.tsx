import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Messages from './Messages';
import MessageInput from './MessageInput';
import { useChat, useCreateChat } from '../../hooks/useChat';
import { useChatStore } from '../../stores/useChatStore';
import { openAIClient } from '../../api/openai';
import type { Message, ChatCompletionRequest } from '../../types';

interface ChatProps {
  chatId?: string;
}

const Chat: React.FC<ChatProps> = ({ chatId }) => {
  const params = useParams();
  const navigate = useNavigate();
  const currentChatId = chatId || params.chatId;
  const { setCurrentChatId, updateChat } = useChatStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreamingResponse, setIsStreamingResponse] = useState(false);

  const { data: chat, isLoading: isChatLoading } = useChat(currentChatId);
  const createChatMutation = useCreateChat();

  useEffect(() => {
    if (currentChatId) {
      setCurrentChatId(currentChatId);
    }
  }, [currentChatId, setCurrentChatId]);

  useEffect(() => {
    if (chat) {
      setMessages(chat.messages || []);
    } else if (!currentChatId) {
      setMessages([]);
    }
  }, [chat, currentChatId]);

  const handleSendMessage = async (content: string) => {
    let activeChatId = currentChatId;

    // Create new chat if we don't have one
    if (!activeChatId) {
      try {
        const newChat = await createChatMutation.mutateAsync();
        activeChatId = newChat.id;
        navigate(`/c/${activeChatId}`);
      } catch (error) {
        console.error('Failed to create chat:', error);
        return;
      }
    }

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setIsStreamingResponse(true);

    try {
      const request: ChatCompletionRequest = {
        model: 'gpt-3.5-turbo',
        messages: [...messages, userMessage].map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
        stream: true,
        temperature: 0.7,
        max_tokens: 1000,
      };

      const assistantMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);

      // Handle streaming response
      let fullContent = '';
      for await (const chunk of openAIClient.createChatCompletionStream(request)) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          fullContent += content;
          setMessages(prev => prev.map(msg =>
            msg.id === assistantMessage.id
              ? { ...msg, content: fullContent }
              : msg
          ));
        }

        if (chunk.choices[0]?.finish_reason === 'stop') {
          setIsStreamingResponse(false);
          break;
        }
      }

      // Update the chat with new messages
      const updatedMessages = [...messages, userMessage, { ...assistantMessage, content: fullContent }];
      updateChat(activeChatId!, {
        messages: updatedMessages,
        updated_at: Date.now(),
        title: updatedMessages.length === 2 ? content.slice(0, 50) + '...' : undefined
      });

    } catch (error) {
      console.error('Failed to send message:', error);
      setIsLoading(false);
      setIsStreamingResponse(false);

      // Add error message
      const errorMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your message. Please try again.',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  if (isChatLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Loading chat...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Messages */}
      <Messages messages={messages} isLoading={isLoading} />

      {/* Message Input */}
      <MessageInput
        onSendMessage={handleSendMessage}
        isLoading={isLoading || isStreamingResponse}
        disabled={createChatMutation.isPending}
      />
    </div>
  );
};

export default Chat;