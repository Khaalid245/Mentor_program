import sys
import os
from dotenv import load_dotenv
from pathlib import Path
from datetime import timedelta
from api.secrets import secrets_manager, validate_secrets
from api.config_manager import config_manager

# Base directory
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Add src directory to Python path
sys.path.insert(0, str(BASE_DIR / "src"))

# Load environment variables
if os.getenv("RUNNING_IN_DOCKER") == "true":
    load_dotenv(BASE_DIR / ".env")
else:
    load_dotenv(BASE_DIR / ".env.local")

# Validate required secrets on startup
if not validate_secrets():
    print("⚠️  Some required environment variables are missing. The application may not work correctly.")

# Security
SECRET_KEY = secrets_manager.get_secret('SECRET_KEY', required=True)
DEBUG = secrets_manager.get_secret('DEBUG', 'False').lower() == 'true'
ALLOWED_HOSTS = security_config.allowed_hosts

# Environment
DJANGO_ENV = secrets_manager.get_secret('DJANGO_ENV', 'development')
VERSION = secrets_manager.get_secret('VERSION', '1.0.0')

# Installed apps
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'api',
]

# Middleware
MIDDLEWARE = [
    'api.middleware.RequestTrackingMiddleware',
    'api.middleware.SecurityHeadersMiddleware',
    'api.middleware.RateLimitingMiddleware',
    'api.middleware.CORSMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'api.middleware.ResponseCompressionMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'api.middleware.APIVersioningMiddleware',
    'api.middleware.RequestValidationMiddleware',
    'api.middleware.MaintenanceModeMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'api.middleware.DatabaseConnectionMiddleware',
]

ROOT_URLCONF = 'src.alif_mentorship_hub.urls'

# Templates
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'src.alif_mentorship_hub.wsgi.application'

# Database - Using secrets manager
DATABASES = {
    'default': secrets_manager.get_database_config()
}

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Africa/Mogadishu'
USE_I18N = True
USE_TZ = True

# Static & media
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'static'
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# File upload limits — 5MB max per file, 20MB max total request
DATA_UPLOAD_MAX_MEMORY_SIZE = 20 * 1024 * 1024   # 20MB total
FILE_UPLOAD_MAX_MEMORY_SIZE = 5 * 1024 * 1024    # 5MB per file

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Custom user model — must be set before any migration is created
AUTH_USER_MODEL = 'api.User'

# DRF
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': security_config.rate_limits,
    'EXCEPTION_HANDLER': 'api.error_handling.custom_exception_handler',
}

# Enhanced Caching with Redis and Enterprise Features
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        **secrets_manager.get_redis_config(),
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            'CONNECTION_POOL_KWARGS': {
                'max_connections': 50,
                'retry_on_timeout': True,
            },
            'SERIALIZER': 'django_redis.serializers.json.JSONSerializer',
            'COMPRESSOR': 'django_redis.compressors.zlib.ZlibCompressor',
        },
        'KEY_PREFIX': 'alif_mentorship',
        'VERSION': 1,
    }
}

# Cache timeout settings
CACHE_TTL = 60 * 15  # 15 minutes
CACHE_MIDDLEWARE_SECONDS = 60 * 15
CACHE_MIDDLEWARE_KEY_PREFIX = 'alif'

# Session backend
SESSION_ENGINE = 'django.contrib.sessions.backends.cache'
SESSION_CACHE_ALIAS = 'default'

