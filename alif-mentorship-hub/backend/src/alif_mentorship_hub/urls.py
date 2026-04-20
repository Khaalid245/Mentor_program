from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from api.health_checks import HealthCheckView, ReadinessCheckView, LivenessCheckView
from api.config_views import get_frontend_config, get_api_info, health_check

urlpatterns = [
    path('admin/', admin.site.urls),       # Admin dashboard
    path('api/', include('api.urls')),     # Include app-level URLs (students, mentors, auth)
    
    # Configuration endpoints for frontend integration
    path('api/v1/config/frontend/', get_frontend_config, name='frontend_config'),
    path('api/v1/config/api-info/', get_api_info, name='api_info'),
    path('api/v1/health/', health_check, name='config_health_check'),
    
    # Health check endpoints for monitoring and K8s
    path('health/', HealthCheckView.as_view(), name='health'),
    path('ready/', ReadinessCheckView.as_view(), name='ready'),
    path('alive/', LivenessCheckView.as_view(), name='alive'),
]

# API Documentation (development only)
if settings.DEBUG:
    try:
        from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
        urlpatterns += [
            path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
            path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
        ]
    except ImportError:
        pass

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

