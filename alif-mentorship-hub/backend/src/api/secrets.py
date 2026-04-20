import os
import logging
from typing import Optional, Dict, Any
from django.core.exceptions import ImproperlyConfigured
from cryptography.fernet import Fernet
import base64

logger = logging.getLogger('api')


class SecureSecretsManager:
    """
    Enterprise-grade secrets management system
    Replaces hardcoded credentials with secure environment variable handling
    """
    
    def __init__(self):
        self._secrets_cache: Dict[str, Any] = {}
        self._encryption_key = self._get_or_create_encryption_key()
        self._cipher = Fernet(self._encryption_key)
    
    def _get_or_create_encryption_key(self) -> bytes:
        """Get or create encryption key for sensitive data"""
        key_env = os.getenv('SECRETS_ENCRYPTION_KEY')
        if key_env:
            try:
                return base64.urlsafe_b64decode(key_env.encode())
            except Exception as e:
                logger.error(f"Invalid encryption key format: {e}")
                raise ImproperlyConfigured("Invalid SECRETS_ENCRYPTION_KEY format")
        
        # Generate new key for development (NOT for production)
        if os.getenv('DJANGO_ENV') == 'development':
            key = Fernet.generate_key()
            logger.warning(f"Generated new encryption key for development: {base64.urlsafe_b64encode(key).decode()}")
            return key
        
        raise ImproperlyConfigured("SECRETS_ENCRYPTION_KEY must be set in production")
    
    def get_secret(self, key: str, default: Optional[str] = None, required: bool = True) -> str:
        """
        Securely retrieve a secret from environment variables
        
        Args:
            key: Environment variable name
            default: Default value if not found
            required: Whether the secret is required
            
        Returns:
            Secret value
            
        Raises:
            ImproperlyConfigured: If required secret is missing
        """
        # Check cache first
        if key in self._secrets_cache:
            return self._secrets_cache[key]
        
        # Get from environment
        value = os.getenv(key, default)
        
        if value is None and required:
            logger.error(f"Required secret '{key}' not found in environment")
            raise ImproperlyConfigured(f"Required environment variable '{key}' is not set")
        
        if value is None:
            return default
        
        # Cache the value
        self._secrets_cache[key] = value
        
        # Log access (without the actual value)
        logger.info(f"Secret '{key}' accessed successfully")
        
        return value
    
    def get_database_config(self) -> Dict[str, str]:
        """Get database configuration from environment"""
        return {
            'ENGINE': 'django.db.backends.mysql',
            'NAME': self.get_secret('DB_NAME', 'mentorship_db'),
            'USER': self.get_secret('DB_USER', 'root'),
            'PASSWORD': self.get_secret('DB_PASSWORD', required=True),
            'HOST': self.get_secret('DB_HOST', 'localhost'),
            'PORT': self.get_secret('DB_PORT', '3306'),
            'OPTIONS': {
                'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
                'charset': 'utf8mb4',
            },
        }
    
    def get_email_config(self) -> Dict[str, Any]:
        """Get email configuration from environment"""
        return {
            'EMAIL_BACKEND': self.get_secret('EMAIL_BACKEND', 'django.core.mail.backends.console.EmailBackend'),
            'EMAIL_HOST': self.get_secret('EMAIL_HOST', 'smtp.gmail.com'),
            'EMAIL_PORT': int(self.get_secret('EMAIL_PORT', '587')),
            'EMAIL_USE_TLS': self.get_secret('EMAIL_USE_TLS', 'True').lower() == 'true',
            'EMAIL_HOST_USER': self.get_secret('EMAIL_HOST_USER', required=False),
            'EMAIL_HOST_PASSWORD': self.get_secret('EMAIL_HOST_PASSWORD', required=False),
            'DEFAULT_FROM_EMAIL': self.get_secret('DEFAULT_FROM_EMAIL', 'noreply@alifmentorship.com'),
        }
    
    def get_jwt_config(self) -> Dict[str, Any]:
        """Get JWT configuration from environment"""
        from datetime import timedelta
        
        return {
            'ACCESS_TOKEN_LIFETIME': timedelta(hours=int(self.get_secret('JWT_ACCESS_HOURS', '24'))),
            'REFRESH_TOKEN_LIFETIME': timedelta(days=int(self.get_secret('JWT_REFRESH_DAYS', '7'))),
            'SIGNING_KEY': self.get_secret('JWT_SIGNING_KEY', required=True),
            'ALGORITHM': self.get_secret('JWT_ALGORITHM', 'HS256'),
        }
    
    def get_redis_config(self) -> Dict[str, Any]:
        """Get Redis configuration from environment"""
        return {
            'LOCATION': self.get_secret('REDIS_URL', 'redis://localhost:6379/1'),
            'OPTIONS': {
                'CLIENT_CLASS': 'django_redis.client.DefaultClient',
                'CONNECTION_POOL_KWARGS': {
                    'max_connections': int(self.get_secret('REDIS_MAX_CONNECTIONS', '50')),
                    'retry_on_timeout': True,
                },
            },
        }
    
    def encrypt_sensitive_data(self, data: str) -> str:
        """Encrypt sensitive data for storage"""
        try:
            encrypted = self._cipher.encrypt(data.encode())
            return base64.urlsafe_b64encode(encrypted).decode()
        except Exception as e:
            logger.error(f"Failed to encrypt data: {e}")
            raise
    
    def decrypt_sensitive_data(self, encrypted_data: str) -> str:
        """Decrypt sensitive data"""
        try:
            encrypted_bytes = base64.urlsafe_b64decode(encrypted_data.encode())
            decrypted = self._cipher.decrypt(encrypted_bytes)
            return decrypted.decode()
        except Exception as e:
            logger.error(f"Failed to decrypt data: {e}")
            raise
    
    def validate_environment(self) -> Dict[str, bool]:
        """Validate that all required environment variables are set"""
        required_vars = [
            'SECRET_KEY',
            'DB_PASSWORD',
            'JWT_SIGNING_KEY',
        ]
        
        if os.getenv('DJANGO_ENV') == 'production':
            required_vars.extend([
                'SECRETS_ENCRYPTION_KEY',
                'EMAIL_HOST_USER',
                'EMAIL_HOST_PASSWORD',
                'REDIS_URL',
            ])
        
        validation_results = {}
        for var in required_vars:
            try:
                value = self.get_secret(var, required=True)
                validation_results[var] = bool(value)
                logger.info(f"✅ {var}: Present")
            except ImproperlyConfigured:
                validation_results[var] = False
                logger.error(f"❌ {var}: Missing")
        
        return validation_results
    
    def generate_secure_password(self, length: int = 32) -> str:
        """Generate a cryptographically secure password"""
        import secrets
        import string
        
        alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
        password = ''.join(secrets.choice(alphabet) for _ in range(length))
        
        # Ensure password meets complexity requirements
        if (any(c.islower() for c in password) and
            any(c.isupper() for c in password) and
            any(c.isdigit() for c in password) and
            any(c in "!@#$%^&*" for c in password)):
            return password
        
        # Regenerate if doesn't meet requirements
        return self.generate_secure_password(length)


