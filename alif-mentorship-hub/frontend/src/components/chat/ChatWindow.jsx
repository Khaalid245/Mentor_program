import { useState, useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import './ChatWindow.css';

export default function ChatWindow({
  messages,
  selectedUser,
  onSendMessage,
  loading,
  error,
}) {
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (content) => {
    onSendMessage(content);
  };

  return (
    <div className="chat-window">
      <div className="chat-window-header">
        <div className="chat-header-info">
          <h2>{selectedUser}</h2>
          <p className="status">Online</p>
        </div>
      </div>

      <div className="messages-container">
        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}

        {loading && messages.length === 0 && (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading messages...</p>
          </div>
        )}

        {messages.length === 0 && !loading && (
          <div className="empty-state">
            <p>No messages yet. Start the conversation!</p>
          </div>
        )}

        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        <div ref={messagesEndRef} />
      </div>

      <MessageInput onSendMessage={handleSendMessage} />
    </div>
  );
}
