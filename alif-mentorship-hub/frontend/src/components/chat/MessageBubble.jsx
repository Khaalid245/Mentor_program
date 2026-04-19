import { useContext } from 'react';
import './MessageBubble.css';

export default function MessageBubble({ message }) {
  // Get current user from localStorage (set during login)
  const currentUserId = parseInt(localStorage.getItem('user_id'));
  const isSent = message.sender_id === currentUserId;

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className={`message-bubble-container ${isSent ? 'sent' : 'received'}`}>
      <div className="message-bubble">
        <p className="message-content">{message.content}</p>
        <div className="message-footer">
          <span className="message-time">{formatTime(message.created_at)}</span>
          {isSent && (
            <span className="read-status">
              {message.is_read ? '✓✓' : '✓'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
