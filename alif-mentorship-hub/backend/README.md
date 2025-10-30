# Alif Mentorship Hub - Backend

Django REST API backend for the Alif Mentorship Hub platform.

## 🏗️ Architecture

```
backend/
├── src/
│   ├── alif_mentorship_hub/    # Django project settings
│   │   ├── __init__.py
│   │   ├── settings.py         # Main settings
│   │   ├── urls.py             # Root URL configuration
│   │   ├── wsgi.py             # WSGI configuration
│   │   └── asgi.py             # ASGI configuration
│   ├── api/                    # Main API application
│   │   ├── models.py           # Database models
│   │   ├── views.py            # API views
│   │   ├── serializers.py      # Data serializers
│   │   ├── urls.py             # API URL patterns
│   │   ├── admin.py            # Admin interface
│   │   └── migrations/         # Database migrations
│   └── apps/                   # Additional Django apps
├── media/                      # File uploads
│   ├── certificates/           # Student certificates
│   ├── transcripts/            # Academic transcripts
│   ├── passports/              # Passport photos
│   └── recommendations/        # Recommendation letters
├── static/                     # Static files
├── tests/                      # Test files
├── config/                     # Configuration files
├── manage.py                   # Django management script
├── requirements.txt            # Python dependencies
└── db.sqlite3                  # SQLite database
```

## 🚀 Quick Start

1. **Create virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run migrations:**
   ```bash
   python manage.py migrate
   ```

4. **Create superuser:**
   ```bash
   python manage.py createsuperuser
   ```

5. **Start development server:**
   ```bash
   python manage.py runserver
   ```

## 📊 Database Models

### User Model
- Built on Django's User model
- Stores user authentication information
- Links to mentor and student profiles

### Mentor Model
- One-to-one relationship with User
- Specialization field
- Bio and availability status
- Links to assigned students

### StudentApplication Model
- Comprehensive application form
- Personal and academic information
- Document uploads
- Mentor assignment
- Status tracking (Pending, Under Review, Approved, Rejected)
- Feedback and consultation scheduling

## 🔐 Authentication

- JWT-based authentication using SimpleJWT
- Access tokens (60 minutes)
- Refresh tokens (1 day)
- Secure password validation

## 📁 File Uploads

Documents are organized in the `media/` directory:
- `certificates/` - Academic certificates
- `transcripts/` - Academic transcripts
- `passports/` - Passport photos
- `recommendations/` - Recommendation letters

## 🧪 Testing

Run tests with:
```bash
python manage.py test
```

## 🔧 Configuration

### Environment Variables
- `SECRET_KEY` - Django secret key
- `DEBUG` - Debug mode
- `ALLOWED_HOSTS` - Allowed hostnames
- `DATABASE_URL` - Database connection string

### CORS Settings
- Configured for frontend development
- Allows credentials
- All origins allowed in development

## 📈 API Documentation

### Authentication Endpoints
- `POST /api/auth/register/` - Register new user
- `POST /api/auth/login/` - Login user
- `GET /api/auth/user/` - Get current user info

### Application Endpoints
- `GET /api/student/applications/` - List applications
- `POST /api/student/applications/` - Create application
- `GET /api/student/applications/{id}/` - Get application
- `PUT /api/student/applications/{id}/` - Update application
- `POST /api/student/applications/{id}/assign_mentor/` - Assign mentor
- `POST /api/student/applications/{id}/update_status/` - Update status

### Mentor Endpoints
- `GET /api/mentors/` - List mentors
- `POST /api/mentors/` - Create mentor
- `GET /api/mentors/{id}/` - Get mentor
- `PUT /api/mentors/{id}/` - Update mentor

## 🚀 Deployment

### Production Settings
1. Set `DEBUG = False`
2. Configure proper `ALLOWED_HOSTS`
3. Use production database (MySQL/PostgreSQL)
4. Set up static file serving
5. Configure media file storage
6. Set up SSL certificates

### Environment Setup
```bash
# Install production dependencies
pip install -r requirements.txt

# Collect static files
python manage.py collectstatic

# Run migrations
python manage.py migrate

# Start production server
gunicorn alif_mentorship_hub.wsgi:application
```

## 🔒 Security

- Password validation
- JWT token security
- CORS configuration
- File upload validation
- SQL injection protection
- XSS protection

## 📝 Development Guidelines

1. Follow PEP 8 style guidelines
2. Write comprehensive docstrings
3. Use proper error handling
4. Write unit tests for new features
5. Use meaningful variable names
6. Keep functions small and focused
7. Use Django best practices

