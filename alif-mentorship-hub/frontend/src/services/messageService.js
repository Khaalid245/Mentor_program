import api from './axios';

export const messageService = {
  // Get all conversations (unique users)
  getConversations: async () => {
    try {
      const response = await api.get('/messages/conversations/');
      return response.data;
    } catch (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }
  },

  // Get messages with a specific user
  getMessages: async (userId) => {
    try {
      const response = await api.get(`/messages/?user_id=${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  },

  // Send a message
  sendMessage: async (recipientId, content) => {
    try {
      const response = await api.post('/messages/', {
        recipient_id: recipientId,
        content: content,
      });
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  // Mark message as read
  markAsRead: async (messageId) => {
    try {
      const response = await api.post(`/messages/${messageId}/read/`);
      return response.data;
    } catch (error) {
      console.error('Error marking message as read:', error);
      throw error;
    }
  },

  // Get unread message count
  getUnreadCount: async () => {
    try {
      const response = await api.get('/messages/unread-count/');
      return response.data;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      throw error;
    }
  },

  // Mark all messages from a user as read
  markConversationAsRead: async (userId, messages) => {
    try {
      const unreadMessages = messages.filter(
        (msg) => !msg.is_read && msg.sender_id === userId
      );
      
      for (const msg of unreadMessages) {
        await messageService.markAsRead(msg.id);
      }
    } catch (error) {
      console.error('Error marking conversation as read:', error);
      throw error;
    }
  },
};
