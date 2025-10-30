from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RegisterView, LoginView, StudentApplicationViewSet, MentorViewSet, current_user

# Initialize router
router = DefaultRouter()
router.register(r'student/applications', StudentApplicationViewSet, basename='student-applications')
router.register(r'mentors', MentorViewSet, basename='mentors')

urlpatterns = [
    # Authentication routes
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/user/', current_user, name='current-user'),  # Added this line

    # API routes from router
    path('', include(router.urls)),
]