# Enhanced Logging with Security and Enterprise Features
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            '()': 'api.secure_logging.SecureLogFormatter',
        },
        'simple': {
            'format': '{levelname} {asctime} {message}',
            'style': '{',
        },
        'json': {
            '()': 'api.secure_logging.SecureLogFormatter',
        },
    },
    'filters': {
        'require_debug_false': {
            '()': 'django.utils.log.RequireDebugFalse',
        },
        'require_debug_true': {
            '()': 'django.utils.log.RequireDebugTrue',
        },
    },
    'handlers': {
        'console': {
            'level': 'DEBUG' if DEBUG else 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'json' if DJANGO_ENV == 'production' else 'simple',
        },
        'file': {
            'level': 'INFO',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': BASE_DIR / 'logs' / 'django.log',
            'maxBytes': 1024 * 1024 * 10,  # 10MB
            'backupCount': 5,
            'formatter': 'json',
        },
        'api_file': {
            'level': 'INFO',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': BASE_DIR / 'logs' / 'api.log',
            'maxBytes': 1024 * 1024 * 10,
            'backupCount': 5,
            'formatter': 'json',
        },
        'security_file': {
            'level': 'INFO',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': BASE_DIR / 'logs' / 'security.log',
            'maxBytes': 1024 * 1024 * 10,
            'backupCount': 10,  # Keep more security logs
            'formatter': 'json',
        },
        'error_file': {
            'level': 'ERROR',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': BASE_DIR / 'logs' / 'errors.log',
            'maxBytes': 1024 * 1024 * 10,
            'backupCount': 10,
            'formatter': 'json',
        },
        'database_file': {
            'level': 'INFO',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': BASE_DIR / 'logs' / 'database.log',
            'maxBytes': 1024 * 1024 * 10,
            'backupCount': 5,
            'formatter': 'json',
        },
        'cache_file': {
            'level': 'INFO',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': BASE_DIR / 'logs' / 'cache.log',
            'maxBytes': 1024 * 1024 * 10,
            'backupCount': 5,
            'formatter': 'json',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file', 'error_file'],
            'level': 'INFO',
            'propagate': False,
        },
        'api': {
            'handlers': ['console', 'api_file', 'error_file'],
            'level': 'DEBUG' if DEBUG else 'INFO',
            'propagate': False,
        },
        'api.requests': {
            'handlers': ['api_file'],
            'level': 'INFO',
            'propagate': False,
        },
        'api.health': {
            'handlers': ['console', 'api_file'],
            'level': 'INFO',
            'propagate': False,
        },
        'api.database': {
            'handlers': ['console', 'database_file', 'error_file'],
            'level': 'INFO',
            'propagate': False,
        },
        'api.cache': {
            'handlers': ['console', 'cache_file'],
            'level': 'INFO',
            'propagate': False,
        },
        'api.errors': {
            'handlers': ['console', 'error_file'],
            'level': 'ERROR',
            'propagate': False,
        },
        'security_audit': {
            'handlers': ['console', 'security_file'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}

# Log message settings
LOG_MESSAGE_MAX_LENGTH = 10000

# JWT - Using secrets manager
SIMPLE_JWT = secrets_manager.get_jwt_config()

# Enhanced CORS Configuration - Using config manager
security_config = config_manager.get_security_config()
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = security_config.cors_origins
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
    'api-version',
]
CORS_EXPOSE_HEADERS = [
    'api-version',
    'api-supported-versions',
    'x-total-count',
    'x-compression-available',
]

# Enhanced CSRF Configuration - Using config manager
CSRF_TRUSTED_ORIGINS = security_config.csrf_trusted_origins
CSRF_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_HTTPONLY = True
CSRF_COOKIE_SAMESITE = 'Lax'

# Security Settings
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
SECURE_HSTS_SECONDS = 31536000 if not DEBUG else 0
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# Session Security
SESSION_COOKIE_SECURE = not DEBUG
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Lax'
SESSION_COOKIE_AGE = 86400  # 24 hours

# Email Configuration - Using secrets manager
email_config = secrets_manager.get_email_config()
EMAIL_BACKEND = email_config['EMAIL_BACKEND']
EMAIL_HOST = email_config['EMAIL_HOST']
EMAIL_PORT = email_config['EMAIL_PORT']
EMAIL_USE_TLS = email_config['EMAIL_USE_TLS']
EMAIL_HOST_USER = email_config['EMAIL_HOST_USER']
EMAIL_HOST_PASSWORD = email_config['EMAIL_HOST_PASSWORD']
DEFAULT_FROM_EMAIL = email_config['DEFAULT_FROM_EMAIL']

# Create logs directory if it doesn't exist
os.makedirs(BASE_DIR / 'logs', exist_ok=True)

# Performance Settings
DATA_UPLOAD_MAX_MEMORY_SIZE = 20 * 1024 * 1024   # 20MB total
FILE_UPLOAD_MAX_MEMORY_SIZE = 5 * 1024 * 1024    # 5MB per file

# Database Connection Settings
DATABASES['default']['CONN_MAX_AGE'] = 60  # Connection pooling
DATABASES['default']['OPTIONS'].update({
    'charset': 'utf8mb4',
    'sql_mode': 'STRICT_TRANS_TABLES',
    'isolation_level': 'read committed',
})

# Celery Configuration (for background tasks)
CELERY_BROKER_URL = secrets_manager.get_secret('CELERY_BROKER_URL', 'redis://localhost:6379/0')
CELERY_RESULT_BACKEND = secrets_manager.get_secret('CELERY_RESULT_BACKEND', 'redis://localhost:6379/0')
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = TIME_ZONE
CELERY_BEAT_SCHEDULER = 'django_celery_beat.schedulers:DatabaseScheduler'

# Monitoring and APM
if DJANGO_ENV == 'production':
    # New Relic APM (if configured)
    NEW_RELIC_LICENSE_KEY = secrets_manager.get_secret('NEW_RELIC_LICENSE_KEY', required=False)
    if NEW_RELIC_LICENSE_KEY:
        NEW_RELIC_APP_NAME = secrets_manager.get_secret('NEW_RELIC_APP_NAME', 'Alif Mentorship Hub')
    
    # Sentry Error Tracking (if configured)
    SENTRY_DSN = secrets_manager.get_secret('SENTRY_DSN', required=False)
    if SENTRY_DSN:
        import sentry_sdk
        from sentry_sdk.integrations.django import DjangoIntegration
        from sentry_sdk.integrations.redis import RedisIntegration
        
        sentry_sdk.init(
            dsn=SENTRY_DSN,
            integrations=[
                DjangoIntegration(auto_enabling=True),
                RedisIntegration(),
            ],
            traces_sample_rate=0.1,
            send_default_pii=False,
            environment=DJANGO_ENV,
            release=VERSION,
        )

# API Documentation
if DEBUG:
    INSTALLED_APPS += ['drf_spectacular']
    REST_FRAMEWORK['DEFAULT_SCHEMA_CLASS'] = 'drf_spectacular.openapi.AutoSchema'
    
    SPECTACULAR_SETTINGS = {
        'TITLE': 'Alif Mentorship Hub API',
        'DESCRIPTION': 'API for the Alif Mentorship Hub platform',
        'VERSION': VERSION,
        'SERVE_INCLUDE_SCHEMA': False,
        'COMPONENT_SPLIT_REQUEST': True,
    }
