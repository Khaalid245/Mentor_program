# 🎓 Alif Mentorship Hub

A comprehensive mentorship and learning platform designed to empower Somali high school students through career guidance, mentorship programs, technology training, and access to higher education opportunities.

## 🎯 Mission

Alif Mentorship Hub is designed to empower Somali high school students (ages 15-20) through career guidance, mentorship programs, and technology training. We connect students with professionals in software engineering, business, and education to help them discover their potential and access higher education opportunities.

## 🏗️ Project Structure

```
alif-mentorship-hub/
├── backend/                     # Django REST API
│   ├── src/
│   │   ├── alif_mentorship_hub/ # Django project settings
│   │   └── api/                 # Main API application
│   ├── media/                   # File uploads (certificates, transcripts, etc.)
│   ├── static/                  # Django static files
│   ├── tests/                   # Backend tests
│   ├── config/                  # Configuration files
│   ├── manage.py                # Django management script
│   ├── requirements.txt         # Python dependencies
│   └── db.sqlite3               # Database file
├── frontend/                    # React frontend
│   ├── src/
│   │   ├── components/          # Reusable React components
│   │   ├── pages/               # Page components
│   │   ├── services/            # API services (axios.js)
│   │   └── context/             # React context (FeaturesData.js)
│   ├── public/                  # Static assets
│   ├── package.json             # Node.js dependencies
│   └── vite.config.js           # Vite configuration
├── scripts/                     # Deployment and utility scripts
│   ├── deploy.sh                # Production deployment script
│   └── setup-dev.sh             # Development setup script
├── setup.bat                    # Windows setup script
├── run-dev.bat                  # Windows development runner
└── README.md                    # This file
```

## 🚀 Key Features

### 🎯 Career Consultation Sessions
One-on-one and group guidance sessions to help students discover their career path and make informed decisions about their future.

### 👨‍🎓 Mentorship Program
Connect students with professionals in software engineering, business, and education who can guide them toward their goals and share valuable insights.

### 💻 Technology Training
Workshops on coding, digital literacy, and innovation skills to prepare students for the digital future and tech careers.

### 📚 Information Hub
Access online resources sharing scholarships, career paths, and university opportunities tailored for Somali students.

### 🌐 Community Events
Participate in school visits, awareness campaigns, and workshops that build community and expand networks.

### 📋 Application Management
Students can submit mentorship applications with required documents (certificates, transcripts, passport photos, recommendation letters).

### 🔐 User Authentication
Secure login system for both students and mentors with role-based access control.

## 👥 Target Users

### Primary Users
Somali high school students (ages 15-20), especially from underserved areas, seeking career guidance and mentorship opportunities.

### Secondary Users
Teachers, mentors, NGOs, parents, and institutions supporting youth development and education.

## 🛠️ Technology Stack

### Backend
- **Framework**: Django 5.2.7
- **API**: Django REST Framework 3.16.1
- **Authentication**: JWT (SimpleJWT)
- **Database**: SQLite (development), MySQL (production)
- **File Storage**: Local media files
- **CORS**: django-cors-headers

### Frontend
- **Framework**: React 19.1.1
- **Build Tool**: Vite 7.1.7
- **Styling**: TailwindCSS 4.1.15
- **Animations**: Framer Motion 12.23.24
- **HTTP Client**: Axios 1.12.2
- **Routing**: React Router DOM 7.9.4

## 🚀 Getting Started

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn

### Quick Setup (Windows)

1. **Run the setup script:**
   ```bash
   setup.bat
   ```

2. **Start development servers:**
   ```bash
   run-dev.bat
   ```

### Manual Setup

#### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Run migrations:
   ```bash
   python manage.py migrate
   ```

5. Create a superuser:
   ```bash
   python manage.py createsuperuser
   ```

6. Start the development server:
   ```bash
   python manage.py runserver
   ```

The API will be available at `http://localhost:8000`

#### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

The frontend will be available at `http://localhost:5173`

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register/` - User registration
- `POST /api/auth/login/` - User login
- `GET /api/auth/user/` - Get current user

### Student Applications
- `GET /api/student/applications/` - List student applications
- `POST /api/student/applications/` - Create new application
- `GET /api/student/applications/{id}/` - Get application details
- `PUT /api/student/applications/{id}/` - Update application

### Mentor Management
- `GET /api/mentor/applications/` - List applications for mentor review
- `PATCH /api/mentor/applications/{id}/` - Update application status
- `POST /api/mentor/applications/{id}/assign_mentor/` - Assign mentor to application

## 🎨 User Interface

### Public Pages
- **Home**: Landing page with hero section, features, and call-to-action
- **About**: Information about the mentorship program
- **Contact**: Contact information and form

### Student Dashboard
- **Application Status**: View current application status
- **Available Programs**: Browse mentorship programs
- **Community Events**: Upcoming events and workshops
- **Achievements**: Track completed milestones

### Mentor Dashboard
- **Application Review**: Review and manage student applications
- **Status Updates**: Approve, reject, or schedule consultations
- **Student Management**: Track assigned students

## 🔧 Development

### Backend Development
- Follow Django best practices
- Use proper model relationships
- Implement proper error handling
- Write comprehensive tests
- Use proper serializers for API responses

### Frontend Development
- Follow React best practices
- Use functional components with hooks
- Implement proper error boundaries
- Use consistent naming conventions
- Write reusable components

### Project Structure Benefits
- **Clean Separation**: Backend and frontend are completely separated
- **Scalable Architecture**: Easy to add new features and components
- **Professional Organization**: Industry-standard directory structure
- **Easy Deployment**: Independent deployment of frontend and backend

## 🚀 Deployment

### Production Deployment
```bash
# Run the deployment script
./scripts/deploy.sh
```

### Development Environment
```bash
# Run the development setup
./scripts/setup-dev.sh
```

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write tests for your changes
5. Submit a pull request

## 🔒 Security Features

- JWT-based authentication
- Role-based access control
- File upload validation
- CORS protection
- Input validation and sanitization

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Support

For support, email info@alifmentorhub.com or join our community discussions.

## 🙏 Acknowledgments

- Somali community organizations
- Educational institutions
- Technology mentors and professionals
- Student volunteers and contributors

---

**Built with ❤️ for the Somali community**