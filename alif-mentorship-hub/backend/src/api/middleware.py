"""
Enterprise Middleware System
Provides security, monitoring, request processing, and performance optimization
"""
import time
import uuid
import json
import logging
from typing import Callable, Optional
from django.http import HttpRequest, HttpResponse, JsonResponse
from django.utils.deprecation import MiddlewareMixin
from django.conf import settings
from django.core.cache import cache
from django.utils import timezone
from django.contrib.auth.models import AnonymousUser
from .secure_logging import api_logger, security_logger
from .error_handling import ErrorCode, ErrorResponseBuilder


class RequestTrackingMiddleware(MiddlewareMixin):
    """Middleware to track requests with unique IDs and timing"""
    
    def process_request(self, request: HttpRequest) -> Optional[HttpResponse]:
        """Add request tracking information"""
        # Generate unique request ID
        request.request_id = str(uuid.uuid4())
        request.start_time = time.time()
        
        # Add client IP
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            request.client_ip = x_forwarded_for.split(',')[0].strip()
        else:
            request.client_ip = request.META.get('REMOTE_ADDR', 'unknown')
        
        return None
    
    def process_response(self, request: HttpRequest, response: HttpResponse) -> HttpResponse:
        """Log request completion"""
        if hasattr(request, 'start_time'):
            response_time = time.time() - request.start_time
            
            # Log API request
            api_logger.log_request(request, response.status_code, response_time)
            
            # Add response headers
            response['X-Request-ID'] = getattr(request, 'request_id', 'unknown')
            response['X-Response-Time'] = f"{response_time:.3f}s"
        
        return response


