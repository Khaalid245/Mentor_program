#!/bin/bash

# Alif Mentorship Hub - Deployment Script
# This script handles the deployment of both backend and frontend

set -e  # Exit on any error

echo "🚀 Starting Alif Mentorship Hub deployment..."

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
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    
    if ! command -v python3 &> /dev/null; then
        print_error "Python 3 is not installed"
        exit 1
    fi
    
    print_success "All requirements met"
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    # Install frontend dependencies
    print_status "Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
    
    # Install backend dependencies
    print_status "Installing backend dependencies..."
    cd backend
    pip install -r requirements.txt
    cd ..
    
    print_success "Dependencies installed"
}

# Setup backend
setup_backend() {
    print_status "Setting up backend..."
    
    cd backend
    
    # Run migrations
    print_status "Running database migrations..."
    python manage.py migrate
    
    # Collect static files
    print_status "Collecting static files..."
    python manage.py collectstatic --noinput
    
    cd ..
    
    print_success "Backend setup complete"
}

# Build frontend
build_frontend() {
    print_status "Building frontend..."
    
    cd frontend
    
    # Build the application
    print_status "Building React application..."
    npm run build
    
    cd ..
    
    print_success "Frontend build complete"
}

# Run tests
run_tests() {
    print_status "Running tests..."
    
    # Frontend tests
    print_status "Running frontend tests..."
    cd frontend
    npm run test -- --watchAll=false
    cd ..
    
    # Backend tests
    print_status "Running backend tests..."
    cd backend
    python manage.py test
    cd ..
    
    print_success "All tests passed"
}

# Main deployment function
deploy() {
    print_status "Starting deployment process..."
    
    check_requirements
    install_dependencies
    setup_backend
    build_frontend
    
    if [ "$1" = "--test" ]; then
        run_tests
    fi
    
    print_success "Deployment complete! 🎉"
    print_status "Backend: Ready to serve API requests"
    print_status "Frontend: Built and ready for static hosting"
}

# Development setup
dev_setup() {
    print_status "Setting up development environment..."
    
    check_requirements
    install_dependencies
    setup_backend
    
    print_success "Development environment ready! 🎉"
    print_status "Run 'npm run dev' to start both servers"
}

# Show help
show_help() {
    echo "Alif Mentorship Hub - Deployment Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  deploy          Deploy the application for production"
    echo "  deploy --test   Deploy and run tests"
    echo "  dev             Setup development environment"
    echo "  help            Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 deploy"
    echo "  $0 deploy --test"
    echo "  $0 dev"
}

# Main script logic
case "$1" in
    "deploy")
        deploy "$2"
        ;;
    "dev")
        dev_setup
        ;;
    "help"|"--help"|"-h")
        show_help
        ;;
    "")
        print_warning "No command specified. Use 'help' to see available commands."
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac

