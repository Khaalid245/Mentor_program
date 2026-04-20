"""
Enterprise Input Sanitization and Validation System
Prevents SQL injection, XSS, and other input-based attacks
"""
import re
import html
import bleach
from typing import Any, Dict, List, Optional, Union
from django.core.exceptions import ValidationError
from django.utils.html import strip_tags
from rest_framework import serializers


class InputSanitizer:
    """Comprehensive input sanitization for enterprise security"""
    
    # XSS prevention patterns
    XSS_PATTERNS = [
        re.compile(r'<script[^>]*>.*?</script>', re.IGNORECASE | re.DOTALL),
        re.compile(r'javascript:', re.IGNORECASE),
        re.compile(r'on\w+\s*=', re.IGNORECASE),
        re.compile(r'<iframe[^>]*>.*?</iframe>', re.IGNORECASE | re.DOTALL),
        re.compile(r'<object[^>]*>.*?</object>', re.IGNORECASE | re.DOTALL),
        re.compile(r'<embed[^>]*>', re.IGNORECASE),
        re.compile(r'<link[^>]*>', re.IGNORECASE),
        re.compile(r'<meta[^>]*>', re.IGNORECASE),
    ]
    
    # SQL injection patterns
    SQL_INJECTION_PATTERNS = [
        re.compile(r'(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)', re.IGNORECASE),
        re.compile(r'(\b(OR|AND)\s+\d+\s*=\s*\d+)', re.IGNORECASE),
        re.compile(r'(\b(OR|AND)\s+["\']?\w+["\']?\s*=\s*["\']?\w+["\']?)', re.IGNORECASE),
        re.compile(r'(--|#|/\*|\*/)', re.IGNORECASE),
        re.compile(r'(\bUNION\s+SELECT\b)', re.IGNORECASE),
        re.compile(r'(\b(EXEC|EXECUTE)\s+)', re.IGNORECASE),
    ]
    
    # Command injection patterns
    COMMAND_INJECTION_PATTERNS = [
        re.compile(r'[;&|`$(){}[\]<>]'),
        re.compile(r'\b(cat|ls|pwd|whoami|id|uname|ps|netstat|ifconfig|ping|wget|curl|nc|telnet|ssh|ftp)\b', re.IGNORECASE),
    ]
    
    # Path traversal patterns
    PATH_TRAVERSAL_PATTERNS = [
        re.compile(r'\.\.[\\/]'),
        re.compile(r'[\\/]\.\.'),
        re.compile(r'%2e%2e[\\/]', re.IGNORECASE),
        re.compile(r'[\\/]%2e%2e', re.IGNORECASE),
    ]
    
    # Allowed HTML tags for rich text (very restrictive)
    ALLOWED_HTML_TAGS = [
        'p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'
    ]
    
    ALLOWED_HTML_ATTRIBUTES = {
        '*': ['class'],
        'a': ['href', 'title'],
        'img': ['src', 'alt', 'width', 'height'],
    }
    
    @classmethod
    def sanitize_string(cls, value: str, allow_html: bool = False, max_length: Optional[int] = None) -> str:
        """Sanitize string input for security"""
        if not isinstance(value, str):
            value = str(value)
        
        # Remove null bytes
        value = value.replace('\x00', '')
        
        # Detect and prevent SQL injection
        if cls.contains_sql_injection(value):
            raise ValidationError("Input contains potentially malicious SQL patterns")
        
        # Detect and prevent command injection
        if cls.contains_command_injection(value):
            raise ValidationError("Input contains potentially malicious command patterns")
        
        # Detect and prevent path traversal
        if cls.contains_path_traversal(value):
            raise ValidationError("Input contains path traversal patterns")
        
        # Handle HTML content
        if allow_html:
            # Use bleach to sanitize HTML
            value = bleach.clean(
                value,
                tags=cls.ALLOWED_HTML_TAGS,
                attributes=cls.ALLOWED_HTML_ATTRIBUTES,
                strip=True
            )
        else:
            # Remove all HTML tags
            value = strip_tags(value)
            # Escape any remaining HTML entities
            value = html.escape(value)
        
        # Prevent XSS
        for pattern in cls.XSS_PATTERNS:
            value = pattern.sub('', value)
        
        # Normalize whitespace
        value = ' '.join(value.split())
        
        # Enforce length limit
        if max_length and len(value) > max_length:
            value = value[:max_length].rstrip()
        
        return value
    
    @classmethod
    def contains_sql_injection(cls, value: str) -> bool:
        """Check if string contains SQL injection patterns"""
        for pattern in cls.SQL_INJECTION_PATTERNS:
            if pattern.search(value):
                return True
        return False
    
    @classmethod
    def contains_command_injection(cls, value: str) -> bool:
        """Check if string contains command injection patterns"""
        for pattern in cls.COMMAND_INJECTION_PATTERNS:
            if pattern.search(value):
                return True
        return False
    
    @classmethod
    def contains_path_traversal(cls, value: str) -> bool:
        """Check if string contains path traversal patterns"""
        for pattern in cls.PATH_TRAVERSAL_PATTERNS:
            if pattern.search(value):
                return True
        return False
    
    @classmethod
    def sanitize_filename(cls, filename: str) -> str:
        """Sanitize filename for safe storage"""
        if not filename:
            return "unnamed_file"
        
        # Remove path components
        filename = filename.split('/')[-1].split('\\')[-1]
        
        # Remove dangerous characters
        filename = re.sub(r'[<>:"/\\|?*\x00-\x1f]', '', filename)
        
        # Remove leading/trailing dots and spaces
        filename = filename.strip('. ')
        
        # Ensure it's not empty
        if not filename:
            filename = "unnamed_file"
        
        # Limit length
        if len(filename) > 255:
            name, ext = filename.rsplit('.', 1) if '.' in filename else (filename, '')
            max_name_length = 255 - len(ext) - 1 if ext else 255
            filename = name[:max_name_length] + ('.' + ext if ext else '')
        
        return filename
    
    @classmethod
    def validate_email(cls, email: str) -> str:
        """Validate and sanitize email address"""
        email = email.strip().lower()
        
        # Basic email pattern
        email_pattern = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
        
        if not email_pattern.match(email):
            raise ValidationError("Invalid email format")
        
        # Check for dangerous patterns
        if cls.contains_sql_injection(email) or cls.contains_command_injection(email):
            raise ValidationError("Email contains invalid characters")
        
        return email
    
    @classmethod
    def validate_username(cls, username: str) -> str:
        """Validate and sanitize username"""
        username = username.strip()
        
        # Username pattern (alphanumeric, underscore, hyphen)
        username_pattern = re.compile(r'^[a-zA-Z0-9_-]+$')
        
        if not username_pattern.match(username):
            raise ValidationError("Username can only contain letters, numbers, underscores, and hyphens")
        
        if len(username) < 3:
            raise ValidationError("Username must be at least 3 characters long")
        
        if len(username) > 30:
            raise ValidationError("Username cannot exceed 30 characters")
        
        return username
    
    @classmethod
    def validate_phone(cls, phone: str) -> str:
        """Validate and sanitize phone number"""
        # Remove all non-digit characters except +
        phone = re.sub(r'[^\d+]', '', phone)
        
        # Basic phone validation
        if not re.match(r'^\+?[\d]{7,15}$', phone):
            raise ValidationError("Invalid phone number format")
        
        return phone
    
    @classmethod
    def sanitize_search_query(cls, query: str) -> str:
        """Sanitize search query to prevent injection"""
        if not query:
            return ""
        
        # Remove dangerous characters
        query = re.sub(r'[<>"\';\\]', '', query)
        
        # Limit length
        query = query[:200]
        
        # Normalize whitespace
        query = ' '.join(query.split())
        
        return query


