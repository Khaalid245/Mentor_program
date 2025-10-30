#!/bin/bash

# Alif Mentorship Hub - Development Setup Script
# This script sets up the development environment

set -e  # Exit on any error

echo "🛠️  Setting up Alif Mentorship Hub development environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

# Check for required tools
check_requirements() {
    print_status "Checking requirements..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 16+ from https://nodejs.org/"
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 16 ]; then
        print_error "Node.js version 16+ is required. Current version: $(node --version)"
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    
    # Check Python
    if ! command -v python3 &> /dev/null; then
        print_error "Python 3 is not installed. Please install Python 3.8+ from https://python.org/"
        exit 1
    fi
    
    PYTHON_VERSION=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1,2)
    print_status "Python version: $PYTHON_VERSION"
    
    # Check pip
    if ! command -v pip3 &> /dev/null; then
        print_error "pip3 is not installed"
        exit 1
    fi
    
    print_success "All requirements met"
}

# Setup backend
setup_backend() {
    print_status "Setting up backend..."
    
    cd backend
    
    # Create virtual environment if it doesn't exist
    if [ ! -d "venv" ]; then
        print_status "Creating Python virtual environment..."
        python3 -m venv venv
    fi
    
    # Activate virtual environment
    print_status "Activating virtual environment..."
    source venv/bin/activate
    
    # Upgrade pip
    print_status "Upgrading pip..."
    pip install --upgrade pip
    
    # Install dependencies
    print_status "Installing Python dependencies..."
    pip install -r requirements.txt
    
    # Run migrations
    print_status "Running database migrations..."
    python manage.py migrate
    
    # Create superuser if it doesn't exist
    print_status "Creating superuser (if needed)..."
    echo "from django.contrib.auth import get_user_model; User = get_user_model(); User.objects.filter(username='admin').exists() or User.objects.create_superuser('admin', 'admin@example.com', 'admin123')" | python manage.py shell
    
    cd ..
    
    print_success "Backend setup complete"
}

# Setup frontend
setup_frontend() {
    print_status "Setting up frontend..."
    
    cd frontend
    
    # Install dependencies
    print_status "Installing Node.js dependencies..."
    npm install
    
    cd ..
    
    print_success "Frontend setup complete"
}

# Create environment files
create_env_files() {
    print_status "Creating environment files..."
    
    # Backend .env file
    if [ ! -f "backend/.env" ]; then
        cat > backend/.env << EOF
# Django Settings
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DATABASE_URL=sqlite:///db.sqlite3

# CORS
CORS_ALLOW_ALL_ORIGINS=True
CORS_ALLOW_CREDENTIALS=True

# JWT Settings
JWT_ACCESS_TOKEN_LIFETIME=60
JWT_REFRESH_TOKEN_LIFETIME=1440
EOF
        print_status "Created backend/.env file"
    fi
    
    # Frontend .env file
    if [ ! -f "frontend/.env" ]; then
        cat > frontend/.env << EOF
# API Configuration
VITE_API_BASE_URL=http://localhost:8000/api
VITE_APP_NAME=Alif Mentorship Hub
VITE_APP_VERSION=1.0.0
EOF
        print_status "Created frontend/.env file"
    fi
    
    print_success "Environment files created"
}

# Show next steps
show_next_steps() {
    echo ""
    print_success "Development environment setup complete! 🎉"
    echo ""
    print_status "Next steps:"
    echo "  1. Start the development servers:"
    echo "     npm run dev"
    echo ""
    echo "  2. Or start them separately:"
    echo "     Backend:  cd backend && source venv/bin/activate && python manage.py runserver"
    echo "     Frontend: cd frontend && npm run dev"
    echo ""
    echo "  3. Access the application:"
    echo "     Frontend: http://localhost:5173"
    echo "     Backend:  http://localhost:8000"
    echo "     Admin:    http://localhost:8000/admin (admin/admin123)"
    echo ""
    print_status "Happy coding! 🚀"
}

# Main setup function
main() {
    check_requirements
    create_env_files
    setup_backend
    setup_frontend
    show_next_steps
}

# Run main function
main

