import { useState } from 'react';
import './MessageInput.css';

export default function MessageInput({ onSendMessage }) {
  const [content, setContent] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!content.trim()) return;

    setIsSending(true);
    try {
      await onSendMessage(content);
      setContent('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form className="message-input-form" onSubmit={handleSubmit}>
      <div className="message-input-container">
        <textarea
          className="message-input"
          placeholder="Type a message... (Shift+Enter for new line)"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isSending}
          rows="1"
        />
        <button
          type="submit"
          className="send-button"
          disabled={!content.trim() || isSending}
        >
          {isSending ? (
            <span className="sending">Sending...</span>
          ) : (
            <span>Send</span>
          )}
        </button>
      </div>
      <div className="character-count">
        {content.length} / 5000
      </div>
    </form>
  );
}
