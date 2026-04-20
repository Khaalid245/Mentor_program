"""
Configuration API Views
Provides dynamic configuration endpoints for frontend integration
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
from .config_manager import config_manager
import logging

logger = logging.getLogger('api')

@api_view(['GET'])
@permission_classes([AllowAny])
def get_frontend_config(request):
    """
    Get configuration for frontend application
    This endpoint provides all necessary configuration for the frontend
    """
    try:
        # Get base configuration
        frontend_config = config_manager.export_frontend_config()
        
        # Add environment-specific overrides
        if hasattr(settings, 'FRONTEND_CONFIG_OVERRIDES'):
            frontend_config.update(settings.FRONTEND_CONFIG_OVERRIDES)
        
        # Add runtime configuration
        frontend_config.update({
            "version": getattr(settings, 'VERSION', '1.0.0'),
            "debug": settings.DEBUG,
            "serverTime": request.META.get('HTTP_DATE'),
            "supportedLanguages": ["en", "so"],  # English and Somali
            "defaultLanguage": "en"
        })
        
        logger.info(f"Frontend configuration requested from {request.META.get('REMOTE_ADDR')}")
        
        return Response({
            "success": True,
            "config": frontend_config
        })
        
    except Exception as e:
        logger.error(f"Error getting frontend config: {str(e)}")
        return Response({
            "success": False,
            "error": "Configuration unavailable"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])
def get_api_info(request):
    """
    Get API information and available endpoints
    """
    try:
        api_config = config_manager.get_api_endpoints()
        
        api_info = {
            "version": api_config.version,
            "basePath": api_config.base_path,
            "endpoints": {
                "authentication": list(api_config.auth_endpoints.keys()),
                "users": list(api_config.user_endpoints.keys()),
                "sessions": list(api_config.session_endpoints.keys())
            },
            "features": {
                "authentication": "JWT with refresh tokens",
                "fileUpload": config_manager.is_feature_enabled('file_upload_enabled'),
                "messaging": config_manager.is_feature_enabled('messaging_enabled'),
                "notifications": config_manager.is_feature_enabled('notifications_enabled'),
                "rateLimit": config_manager.is_feature_enabled('rate_limiting_enabled')
            },
            "limits": {
                "maxFileSize": config_manager.get_frontend_config().max_file_size,
                "supportedFileTypes": config_manager.get_frontend_config().supported_file_types,
                "rateLimits": config_manager.get_security_config().rate_limits
            }
        }
        
        return Response({
            "success": True,
            "api": api_info
        })
        
    except Exception as e:
        logger.error(f"Error getting API info: {str(e)}")
        return Response({
            "success": False,
            "error": "API information unavailable"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """
    Health check endpoint with configuration status
    """
    try:
        # Basic health check
        health_status = {
            "status": "healthy",
            "timestamp": request.META.get('HTTP_DATE'),
            "environment": config_manager.environment,
            "version": getattr(settings, 'VERSION', '1.0.0')
        }
        
        # Add configuration status
        try:
            config_manager.get_config('features')
            health_status["configuration"] = "loaded"
        except:
            health_status["configuration"] = "error"
            health_status["status"] = "degraded"
        
        # Add database status
        try:
            from django.db import connection
            connection.ensure_connection()
            health_status["database"] = "connected"
        except:
            health_status["database"] = "disconnected"
            health_status["status"] = "unhealthy"
        
        # Add cache status if enabled
        if config_manager.is_feature_enabled('caching_enabled'):
            try:
                from django.core.cache import cache
                cache.set('health_check', 'ok', 10)
                if cache.get('health_check') == 'ok':
                    health_status["cache"] = "connected"
                else:
                    health_status["cache"] = "disconnected"
            except:
                health_status["cache"] = "error"
        
        status_code = status.HTTP_200_OK
        if health_status["status"] == "unhealthy":
            status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        elif health_status["status"] == "degraded":
            status_code = status.HTTP_200_OK  # Still operational
        
        return Response(health_status, status=status_code)
        
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return Response({
            "status": "unhealthy",
            "error": "Health check failed"
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)