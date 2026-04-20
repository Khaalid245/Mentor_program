"""
Enterprise Configuration Manager
Provides flexible, environment-aware configuration for backend-frontend integration
"""
import os
import json
from typing import Dict, Any, Optional, List
from dataclasses import dataclass, asdict
from pathlib import Path

@dataclass
class APIEndpointConfig:
    """Configuration for API endpoints"""
    version: str = "v1"
    base_path: str = "/api"
    auth_endpoints: Dict[str, str] = None
    user_endpoints: Dict[str, str] = None
    session_endpoints: Dict[str, str] = None
    
    def __post_init__(self):
        if self.auth_endpoints is None:
            self.auth_endpoints = {
                "login": f"{self.base_path}/{self.version}/auth/login/",
                "register": f"{self.base_path}/{self.version}/auth/register/",
                "refresh": f"{self.base_path}/{self.version}/auth/refresh/",
                "logout": f"{self.base_path}/{self.version}/auth/logout/",
                "profile": f"{self.base_path}/{self.version}/auth/profile/"
            }
        
        if self.user_endpoints is None:
            self.user_endpoints = {
                "mentors": f"{self.base_path}/{self.version}/mentors/",
                "students": f"{self.base_path}/{self.version}/students/",
                "applications": f"{self.base_path}/{self.version}/applications/"
            }
            
        if self.session_endpoints is None:
            self.session_endpoints = {
                "sessions": f"{self.base_path}/{self.version}/sessions/",
                "reviews": f"{self.base_path}/{self.version}/reviews/",
                "messages": f"{self.base_path}/{self.version}/messages/"
            }

@dataclass
class FrontendConfig:
    """Configuration for frontend integration"""
    base_url: str = "http://localhost:5173"
    api_timeout: int = 30000
    retry_attempts: int = 3
    cache_duration: int = 300000  # 5 minutes
    supported_file_types: List[str] = None
    max_file_size: int = 5242880  # 5MB
    
    def __post_init__(self):
        if self.supported_file_types is None:
            self.supported_file_types = [
                "image/jpeg", "image/png", "image/gif",
                "application/pdf", "text/plain",
                "application/msword",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            ]

@dataclass
class SecurityConfig:
    """Security configuration for enterprise deployment"""
    cors_origins: List[str] = None
    csrf_trusted_origins: List[str] = None
    allowed_hosts: List[str] = None
    rate_limits: Dict[str, str] = None
    jwt_expiry: int = 3600  # 1 hour
    refresh_expiry: int = 604800  # 7 days
    
    def __post_init__(self):
        if self.cors_origins is None:
            self.cors_origins = [
                "http://localhost:5173",
                "http://127.0.0.1:5173"
            ]
        
        if self.csrf_trusted_origins is None:
            self.csrf_trusted_origins = self.cors_origins.copy()
            
        if self.allowed_hosts is None:
            self.allowed_hosts = ["localhost", "127.0.0.1"]
            
        if self.rate_limits is None:
            self.rate_limits = {
                "anon": "100/hour",
                "user": "1000/hour",
                "login": "5/minute",
                "register": "3/minute"
            }

@dataclass
class DatabaseConfig:
    """Database configuration"""
    engine: str = "django.db.backends.sqlite3"
    name: str = "db.sqlite3"
    host: str = ""
    port: str = ""
    user: str = ""
    password: str = ""
    options: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.options is None:
            if "mysql" in self.engine:
                self.options = {
                    'charset': 'utf8mb4',
                    'sql_mode': 'STRICT_TRANS_TABLES',
                    'isolation_level': 'read committed',
                }
            else:
                self.options = {}

