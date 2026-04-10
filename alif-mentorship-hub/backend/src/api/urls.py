from django.urls import path, include
from rest_framework.routers import DefaultRouter
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView, LoginView, current_user,
    StudentApplicationViewSet, MentorViewSet,
    MentorshipSessionViewSet, CareerPathViewSet, StudentGoalViewSet
)

# Initialize router
router = DefaultRouter()
router.register(r'student/applications', StudentApplicationViewSet, basename='student-applications')
router.register(r'mentors', MentorViewSet, basename='mentors')
router.register(r'sessions', MentorshipSessionViewSet, basename='sessions')
router.register(r'career-paths', CareerPathViewSet, basename='career-paths')
router.register(r'goals', StudentGoalViewSet, basename='goals')

urlpatterns = [
    # Authentication routes
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('auth/user/', current_user, name='current-user'),

    # API routes from router
    path('', include(router.urls)),
]

# ADD THIS — enables serving uploaded profile images
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