class SecurityHeadersMiddleware(MiddlewareMixin):
    """Middleware to add security headers"""
    
    def process_response(self, request: HttpRequest, response: HttpResponse) -> HttpResponse:
        """Add security headers to response"""
        
        # Content Security Policy
        if not settings.DEBUG:
            response['Content-Security-Policy'] = (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline'; "
                "style-src 'self' 'unsafe-inline'; "
                "img-src 'self' data: https:; "
                "font-src 'self' https:; "
                "connect-src 'self'; "
                "frame-ancestors 'none';"
            )
        
        # Security headers
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-Frame-Options'] = 'DENY'
        response['X-XSS-Protection'] = '1; mode=block'
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        
        # HSTS (only in production with HTTPS)
        if not settings.DEBUG and request.is_secure():
            response['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload'
        
        # Remove server information
        if 'Server' in response:
            del response['Server']
        
        return response


class RateLimitingMiddleware(MiddlewareMixin):
    """Advanced rate limiting middleware"""
    
    def __init__(self, get_response: Callable):
        super().__init__(get_response)
        self.logger = logging.getLogger('api.rate_limiting')
    
    def process_request(self, request: HttpRequest) -> Optional[HttpResponse]:
        """Check rate limits"""
        
        # Skip rate limiting for certain paths
        if self._should_skip_rate_limiting(request):
            return None
        
        # Get client identifier
        client_id = self._get_client_identifier(request)
        
        # Check different rate limit tiers
        if self._is_rate_limited(request, client_id):
            self.logger.warning(
                f"Rate limit exceeded for {client_id}",
                extra={
                    'client_id': client_id,
                    'path': request.path,
                    'method': request.method,
                    'ip_address': request.client_ip if hasattr(request, 'client_ip') else 'unknown'
                }
            )
            
            return JsonResponse({
                'success': False,
                'error': {
                    'code': ErrorCode.RATE_LIMIT_EXCEEDED,
                    'message': 'Rate limit exceeded. Please try again later.',
                    'retry_after': 60
                }
            }, status=429)
        
        return None
    
    def _should_skip_rate_limiting(self, request: HttpRequest) -> bool:
        """Check if rate limiting should be skipped"""
        skip_paths = ['/health/', '/ready/', '/alive/', '/api/v1/config/']
        return any(request.path.startswith(path) for path in skip_paths)
    
    def _get_client_identifier(self, request: HttpRequest) -> str:
        """Get client identifier for rate limiting"""
        if hasattr(request, 'user') and not isinstance(request.user, AnonymousUser):
            return f"user:{request.user.id}"
        
        return f"ip:{getattr(request, 'client_ip', 'unknown')}"
    
    def _is_rate_limited(self, request: HttpRequest, client_id: str) -> bool:
        """Check if client is rate limited"""
        
        # Different limits for different endpoints
        limits = self._get_rate_limits(request)
        
        for window, max_requests in limits.items():
            cache_key = f"rate_limit:{client_id}:{request.path}:{window}"
            current_requests = cache.get(cache_key, 0)
            
            if current_requests >= max_requests:
                return True
            
            # Increment counter
            cache.set(cache_key, current_requests + 1, window)
        
        return False
    
    def _get_rate_limits(self, request: HttpRequest) -> dict:
        """Get rate limits for the request"""
        
        # Authentication endpoints (stricter limits)
        if request.path.startswith('/api/v1/auth/'):
            if request.path.endswith('/login/'):
                return {60: 5, 3600: 20}  # 5 per minute, 20 per hour
            elif request.path.endswith('/register/'):
                return {60: 2, 3600: 10}  # 2 per minute, 10 per hour
            else:
                return {60: 10, 3600: 100}  # 10 per minute, 100 per hour
        
        # API endpoints (normal limits)
        if request.path.startswith('/api/'):
            if hasattr(request, 'user') and not isinstance(request.user, AnonymousUser):
                return {60: 100, 3600: 1000}  # Authenticated users: 100/min, 1000/hour
            else:
                return {60: 20, 3600: 200}  # Anonymous users: 20/min, 200/hour
        
        # Default limits
        return {60: 60, 3600: 600}  # 60 per minute, 600 per hour


class CORSMiddleware(MiddlewareMixin):
    """Enhanced CORS middleware with security"""
    
    def process_response(self, request: HttpRequest, response: HttpResponse) -> HttpResponse:
        """Add CORS headers"""
        
        origin = request.META.get('HTTP_ORIGIN')
        
        # Check if origin is allowed
        if origin and self._is_origin_allowed(origin):
            response['Access-Control-Allow-Origin'] = origin
            response['Access-Control-Allow-Credentials'] = 'true'
        
        # Handle preflight requests
        if request.method == 'OPTIONS':
            response['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
            response['Access-Control-Allow-Headers'] = (
                'Accept, Accept-Language, Content-Language, Content-Type, '
                'Authorization, X-Requested-With, X-CSRFToken, API-Version'
            )
            response['Access-Control-Max-Age'] = '86400'  # 24 hours
        
        return response
    
    def _is_origin_allowed(self, origin: str) -> bool:
        """Check if origin is in allowed list"""
        allowed_origins = getattr(settings, 'CORS_ALLOWED_ORIGINS', [])
        return origin in allowed_origins


class MaintenanceModeMiddleware(MiddlewareMixin):
    """Middleware to handle maintenance mode"""
    
    def process_request(self, request: HttpRequest) -> Optional[HttpResponse]:
        """Check if site is in maintenance mode"""
        
        # Skip for health checks and admin
        if (request.path.startswith('/health/') or 
            request.path.startswith('/admin/') or
            request.path.startswith('/api/v1/health/')):
            return None
        
        # Check maintenance mode setting
        try:
            from api.models import PlatformSettings
            settings_obj = PlatformSettings.get_solo()
            
            if settings_obj.maintenance_mode:
                return JsonResponse({
                    'success': False,
                    'error': {
                        'code': ErrorCode.MAINTENANCE_MODE,
                        'message': 'The platform is currently under maintenance. Please try again later.',
                        'maintenance': True
                    }
                }, status=503)
        
        except Exception:
            # If we can't check settings, allow request to proceed
            pass
        
        return None


class APIVersioningMiddleware(MiddlewareMixin):
    """Middleware to handle API versioning"""
    
    def process_request(self, request: HttpRequest) -> Optional[HttpResponse]:
        """Add API version information"""
        
        # Get version from header or URL
        api_version = request.META.get('HTTP_API_VERSION', 'v1')
        
        # Validate version
        supported_versions = ['v1']
        if api_version not in supported_versions:
            return JsonResponse({
                'success': False,
                'error': {
                    'code': 'UNSUPPORTED_API_VERSION',
                    'message': f'API version {api_version} is not supported',
                    'supported_versions': supported_versions
                }
            }, status=400)
        
        request.api_version = api_version
        return None
    
    def process_response(self, request: HttpRequest, response: HttpResponse) -> HttpResponse:
        """Add API version headers"""
        response['API-Version'] = getattr(request, 'api_version', 'v1')
        response['API-Supported-Versions'] = 'v1'
        return response


class RequestValidationMiddleware(MiddlewareMixin):
    """Middleware for request validation and sanitization"""
    
    def __init__(self, get_response: Callable):
        super().__init__(get_response)
        self.logger = logging.getLogger('api.validation')
    
    def process_request(self, request: HttpRequest) -> Optional[HttpResponse]:
        """Validate request"""
        
        # Skip validation for certain paths
        if not request.path.startswith('/api/'):
            return None
        
        # Validate content type for POST/PUT/PATCH
        if request.method in ['POST', 'PUT', 'PATCH']:
            content_type = request.META.get('CONTENT_TYPE', '')
            
            if not content_type:
                return JsonResponse({
                    'success': False,
                    'error': {
                        'code': ErrorCode.INVALID_FORMAT,
                        'message': 'Content-Type header is required'
                    }
                }, status=400)
            
            # Check for valid content types
            valid_types = [
                'application/json',
                'application/x-www-form-urlencoded',
                'multipart/form-data'
            ]
            
            if not any(content_type.startswith(vt) for vt in valid_types):
                return JsonResponse({
                    'success': False,
                    'error': {
                        'code': ErrorCode.INVALID_FORMAT,
                        'message': f'Unsupported content type: {content_type}'
                    }
                }, status=415)
        
        # Validate request size
        content_length = request.META.get('CONTENT_LENGTH')
        if content_length:
            try:
                size = int(content_length)
                max_size = getattr(settings, 'DATA_UPLOAD_MAX_MEMORY_SIZE', 20 * 1024 * 1024)
                
                if size > max_size:
                    return JsonResponse({
                        'success': False,
                        'error': {
                            'code': ErrorCode.FILE_TOO_LARGE,
                            'message': f'Request too large. Maximum size: {max_size} bytes'
                        }
                    }, status=413)
            
            except ValueError:
                pass
        
        return None


class ResponseCompressionMiddleware(MiddlewareMixin):
    """Middleware to handle response compression"""
    
    def process_response(self, request: HttpRequest, response: HttpResponse) -> HttpResponse:
        """Add compression headers"""
        
        # Check if client accepts compression
        accept_encoding = request.META.get('HTTP_ACCEPT_ENCODING', '')
        
        if 'gzip' in accept_encoding.lower():
            response['X-Compression-Available'] = 'gzip'
        
        # Add content length if not present
        if not response.get('Content-Length') and hasattr(response, 'content'):
            response['Content-Length'] = str(len(response.content))
        
        return response


class DatabaseConnectionMiddleware(MiddlewareMixin):
    """Middleware to manage database connections"""
    
    def process_request(self, request: HttpRequest) -> Optional[HttpResponse]:
        """Check database connection"""
        from django.db import connection
        
        # Test connection for critical endpoints
        if request.path.startswith('/api/') and request.method in ['POST', 'PUT', 'PATCH', 'DELETE']:
            try:
                connection.ensure_connection()
            except Exception as e:
                logger = logging.getLogger('api.database')
                logger.error(f"Database connection failed: {str(e)}")
                
                return JsonResponse({
                    'success': False,
                    'error': {
                        'code': ErrorCode.SERVICE_UNAVAILABLE,
                        'message': 'Database service temporarily unavailable'
                    }
                }, status=503)
        
        return None
    
    def process_response(self, request: HttpRequest, response: HttpResponse) -> HttpResponse:
        """Close database connections if needed"""
        from django.db import connection
        
        # Close connection for long-running requests
        if hasattr(request, 'start_time'):
            request_time = time.time() - request.start_time
            if request_time > 30:  # 30 seconds
                connection.close()
        
        return response