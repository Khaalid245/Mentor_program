"""
Enterprise Error Handling System
Provides structured, secure error responses without exposing internal details
"""
import logging
import traceback
from typing import Any, Dict, Optional, Union
from django.conf import settings
from django.core.exceptions import ValidationError, PermissionDenied
from django.http import Http404
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler
from rest_framework.exceptions import (
    APIException, AuthenticationFailed, NotAuthenticated, PermissionDenied as DRFPermissionDenied,
    NotFound, ValidationError as DRFValidationError, Throttled, ParseError, UnsupportedMediaType
)
from .secure_logging import log_error_safely, security_logger


class ErrorCode:
    """Standardized error codes for the application"""
    
    # Authentication & Authorization
    AUTH_REQUIRED = "AUTH_REQUIRED"
    AUTH_INVALID = "AUTH_INVALID"
    AUTH_EXPIRED = "AUTH_EXPIRED"
    PERMISSION_DENIED = "PERMISSION_DENIED"
    ACCOUNT_SUSPENDED = "ACCOUNT_SUSPENDED"
    ACCOUNT_DEACTIVATED = "ACCOUNT_DEACTIVATED"
    
    # Validation
    VALIDATION_ERROR = "VALIDATION_ERROR"
    INVALID_INPUT = "INVALID_INPUT"
    MISSING_REQUIRED_FIELD = "MISSING_REQUIRED_FIELD"
    INVALID_FORMAT = "INVALID_FORMAT"
    
    # Resource Management
    RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND"
    RESOURCE_CONFLICT = "RESOURCE_CONFLICT"
    RESOURCE_GONE = "RESOURCE_GONE"
    
    # Business Logic
    BUSINESS_RULE_VIOLATION = "BUSINESS_RULE_VIOLATION"
    OPERATION_NOT_ALLOWED = "OPERATION_NOT_ALLOWED"
    QUOTA_EXCEEDED = "QUOTA_EXCEEDED"
    
    # System
    INTERNAL_ERROR = "INTERNAL_ERROR"
    SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE"
    RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED"
    MAINTENANCE_MODE = "MAINTENANCE_MODE"
    
    # File Operations
    FILE_TOO_LARGE = "FILE_TOO_LARGE"
    INVALID_FILE_TYPE = "INVALID_FILE_TYPE"
    FILE_UPLOAD_FAILED = "FILE_UPLOAD_FAILED"


class EnterpriseAPIException(APIException):
    """Base exception class for enterprise API errors"""
    
    def __init__(self, message: str, error_code: str, details: Optional[Dict[str, Any]] = None, 
                 status_code: int = status.HTTP_400_BAD_REQUEST):
        self.error_code = error_code
        self.details = details or {}
        self.status_code = status_code
        super().__init__(message)


class BusinessRuleViolationError(EnterpriseAPIException):
    """Exception for business rule violations"""
    
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            error_code=ErrorCode.BUSINESS_RULE_VIOLATION,
            details=details,
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY
        )


class ResourceConflictError(EnterpriseAPIException):
    """Exception for resource conflicts"""
    
    def __init__(self, message: str, resource_type: str, resource_id: Optional[str] = None):
        details = {'resource_type': resource_type}
        if resource_id:
            details['resource_id'] = resource_id
        
        super().__init__(
            message=message,
            error_code=ErrorCode.RESOURCE_CONFLICT,
            details=details,
            status_code=status.HTTP_409_CONFLICT
        )


class QuotaExceededError(EnterpriseAPIException):
    """Exception for quota/limit exceeded"""
    
    def __init__(self, message: str, quota_type: str, current_value: int, max_value: int):
        super().__init__(
            message=message,
            error_code=ErrorCode.QUOTA_EXCEEDED,
            details={
                'quota_type': quota_type,
                'current_value': current_value,
                'max_value': max_value
            },
            status_code=status.HTTP_429_TOO_MANY_REQUESTS
        )