class SecureValidationMixin:
    """Mixin for DRF serializers to add secure validation"""
    
    def validate_text_field(self, value: str, field_name: str, max_length: Optional[int] = None, allow_html: bool = False) -> str:
        """Validate text field with security checks"""
        try:
            return InputSanitizer.sanitize_string(value, allow_html=allow_html, max_length=max_length)
        except ValidationError as e:
            raise serializers.ValidationError({field_name: str(e)})
    
    def validate_email_field(self, value: str, field_name: str = 'email') -> str:
        """Validate email field"""
        try:
            return InputSanitizer.validate_email(value)
        except ValidationError as e:
            raise serializers.ValidationError({field_name: str(e)})
    
    def validate_username_field(self, value: str, field_name: str = 'username') -> str:
        """Validate username field"""
        try:
            return InputSanitizer.validate_username(value)
        except ValidationError as e:
            raise serializers.ValidationError({field_name: str(e)})


def sanitize_dict(data: Dict[str, Any], allowed_keys: Optional[List[str]] = None) -> Dict[str, Any]:
    """Sanitize dictionary data"""
    sanitized = {}
    
    for key, value in data.items():
        # Skip keys not in allowed list
        if allowed_keys and key not in allowed_keys:
            continue
        
        # Sanitize key
        safe_key = InputSanitizer.sanitize_string(str(key), allow_html=False, max_length=100)
        
        # Sanitize value based on type
        if isinstance(value, str):
            safe_value = InputSanitizer.sanitize_string(value, allow_html=False, max_length=1000)
        elif isinstance(value, dict):
            safe_value = sanitize_dict(value)
        elif isinstance(value, list):
            safe_value = [
                InputSanitizer.sanitize_string(str(item), allow_html=False, max_length=500)
                if isinstance(item, str) else item
                for item in value[:100]  # Limit list size
            ]
        else:
            safe_value = value
        
        sanitized[safe_key] = safe_value
    
    return sanitized


def validate_json_field(value: Any, max_depth: int = 3, max_keys: int = 100) -> Any:
    """Validate JSON field for security"""
    def validate_recursive(obj, depth=0):
        if depth > max_depth:
            raise ValidationError("JSON structure too deep")
        
        if isinstance(obj, dict):
            if len(obj) > max_keys:
                raise ValidationError("Too many keys in JSON object")
            
            validated = {}
            for k, v in obj.items():
                safe_key = InputSanitizer.sanitize_string(str(k), max_length=100)
                validated[safe_key] = validate_recursive(v, depth + 1)
            return validated
        
        elif isinstance(obj, list):
            if len(obj) > max_keys:
                raise ValidationError("JSON array too large")
            
            return [validate_recursive(item, depth + 1) for item in obj]
        
        elif isinstance(obj, str):
            return InputSanitizer.sanitize_string(obj, max_length=1000)
        
        else:
            return obj
    
    return validate_recursive(value)


# Decorator for view methods to sanitize request data
def sanitize_request_data(allowed_fields: Optional[List[str]] = None):
    """Decorator to sanitize request data"""
    def decorator(view_method):
        def wrapper(self, request, *args, **kwargs):
            if hasattr(request, 'data') and request.data:
                try:
                    request._full_data = sanitize_dict(request.data, allowed_fields)
                except ValidationError as e:
                    from rest_framework.response import Response
                    from rest_framework import status
                    return Response(
                        {'error': 'Invalid input data', 'details': str(e)},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            return view_method(self, request, *args, **kwargs)
        return wrapper
    return decorator