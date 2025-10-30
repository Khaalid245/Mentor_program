@echo off
echo 🚀 Starting Alif Mentorship Hub Development Servers...

REM Start backend in a new window
start "Backend Server" cmd /k "cd backend && venv\Scripts\activate && python manage.py runserver"

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend in a new window
start "Frontend Server" cmd /k "cd frontend && npm run dev"

echo ✅ Both servers are starting...
echo.
echo 🌐 Access the application:
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:8000
echo   Admin:    http://localhost:8000/admin (admin/admin123)
echo.
echo Press any key to exit...
pause >nul
