#!/bin/bash

# Enterprise Flexible Deployment Script
# Configures and deploys Alif Mentorship Hub with dynamic configuration

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-development}
PROJECT_ROOT=$(pwd)
BACKEND_DIR="$PROJECT_ROOT/alif-mentorship-hub/backend"
FRONTEND_DIR="$PROJECT_ROOT/alif-mentorship-hub/frontend"

echo -e "${BLUE}🚀 Starting Enterprise Flexible Deployment${NC}"
echo -e "${BLUE}Environment: ${ENVIRONMENT}${NC}"

# Function to print status
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(development|staging|production)$ ]]; then
    print_error "Invalid environment. Use: development, staging, or production"
    exit 1
fi

print_status "Environment validated: $ENVIRONMENT"

# Check if configuration files exist
CONFIG_FILE="$BACKEND_DIR/config_${ENVIRONMENT}.json"
if [[ ! -f "$CONFIG_FILE" ]]; then
    print_warning "Configuration file not found: $CONFIG_FILE"
    print_status "Creating default configuration..."
    
    # Create configuration based on environment
    if [[ "$ENVIRONMENT" == "production" ]]; then
        cp "$BACKEND_DIR/config_production.json" "$CONFIG_FILE"
    else
        cp "$BACKEND_DIR/config_development.json" "$CONFIG_FILE"
    fi
fi

print_status "Configuration file ready: $CONFIG_FILE"

# Backend Setup
echo -e "${BLUE}📦 Setting up Backend${NC}"

cd "$BACKEND_DIR"

# Create virtual environment if it doesn't exist
if [[ ! -d "venv" ]]; then
    print_status "Creating Python virtual environment..."
    python -m venv venv
fi

# Activate virtual environment
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    source venv/Scripts/activate
else
    source venv/bin/activate
fi

print_status "Virtual environment activated"

# Install dependencies
print_status "Installing Python dependencies..."
pip install -r requirements_enterprise.txt

# Set environment variables
export DJANGO_ENV="$ENVIRONMENT"
export PYTHONPATH="$BACKEND_DIR/src:$PYTHONPATH"

print_status "Environment variables set"

# Database setup
print_status "Setting up database..."
cd src
python manage.py makemigrations
python manage.py migrate

# Create superuser for production
if [[ "$ENVIRONMENT" == "production" ]]; then
    print_status "Creating superuser for production..."
    echo "from django.contrib.auth import get_user_model; User = get_user_model(); User.objects.create_superuser('admin', 'admin@alifmentorship.com', 'secure_admin_password') if not User.objects.filter(username='admin').exists() else None" | python manage.py shell
fi

# Collect static files for production
if [[ "$ENVIRONMENT" == "production" ]]; then
    print_status "Collecting static files..."
    python manage.py collectstatic --noinput
fi

print_status "Backend setup complete"

# Frontend Setup
echo -e "${BLUE}🎨 Setting up Frontend${NC}"

cd "$FRONTEND_DIR"

# Install dependencies
print_status "Installing Node.js dependencies..."
npm install

# Create environment file
ENV_FILE=".env.${ENVIRONMENT}"
if [[ ! -f "$ENV_FILE" ]]; then
    print_status "Creating frontend environment file..."
    
    if [[ "$ENVIRONMENT" == "production" ]]; then
        cat > "$ENV_FILE" << EOF
VITE_API_BASE_URL=https://api.alifmentorship.com/api/v1/
VITE_APP_ENV=production
VITE_APP_VERSION=1.0.0
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_MONITORING=true
EOF
    else
        cat > "$ENV_FILE" << EOF
VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1/
VITE_APP_ENV=development
VITE_APP_VERSION=1.0.0-dev
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_MONITORING=false
EOF
    fi
fi

# Copy environment file
cp "$ENV_FILE" .env

print_status "Frontend environment configured"

# Build for production
if [[ "$ENVIRONMENT" == "production" ]]; then
    print_status "Building frontend for production..."
    npm run build
    print_status "Frontend build complete"
fi

# Health Check
echo -e "${BLUE}🏥 Running Health Checks${NC}"

cd "$BACKEND_DIR/src"

# Start backend in background for health check
print_status "Starting backend for health check..."
python manage.py runserver 8000 &
BACKEND_PID=$!

# Wait for backend to start
sleep 5

# Check backend health
if curl -f http://localhost:8000/api/v1/health/ > /dev/null 2>&1; then
    print_status "Backend health check passed"
else
    print_warning "Backend health check failed"
fi

# Check configuration endpoint
if curl -f http://localhost:8000/api/v1/config/frontend/ > /dev/null 2>&1; then
    print_status "Configuration endpoint accessible"
else
    print_warning "Configuration endpoint not accessible"
fi

# Stop backend
kill $BACKEND_PID 2>/dev/null || true

# Deployment Summary
echo -e "${BLUE}📋 Deployment Summary${NC}"
echo "Environment: $ENVIRONMENT"
echo "Backend Directory: $BACKEND_DIR"
echo "Frontend Directory: $FRONTEND_DIR"
echo "Configuration File: $CONFIG_FILE"

if [[ "$ENVIRONMENT" == "development" ]]; then
    echo -e "${GREEN}🎯 Development Deployment Complete${NC}"
    echo "To start the application:"
    echo "  Backend:  cd $BACKEND_DIR/src && python manage.py runserver"
    echo "  Frontend: cd $FRONTEND_DIR && npm run dev"
elif [[ "$ENVIRONMENT" == "production" ]]; then
    echo -e "${GREEN}🚀 Production Deployment Complete${NC}"
    echo "Backend static files collected"
    echo "Frontend built for production"
    echo "Configure your web server to serve the built files"
fi

echo -e "${GREEN}✨ Enterprise Flexible Deployment Successful!${NC}"