class ErrorResponseBuilder:
    """Builder for standardized error responses"""
    
    @staticmethod
    def build_error_response(
        error_code: str,
        message: str,
        status_code: int = status.HTTP_400_BAD_REQUEST,
        details: Optional[Dict[str, Any]] = None,
        field_errors: Optional[Dict[str, list]] = None,
        request_id: Optional[str] = None
    ) -> Response:
        """Build standardized error response"""
        
        error_response = {
            'success': False,
            'error': {
                'code': error_code,
                'message': message,
                'timestamp': ErrorResponseBuilder._get_timestamp(),
            }
        }
        
        # Add details if provided
        if details:
            error_response['error']['details'] = details
        
        # Add field-specific errors
        if field_errors:
            error_response['error']['field_errors'] = field_errors
        
        # Add request ID for tracing
        if request_id:
            error_response['error']['request_id'] = request_id
        
        # Add documentation link in development
        if settings.DEBUG:
            error_response['error']['documentation'] = f"/api/docs/errors/{error_code.lower()}"
        
        return Response(error_response, status=status_code)
    
    @staticmethod
    def build_validation_error_response(
        validation_errors: Dict[str, list],
        request_id: Optional[str] = None
    ) -> Response:
        """Build validation error response"""
        
        # Count total errors
        total_errors = sum(len(errors) for errors in validation_errors.values())
        
        message = f"Validation failed with {total_errors} error(s)"
        if total_errors == 1:
            # If only one error, use it as the main message
            field_name, errors = next(iter(validation_errors.items()))
            message = f"{field_name}: {errors[0]}"
        
        return ErrorResponseBuilder.build_error_response(
            error_code=ErrorCode.VALIDATION_ERROR,
            message=message,
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            field_errors=validation_errors,
            request_id=request_id
        )
    
    @staticmethod
    def _get_timestamp() -> str:
        """Get current timestamp in ISO format"""
        from django.utils import timezone
        return timezone.now().isoformat()


def custom_exception_handler(exc, context):
    """Custom exception handler for enterprise error responses"""
    
    # Get the request for logging
    request = context.get('request')
    request_id = getattr(request, 'request_id', None) if request else None
    user_id = getattr(request.user, 'id', None) if request and hasattr(request, 'user') else None
    
    # Get logger
    logger = logging.getLogger('api.errors')
    
    # Handle enterprise exceptions
    if isinstance(exc, EnterpriseAPIException):
        log_error_safely(logger, f"Enterprise API error: {exc.error_code}", exc, user_id)
        
        return ErrorResponseBuilder.build_error_response(
            error_code=exc.error_code,
            message=str(exc),
            status_code=exc.status_code,
            details=exc.details,
            request_id=request_id
        )
    
    # Handle DRF validation errors
    if isinstance(exc, DRFValidationError):
        field_errors = {}
        
        if hasattr(exc, 'detail'):
            if isinstance(exc.detail, dict):
                for field, errors in exc.detail.items():
                    if isinstance(errors, list):
                        field_errors[field] = [str(error) for error in errors]
                    else:
                        field_errors[field] = [str(errors)]
            elif isinstance(exc.detail, list):
                field_errors['non_field_errors'] = [str(error) for error in exc.detail]
            else:
                field_errors['non_field_errors'] = [str(exc.detail)]
        
        return ErrorResponseBuilder.build_validation_error_response(
            validation_errors=field_errors,
            request_id=request_id
        )
    
    # Handle authentication errors
    if isinstance(exc, (NotAuthenticated, AuthenticationFailed)):
        error_code = ErrorCode.AUTH_REQUIRED if isinstance(exc, NotAuthenticated) else ErrorCode.AUTH_INVALID
        
        security_logger.log_authentication_attempt(
            username=getattr(request.user, 'username', 'anonymous') if request else 'unknown',
            success=False,
            ip_address=request.META.get('REMOTE_ADDR', 'unknown') if request else 'unknown',
            user_agent=request.META.get('HTTP_USER_AGENT', 'unknown') if request else 'unknown'
        )
        
        return ErrorResponseBuilder.build_error_response(
            error_code=error_code,
            message=str(exc),
            status_code=status.HTTP_401_UNAUTHORIZED,
            request_id=request_id
        )
    
    # Handle permission errors
    if isinstance(exc, (PermissionDenied, DRFPermissionDenied)):
        security_logger.log_permission_denied(
            user_id=user_id,
            resource=request.path if request else 'unknown',
            action=request.method if request else 'unknown',
            ip_address=request.META.get('REMOTE_ADDR', 'unknown') if request else 'unknown'
        )
        
        return ErrorResponseBuilder.build_error_response(
            error_code=ErrorCode.PERMISSION_DENIED,
            message="You don't have permission to perform this action",
            status_code=status.HTTP_403_FORBIDDEN,
            request_id=request_id
        )
    
    # Handle not found errors
    if isinstance(exc, (Http404, NotFound)):
        return ErrorResponseBuilder.build_error_response(
            error_code=ErrorCode.RESOURCE_NOT_FOUND,
            message="The requested resource was not found",
            status_code=status.HTTP_404_NOT_FOUND,
            request_id=request_id
        )
    
    # Handle throttling
    if isinstance(exc, Throttled):
        return ErrorResponseBuilder.build_error_response(
            error_code=ErrorCode.RATE_LIMIT_EXCEEDED,
            message=f"Rate limit exceeded. Try again in {exc.wait} seconds.",
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            details={'retry_after': exc.wait},
            request_id=request_id
        )
    
    # Handle parse errors
    if isinstance(exc, ParseError):
        return ErrorResponseBuilder.build_error_response(
            error_code=ErrorCode.INVALID_INPUT,
            message="Invalid request format",
            status_code=status.HTTP_400_BAD_REQUEST,
            request_id=request_id
        )
    
    # Handle unsupported media type
    if isinstance(exc, UnsupportedMediaType):
        return ErrorResponseBuilder.build_error_response(
            error_code=ErrorCode.INVALID_FORMAT,
            message=f"Unsupported media type: {exc.detail}",
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            request_id=request_id
        )
    
    # Handle Django validation errors
    if isinstance(exc, ValidationError):
        field_errors = {}
        if hasattr(exc, 'message_dict'):
            for field, messages in exc.message_dict.items():
                field_errors[field] = messages
        else:
            field_errors['non_field_errors'] = exc.messages if hasattr(exc, 'messages') else [str(exc)]
        
        return ErrorResponseBuilder.build_validation_error_response(
            validation_errors=field_errors,
            request_id=request_id
        )
    
    # Log unexpected errors
    log_error_safely(logger, "Unexpected error occurred", exc, user_id)
    
    # Handle all other exceptions
    if settings.DEBUG:
        # In debug mode, let DRF handle it to show full traceback
        response = exception_handler(exc, context)
        if response is not None:
            return response
    
    # Production error response (don't expose internal details)
    return ErrorResponseBuilder.build_error_response(
        error_code=ErrorCode.INTERNAL_ERROR,
        message="An internal error occurred. Please try again later.",
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        request_id=request_id
    )


