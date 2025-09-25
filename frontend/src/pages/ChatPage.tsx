import React from 'react';
import { useParams } from 'react-router-dom';
import Chat from '../components/chat/Chat';

const ChatPage: React.FC = () => {
  const { chatId } = useParams<{ chatId: string }>();

  return <Chat chatId={chatId} />;
};

export default ChatPage;