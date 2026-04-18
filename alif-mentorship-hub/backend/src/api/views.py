from django.utils import timezone
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User, MentorProfile, Session, Review, Resource
from .serializers import (
    RegisterSerializer, MentorProfileSerializer, MentorProfileUpdateSerializer,
    SessionSerializer, SessionDetailSerializer, ReviewSerializer, ResourceSerializer,
)
from .permissions import IsStudent, IsMentor, IsAdmin


# ─────────────────────────────────────────────
# Auth
# ─────────────────────────────────────────────
class RegisterView(generics.CreateAPIView):
    queryset           = User.objects.all()
    serializer_class   = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'access':   str(refresh.access_token),
            'refresh':  str(refresh),
            'user_id':  user.id,
            'username': user.username,
            'role':     user.role,
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username', '').strip()
        password = request.data.get('password', '')

        if not username or not password:
            return Response(
                {'error': 'Username and password are required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response(
                {'error': 'Invalid credentials.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if not user.check_password(password):
            return Response(
                {'error': 'Invalid credentials.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if not user.is_active:
            return Response(
                {'error': 'This account is disabled.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        refresh = RefreshToken.for_user(user)
        return Response({
            'access':   str(refresh.access_token),
            'refresh':  str(refresh),
            'user_id':  user.id,
            'username': user.username,
            'role':     user.role,
        })


# ─────────────────────────────────────────────
# Mentor Profiles — Public
# ─────────────────────────────────────────────
class MentorListView(generics.ListAPIView):
    """Public — returns all verified mentors. Supports ?field= and ?university= filters."""
    serializer_class   = MentorProfileSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        qs = MentorProfile.objects.filter(is_verified=True).select_related('user').order_by('-id')
        field      = self.request.query_params.get('field')
        university = self.request.query_params.get('university')
        if field:
            qs = qs.filter(field_of_study__icontains=field)
        if university:
            qs = qs.filter(university__icontains=university)
        return qs


class MentorDetailView(generics.RetrieveAPIView):
    """Public — single verified mentor profile."""
    serializer_class   = MentorProfileSerializer
    permission_classes = [AllowAny]
    queryset           = MentorProfile.objects.filter(is_verified=True).select_related('user')


class MentorMeView(APIView):
    """Mentor only — GET or PATCH their own profile."""
    permission_classes = [IsMentor]

    def get(self, request):
        try:
            profile = request.user.mentor_profile
        except MentorProfile.DoesNotExist:
            return Response({'error': 'Mentor profile not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(MentorProfileSerializer(profile).data)

    def patch(self, request):
        try:
            profile = request.user.mentor_profile
        except MentorProfile.DoesNotExist:
            return Response({'error': 'Mentor profile not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = MentorProfileUpdateSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(MentorProfileSerializer(profile).data)


# ─────────────────────────────────────────────
# Mentor Reviews — Public
# ─────────────────────────────────────────────
class MentorReviewListView(generics.ListAPIView):
    """Public — all reviews for a specific mentor."""
    serializer_class   = ReviewSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        mentor_profile_id = self.kwargs['pk']
        return (
            Review.objects
            .filter(session__mentor__mentor_profile__id=mentor_profile_id)
            .select_related('session__student')
            .order_by('-created_at')
        )


# ─────────────────────────────────────────────
# Admin — Mentor Verification
# ─────────────────────────────────────────────
class AdminMentorVerifyView(APIView):
    """Admin only — verify a mentor profile."""
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        try:
            profile = MentorProfile.objects.get(pk=pk)
        except MentorProfile.DoesNotExist:
            return Response({'error': 'Mentor profile not found.'}, status=status.HTTP_404_NOT_FOUND)
        profile.is_verified = True
        profile.save(update_fields=['is_verified'])
        return Response({'detail': 'Mentor verified successfully.'})


class AdminMentorRejectView(APIView):
    """Admin only — reject and delete a mentor profile, reset user role to student."""
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        try:
            profile = MentorProfile.objects.get(pk=pk)
        except MentorProfile.DoesNotExist:
            return Response({'error': 'Mentor profile not found.'}, status=status.HTTP_404_NOT_FOUND)
        user = profile.user
        profile.delete()
        user.role = 'student'
        user.save(update_fields=['role'])
        return Response({'detail': 'Mentor profile rejected and removed.'})


# ─────────────────────────────────────────────
# Admin — Unverified Mentor List
# ─────────────────────────────────────────────
class AdminMentorListView(generics.ListAPIView):
    """Admin only — list all mentor profiles (verified and unverified)."""
    serializer_class   = MentorProfileSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        return MentorProfile.objects.select_related('user').order_by('-id')


# ─────────────────────────────────────────────
# Sessions
# ─────────────────────────────────────────────

# Valid status transitions — terminal states have no outgoing transitions
VALID_TRANSITIONS = {
    'pending':   ['accepted', 'declined', 'cancelled'],
    'accepted':  ['completed', 'cancelled'],
    'declined':  [],
    'completed': [],
    'cancelled': [],
}


class SessionListCreateView(generics.ListCreateAPIView):
    """
    GET  — scoped by role (student/mentor/admin). Supports ?status= filter.
    POST — student only. Creates a pending session.
    """
    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsStudent()]
        return [IsAuthenticated()]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return SessionSerializer
        return SessionDetailSerializer

    def get_queryset(self):
        user = self.request.user
        qs = Session.objects.select_related('student', 'mentor').order_by('-created_at')

        if user.role == 'student':
            qs = qs.filter(student=user)
        elif user.role == 'mentor':
            qs = qs.filter(mentor=user)
        # admin sees all

        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs

    def perform_create(self, serializer):
        serializer.save(student=self.request.user)


class SessionDetailView(generics.RetrieveUpdateAPIView):
    """Detail + patch — accessible by the student or mentor involved, or admin.
    Mentor can PATCH mentor_notes on completed sessions."""
    serializer_class   = SessionDetailSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs   = Session.objects.select_related('student', 'mentor')
        if user.role == 'student':
            return qs.filter(student=user)
        if user.role == 'mentor':
            return qs.filter(mentor=user)
        return qs.all()

    def partial_update(self, request, *args, **kwargs):
        session = self.get_object()
        # Mentor can only patch mentor_notes, and only on completed sessions
        if request.user.role == 'mentor':
            if session.status != 'completed':
                from rest_framework.response import Response
                from rest_framework import status
                return Response(
                    {'error': 'Notes can only be added to completed sessions.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            allowed = {k: v for k, v in request.data.items() if k == 'mentor_notes'}
            serializer = self.get_serializer(session, data=allowed, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)
        return super().partial_update(request, *args, **kwargs)


class SessionAcceptView(APIView):
    """Mentor only — accept a pending session. Requires meet_link."""
    permission_classes = [IsMentor]

    def post(self, request, pk):
        session = self._get_session(request.user, pk)
        if session is None:
            return Response({'error': 'Session not found.'}, status=status.HTTP_404_NOT_FOUND)

        if 'accepted' not in VALID_TRANSITIONS.get(session.status, []):
            return Response(
                {'error': f"Cannot accept a session with status '{session.status}'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        meet_link = request.data.get('meet_link', '').strip()
        if not meet_link:
            return Response(
                {'error': 'meet_link is required when accepting a session.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        session.status    = 'accepted'
        session.meet_link = meet_link
        session.save(update_fields=['status', 'meet_link'])
        return Response(SessionDetailSerializer(session).data)

    def _get_session(self, mentor_user, pk):
        try:
            return Session.objects.get(pk=pk, mentor=mentor_user)
        except Session.DoesNotExist:
            return None


class SessionDeclineView(APIView):
    """Mentor only — decline a pending session."""
    permission_classes = [IsMentor]

    def post(self, request, pk):
        try:
            session = Session.objects.get(pk=pk, mentor=request.user)
        except Session.DoesNotExist:
            return Response({'error': 'Session not found.'}, status=status.HTTP_404_NOT_FOUND)

        if 'declined' not in VALID_TRANSITIONS.get(session.status, []):
            return Response(
                {'error': f"Cannot decline a session with status '{session.status}'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        session.status = 'declined'
        session.save(update_fields=['status'])
        return Response(SessionDetailSerializer(session).data)


class SessionCompleteView(APIView):
    """Mentor only — mark an accepted session as completed."""
    permission_classes = [IsMentor]

    def post(self, request, pk):
        try:
            session = Session.objects.get(pk=pk, mentor=request.user)
        except Session.DoesNotExist:
            return Response({'error': 'Session not found.'}, status=status.HTTP_404_NOT_FOUND)

        if 'completed' not in VALID_TRANSITIONS.get(session.status, []):
            return Response(
                {'error': f"Cannot complete a session with status '{session.status}'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Mentor can optionally add notes when completing
        notes = request.data.get('mentor_notes', '').strip()
        session.status = 'completed'
        if notes:
            session.mentor_notes = notes
        session.save(update_fields=['status', 'mentor_notes'])
        return Response(SessionDetailSerializer(session).data)


class SessionCancelView(APIView):
    """Student only — cancel a pending session."""
    permission_classes = [IsStudent]

    def post(self, request, pk):
        try:
            session = Session.objects.get(pk=pk, student=request.user)
        except Session.DoesNotExist:
            return Response({'error': 'Session not found.'}, status=status.HTTP_404_NOT_FOUND)

        if session.status != 'pending':
            return Response(
                {'error': 'Only pending sessions can be cancelled.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        session.status = 'cancelled'
        session.save(update_fields=['status'])
        return Response(SessionDetailSerializer(session).data)


# ─────────────────────────────────────────────
# Reviews
# ─────────────────────────────────────────────
class SessionReviewView(APIView):
    """Student only — post a review for a completed session."""
    permission_classes = [IsStudent]

    def post(self, request, pk):
        try:
            session = Session.objects.get(pk=pk, student=request.user)
        except Session.DoesNotExist:
            return Response({'error': 'Session not found.'}, status=status.HTTP_404_NOT_FOUND)

        if session.status != 'completed':
            return Response(
                {'error': 'You can only review a completed session.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if hasattr(session, 'review'):
            return Response(
                {'error': 'You have already reviewed this session.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = ReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        # Save triggers the post_save signal in models.py which updates average_rating
        serializer.save(session=session)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


# ─────────────────────────────────────────────
# Resources
# ─────────────────────────────────────────────
class ResourceListCreateView(generics.ListCreateAPIView):
    """
    GET  — public. Supports ?category= filter.
    POST — admin only.
    """
    serializer_class = ResourceSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdmin()]
        return [AllowAny()]

    def get_queryset(self):
        qs       = Resource.objects.select_related('author').order_by('-published_at')
        category = self.request.query_params.get('category')
        if category:
            qs = qs.filter(category=category)
        return qs

    def perform_create(self, serializer):
        serializer.save(author=self.request.user, published_at=timezone.now())


class ResourceDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    — public.
    PATCH  — admin only.
    DELETE — admin only.
    """
    serializer_class = ResourceSerializer
    queryset         = Resource.objects.select_related('author')

    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAdmin()]


# ─────────────────────────────────────────────
# Admin Stats
# ─────────────────────────────────────────────
class AdminStatsView(APIView):
    """Admin only — platform-wide statistics."""
    permission_classes = [IsAdmin]

    def get(self, request):
        now        = timezone.now()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        all_reviews = Review.objects.all()
        avg_rating  = (
            sum(r.rating for r in all_reviews) / all_reviews.count()
            if all_reviews.count() > 0 else 0.0
        )

        return Response({
            'total_students':          User.objects.filter(role='student').count(),
            'total_verified_mentors':  MentorProfile.objects.filter(is_verified=True).count(),
            'total_sessions':          Session.objects.count(),
            'sessions_this_month':     Session.objects.filter(created_at__gte=month_start).count(),
            'completed_sessions':      Session.objects.filter(status='completed').count(),
            'average_platform_rating': round(avg_rating, 2),
        })