class ErrorHandlingMixin:
    """Mixin for views to provide consistent error handling"""
    
    def handle_business_error(self, message: str, details: Optional[Dict[str, Any]] = None) -> Response:
        """Handle business logic errors"""
        return ErrorResponseBuilder.build_error_response(
            error_code=ErrorCode.BUSINESS_RULE_VIOLATION,
            message=message,
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            details=details,
            request_id=getattr(self.request, 'request_id', None)
        )
    
    def handle_not_found(self, resource_type: str, resource_id: Optional[str] = None) -> Response:
        """Handle resource not found errors"""
        message = f"{resource_type.title()} not found"
        details = {'resource_type': resource_type}
        if resource_id:
            details['resource_id'] = resource_id
        
        return ErrorResponseBuilder.build_error_response(
            error_code=ErrorCode.RESOURCE_NOT_FOUND,
            message=message,
            status_code=status.HTTP_404_NOT_FOUND,
            details=details,
            request_id=getattr(self.request, 'request_id', None)
        )
    
    def handle_conflict(self, message: str, resource_type: str, resource_id: Optional[str] = None) -> Response:
        """Handle resource conflict errors"""
        details = {'resource_type': resource_type}
        if resource_id:
            details['resource_id'] = resource_id
        
        return ErrorResponseBuilder.build_error_response(
            error_code=ErrorCode.RESOURCE_CONFLICT,
            message=message,
            status_code=status.HTTP_409_CONFLICT,
            details=details,
            request_id=getattr(self.request, 'request_id', None)
        )


# Utility functions for common error scenarios
def raise_business_error(message: str, details: Optional[Dict[str, Any]] = None):
    """Raise a business rule violation error"""
    raise BusinessRuleViolationError(message, details)


def raise_resource_conflict(message: str, resource_type: str, resource_id: Optional[str] = None):
    """Raise a resource conflict error"""
    raise ResourceConflictError(message, resource_type, resource_id)


def raise_quota_exceeded(message: str, quota_type: str, current_value: int, max_value: int):
    """Raise a quota exceeded error"""
    raise QuotaExceededError(message, quota_type, current_value, max_value)