class ConfigManager:
    """Enterprise configuration manager"""
    
    def __init__(self, config_file: Optional[str] = None):
        self.config_file = config_file or self._get_default_config_path()
        self.environment = os.getenv('DJANGO_ENV', 'development')
        self._config_cache = {}
        self._load_config()
    
    def _get_default_config_path(self) -> str:
        """Get default configuration file path"""
        base_dir = Path(__file__).resolve().parent.parent.parent
        return str(base_dir / f"config_{self.environment}.json")
    
    def _load_config(self):
        """Load configuration from file or create default"""
        if os.path.exists(self.config_file):
            with open(self.config_file, 'r') as f:
                config_data = json.load(f)
                self._config_cache = config_data
        else:
            self._create_default_config()
    
    def _create_default_config(self):
        """Create default configuration file"""
        default_config = {
            "api_endpoints": asdict(APIEndpointConfig()),
            "frontend": asdict(FrontendConfig()),
            "security": asdict(SecurityConfig()),
            "database": asdict(DatabaseConfig()),
            "features": {
                "messaging_enabled": True,
                "file_upload_enabled": True,
                "notifications_enabled": True,
                "analytics_enabled": True,
                "caching_enabled": True,
                "rate_limiting_enabled": True
            },
            "integrations": {
                "email_service": "smtp",
                "storage_service": "local",
                "monitoring_service": None,
                "analytics_service": None
            }
        }
        
        # Environment-specific overrides
        if self.environment == 'production':
            default_config["security"]["cors_origins"] = [
                "https://alifmentorship.com",
                "https://www.alifmentorship.com"
            ]
            default_config["security"]["csrf_trusted_origins"] = default_config["security"]["cors_origins"]
            default_config["security"]["allowed_hosts"] = ["alifmentorship.com", "www.alifmentorship.com"]
            default_config["database"]["engine"] = "django.db.backends.mysql"
            default_config["integrations"]["storage_service"] = "aws_s3"
            default_config["integrations"]["monitoring_service"] = "sentry"
        
        self._config_cache = default_config
        self.save_config()
    
    def get_config(self, section: str, key: Optional[str] = None, default: Any = None) -> Any:
        """Get configuration value"""
        if section not in self._config_cache:
            return default
        
        if key is None:
            return self._config_cache[section]
        
        return self._config_cache[section].get(key, default)
    
    def set_config(self, section: str, key: str, value: Any):
        """Set configuration value"""
        if section not in self._config_cache:
            self._config_cache[section] = {}
        
        self._config_cache[section][key] = value
        self.save_config()
    
    def update_config(self, section: str, updates: Dict[str, Any]):
        """Update multiple configuration values"""
        if section not in self._config_cache:
            self._config_cache[section] = {}
        
        self._config_cache[section].update(updates)
        self.save_config()
    
    def save_config(self):
        """Save configuration to file"""
        os.makedirs(os.path.dirname(self.config_file), exist_ok=True)
        with open(self.config_file, 'w') as f:
            json.dump(self._config_cache, f, indent=2)
    
    def get_api_endpoints(self) -> APIEndpointConfig:
        """Get API endpoints configuration"""
        config_data = self.get_config('api_endpoints', default={})
        return APIEndpointConfig(**config_data)
    
    def get_frontend_config(self) -> FrontendConfig:
        """Get frontend configuration"""
        config_data = self.get_config('frontend', default={})
        return FrontendConfig(**config_data)
    
    def get_security_config(self) -> SecurityConfig:
        """Get security configuration"""
        config_data = self.get_config('security', default={})
        return SecurityConfig(**config_data)
    
    def get_database_config(self) -> DatabaseConfig:
        """Get database configuration"""
        config_data = self.get_config('database', default={})
        return DatabaseConfig(**config_data)
    
    def is_feature_enabled(self, feature: str) -> bool:
        """Check if a feature is enabled"""
        return self.get_config('features', feature, False)
    
    def get_integration_config(self, service: str) -> Optional[str]:
        """Get integration service configuration"""
        return self.get_config('integrations', service)
    
    def export_frontend_config(self) -> Dict[str, Any]:
        """Export configuration for frontend consumption"""
        api_config = self.get_api_endpoints()
        frontend_config = self.get_frontend_config()
        
        return {
            "apiBaseUrl": f"http://localhost:8000{api_config.base_path}/{api_config.version}/",
            "endpoints": {
                **api_config.auth_endpoints,
                **api_config.user_endpoints,
                **api_config.session_endpoints
            },
            "timeout": frontend_config.api_timeout,
            "retryAttempts": frontend_config.retry_attempts,
            "cacheDuration": frontend_config.cache_duration,
            "fileUpload": {
                "maxSize": frontend_config.max_file_size,
                "supportedTypes": frontend_config.supported_file_types
            },
            "features": self.get_config('features', default={}),
            "environment": self.environment
        }

# Global configuration manager instance
config_manager = ConfigManager()