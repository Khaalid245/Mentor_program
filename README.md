# Alif Mentorship Hub

> A mentorship platform connecting Somali high school students with experienced mentors for career guidance and educational support

## African Context

In many Somali communities, high school students face significant barriers to accessing mentorship and career guidance resources. Limited infrastructure, geographical isolation, and lack of connections to professional networks prevent talented students from realizing their full potential. Alif Mentorship Hub addresses this critical gap by creating a digital platform that democratizes access to mentorship, breaking down geographical and socioeconomic barriers. This platform empowers Somali youth to connect with professionals who understand their cultural context and can provide relevant, meaningful guidance for their educational and career journeys. By leveraging technology, we can transform mentorship from a privilege accessible only to a few into a right available to all motivated students.

## Team Members

- Belinda Larose - Team Lead & Frontend Developer
- Amelie Umutoni - Frontend Developer
- Khaalid Abdillahi - Backend Developer

## Project Overview

Alif Mentorship Hub is a comprehensive mentorship and learning platform designed to empower Somali high school students (ages 15-20) through career guidance, mentorship programs, and technology training. The application connects students with professionals in software engineering, business, and education to help them discover their potential and access higher education opportunities.

The platform provides secure authentication with role-based access control for both students and mentors. Students can submit mentorship applications with required documents (certificates, transcripts, passport photos, recommendation letters) and track their application status. Mentors receive assigned applications, review student information, and can approve or reject applications while providing feedback. The platform also supports career consultation scheduling and serves as an information hub for scholarships and career paths tailored for Somali students.

Built with modern technologies including React and Django REST Framework, the application ensures a scalable, secure, and user-friendly experience. The responsive design works seamlessly across different devices, making mentorship accessible even in areas with limited internet infrastructure.

### Target Users

Primary users are Somali high school students (ages 15-20), especially from underserved areas, seeking career guidance and mentorship opportunities. Secondary users include teachers, mentors, NGOs, parents, and institutions supporting youth development and education. Administrators manage mentor assignments and oversee the mentorship programs.

### Core Features

- **Application Management**: Students can submit mentorship applications with required documents (certificates, transcripts, passport photos, recommendation letters) and track their application status through a personalized dashboard.
- **Mentorship Program**: Connect students with professionals in software engineering, business, and education. Mentors review assigned applications, provide feedback, and approve or reject applications with consultation scheduling.
- **User Authentication**: Secure login system for both students and mentors with role-based access control, ensuring users only access their designated dashboards and features.
- **Career Consultation Sessions**: System supports consultation scheduling between approved students and assigned mentors, facilitating one-on-one guidance sessions.
- **Dashboard Management**: Separate dashboards for students and mentors with application tracking, status updates, and management tools tailored to each user role.
- **Information Hub**: Platform serves as a resource center for scholarships, career paths, and university opportunities tailored for Somali students.

## Technology Stack

- **Backend**: Python 3.9+, Django 5.2.7, Django REST Framework 3.16.1
- **Frontend**: React 19.1.1, Vite 7.1.7, TailwindCSS 3.4.1
- **Database**: SQLite (development), MySQL (production)
- **Authentication**: JWT (SimpleJWT) via djangorestframework-simplejwt
- **HTTP Client**: Axios 1.12.2
- **Routing**: React Router DOM 7.9.4
- **Animations**: Framer Motion 12.23.24
- **Other**: django-cors-headers for CORS support, PostCSS for CSS processing

## Getting Started

### Prerequisites

- Python 3.9 or higher
- Node.js 16 or higher
- npm or yarn
- MySQL (for production deployment)

### Installation

1. Clone the repository

```bash
git clone https://github.com/Belinda1704/alif-hub-devops-group2.git
cd alif-hub
```

2. Set up the backend (Django)

```bash
cd alif-hub/backend
python -m venv venv
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate
pip install -r requirements.txt
python src/manage.py migrate
python src/manage.py createsuperuser
python src/manage.py runserver
```

3. Set up the frontend (React)

```bash
cd alif-hub/frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173` and backend at `http://localhost:8000`

### Usage

**For Students**: Sign up as a student using the signup page, complete your profile, and submit a mentorship application with required documents (certificates, transcripts, passport photos, and recommendation letters). Track your application status through the student dashboard, view mentor feedback, and access consultation schedules once approved.

**For Mentors**: Sign up as a mentor using the signup page. Once an admin assigns you to a student application, access the mentor dashboard to review student applications, view applicant details, and approve or reject applications with feedback. You can schedule consultations with approved students.

**For Administrators**: Access the Django admin panel at `http://localhost:8000/admin/` to manage users, assign mentors to student applications, and oversee the mentorship program operations.

## Project Structure

```
alif-hub-devops-group2/
├── alif-hub/
│   ├── frontend/              # React application
│   │   ├── public/            # Static assets
│   │   ├── src/
│   │   │   ├── components/    # Reusable UI components (Navbar, Footer, etc.)
│   │   │   ├── pages/         # Page components (Home, Login, Dashboards, etc.)
│   │   │   ├── services/      # API services (axios configuration)
│   │   │   ├── context/       # React context providers
│   │   │   └── assets/        # Images and other assets
│   │   ├── package.json
│   │   ├── vite.config.js
│   │   └── tailwind.config.js
│   ├── backend/               # Django application
│   │   ├── src/
│   │   │   ├── alif_mentorship_hub/  # Main Django project settings
│   │   │   │   ├── settings.py
│   │   │   │   ├── urls.py
│   │   │   │   └── wsgi.py
│   │   │   └── api/           # Django app for mentorship features
│   │   │       ├── models.py      # Mentor and StudentApplication models
│   │   │       ├── views.py       # API views for authentication and applications
│   │   │       ├── serializers.py # DRF serializers
│   │   │       ├── urls.py        # API URL routing
│   │   │       └── migrations/     # Database migrations
│   │   ├── manage.py          # Django management script
│   │   ├── requirements.txt   # Python dependencies
│   │   ├── db.sqlite3        # SQLite database (development)
│   │   └── media/             # User-uploaded files (certificates, photos, etc.)
│   ├── .github/
│   │   └── CODEOWNERS         # Code ownership rules
├── README.md
├── LICENSE
└── .gitignore
```

## Links

- [GitHub Repository](https://github.com/Belinda1704/alif-hub-devops-group2)
- [Project Board](https://github.com/Belinda1704/alif-hub-devops-group2/projects)
- [Issues](https://github.com/Belinda1704/alif-hub-devops-group2/issues)

## License

MIT License - see [LICENSE](LICENSE) file for details
