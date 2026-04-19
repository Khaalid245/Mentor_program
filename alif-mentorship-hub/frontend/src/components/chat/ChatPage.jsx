import { useState, useEffect } from 'react';
import { messageService } from '../../services/messageService';
import ConversationList from './ConversationList';
import ChatWindow from './ChatWindow';
import './ChatPage.css';

export default function ChatPage() {
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
    loadUnreadCount();
    
    // Poll for new messages every 3 seconds
    const interval = setInterval(() => {
      loadConversations();
      if (selectedUser) {
        loadMessages(selectedUser);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [selectedUser]);

  const loadConversations = async () => {
    try {
      const data = await messageService.getConversations();
      setConversations(data);
      setError(null);
    } catch (err) {
      setError('Failed to load conversations');
      console.error(err);
    }
  };

  const loadMessages = async (userId) => {
    try {
      setLoading(true);
      const data = await messageService.getMessages(userId);
      setMessages(data);
      
      // Mark unread messages as read
      const unreadMessages = data.filter((msg) => !msg.is_read && msg.sender_id === userId);
      for (const msg of unreadMessages) {
        await messageService.markAsRead(msg.id);
      }
      
      setError(null);
    } catch (err) {
      setError('Failed to load messages');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const data = await messageService.getUnreadCount();
      setUnreadCount(data.unread_count);
    } catch (err) {
      console.error('Failed to load unread count:', err);
    }
  };

  const handleSelectUser = (userId) => {
    setSelectedUser(userId);
    loadMessages(userId);
  };

  const handleSendMessage = async (content) => {
    if (!selectedUser || !content.trim()) return;

    try {
      await messageService.sendMessage(selectedUser, content);
      // Reload messages to show the new message
      await loadMessages(selectedUser);
      // Reload conversations to update last message
      await loadConversations();
      await loadUnreadCount();
    } catch (err) {
      setError('Failed to send message');
      console.error(err);
    }
  };

  return (
    <div className="chat-page">
      <div className="chat-container">
        <ConversationList
          conversations={conversations}
          selectedUser={selectedUser}
          onSelectUser={handleSelectUser}
          unreadCount={unreadCount}
        />
        
        {selectedUser ? (
          <ChatWindow
            messages={messages}
            selectedUser={selectedUser}
            onSendMessage={handleSendMessage}
            loading={loading}
            error={error}
          />
        ) : (
          <div className="no-conversation">
            <div className="no-conversation-icon">💬</div>
            <h2>Select a conversation to start messaging</h2>
            <p>Choose a mentor or student from the list to begin chatting</p>
          </div>
        )}
      </div>
    </div>
  );
}
