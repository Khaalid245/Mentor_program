# 🚀 Phase 3 Feature 1: Real-Time Messaging System

## Status: ✅ BACKEND COMPLETE (Frontend in progress)

---

## Overview

Real-time messaging enables direct communication between students and mentors before, during, and after sessions. This feature is critical for:
- Clarifying session goals before meeting
- Sharing resources after sessions
- Building relationships and trust
- Reducing no-shows through pre-session communication

---

## What's Been Implemented

### ✅ Backend (Complete)

#### 1. Message Model
```python
class Message(models.Model):
    sender = ForeignKey(User, related_name='sent_messages')
    recipient = ForeignKey(User, related_name='received_messages')
    content = TextField()
    is_read = BooleanField(default=False)
    read_at = DateTimeField(null=True, blank=True)
    created_at = DateTimeField(auto_now_add=True)
    updated_at = DateTimeField(auto_now=True)
```

**Features**:
- Bidirectional messaging (sender ↔ recipient)
- Read status tracking
- Timestamp tracking
- Optimized indexes for fast queries

#### 2. API Endpoints

**Messaging Endpoints**:
```
POST   /api/messages/                    # Send message
GET    /api/messages/?user_id=X          # Get messages with specific user
POST   /api/messages/{id}/read/          # Mark message as read
GET    /api/conversations/               # List all conversations
GET    /api/messages/unread-count/       # Get total unread count
```

**Request/Response Examples**:

Send Message:
```json
POST /api/messages/
{
  "recipient_id": 5,
  "content": "Hi! I'd like to discuss Python fundamentals in our session."
}

Response (201):
{
  "id": 42,
  "sender_username": "student_john",
  "recipient_username": "mentor_jane",
  "content": "Hi! I'd like to discuss Python fundamentals in our session.",
  "is_read": false,
  "read_at": null,
  "created_at": "2025-01-20T10:30:00Z"
}
```

Get Conversations:
```json
GET /api/conversations/

Response (200):
[
  {
    "user_id": 5,
    "username": "mentor_jane",
    "unread_count": 2,
    "last_message": "Looking forward to our session!",
    "last_message_time": "2025-01-20T10:30:00Z"
  },
  {
    "user_id": 8,
    "username": "mentor_bob",
    "unread_count": 0,
    "last_message": "Session completed successfully",
    "last_message_time": "2025-01-19T15:00:00Z"
  }
]
```

Get Messages with User:
```json
GET /api/messages/?user_id=5

Response (200):
[
  {
    "id": 42,
    "sender_id": 3,
    "sender_username": "student_john",
    "recipient_id": 5,
    "recipient_username": "mentor_jane",
    "content": "Hi! I'd like to discuss Python fundamentals.",
    "is_read": true,
    "read_at": "2025-01-20T10:35:00Z",
    "created_at": "2025-01-20T10:30:00Z"
  },
  {
    "id": 43,
    "sender_id": 5,
    "sender_username": "mentor_jane",
    "recipient_id": 3,
    "recipient_username": "student_john",
    "content": "Great! Let's focus on loops and functions.",
    "is_read": true,
    "read_at": "2025-01-20T10:32:00Z",
    "created_at": "2025-01-20T10:31:00Z"
  }
]
```

Mark as Read:
```json
POST /api/messages/42/read/

Response (200):
{
  "id": 42,
  "sender_username": "student_john",
  "recipient_username": "mentor_jane",
  "content": "Hi! I'd like to discuss Python fundamentals.",
  "is_read": true,
  "read_at": "2025-01-20T10:35:00Z",
  "created_at": "2025-01-20T10:30:00Z"
}
```

Unread Count:
```json
GET /api/messages/unread-count/

Response (200):
{
  "unread_count": 3
}
```

#### 3. Serializers

**MessageSerializer**: For list/create operations
```python
class MessageSerializer(serializers.ModelSerializer):
    sender_username = serializers.CharField(source='sender.username', read_only=True)
    recipient_username = serializers.CharField(source='recipient.username', read_only=True)
```

**MessageDetailSerializer**: For detailed message info
```python
class MessageDetailSerializer(serializers.ModelSerializer):
    sender_id = serializers.IntegerField(source='sender.id', read_only=True)
    recipient_id = serializers.IntegerField(source='recipient.id', read_only=True)
```

**ConversationSerializer**: For conversation list
```python
class ConversationSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()
    username = serializers.CharField()
    unread_count = serializers.IntegerField()
    last_message = serializers.CharField()
    last_message_time = serializers.DateTimeField()
```

#### 4. Database Migration

Migration file: `0008_message_sessionanalytics.py`

Creates:
- `api_message` table with indexes
- `api_sessionanalytics` table

Run migrations:
```bash
cd backend
python src/manage.py makemigrations
python src/manage.py migrate
```

---

## 📋 Frontend Implementation (Next Steps)

### Components to Build

#### 1. Chat Page (`frontend/src/pages/ChatPage.jsx`)
```jsx
// Main chat interface
- ConversationList (left sidebar)
- ChatWindow (main area)
- MessageInput (bottom)
```

#### 2. Conversation List (`frontend/src/components/chat/ConversationList.jsx`)
```jsx
// Features:
- List all conversations
- Show unread badge
- Search conversations
- Click to open chat
- Sort by last message time
```

#### 3. Chat Window (`frontend/src/components/chat/ChatWindow.jsx`)
```jsx
// Features:
- Display messages
- Show sender/recipient info
- Scroll to latest message
- Show read receipts
- Show typing indicator
```

#### 4. Message Input (`frontend/src/components/chat/MessageInput.jsx`)
```jsx
// Features:
- Text input field
- Send button
- Emoji picker (optional)
- File upload (Phase 3.2)
- Character counter
```

#### 5. Message Bubble (`frontend/src/components/chat/MessageBubble.jsx`)
```jsx
// Features:
- Display message content
- Show timestamp
- Show read status
- Different styling for sent/received
- Avatar for sender
```

### API Integration

```javascript
// services/messageService.js
export const messageService = {
  // Get all conversations
  getConversations: () => api.get('/messages/conversations/'),
  
  // Get messages with specific user
  getMessages: (userId) => api.get(`/messages/?user_id=${userId}`),
  
  // Send message
  sendMessage: (recipientId, content) => 
    api.post('/messages/', { recipient_id: recipientId, content }),
  
  // Mark message as read
  markAsRead: (messageId) => api.post(`/messages/${messageId}/read/`),
  
  // Get unread count
  getUnreadCount: () => api.get('/messages/unread-count/'),
};
```

### UI Design (Teal Theme)

```css
/* Chat container */
.chat-container {
  display: flex;
  height: 100vh;
  background: #F0FDF9;
}

/* Conversation list */
.conversation-list {
  width: 300px;
  border-right: 1px solid #CCFBF1;
  overflow-y: auto;
}

.conversation-item {
  padding: 12px;
  border-bottom: 1px solid #CCFBF1;
  cursor: pointer;
  transition: background 0.2s;
}

.conversation-item:hover {
  background: #F0FDF9;
}

.conversation-item.active {
  background: #D1FAE5;
  border-left: 3px solid #0D9488;
}

/* Chat window */
.chat-window {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

/* Message bubbles */
.message {
  margin-bottom: 12px;
  display: flex;
}

.message.sent {
  justify-content: flex-end;
}

.message.received {
  justify-content: flex-start;
}

.message-bubble {
  max-width: 60%;
  padding: 12px 16px;
  border-radius: 12px;
  word-wrap: break-word;
}

.message.sent .message-bubble {
  background: #0D9488;
  color: white;
}

.message.received .message-bubble {
  background: #CCFBF1;
  color: #134E4A;
}

.message-time {
  font-size: 12px;
  margin-top: 4px;
  opacity: 0.7;
}

.read-receipt {
  font-size: 12px;
  margin-top: 4px;
}

/* Message input */
.message-input-area {
  padding: 16px;
  border-top: 1px solid #CCFBF1;
  display: flex;
  gap: 8px;
}

.message-input {
  flex: 1;
  padding: 12px;
  border: 1px solid #CCFBF1;
  border-radius: 8px;
  font-size: 14px;
  font-family: 'Plus Jakarta Sans', sans-serif;
}

.message-input:focus {
  outline: none;
  border-color: #0D9488;
  box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.1);
}

.send-button {
  padding: 12px 24px;
  background: #0D9488;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.2s;
}

.send-button:hover {
  background: #0F766E;
}

.send-button:disabled {
  background: #CCFBF1;
  cursor: not-allowed;
}
```

---

## 🔌 WebSocket Setup (Optional - Phase 3.2)

For real-time updates without polling:

### Backend Setup

1. Install Django Channels:
```bash
pip install channels==4.0.0
pip install channels-redis==4.1.0
```

2. Update `settings.py`:
```python
INSTALLED_APPS = [
    'daphne',  # Add before django.contrib
    'channels',
    # ... rest of apps
]

ASGI_APPLICATION = 'alif_mentorship_hub.asgi.application'

CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            'hosts': [('127.0.0.1', 6379)],
        },
    },
}
```

3. Create `asgi.py`:
```python
import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from api.routing import websocket_urlpatterns

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'alif_mentorship_hub.settings')

application = ProtocolTypeRouter({
    'http': get_asgi_application(),
    'websocket': AuthMiddlewareStack(
        URLRouter(websocket_urlpatterns)
    ),
})
```

4. Create `api/routing.py`:
```python
from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/chat/(?P<user_id>\w+)/$', consumers.ChatConsumer.as_asgi()),
]
```

5. Create `api/consumers.py`:
```python
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from .models import Message
from .serializers import MessageDetailSerializer

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user_id = self.scope['url_route']['kwargs']['user_id']
        self.room_group_name = f'chat_{self.user_id}'
        
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()
    
    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
    
    async def receive(self, text_data):
        data = json.loads(text_data)
        message_type = data.get('type')
        
        if message_type == 'chat_message':
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message',
                    'message': data['message'],
                    'sender_id': self.scope['user'].id,
                }
            )
    
    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'type': 'chat_message',
            'message': event['message'],
            'sender_id': event['sender_id'],
        }))
```

