import logging
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

logger = logging.getLogger('api')


def custom_exception_handler(exc, context):
    """Custom exception handler with logging"""
    response = exception_handler(exc, context)
    
    # Log the exception
    logger.error(
        f"API Exception: {exc.__class__.__name__}",
        extra={
            'view': context.get('view').__class__.__name__,
            'request_method': context.get('request').method,
            'request_path': context.get('request').path,
            'exception': str(exc),
        },
        exc_info=True,
    )
    
    if response is None:
        # Unhandled exception - return 500
        return Response(
            {'detail': 'Internal server error. Please contact support.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
    
    return response
