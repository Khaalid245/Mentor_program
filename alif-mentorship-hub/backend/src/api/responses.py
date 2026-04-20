from rest_framework.response import Response
from rest_framework import status
import logging

logger = logging.getLogger('api')


class StandardErrorResponse:
    """Standardized error response format for consistent API responses"""
    
    @staticmethod
    def validation_error(message, field=None, code='validation_error'):
        """Standard validation error response"""
        error_data = {
            'error': {
                'type': 'validation_error',
                'code': code,
                'message': message,
                'timestamp': logger.handlers[0].formatter.formatTime(logger.makeRecord(
                    'api', logging.ERROR, '', 0, '', (), None
                )) if logger.handlers else None
            }
        }
        if field:
            error_data['error']['field'] = field
        
        logger.warning(f"Validation error: {message} (field: {field})")
        return Response(error_data, status=status.HTTP_400_BAD_REQUEST)
    
    @staticmethod
    def not_found_error(resource='Resource', resource_id=None):
        """Standard not found error response"""
        message = f"{resource} not found"
        if resource_id:
            message += f" (ID: {resource_id})"
        
        error_data = {
            'error': {
                'type': 'not_found',
                'code': 'resource_not_found',
                'message': message,
                'resource': resource.lower(),
                'resource_id': resource_id
            }
        }
        
        logger.warning(f"Resource not found: {resource} (ID: {resource_id})")
        return Response(error_data, status=status.HTTP_404_NOT_FOUND)
    
    @staticmethod
    def permission_error(message="You don't have permission to perform this action"):
        """Standard permission error response"""
        error_data = {
            'error': {
                'type': 'permission_denied',
                'code': 'insufficient_permissions',
                'message': message
            }
        }
        
        logger.warning(f"Permission denied: {message}")
        return Response(error_data, status=status.HTTP_403_FORBIDDEN)
    
    @staticmethod
    def authentication_error(message="Authentication credentials were not provided or are invalid"):
        """Standard authentication error response"""
        error_data = {
            'error': {
                'type': 'authentication_failed',
                'code': 'invalid_credentials',
                'message': message
            }
        }
        
        logger.warning(f"Authentication failed: {message}")
        return Response(error_data, status=status.HTTP_401_UNAUTHORIZED)
    
    @staticmethod
    def server_error(message="An internal server error occurred. Please contact support."):
        """Standard server error response"""
        error_data = {
            'error': {
                'type': 'server_error',
                'code': 'internal_server_error',
                'message': message,
                'support_contact': 'support@alifmentorship.com'
            }
        }
        
        logger.error(f"Server error: {message}")
        return Response(error_data, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @staticmethod
    def rate_limit_error(message="Rate limit exceeded. Please try again later."):
        """Standard rate limit error response"""
        error_data = {
            'error': {
                'type': 'rate_limit_exceeded',
                'code': 'too_many_requests',
                'message': message
            }
        }
        
        logger.warning(f"Rate limit exceeded: {message}")
        return Response(error_data, status=status.HTTP_429_TOO_MANY_REQUESTS)


class StandardSuccessResponse:
    """Standardized success response format"""
    
    @staticmethod
    def created(data, message="Resource created successfully"):
        """Standard creation success response"""
        response_data = {
            'success': True,
            'message': message,
            'data': data
        }
        return Response(response_data, status=status.HTTP_201_CREATED)
    
    @staticmethod
    def updated(data, message="Resource updated successfully"):
        """Standard update success response"""
        response_data = {
            'success': True,
            'message': message,
            'data': data
        }
        return Response(response_data, status=status.HTTP_200_OK)
    
    @staticmethod
    def deleted(message="Resource deleted successfully"):
        """Standard deletion success response"""
        response_data = {
            'success': True,
            'message': message
        }
        return Response(response_data, status=status.HTTP_200_OK)
    
    @staticmethod
    def action_completed(message, data=None):
        """Standard action completion response"""
        response_data = {
            'success': True,
            'message': message
        }
        if data:
            response_data['data'] = data
        return Response(response_data, status=status.HTTP_200_OK)