### Frontend WebSocket Client

```javascript
// services/websocketService.js
export class WebSocketService {
  constructor(userId) {
    this.userId = userId;
    this.ws = null;
    this.listeners = {};
  }
  
  connect() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    this.ws = new WebSocket(
      `${protocol}//${window.location.host}/ws/chat/${this.userId}/`
    );
    
    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.emit('message', data);
    };
    
    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.emit('error', error);
    };
    
    this.ws.onclose = () => {
      this.emit('close');
    };
  }
  
  send(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'chat_message',
        message: message,
      }));
    }
  }
  
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }
  
  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }
  
  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }
}
```

---

## 🧪 Testing

### Backend Tests

```python
# tests/test_messaging.py
from django.test import TestCase
from rest_framework.test import APIClient
from api.models import User, Message

class MessageAPITestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.student = User.objects.create_user(
            username='student1',
            password='pass123',
            role='student'
        )
        self.mentor = User.objects.create_user(
            username='mentor1',
            password='pass123',
            role='mentor'
        )
    
    def test_send_message(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.post('/api/messages/', {
            'recipient_id': self.mentor.id,
            'content': 'Hello mentor!'
        })
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Message.objects.count(), 1)
    
    def test_get_conversations(self):
        # Create messages
        Message.objects.create(
            sender=self.student,
            recipient=self.mentor,
            content='Hi'
        )
        
        self.client.force_authenticate(user=self.student)
        response = self.client.get('/api/conversations/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
    
    def test_mark_as_read(self):
        msg = Message.objects.create(
            sender=self.mentor,
            recipient=self.student,
            content='Hello'
        )
        
        self.client.force_authenticate(user=self.student)
        response = self.client.post(f'/api/messages/{msg.id}/read/')
        self.assertEqual(response.status_code, 200)
        
        msg.refresh_from_db()
        self.assertTrue(msg.is_read)
```

### Frontend Tests

```javascript
// tests/Chat.test.jsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ChatPage from '../pages/ChatPage';
import * as messageService from '../services/messageService';

jest.mock('../services/messageService');

describe('ChatPage', () => {
  beforeEach(() => {
    messageService.getConversations.mockResolvedValue([
      {
        user_id: 1,
        username: 'mentor_jane',
        unread_count: 2,
        last_message: 'See you soon!',
        last_message_time: '2025-01-20T10:30:00Z'
      }
    ]);
  });
  
  test('renders conversation list', async () => {
    render(<ChatPage />);
    await waitFor(() => {
      expect(screen.getByText('mentor_jane')).toBeInTheDocument();
    });
  });
  
  test('sends message', async () => {
    messageService.sendMessage.mockResolvedValue({
      id: 1,
      content: 'Hello!',
      is_read: false
    });
    
    render(<ChatPage />);
    const input = screen.getByPlaceholderText('Type a message...');
    fireEvent.change(input, { target: { value: 'Hello!' } });
    fireEvent.click(screen.getByText('Send'));
    
    await waitFor(() => {
      expect(messageService.sendMessage).toHaveBeenCalledWith(1, 'Hello!');
    });
  });
});
```

---

## 📊 Performance Metrics

### Expected Performance

- Message delivery: < 100ms (with WebSocket)
- Message delivery: < 500ms (with polling)
- Conversation list load: < 1 second
- Unread count update: Real-time
- Database query time: < 50ms

### Optimization Tips

1. **Pagination**: Load messages in batches of 50
2. **Caching**: Cache conversation list for 30 seconds
3. **Indexing**: Use database indexes on sender/recipient/created_at
4. **Lazy Loading**: Load older messages on scroll

---

## 🚀 Deployment

### Docker Setup

Update `docker-compose.yml`:
```yaml
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
  
  backend:
    build: ./backend
    command: daphne -b 0.0.0.0 -p 8000 alif_mentorship_hub.asgi:application
    depends_on:
      - redis
    environment:
      - CHANNEL_LAYERS_BACKEND=channels_redis.core.RedisChannelLayer
```

### Environment Variables

```bash
# .env
CHANNEL_LAYERS_BACKEND=channels_redis.core.RedisChannelLayer
REDIS_HOST=localhost
REDIS_PORT=6379
```

---

## 📈 Success Metrics

- [ ] Message delivery time < 100ms
- [ ] 99.9% uptime
- [ ] Support 1000+ concurrent connections
- [ ] User adoption > 80%
- [ ] Average response time < 5 minutes
- [ ] Zero message loss
- [ ] Read receipts working 100% of the time

---

## 🔮 Phase 3.2 Enhancements

Future improvements:
1. File sharing in messages
2. Typing indicators
3. Message search
4. Message reactions (emoji)
5. Message editing/deletion
6. Group chats
7. Voice messages
8. Video call integration

---

## 📞 Support

For issues or questions:
1. Check the API documentation
2. Review test cases
3. Check WebSocket connection logs
4. Verify Redis is running (if using WebSocket)

---

**Phase 3 Feature 1 Status**: ✅ Backend Complete | ⏳ Frontend In Progress

**Next**: Feature 2 - Mobile Optimization & PWA
