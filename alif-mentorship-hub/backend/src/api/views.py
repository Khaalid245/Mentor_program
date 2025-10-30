from rest_framework import viewsets, permissions, status, generics
from rest_framework.response import Response
from rest_framework.decorators import action, api_view, permission_classes
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.authentication import JWTAuthentication
from .models import StudentApplication, Mentor
from .serializers import StudentApplicationSerializer, MentorSerializer, UserSerializer

# ---------------------------
# User Registration
# ---------------------------
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        }, status=status.HTTP_201_CREATED)


# ---------------------------
# User Login
# ---------------------------
class LoginView(generics.GenericAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        username = request.data.get('username')
        password = request.data.get('password')

        user = authenticate(username=username, password=password)
        if user is None:
            return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

        refresh = RefreshToken.for_user(user)
        return Response({
            "username": user.username,
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        })


# ---------------------------
# Current User Endpoint
# ---------------------------
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def current_user(request):
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


# ---------------------------
# Mentor Management (Admin Only)
# ---------------------------
class MentorViewSet(viewsets.ModelViewSet):
    queryset = Mentor.objects.all()
    serializer_class = MentorSerializer
    permission_classes = [permissions.IsAdminUser]
    authentication_classes = [JWTAuthentication]


# ---------------------------
# Student Application Management
# ---------------------------
class StudentApplicationViewSet(viewsets.ModelViewSet):
    """
    - list/retrieve/create: authenticated users (students see their own, mentors see assigned, admins see all)
    - update / partial_update / destroy: admin only (keeps it simple)
    - assign_mentor: admin only
    - update_status: authenticated but further validated inside method (only assigned mentor or admin)
    """
    queryset = StudentApplication.objects.all()
    serializer_class = StudentApplicationSerializer
    authentication_classes = [JWTAuthentication]

    def get_permissions(self):
        # If the action has been decorated with permission_classes, DRF leaves those to be checked first.
        # We'll fallback to sensible defaults for the others:
        if self.action in ['list', 'retrieve', 'create']:
            return [permissions.IsAuthenticated()]
        # update/partial_update/destroy -> admins only for simplicity
        if self.action in ['update', 'partial_update', 'destroy']:
            return [permissions.IsAdminUser()]
        # For custom actions (assign_mentor/update_status) @action decorator sets permission_classes.
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return StudentApplication.objects.all()
        if hasattr(user, 'mentor_profile'):
            return StudentApplication.objects.filter(mentor=user.mentor_profile)
        return StudentApplication.objects.filter(user=user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        user = request.user
        # Students should not edit after submission unless Rejected
        if user == instance.user and instance.status != "Rejected":
            return Response({"error": "You cannot edit your application after submission."}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def assign_mentor(self, request, pk=None):
        application = self.get_object()
        mentor_id = request.data.get('mentor_id')
        mentor = Mentor.objects.filter(id=mentor_id).first()
        if not mentor:
            return Response({"error": "Mentor not found"}, status=status.HTTP_404_NOT_FOUND)

        application.mentor = mentor
        application.status = "Under Review"
        application.save()
        return Response({"success": f"Mentor {mentor.user.username} assigned successfully."})

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def update_status(self, request, pk=None):
        """
        Only allow:
         - Admins (user.is_staff)
         - The assigned mentor (user.mentor_profile and matches application.mentor)
        """
        application = self.get_object()
        user = request.user

        # Debug print (remove later) — shows if request arrived with proper user.
        print("Logged user in update_status:", user, "is_authenticated:", user.is_authenticated)

        # Check user is admin or mentor
        mentor_profile = getattr(user, "mentor_profile", None)
        if not mentor_profile and not user.is_staff:
            # This will return 403 with JSON we control
            return Response({"detail": "Only assigned mentors or admins can change status."}, status=status.HTTP_403_FORBIDDEN)

        # If mentor, ensure they are the assigned mentor for this application
        if mentor_profile and application.mentor != mentor_profile:
            return Response({"detail": "You are not assigned to this student."}, status=status.HTTP_403_FORBIDDEN)

        status_choice = request.data.get('status')
        feedback = request.data.get('feedback', '')
        consultation_date = request.data.get('consultation_date', None)

        if status_choice not in dict(application.STATUS_CHOICES):
            return Response({"error": "Invalid status choice."}, status=status.HTTP_400_BAD_REQUEST)

        application.status = status_choice
        application.feedback = feedback
        if consultation_date:
            application.consultation_date = consultation_date
        application.save()

        return Response({"success": f"Application status updated to '{status_choice}'."})
