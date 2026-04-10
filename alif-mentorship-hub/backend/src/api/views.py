from rest_framework import viewsets, permissions, status, generics
from rest_framework.response import Response
from rest_framework.decorators import action, api_view, permission_classes
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.authentication import JWTAuthentication
from .models import StudentApplication, Mentor, MentorshipSession, CareerPath, StudentGoal
from .serializers import (
    StudentApplicationSerializer, MentorSerializer, UserSerializer,
    MentorshipSessionSerializer, CareerPathSerializer, StudentGoalSerializer
)

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
# Role Helper
# ---------------------------
def get_user_role(user):
    if user.is_staff:
        return "admin"
    if hasattr(user, "mentor_profile"):
        return "mentor"
    return "student"


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
            "role": get_user_role(user),
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
# Career Path (Admin writes, everyone reads)
# ---------------------------
class CareerPathViewSet(viewsets.ModelViewSet):
    queryset = CareerPath.objects.all()
    serializer_class = CareerPathSerializer
    authentication_classes = [JWTAuthentication]

    def get_permissions(self):
        # Anyone authenticated can list/retrieve
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        # Only admin can create/update/delete
        return [permissions.IsAdminUser()]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


# ---------------------------
# Student Goal
# ---------------------------
class StudentGoalViewSet(viewsets.ModelViewSet):
    serializer_class = StudentGoalSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None  # student has exactly one goal

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return StudentGoal.objects.select_related('student', 'career_path').all()
        if hasattr(user, 'mentor_profile'):
            assigned_student_ids = StudentApplication.objects.filter(
                mentor=user.mentor_profile
            ).values_list('user_id', flat=True)
            return StudentGoal.objects.select_related(
                'student', 'career_path'
            ).filter(student_id__in=assigned_student_ids)
        return StudentGoal.objects.select_related('student', 'career_path').filter(student=user)

    def create(self, request, *args, **kwargs):
        mentor_profile = getattr(request.user, 'mentor_profile', None)
        is_admin = request.user.is_staff

        # Determine which student this goal is for
        student_id = request.data.get('student_id')

        if mentor_profile or is_admin:
            # Mentor/admin must supply student_id
            if not student_id:
                return Response(
                    {"error": "student_id is required."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            try:
                student = User.objects.get(pk=student_id)
            except User.DoesNotExist:
                return Response({"error": "Student not found."}, status=status.HTTP_404_NOT_FOUND)

            # Mentor can only set goals for their assigned students
            if mentor_profile:
                is_assigned = StudentApplication.objects.filter(
                    user=student, mentor=mentor_profile
                ).exists()
                if not is_assigned:
                    return Response(
                        {"detail": "You are not assigned to this student."},
                        status=status.HTTP_403_FORBIDDEN
                    )
        else:
            # Student sets their own goal
            student = request.user

        # Upsert — update if goal already exists, create if not
        goal, created = StudentGoal.objects.update_or_create(
            student=student,
            defaults={
                'career_path_id': request.data.get('career_path_id'),
                'status': request.data.get('status', 'Exploring'),
                'mentor_notes': request.data.get('mentor_notes', ''),
            }
        )
        serializer = self.get_serializer(goal)
        http_status = status.HTTP_201_CREATED if created else status.HTTP_200_OK
        return Response(serializer.data, status=http_status)

    def update(self, request, *args, **kwargs):
        goal = self.get_object()
        mentor_profile = getattr(request.user, 'mentor_profile', None)

        # Mentor can only update goals of their assigned students
        if mentor_profile:
            is_assigned = StudentApplication.objects.filter(
                user=goal.student, mentor=mentor_profile
            ).exists()
            if not is_assigned:
                return Response(
                    {"detail": "You are not assigned to this student."},
                    status=status.HTTP_403_FORBIDDEN
                )
        return super().update(request, *args, **kwargs)


# ---------------------------
# Mentorship Session Management
# ---------------------------
class MentorshipSessionViewSet(viewsets.ModelViewSet):
    """
    - Mentor: create sessions for their assigned students, update notes/outcome
    - Student: read-only, sees only sessions linked to their application
    - Admin: full access
    """
    serializer_class = MentorshipSessionSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None  # already scoped per user — no pagination needed

    def get_queryset(self):
        user = self.request.user
        qs = MentorshipSession.objects.select_related('application__user', 'mentor__user')
        if user.is_staff:
            return qs.all()
        if hasattr(user, 'mentor_profile'):
            return qs.filter(mentor=user.mentor_profile)
        if hasattr(user, 'application'):
            return qs.filter(application=user.application)
        return MentorshipSession.objects.none()

    def create(self, request, *args, **kwargs):
        mentor_profile = getattr(request.user, 'mentor_profile', None)
        if not mentor_profile and not request.user.is_staff:
            return Response(
                {"detail": "Only mentors or admins can create sessions."},
                status=status.HTTP_403_FORBIDDEN
            )

        application_id = request.data.get('application_id')
        try:
            application = StudentApplication.objects.get(pk=application_id)
        except StudentApplication.DoesNotExist:
            return Response({"error": "Application not found."}, status=status.HTTP_404_NOT_FOUND)

        # Mentor can only create sessions for their assigned student
        if mentor_profile and application.mentor != mentor_profile:
            return Response(
                {"detail": "You are not assigned to this student."},
                status=status.HTTP_403_FORBIDDEN
            )

        # Application must be approved before sessions can be created
        if application.status != 'Approved':
            return Response(
                {"detail": "Sessions can only be created for approved applications."},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(
            application=application,
            mentor=mentor_profile or application.mentor
        )
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        session = self.get_object()
        mentor_profile = getattr(request.user, 'mentor_profile', None)
        # Only the session's mentor or admin can update
        if mentor_profile and session.mentor != mentor_profile:
            return Response(
                {"detail": "You can only update your own sessions."},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)


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
    pagination_class = None  # scoped per user — student always has 1, mentor has few

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
        qs = StudentApplication.objects.select_related('user', 'mentor__user')
        if user.is_staff:
            return qs.all()
        if hasattr(user, 'mentor_profile'):
            return qs.filter(mentor=user.mentor_profile)
        return qs.filter(user=user)

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
