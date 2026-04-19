import './ConversationList.css';

export default function ConversationList({
  conversations,
  selectedUser,
  onSelectUser,
  unreadCount,
}) {
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const truncateMessage = (message, length = 50) => {
    return message.length > length ? message.substring(0, length) + '...' : message;
  };

  return (
    <div className="conversation-list">
      <div className="conversation-list-header">
        <h2>Messages</h2>
        {unreadCount > 0 && (
          <span className="unread-badge-header">{unreadCount}</span>
        )}
      </div>

      <div className="conversation-list-content">
        {conversations.length === 0 ? (
          <div className="no-conversations">
            <p>No conversations yet</p>
          </div>
        ) : (
          conversations.map((conversation) => (
            <div
              key={conversation.user_id}
              className={`conversation-item ${
                selectedUser === conversation.user_id ? 'active' : ''
              }`}
              onClick={() => onSelectUser(conversation.user_id)}
            >
              <div className="conversation-item-header">
                <span className="username">{conversation.username}</span>
                <span className="timestamp">
                  {formatTime(conversation.last_message_time)}
                </span>
              </div>

              <div className="conversation-item-body">
                <p className="last-message">
                  {truncateMessage(conversation.last_message)}
                </p>
                {conversation.unread_count > 0 && (
                  <span className="unread-badge">
                    {conversation.unread_count}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
