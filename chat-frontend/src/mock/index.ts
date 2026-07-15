import type { Chat } from '../types';

export const createNewChat = (): Chat => ({
  id: `chat-${Date.now()}`,
  title: 'New Conversation',
  createdAt: new Date(),
  lastMessageAt: new Date(),
  messages: [],
});
