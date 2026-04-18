# Alif Mentorship Hub

A mentorship platform connecting Somali high school students with experienced mentors for career guidance and educational support.

## Tech Stack

- Frontend: React 19, Vite 7, TailwindCSS 3
- Backend: Python 3.9+, Django 5, Django REST Framework, SimpleJWT
- Database: MySQL (production), SQLite (development fallback)

## Prerequisites

- Node.js 18 or higher
- Python 3.9 or higher
- MySQL 8.0 or higher (for production)
- pip and virtualenv

## Backend Setup

```bash
# 1. Clone the repository
git clone https://github.com/Khaalid245/Mentor_program.git
cd Mentor_program/alif-mentorship-hub

# 2. Create and activate a virtual environment
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# macOS / Linux
source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Configure environment variables
# Copy the example and fill in your values
cp .env.local .env.local
# Edit .env.local and set:
#   SECRET_KEY=your-secret-key
#   DEBUG=True
#   DB_NAME=mentorship_db
#   DB_USER=root
#   DB_PASSWORD=your-mysql-password
#   DB_HOST=127.0.0.1
#   DB_PORT=3306
#   ALLOWED_HOSTS=localhost,127.0.0.1

# 5. Create the MySQL database
# In MySQL shell:
#   CREATE DATABASE mentorship_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 6. Run migrations
python src/manage.py migrate

# 7. Create a superuser (admin account)
python src/manage.py createsuperuser
# Follow the prompts — use role: admin

# 8. Start the development server
python src/manage.py runserver
# Backend runs at http://localhost:8000
```

## Frontend Setup

```bash
# From the project root
cd alif-mentorship-hub/frontend

# 1. Install dependencies
npm install

# 2. Configure environment variables
cp .env.example .env
# Edit .env — the default value works for local development:
#   VITE_API_BASE_URL=http://localhost:8000/api/

# 3. Start the development server
npm run dev
# Frontend runs at http://localhost:5173
```

## Default Accounts for Local Testing

After running `createsuperuser`, log in to the Django admin panel at `http://localhost:8000/admin/` to create test mentor and student accounts.

| Role    | How to create                                      |
|---------|----------------------------------------------------|
| Admin   | Created via `python src/manage.py createsuperuser` |
| Mentor  | Register at `/signup` with role = Mentor           |
| Student | Register at `/signup` with role = Student          |

## Dashboard URLs

| Role    | URL                          |
|---------|------------------------------|
| Student | http://localhost:5173/student/dashboard |
| Mentor  | http://localhost:5173/mentor/dashboard  |
| Admin   | http://localhost:5173/admin/dashboard   |

## API Base URL

All API endpoints are served at `http://localhost:8000/api/`.

The Django admin panel is at `http://localhost:8000/admin/`.
