from django.db.models import Q
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User, MentorProfile, Session, Review, StudentFeedback, Resource, Report, AuditLog, PlatformSettings, AdminNotificationSettings
from .serializers import (
    RegisterSerializer, MentorProfileSerializer, MentorProfileUpdateSerializer,
    SessionSerializer, SessionDetailSerializer, ReviewSerializer, StudentFeedbackSerializer, ResourceSerializer,
    AdminMeSerializer, PlatformSettingsSerializer, AdminNotificationSettingsSerializer,
    AdminUserListSerializer, AdminUserDetailSerializer,
    ReportSerializer, AdminReportSerializer,
    AuditLogSerializer,
)
from .permissions import IsStudent, IsMentor, IsAdmin
from .audit import create_audit_log
from .email import (
    send_session_request_notification,
    send_session_accepted_notification,
    send_session_declined_notification,
    send_session_completed_notification,
    send_mentor_verified_notification,
    send_report_resolved_notification,
    send_session_cancelled_notification,
)


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

        if user.is_suspended:
            return Response(
                {'error': 'Your account has been suspended. Contact support.'},
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
    serializer_class   = MentorProfileSerializer
    permission_classes = [AllowAny]
    queryset           = MentorProfile.objects.filter(is_verified=True).select_related('user')


class MentorMeView(APIView):
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
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        try:
            profile = MentorProfile.objects.get(pk=pk)
        except MentorProfile.DoesNotExist:
            return Response({'error': 'Mentor profile not found.'}, status=status.HTTP_404_NOT_FOUND)
        profile.is_verified = True
        profile.save(update_fields=['is_verified'])
        create_audit_log(
            admin=request.user,
            action='verify_mentor',
            target_user=profile.user,
            detail=f"Verified mentor {profile.user.username}"
        )
        send_mentor_verified_notification(profile)
        return Response({'detail': 'Mentor verified successfully.'})


class AdminMentorRejectView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        try:
            profile = MentorProfile.objects.get(pk=pk)
        except MentorProfile.DoesNotExist:
            return Response({'error': 'Mentor profile not found.'}, status=status.HTTP_404_NOT_FOUND)
        user = profile.user
        username = user.username
        profile.delete()
        user.role = 'student'
        user.save(update_fields=['role'])
        create_audit_log(
            admin=request.user,
            action='reject_mentor',
            target_user=user,
            detail=f"Rejected mentor {username}"
        )
        return Response({'detail': 'Mentor profile rejected and removed.'})


class AdminMentorListView(generics.ListAPIView):
    serializer_class   = MentorProfileSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        return MentorProfile.objects.select_related('user').order_by('-id')


# ─────────────────────────────────────────────
# Sessions
# ─────────────────────────────────────────────
VALID_TRANSITIONS = {
    'pending':   ['accepted', 'declined', 'cancelled'],
    'accepted':  ['completed', 'cancelled'],
    'declined':  [],
    'completed': [],
    'cancelled': [],
}


class SessionListCreateView(generics.ListCreateAPIView):
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
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs

    def perform_create(self, serializer):
        session = serializer.save(student=self.request.user)
        send_session_request_notification(session)


class SessionDetailView(generics.RetrieveUpdateAPIView):
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
        if request.user.role == 'mentor':
            if session.status != 'completed':
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
    permission_classes = [IsMentor]

    def post(self, request, pk):
        try:
            session = Session.objects.get(pk=pk, mentor=request.user)
        except Session.DoesNotExist:
            return Response({'error': 'Session not found.'}, status=status.HTTP_404_NOT_FOUND)
        if 'accepted' not in VALID_TRANSITIONS.get(session.status, []):
            return Response({'error': f"Cannot accept a session with status '{session.status}'."}, status=status.HTTP_400_BAD_REQUEST)
        meet_link = request.data.get('meet_link', '').strip()
        if not meet_link:
            return Response({'error': 'meet_link is required when accepting a session.'}, status=status.HTTP_400_BAD_REQUEST)
        session.status    = 'accepted'
        session.meet_link = meet_link
        session.save(update_fields=['status', 'meet_link'])
        send_session_accepted_notification(session)
        return Response(SessionDetailSerializer(session).data)


class SessionDeclineView(APIView):
    permission_classes = [IsMentor]

    def post(self, request, pk):
        try:
            session = Session.objects.get(pk=pk, mentor=request.user)
        except Session.DoesNotExist:
            return Response({'error': 'Session not found.'}, status=status.HTTP_404_NOT_FOUND)
        if 'declined' not in VALID_TRANSITIONS.get(session.status, []):
            return Response({'error': f"Cannot decline a session with status '{session.status}'."}, status=status.HTTP_400_BAD_REQUEST)
        session.status = 'declined'
        session.save(update_fields=['status'])
        send_session_declined_notification(session)
        return Response(SessionDetailSerializer(session).data)


class SessionCompleteView(APIView):
    permission_classes = [IsMentor]

    def post(self, request, pk):
        try:
            session = Session.objects.get(pk=pk, mentor=request.user)
        except Session.DoesNotExist:
            return Response({'error': 'Session not found.'}, status=status.HTTP_404_NOT_FOUND)
        if 'completed' not in VALID_TRANSITIONS.get(session.status, []):
            return Response({'error': f"Cannot complete a session with status '{session.status}'."}, status=status.HTTP_400_BAD_REQUEST)
        notes = request.data.get('mentor_notes', '').strip()
        session.status = 'completed'
        if notes:
            session.mentor_notes = notes
        session.save(update_fields=['status', 'mentor_notes'])
        send_session_completed_notification(session)
        return Response(SessionDetailSerializer(session).data)


class SessionCancelView(APIView):
    permission_classes = [IsStudent]

    def post(self, request, pk):
        try:
            session = Session.objects.get(pk=pk, student=request.user)
        except Session.DoesNotExist:
            return Response({'error': 'Session not found.'}, status=status.HTTP_404_NOT_FOUND)
        if session.status != 'pending':
            return Response({'error': 'Only pending sessions can be cancelled.'}, status=status.HTTP_400_BAD_REQUEST)
        session.status = 'cancelled'
        session.save(update_fields=['status'])
        send_session_cancelled_notification(session, request.user)
        return Response(SessionDetailSerializer(session).data)


# ─────────────────────────────────────────────
# Reviews
# ─────────────────────────────────────────────
class SessionReviewView(APIView):
    permission_classes = [IsStudent]

    def post(self, request, pk):
        try:
            session = Session.objects.get(pk=pk, student=request.user)
        except Session.DoesNotExist:
            return Response({'error': 'Session not found.'}, status=status.HTTP_404_NOT_FOUND)
        if session.status != 'completed':
            return Response({'error': 'You can only review a completed session.'}, status=status.HTTP_400_BAD_REQUEST)
        if hasattr(session, 'review'):
            return Response({'error': 'You have already reviewed this session.'}, status=status.HTTP_400_BAD_REQUEST)
        serializer = ReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(session=session)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


# ─────────────────────────────────────────────
# Student Feedback (Mentor → Student)
# ─────────────────────────────────────────────
class SessionFeedbackView(APIView):
    permission_classes = [IsMentor]

    def post(self, request, pk):
        try:
            session = Session.objects.get(pk=pk, mentor=request.user)
        except Session.DoesNotExist:
            return Response({'error': 'Session not found.'}, status=status.HTTP_404_NOT_FOUND)
        if session.status != 'completed':
            return Response({'error': 'You can only provide feedback for a completed session.'}, status=status.HTTP_400_BAD_REQUEST)
        if hasattr(session, 'student_feedback'):
            return Response({'error': 'You have already provided feedback for this session.'}, status=status.HTTP_400_BAD_REQUEST)
        serializer = StudentFeedbackSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(session=session)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


# ─────────────────────────────────────────────
# Reports
# ─────────────────────────────────────────────
class SessionReportView(APIView):
    permission_classes = [IsStudent]

    def post(self, request, pk):
        try:
            session = Session.objects.get(pk=pk, student=request.user)
        except Session.DoesNotExist:
            return Response({'error': 'Session not found.'}, status=status.HTTP_404_NOT_FOUND)
        
        if session.status != 'completed':
            return Response({'error': 'You can only report a completed session.'}, status=status.HTTP_400_BAD_REQUEST)
        
        if hasattr(session, 'report'):
            return Response({'error': 'You have already reported this session.'}, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = ReportSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(
            reporter=request.user,
            reported_user=session.mentor,
            session=session
        )
        return Response({'detail': 'Report submitted successfully.'}, status=status.HTTP_201_CREATED)


class AdminReportListView(generics.ListAPIView):
    serializer_class   = AdminReportSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        qs = Report.objects.select_related('reporter', 'reported_user', 'session', 'resolved_by').order_by('-created_at')
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs


class AdminReportResolveView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        try:
            report = Report.objects.get(pk=pk)
        except Report.DoesNotExist:
            return Response({'error': 'Report not found.'}, status=status.HTTP_404_NOT_FOUND)
        
        admin_note = request.data.get('admin_note', '').strip()
        if not admin_note or len(admin_note) < 10:
            return Response({'error': 'Admin note is required and must be at least 10 characters.'}, status=status.HTTP_400_BAD_REQUEST)
        
        report.status = 'resolved'
        report.admin_note = admin_note
        report.resolved_at = timezone.now()
        report.resolved_by = request.user
        report.save(update_fields=['status', 'admin_note', 'resolved_at', 'resolved_by'])
        create_audit_log(
            admin=request.user,
            action='resolve_report',
            target_id=report.id,
            detail=f"Resolved report #{report.id} against {report.reported_user.username}"
        )
        send_report_resolved_notification(report)
        return Response(AdminReportSerializer(report).data)


class AdminReportDismissView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        try:
            report = Report.objects.get(pk=pk)
        except Report.DoesNotExist:
            return Response({'error': 'Report not found.'}, status=status.HTTP_404_NOT_FOUND)
        
        admin_note = request.data.get('admin_note', '').strip()
        if not admin_note or len(admin_note) < 10:
            return Response({'error': 'Admin note is required and must be at least 10 characters.'}, status=status.HTTP_400_BAD_REQUEST)
        
        report.status = 'dismissed'
        report.admin_note = admin_note
        report.resolved_at = timezone.now()
        report.resolved_by = request.user
        report.save(update_fields=['status', 'admin_note', 'resolved_at', 'resolved_by'])
        create_audit_log(
            admin=request.user,
            action='dismiss_report',
            target_id=report.id,
            detail=f"Dismissed report #{report.id} against {report.reported_user.username}"
        )
        return Response(AdminReportSerializer(report).data)


# ─────────────────────────────────────────────
# Resources
# ─────────────────────────────────────────────
class ResourceListCreateView(generics.ListCreateAPIView):
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
        resource = serializer.save(author=self.request.user, published_at=timezone.now())
        create_audit_log(
            admin=self.request.user,
            action='publish_resource',
            target_id=resource.id,
            detail=f"Published resource: {resource.title}"
        )


class ResourceDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ResourceSerializer
    queryset         = Resource.objects.select_related('author')

    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAdmin()]

    def perform_update(self, serializer):
        resource = serializer.save()
        create_audit_log(
            admin=self.request.user,
            action='edit_resource',
            target_id=resource.id,
            detail=f"Edited resource: {resource.title}"
        )

    def perform_destroy(self, instance):
        title = instance.title
        resource_id = instance.id
        instance.delete()
        create_audit_log(
            admin=self.request.user,
            action='delete_resource',
            target_id=resource_id,
            detail=f"Deleted resource: {title}"
        )


# ─────────────────────────────────────────────
# Admin Me
# ─────────────────────────────────────────────
class AdminMeView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        return Response(AdminMeSerializer(request.user).data)

    def patch(self, request):
        serializer = AdminMeSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(AdminMeSerializer(request.user).data)


# ─────────────────────────────────────────────
# Admin Platform Settings
# ─────────────────────────────────────────────
class AdminPlatformSettingsView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        return Response(PlatformSettingsSerializer(PlatformSettings.get_solo()).data)

    def patch(self, request):
        settings = PlatformSettings.get_solo()
        serializer = PlatformSettingsSerializer(settings, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        create_audit_log(
            admin=request.user,
            action='update_platform_settings',
            detail="Updated platform settings"
        )
        return Response(PlatformSettingsSerializer(settings).data)


# ─────────────────────────────────────────────
# Admin Notification Settings
# ─────────────────────────────────────────────
class AdminNotificationSettingsView(APIView):
    permission_classes = [IsAdmin]

    def _get_or_create(self, user):
        obj, _ = AdminNotificationSettings.objects.get_or_create(admin=user)
        return obj

    def get(self, request):
        return Response(AdminNotificationSettingsSerializer(self._get_or_create(request.user)).data)

    def patch(self, request):
        ns = self._get_or_create(request.user)
        serializer = AdminNotificationSettingsSerializer(ns, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(AdminNotificationSettingsSerializer(ns).data)


# ─────────────────────────────────────────────
# Admin Stats
# ─────────────────────────────────────────────
class AdminStatsView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        now         = timezone.now()
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


# ─────────────────────────────────────────────
# Admin Session Management
# ─────────────────────────────────────────────
class AdminSessionListView(generics.ListAPIView):
    serializer_class   = SessionDetailSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        qs = Session.objects.select_related('student', 'mentor').order_by('-created_at')
        
        # Status filter
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        
        # Search by student or mentor username
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(
                Q(student__username__icontains=search) | 
                Q(mentor__username__icontains=search)
            )
        
        # Date range filter
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        if date_from:
            try:
                from_date = timezone.datetime.fromisoformat(date_from.replace('Z', '+00:00'))
                qs = qs.filter(requested_time__gte=from_date)
            except ValueError:
                pass
        if date_to:
            try:
                to_date = timezone.datetime.fromisoformat(date_to.replace('Z', '+00:00'))
                qs = qs.filter(requested_time__lte=to_date)
            except ValueError:
                pass
        
        return qs


class AdminSessionCancelView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        try:
            session = Session.objects.get(pk=pk)
        except Session.DoesNotExist:
            return Response({'error': 'Session not found.'}, status=status.HTTP_404_NOT_FOUND)
        
        if session.status not in ['pending', 'accepted']:
            return Response(
                {'error': f'This session cannot be cancelled because it is already {session.status}.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        session.status = 'cancelled'
        session.save(update_fields=['status'])
        create_audit_log(
            admin=request.user,
            action='cancel_session',
            target_id=session.id,
            detail=f"Cancelled session #{session.id} between {session.student.username} and {session.mentor.username}"
        )
        send_session_cancelled_notification(session, request.user)
        return Response(SessionDetailSerializer(session).data)


# ─────────────────────────────────────────────
# Admin User Management
# ─────────────────────────────────────────────
class AdminUserListView(generics.ListAPIView):
    serializer_class   = AdminUserListSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        qs     = User.objects.order_by('-date_joined')
        role   = self.request.query_params.get('role')
        search = self.request.query_params.get('search')
        st     = self.request.query_params.get('status')
        if role:
            qs = qs.filter(role=role)
        if search:
            qs = qs.filter(Q(username__icontains=search) | Q(email__icontains=search))
        if st == 'active':
            qs = qs.filter(is_active=True, is_suspended=False, is_deactivated=False)
        elif st == 'suspended':
            qs = qs.filter(is_suspended=True)
        elif st == 'deactivated':
            qs = qs.filter(is_deactivated=True)
        return qs


class AdminUserDetailView(generics.RetrieveAPIView):
    serializer_class   = AdminUserDetailSerializer
    permission_classes = [IsAdmin]
    queryset           = User.objects.all()


class AdminUserSuspendView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
        user.is_suspended = True
        user.save(update_fields=['is_suspended'])
        create_audit_log(
            admin=request.user,
            action='suspend_user',
            target_user=user,
            detail=f"Suspended user {user.username}"
        )
        return Response({'is_suspended': True, 'is_deactivated': user.is_deactivated})


class AdminUserUnsuspendView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
        user.is_suspended = False
        user.save(update_fields=['is_suspended'])
        create_audit_log(
            admin=request.user,
            action='unsuspend_user',
            target_user=user,
            detail=f"Unsuspended user {user.username}"
        )
        return Response({'is_suspended': False, 'is_deactivated': user.is_deactivated})


class AdminUserDeactivateView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
        user.is_deactivated = True
        user.is_active      = False
        user.save(update_fields=['is_deactivated', 'is_active'])
        create_audit_log(
            admin=request.user,
            action='deactivate_user',
            target_user=user,
            detail=f"Deactivated user {user.username}"
        )
        return Response({'is_suspended': user.is_suspended, 'is_deactivated': True})



# ─────────────────────────────────────────────
# Admin Audit Log
# ─────────────────────────────────────────────
class AdminAuditLogView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        qs = AuditLog.objects.select_related('admin', 'target_user').order_by('-created_at')
        
        # Action filter
        action_filter = request.query_params.get('action')
        if action_filter:
            qs = qs.filter(action=action_filter)
        
        # Admin filter
        admin_id = request.query_params.get('admin_id')
        if admin_id:
            qs = qs.filter(admin_id=admin_id)
        
        # Date range filter
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        if date_from:
            try:
                from_date = timezone.datetime.fromisoformat(date_from.replace('Z', '+00:00'))
                qs = qs.filter(created_at__gte=from_date)
            except ValueError:
                pass
        if date_to:
            try:
                to_date = timezone.datetime.fromisoformat(date_to.replace('Z', '+00:00'))
                qs = qs.filter(created_at__lte=to_date)
            except ValueError:
                pass
        
        # Pagination
        page_size = 50
        page = int(request.query_params.get('page', 1))
        start = (page - 1) * page_size
        end = start + page_size
        
        total_count = qs.count()
        total_pages = (total_count + page_size - 1) // page_size
        
        results = qs[start:end]
        serializer = AuditLogSerializer(results, many=True)
        
        return Response({
            'results': serializer.data,
            'count': total_count,
            'page': page,
            'total_pages': total_pages,
            'has_next': page < total_pages,
            'has_previous': page > 1,
        })
