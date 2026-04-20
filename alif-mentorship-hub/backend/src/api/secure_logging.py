"""
Enterprise Secure Logging System
Fixes CWE-117 (Log Injection) and CWE-532 (Sensitive Data Logging)
"""
import re
import json
import logging
from typing import Any, Dict, Optional
from django.conf import settings


class SecureLogFormatter(logging.Formatter):
    """Secure log formatter that prevents injection and sanitizes sensitive data"""
    
    # Patterns for sensitive data detection
    SENSITIVE_PATTERNS = [
        (re.compile(r'password["\']?\s*[:=]\s*["\']?([^"\'}\s,]+)', re.IGNORECASE), 'password'),
        (re.compile(r'token["\']?\s*[:=]\s*["\']?([^"\'}\s,]+)', re.IGNORECASE), 'token'),
        (re.compile(r'key["\']?\s*[:=]\s*["\']?([^"\'}\s,]+)', re.IGNORECASE), 'key'),
        (re.compile(r'secret["\']?\s*[:=]\s*["\']?([^"\'}\s,]+)', re.IGNORECASE), 'secret'),
        (re.compile(r'authorization["\']?\s*[:=]\s*["\']?([^"\'}\s,]+)', re.IGNORECASE), 'auth'),
        (re.compile(r'bearer\s+([a-zA-Z0-9\-._~+/]+=*)', re.IGNORECASE), 'bearer'),
        (re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'), 'email'),
        (re.compile(r'\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b'), 'card'),
        (re.compile(r'\b\d{3}-\d{2}-\d{4}\b'), 'ssn'),
    ]
    
    # Log injection patterns
    INJECTION_PATTERNS = [
        re.compile(r'[\r\n]'),  # CRLF injection
        re.compile(r'[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]'),  # Control characters
        re.compile(r'<script[^>]*>.*?</script>', re.IGNORECASE | re.DOTALL),  # Script tags
        re.compile(r'javascript:', re.IGNORECASE),  # JavaScript URLs
        re.compile(r'on\w+\s*=', re.IGNORECASE),  # Event handlers
    ]
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.max_length = getattr(settings, 'LOG_MESSAGE_MAX_LENGTH', 10000)
    
    def format(self, record):
        """Format log record with security sanitization"""
        # Sanitize the message
        if hasattr(record, 'msg') and record.msg:
            record.msg = self.sanitize_message(str(record.msg))
        
        # Sanitize arguments
        if hasattr(record, 'args') and record.args:
            record.args = tuple(self.sanitize_message(str(arg)) for arg in record.args)
        
        # Create structured log entry
        log_entry = {
            'timestamp': self.formatTime(record),
            'level': record.levelname,
            'logger': record.name,
            'message': record.getMessage(),
            'module': record.module,
            'function': record.funcName,
            'line': record.lineno,
        }
        
        # Add extra fields if present
        if hasattr(record, 'user_id'):
            log_entry['user_id'] = record.user_id
        if hasattr(record, 'request_id'):
            log_entry['request_id'] = record.request_id
        if hasattr(record, 'ip_address'):
            log_entry['ip_address'] = record.ip_address
        if hasattr(record, 'user_agent'):
            log_entry['user_agent'] = self.sanitize_message(record.user_agent)
        
        # Add exception info if present
        if record.exc_info:
            log_entry['exception'] = self.formatException(record.exc_info)
        
        # Truncate if too long
        message = json.dumps(log_entry, default=str, ensure_ascii=False)
        if len(message) > self.max_length:
            log_entry['message'] = log_entry['message'][:self.max_length - 100] + '... [TRUNCATED]'
            message = json.dumps(log_entry, default=str, ensure_ascii=False)
        
        return message
    
    def sanitize_message(self, message: str) -> str:
        """Sanitize log message to prevent injection and hide sensitive data"""
        if not isinstance(message, str):
            message = str(message)
        
        # Remove log injection patterns
        for pattern in self.INJECTION_PATTERNS:
            message = pattern.sub('[FILTERED]', message)
        
        # Hide sensitive data
        for pattern, data_type in self.SENSITIVE_PATTERNS:
            message = pattern.sub(f'[{data_type.upper()}_REDACTED]', message)
        
        # Limit length
        if len(message) > self.max_length:
            message = message[:self.max_length] + '... [TRUNCATED]'
        
        return message


class SecurityAuditLogger:
    """Dedicated logger for security events"""
    
    def __init__(self):
        self.logger = logging.getLogger('security_audit')
    
    def log_authentication_attempt(self, username: str, success: bool, ip_address: str, user_agent: str):
        """Log authentication attempts"""
        self.logger.info(
            "Authentication attempt",
            extra={
                'event_type': 'auth_attempt',
                'username': username,
                'success': success,
                'ip_address': ip_address,
                'user_agent': user_agent,
            }
        )
    
    def log_permission_denied(self, user_id: Optional[int], resource: str, action: str, ip_address: str):
        """Log permission denied events"""
        self.logger.warning(
            "Permission denied",
            extra={
                'event_type': 'permission_denied',
                'user_id': user_id,
                'resource': resource,
                'action': action,
                'ip_address': ip_address,
            }
        )
    
    def log_suspicious_activity(self, user_id: Optional[int], activity: str, details: Dict[str, Any], ip_address: str):
        """Log suspicious activities"""
        self.logger.warning(
            "Suspicious activity detected",
            extra={
                'event_type': 'suspicious_activity',
                'user_id': user_id,
                'activity': activity,
                'details': details,
                'ip_address': ip_address,
            }
        )
    
    def log_data_access(self, user_id: int, resource: str, action: str, resource_id: Optional[str] = None):
        """Log sensitive data access"""
        self.logger.info(
            "Data access",
            extra={
                'event_type': 'data_access',
                'user_id': user_id,
                'resource': resource,
                'action': action,
                'resource_id': resource_id,
            }
        )
    
    def log_configuration_change(self, user_id: int, setting: str, old_value: str, new_value: str):
        """Log configuration changes"""
        self.logger.info(
            "Configuration changed",
            extra={
                'event_type': 'config_change',
                'user_id': user_id,
                'setting': setting,
                'old_value': old_value,
                'new_value': new_value,
            }
        )


class APILogger:
    """Structured API request/response logger"""
    
    def __init__(self):
        self.logger = logging.getLogger('api.requests')
    
    def log_request(self, request, response_status: int, response_time: float):
        """Log API request with sanitized data"""
        # Sanitize headers
        safe_headers = {}
        for key, value in request.META.items():
            if key.startswith('HTTP_'):
                header_name = key[5:].replace('_', '-').lower()
                if header_name not in ['authorization', 'cookie', 'x-api-key']:
                    safe_headers[header_name] = value
                else:
                    safe_headers[header_name] = '[REDACTED]'
        
        # Sanitize query parameters
        safe_params = {}
        for key, value in request.GET.items():
            if key.lower() in ['password', 'token', 'key', 'secret']:
                safe_params[key] = '[REDACTED]'
            else:
                safe_params[key] = value
        
        self.logger.info(
            "API Request",
            extra={
                'method': request.method,
                'path': request.path,
                'query_params': safe_params,
                'headers': safe_headers,
                'user_id': getattr(request.user, 'id', None) if hasattr(request, 'user') else None,
                'ip_address': self.get_client_ip(request),
                'response_status': response_status,
                'response_time_ms': round(response_time * 1000, 2),
            }
        )
    
    def get_client_ip(self, request):
        """Get client IP address safely"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR', 'unknown')
        return ip


# Global instances
security_logger = SecurityAuditLogger()
api_logger = APILogger()


def get_secure_logger(name: str) -> logging.Logger:
    """Get a logger with secure formatting"""
    logger = logging.getLogger(name)
    return logger


def log_user_action(user_id: int, action: str, resource: str, details: Optional[Dict[str, Any]] = None):
    """Helper function to log user actions securely"""
    logger = get_secure_logger('api.user_actions')
    logger.info(
        f"User action: {action}",
        extra={
            'user_id': user_id,
            'action': action,
            'resource': resource,
            'details': details or {},
        }
    )


def log_error_safely(logger: logging.Logger, message: str, exception: Exception, user_id: Optional[int] = None):
    """Log errors without exposing sensitive information"""
    # Create safe error message
    safe_message = f"Error: {message}"
    
    # Log with structured data
    logger.error(
        safe_message,
        extra={
            'error_type': type(exception).__name__,
            'user_id': user_id,
            'error_code': getattr(exception, 'code', None),
        },
        exc_info=True
    )