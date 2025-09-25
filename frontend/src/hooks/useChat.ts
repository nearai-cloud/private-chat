import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { openAIClient } from '../api/openai';
import { useChatStore } from '../stores/useChatStore';
import type { Chat, Message, ChatCompletionRequest } from '../types';

export const useChats = () => {
  const { setChats } = useChatStore();

  return useQuery({
    queryKey: ['chats'],
    queryFn: async () => {
      const chats = await openAIClient.getChats();
      setChats(chats);
      return chats;
    },
  });
};

export const useChat = (chatId?: string) => {
  return useQuery({
    queryKey: ['chat', chatId],
    queryFn: () => openAIClient.getChat(chatId!),
    enabled: !!chatId,
  });
};

export const useCreateChat = () => {
  const queryClient = useQueryClient();
  const { addChat } = useChatStore();

  return useMutation({
    mutationFn: (title?: string) => openAIClient.createChat(title),
    onSuccess: (newChat) => {
      addChat(newChat);
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    },
  });
};

export const useDeleteChat = () => {
  const queryClient = useQueryClient();
  const { deleteChat } = useChatStore();

  return useMutation({
    mutationFn: (chatId: string) => openAIClient.deleteChat(chatId),
    onSuccess: (_, chatId) => {
      deleteChat(chatId);
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    },
  });
};

export const useChatCompletion = () => {
  return useMutation({
    mutationFn: (request: ChatCompletionRequest) => openAIClient.createChatCompletion(request),
  });
};