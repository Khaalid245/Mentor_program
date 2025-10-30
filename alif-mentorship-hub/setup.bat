@echo off
echo 🚀 Setting up Alif Mentorship Hub...

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Please run this script from the project root directory
    pause
    exit /b 1
)

echo 📦 Installing frontend dependencies...
cd frontend
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install frontend dependencies
    pause
    exit /b 1
)
cd ..

echo 🐍 Setting up Python virtual environment...
cd backend
if not exist "venv" (
    python -m venv venv
)
call venv\Scripts\activate
pip install --upgrade pip
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo ❌ Failed to install backend dependencies
    pause
    exit /b 1
)

echo 🗄️ Running database migrations...
python manage.py migrate
if %errorlevel% neq 0 (
    echo ❌ Failed to run migrations
    pause
    exit /b 1
)

echo 👤 Creating superuser...
echo from django.contrib.auth import get_user_model; User = get_user_model(); User.objects.filter(username='admin').exists() or User.objects.create_superuser('admin', 'admin@example.com', 'admin123') | python manage.py shell

cd ..

echo ✅ Setup complete!
echo.
echo 🎉 Next steps:
echo   1. Start the backend: cd backend ^&^& venv\Scripts\activate ^&^& python manage.py runserver
echo   2. Start the frontend: cd frontend ^&^& npm run dev
echo.
echo 🌐 Access the application:
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:8000
echo   Admin:    http://localhost:8000/admin (admin/admin123)
echo.
pause
