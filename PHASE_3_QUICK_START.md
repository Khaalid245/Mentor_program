# ⚡ Phase 3 Feature 1: Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Backend Setup (2 minutes)

```bash
cd alif-mentorship-hub/backend

# Install dependencies
pip install -r requirements_new.txt

# Run migrations
python src/manage.py makemigrations
python src/manage.py migrate

# Start server
python src/manage.py runserver
```

**Expected Output**:
```
Starting development server at http://127.0.0.1:8000/
```

### Step 2: Frontend Setup (1 minute)

```bash
cd alif-mentorship-hub/frontend

# Start dev server
npm run dev
```

**Expected Output**:
```
VITE v7.1.7  ready in 234 ms

➜  Local:   http://localhost:5173/
```

### Step 3: Create Test Users (1 minute)

```bash
# In another terminal
cd alif-mentorship-hub/backend
python src/manage.py shell

# In Python shell:
from api.models import User

student = User.objects.create_user(
    username='student_test',
    password='pass123',
    role='student'
)

mentor = User.objects.create_user(
    username='mentor_test',
    password='pass123',
    role='mentor'
)

print("Users created!")
exit()
```

### Step 4: Test in Browser (1 minute)

1. Open http://localhost:5173
2. Login as `student_test` / `pass123`
3. Navigate to `/chat`
4. Open another browser tab (incognito)
5. Login as `mentor_test` / `pass123`
6. Navigate to `/chat`
7. Send message from student to mentor
8. Verify message appears in both browsers

---

## 📋 What to Test

### ✅ Messaging
- [ ] Send message
- [ ] Receive message
- [ ] Message appears in both browsers
- [ ] Read receipts show (✓ vs ✓✓)
- [ ] Timestamps display correctly

### ✅ Conversations
- [ ] Conversation list shows
- [ ] Last message preview shows
- [ ] Unread badge shows
- [ ] Active conversation highlights
- [ ] Clicking conversation loads messages

### ✅ UI/UX
- [ ] Messages auto-scroll to bottom
- [ ] Loading spinner shows while loading
- [ ] Error messages display
- [ ] Empty state shows when no conversations
- [ ] Animations are smooth

### ✅ Mobile
- [ ] Layout stacks on mobile
- [ ] Buttons are touch-friendly (44px)
- [ ] Text is readable
- [ ] Scrolling works smoothly

---

## 🔧 Common Issues & Fixes

### Issue: "Module not found" error

**Solution**:
```bash
# Make sure you're in the right directory
cd alif-mentorship-hub/frontend

# Reinstall dependencies
npm install

# Clear cache
rm -rf node_modules package-lock.json
npm install
```

### Issue: Backend not responding

**Solution**:
```bash
# Check if backend is running
curl http://localhost:8000/api/auth/login/

# If not, start it
cd alif-mentorship-hub/backend
python src/manage.py runserver
```

### Issue: Messages not showing

**Solution**:
1. Check browser console for errors (F12)
2. Verify authentication token is valid
3. Check that both users exist in database
4. Verify API endpoints are working with cURL

### Issue: Styling looks wrong

**Solution**:
```bash
# Clear browser cache
# Ctrl+Shift+Delete (Windows/Linux)
# Cmd+Shift+Delete (Mac)

# Or hard refresh
# Ctrl+F5 (Windows/Linux)
# Cmd+Shift+R (Mac)
```

---

## 📱 Testing on Mobile

### Using Chrome DevTools

1. Open Chrome DevTools (F12)
2. Click device toggle (Ctrl+Shift+M)
3. Select mobile device
4. Test responsive layout

### Using Real Device

1. Get your computer's IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
2. On mobile, navigate to: `http://YOUR_IP:5173`
3. Test on actual device

---

## 🧪 API Testing with cURL

### Send Message

```bash
# Get token first
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username": "student_test", "password": "pass123"}'

# Copy the access token from response

# Send message
curl -X POST http://localhost:8000/api/messages/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"recipient_id": 2, "content": "Hello!"}'
```

### Get Conversations

```bash
curl -X GET http://localhost:8000/api/conversations/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Unread Count

```bash
curl -X GET http://localhost:8000/api/messages/unread-count/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📊 Database Verification

### Check Messages Table

```bash
python src/manage.py shell

from api.models import Message

# Count messages
print(f"Total messages: {Message.objects.count()}")

# List all messages
for msg in Message.objects.all():
    print(f"{msg.sender.username} → {msg.recipient.username}: {msg.content}")
```

### Check SessionAnalytics Table

```bash
from api.models import SessionAnalytics

# Count analytics
print(f"Total analytics: {SessionAnalytics.objects.count()}")

# List all analytics
for analytics in SessionAnalytics.objects.all():
    print(f"Session {analytics.session_id}: {analytics.skills_learned}")
```

---

## 🎯 Next Steps

### Immediate
1. ✅ Test messaging works
2. ✅ Test on mobile
3. ✅ Fix any UI issues
4. ✅ Verify all features work

### Short Term
1. Add chat route to student/mentor dashboards
2. Add unread badge to navigation
3. Implement WebSocket for real-time updates
4. Add typing indicators

### Medium Term
1. Add file sharing
2. Add message search
3. Add message reactions
4. Add group chats

---

## 📚 Documentation

### Quick Reference
- **API Docs**: PHASE_3_FEATURE_1_MESSAGING.md
- **Frontend Guide**: PHASE_3_FEATURE_1_FRONTEND_COMPLETE.md
- **Backend Guide**: PHASE_3_FEATURE_1_SUMMARY.md

### Detailed Guides
- **Implementation Plan**: PHASE_3_IMPLEMENTATION_PLAN.md
- **Progress Update**: PHASE_3_PROGRESS_UPDATE.md

---

## 🆘 Need Help?

### Check These Files
1. Backend errors → Check `backend/src/api/views.py`
2. Frontend errors → Check browser console (F12)
3. API issues → Check `backend/src/api/urls.py`
4. Styling issues → Check `frontend/src/components/chat/*.css`

### Common Commands

```bash
# View backend logs
python src/manage.py runserver

# View frontend logs
npm run dev

# Check database
python src/manage.py shell

# Run migrations
python src/manage.py migrate

# Create superuser
python src/manage.py createsuperuser
```

---

## ✅ Verification Checklist

- [ ] Backend running on http://localhost:8000
- [ ] Frontend running on http://localhost:5173
- [ ] Test users created
- [ ] Can login as student
- [ ] Can login as mentor
- [ ] Can navigate to /chat
- [ ] Can send message
- [ ] Can receive message
- [ ] Messages appear in both browsers
- [ ] Read receipts work
- [ ] Unread badges work
- [ ] Mobile layout works
- [ ] No console errors
- [ ] No network errors

---

## 🎉 You're Ready!

Everything is set up and ready to go. Start testing and enjoy the new messaging system!

**Questions?** Check the documentation files or review the code comments.

---

**Happy Coding!** 🚀