# Global instance
secrets_manager = SecureSecretsManager()


def get_secret(key: str, default: Optional[str] = None, required: bool = True) -> str:
    """Convenience function to get secrets"""
    return secrets_manager.get_secret(key, default, required)


def validate_secrets() -> bool:
    """Validate all required secrets are present"""
    results = secrets_manager.validate_environment()
    all_valid = all(results.values())
    
    if not all_valid:
        missing = [k for k, v in results.items() if not v]
        logger.error(f"Missing required environment variables: {missing}")
        
        # Print helpful error message
        print("\n🚨 MISSING REQUIRED ENVIRONMENT VARIABLES:")
        for var in missing:
            print(f"   ❌ {var}")
        
        print("\n📋 Create a .env file with these variables:")
        for var in missing:
            if var == 'SECRET_KEY':
                print(f"   {var}=your-secret-key-here")
            elif var == 'JWT_SIGNING_KEY':
                print(f"   {var}=your-jwt-signing-key-here")
            elif var == 'SECRETS_ENCRYPTION_KEY':
                key = base64.urlsafe_b64encode(Fernet.generate_key()).decode()
                print(f"   {var}={key}")
            else:
                print(f"   {var}=your-{var.lower().replace('_', '-')}-here")
        
        print("\n🔧 Or set them as environment variables before running the application.\n")
    
    return all_valid