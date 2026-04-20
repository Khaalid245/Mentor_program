import logging
from django.db.models import Q, Count, Avg, Prefetch
from django.utils import timezone
from django.db import transaction
from django.core.cache import cache
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.throttling import UserRateThrottle, AnonRateThrottle
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User, MentorProfile, Session, Review, StudentFeedback, Resource, Report, AuditLog, PlatformSettings, AdminNotificationSettings, MentorFavorite, SavedSearch, Message, SessionAnalytics
from .serializers import (
    RegisterSerializer, MentorProfileSerializer, MentorProfileUpdateSerializer,
    SessionSerializer, SessionDetailSerializer, ReviewSerializer, StudentFeedbackSerializer, ResourceSerializer,
    AdminMeSerializer, PlatformSettingsSerializer, AdminNotificationSettingsSerializer,
    AdminUserListSerializer, AdminUserDetailSerializer,
    ReportSerializer, AdminReportSerializer,
    AuditLogSerializer,
    MentorFavoriteSerializer, SavedSearchSerializer,
    MessageSerializer, MessageDetailSerializer, ConversationSerializer,
    SessionAnalyticsSerializer, StudentAnalyticsSerializer, MentorAnalyticsSerializer,
)
from .permissions import IsStudent, IsMentor, IsAdmin
from .audit import create_audit_log
from .utils import (
    get_optimized_mentor_queryset, get_mentor_with_stats, invalidate_mentor_cache,
    safe_float_conversion, safe_int_conversion, validate_search_string
)
from .email import (
    send_session_request_notification,
    send_session_accepted_notification,
    send_session_declined_notification,
    send_session_completed_notification,
    send_mentor_verified_notification,
    send_report_resolved_notification,
    send_session_cancelled_notification,
)
from .secure_logging import get_secure_logger, log_user_action, log_error_safely, security_logger
from .error_handling import (
    ErrorHandlingMixin, ErrorCode, ErrorResponseBuilder, 
    raise_business_error, raise_resource_conflict, EnterpriseAPIException
)
from .input_sanitization import InputSanitizer, SecureValidationMixin, sanitize_request_data
from .database_optimization import DatabaseOptimizer, QueryOptimizer

# Setup secure logging
logger = get_secure_logger('api')


# ─────────────────────────────────────────────
# Auth
# ─────────────────────────────────────────────
class RegisterView(generics.CreateAPIView, ErrorHandlingMixin):
    queryset           = User.objects.all()
    serializer_class   = RegisterSerializer
    permission_classes = [AllowAny]
    throttle_classes   = [AnonRateThrottle]

    @transaction.atomic
    @sanitize_request_data(['username', 'password', 'role', 'phone', 'first_name', 'last_name'])
    def create(self, request, *args, **kwargs):
        try:
            # Sanitize username
            username = InputSanitizer.validate_username(request.data.get('username', ''))
            
            log_user_action(
                user_id=None,
                action='registration_attempt',
                resource='user',
                details={'username': username}
            )
            
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            
            log_user_action(
                user_id=user.id,
                action='registration_success',
                resource='user',
                details={'username': user.username, 'role': user.role}
            )
            
            security_logger.log_authentication_attempt(
                username=user.username,
                success=True,
                ip_address=getattr(request, 'client_ip', 'unknown'),
                user_agent=request.META.get('HTTP_USER_AGENT', 'unknown')
            )
            
            return Response({
                'success': True,
                'data': {
                    'access':   str(refresh.access_token),
                    'refresh':  str(refresh),
                    'user_id':  user.id,
                    'username': user.username,
                    'role':     user.role,
                }
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            log_error_safely(logger, "Registration failed", e, user_id=None)
            
            if isinstance(e, EnterpriseAPIException):
                raise
            
            return ErrorResponseBuilder.build_error_response(
                error_code=ErrorCode.INTERNAL_ERROR,
                message="Registration failed. Please try again.",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                request_id=getattr(request, 'request_id', None)
            )


class LoginView(APIView, ErrorHandlingMixin):
    permission_classes = [AllowAny]
    throttle_classes   = [AnonRateThrottle]

    @sanitize_request_data(['username', 'password'])
    def post(self, request):
        try:
            username = InputSanitizer.validate_username(request.data.get('username', '').strip())
            password = request.data.get('password', '')
            
            if not username or not password:
                security_logger.log_authentication_attempt(
                    username=username or 'unknown',
                    success=False,
                    ip_address=getattr(request, 'client_ip', 'unknown'),
                    user_agent=request.META.get('HTTP_USER_AGENT', 'unknown')
                )
                
                return ErrorResponseBuilder.build_error_response(
                    error_code=ErrorCode.MISSING_REQUIRED_FIELD,
                    message='Username and password are required.',
                    status_code=status.HTTP_400_BAD_REQUEST,
                    request_id=getattr(request, 'request_id', None)
                )

            try:
                user = User.objects.get(username=username)
            except User.DoesNotExist:
                security_logger.log_authentication_attempt(
                    username=username,
                    success=False,
                    ip_address=getattr(request, 'client_ip', 'unknown'),
                    user_agent=request.META.get('HTTP_USER_AGENT', 'unknown')
                )
                
                return ErrorResponseBuilder.build_error_response(
                    error_code=ErrorCode.AUTH_INVALID,
                    message='Invalid credentials.',
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    request_id=getattr(request, 'request_id', None)
                )

            if not user.check_password(password):
                security_logger.log_authentication_attempt(
                    username=username,
                    success=False,
                    ip_address=getattr(request, 'client_ip', 'unknown'),
                    user_agent=request.META.get('HTTP_USER_AGENT', 'unknown')
                )
                
                return ErrorResponseBuilder.build_error_response(
                    error_code=ErrorCode.AUTH_INVALID,
                    message='Invalid credentials.',
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    request_id=getattr(request, 'request_id', None)
                )

            if not user.is_active:
                return ErrorResponseBuilder.build_error_response(
                    error_code=ErrorCode.ACCOUNT_DEACTIVATED,
                    message='This account is disabled.',
                    status_code=status.HTTP_403_FORBIDDEN,
                    request_id=getattr(request, 'request_id', None)
                )

            if user.is_suspended:
                return ErrorResponseBuilder.build_error_response(
                    error_code=ErrorCode.ACCOUNT_SUSPENDED,
                    message='Your account has been suspended. Contact support.',
                    status_code=status.HTTP_403_FORBIDDEN,
                    request_id=getattr(request, 'request_id', None)
                )

            refresh = RefreshToken.for_user(user)
            
            security_logger.log_authentication_attempt(
                username=username,
                success=True,
                ip_address=getattr(request, 'client_ip', 'unknown'),
                user_agent=request.META.get('HTTP_USER_AGENT', 'unknown')
            )
            
            log_user_action(
                user_id=user.id,
                action='login_success',
                resource='user',
                details={'username': user.username}
            )
            
            return Response({
                'success': True,
                'data': {
                    'access':   str(refresh.access_token),
                    'refresh':  str(refresh),
                    'user_id':  user.id,
                    'username': user.username,
                    'role':     user.role,
                }
            })
            
        except Exception as e:
            log_error_safely(logger, "Login error occurred", e, user_id=None)
            
            return ErrorResponseBuilder.build_error_response(
                error_code=ErrorCode.INTERNAL_ERROR,
                message='Login failed. Please try again.',
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                request_id=getattr(request, 'request_id', None)
            )


# ─────────────────────────────────────────────
# Mentor Profiles — Public
# ─────────────────────────────────────────────
class MentorListView(generics.ListAPIView, ErrorHandlingMixin):
    serializer_class   = MentorProfileSerializer
    permission_classes = [AllowAny]
    throttle_classes   = [AnonRateThrottle, UserRateThrottle]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def get_queryset(self):
        try:
            with DatabaseOptimizer.query_monitor('mentor_list_query'):
                # Use optimized query from QueryOptimizer
                qs = QueryOptimizer.optimize_mentor_list_query()
                
                # Apply filters with proper validation
                filters = self._get_validated_filters()
                qs = self._apply_filters(qs, filters)
                qs = self._apply_sorting(qs, filters.get('sort'))
                
                log_user_action(
                    user_id=getattr(self.request.user, 'id', None),
                    action='mentor_list_view',
                    resource='mentor_profile',
                    details={'filters_count': len(filters)}
                )
                
                return qs
            
        except Exception as e:
            log_error_safely(logger, "Error in MentorListView.get_queryset", e)
            # Return empty queryset on error to prevent crashes
            return MentorProfile.objects.none()
    
    def _get_validated_filters(self):
        """Extract and validate query parameters"""
        filters = {}
        
        try:
            # Basic string filters
            field = self.request.query_params.get('field')
            if field:
                filters['field'] = validate_search_string(field, 'field', 100)
            
            university = self.request.query_params.get('university')
            if university:
                filters['university'] = validate_search_string(university, 'university', 100)
            
            language = self.request.query_params.get('language')
            if language:
                filters['language'] = validate_search_string(language, 'language', 50)
            
            # Numeric filters with validation
            rating_min = self.request.query_params.get('rating_min')
            if rating_min:
                filters['rating_min'] = safe_float_conversion(rating_min, 'rating_min', 0.0, 5.0)
            
            experience_min = self.request.query_params.get('experience_min')
            if experience_min:
                filters['experience_min'] = safe_int_conversion(experience_min, 'experience_min', 0, 50)
            
            reliability_min = self.request.query_params.get('reliability_min')
            if reliability_min:
                filters['reliability_min'] = safe_float_conversion(reliability_min, 'reliability_min', 0.0, 100.0)
            
            # Boolean filters
            availability = self.request.query_params.get('availability')
            if availability:
                filters['availability'] = availability.lower() == 'true'
            
            # Sort parameter
            sort_by = self.request.query_params.get('sort')
            if sort_by and sort_by in ['rating', 'reviews', 'experience', 'reliability', 'newest']:
                filters['sort'] = sort_by
            
        except ValueError as e:
            logger.warning(f"Invalid filter parameter: {str(e)}")
            # Continue with valid filters, ignore invalid ones
        
        return filters
    
    def _apply_filters(self, qs, filters):
        """Apply validated filters to queryset"""
        if filters.get('field'):
            qs = qs.filter(field_of_study__icontains=filters['field'])
        
        if filters.get('university'):
            qs = qs.filter(university__icontains=filters['university'])
        
        if filters.get('language'):
            qs = qs.filter(languages__contains=filters['language'])
        
        if filters.get('availability'):
            qs = qs.exclude(availability=[])
        
        if filters.get('rating_min'):
            qs = qs.filter(average_rating__gte=filters['rating_min'])
        
        if filters.get('experience_min'):
            qs = qs.filter(years_of_experience__gte=filters['experience_min'])
        
        if filters.get('reliability_min'):
            qs = qs.filter(user__reliability_score__gte=filters['reliability_min'])
        
        return qs
    
    def _apply_sorting(self, qs, sort_by):
        """Apply sorting to queryset"""
        if sort_by == 'rating':
            return qs.order_by('-average_rating', '-id')
        elif sort_by == 'reviews':
            # Use annotation to avoid N+1 queries
            return qs.annotate(
                review_count=Count('user__sessions_as_mentor__review')
            ).order_by('-review_count', '-id')
        elif sort_by == 'experience':
            return qs.order_by('-years_of_experience', '-id')
        elif sort_by == 'reliability':
            return qs.order_by('-user__reliability_score', '-id')
        elif sort_by == 'newest':
            return qs.order_by('-id')
        else:
            return qs.order_by('-id')


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
    throttle_classes = [UserRateThrottle]
    
    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsStudent()]
        return [IsAuthenticated()]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return SessionSerializer
        return SessionDetailSerializer

    def get_queryset(self):
        try:
            user = self.request.user
            # Optimized queryset with proper prefetching
            qs = Session.objects.select_related(
                'student', 'mentor', 'mentor__mentor_profile'
            ).prefetch_related(
                'review', 'report', 'student_feedback'
            ).order_by('-created_at')
            
            if user.role == 'student':
                qs = qs.filter(student=user)
            elif user.role == 'mentor':
                qs = qs.filter(mentor=user)
            
            # Apply status filter with validation
            status_filter = self.request.query_params.get('status')
            if status_filter and status_filter in ['pending', 'accepted', 'declined', 'completed', 'cancelled']:
                qs = qs.filter(status=status_filter)
            
            logger.info(f"SessionListView query for user {user.username} ({user.role})")
            return qs
            
        except Exception as e:
            logger.error(f"Error in SessionListCreateView.get_queryset: {str(e)}")
            return Session.objects.none()

    @transaction.atomic
    def perform_create(self, serializer):
        try:
            # Check if user is restricted
            if self.request.user.is_restricted():
                from rest_framework.exceptions import PermissionDenied
                restriction_end = self.request.user.restriction_until.strftime('%B %d, %Y at %I:%M %p')
                logger.warning(f"Restricted user {self.request.user.username} attempted to book session")
                raise PermissionDenied(
                    f"Your account is temporarily restricted from booking sessions until {restriction_end} "
                    f"due to multiple cancellations or no-shows. Please contact support if you believe this is an error."
                )
            
            session = serializer.save(student=self.request.user)
            logger.info(f"Session created: {session.id} by {self.request.user.username}")
            
            # Send notification (wrapped in try-catch to prevent transaction rollback)
            try:
                send_session_request_notification(session)
            except Exception as e:
                logger.error(f"Failed to send session notification: {str(e)}")
                # Don't fail the transaction for notification errors
                
        except Exception as e:
            logger.error(f"Session creation failed: {str(e)}")
            raise


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
    throttle_classes   = [UserRateThrottle]

    @transaction.atomic
    def post(self, request, pk):
        try:
            session = Session.objects.select_related('student', 'mentor').get(pk=pk, mentor=request.user)
        except Session.DoesNotExist:
            logger.warning(f"Session {pk} not found for mentor {request.user.username}")
            return Response({'error': 'Session not found.'}, status=status.HTTP_404_NOT_FOUND)
        
        try:
            if 'accepted' not in VALID_TRANSITIONS.get(session.status, []):
                logger.warning(f"Invalid transition attempt: {session.status} -> accepted for session {pk}")
                return Response(
                    {'error': f"Cannot accept a session with status '{session.status}'."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            meet_link = request.data.get('meet_link', '').strip()
            if not meet_link:
                return Response(
                    {'error': 'meet_link is required when accepting a session.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            session.status = 'accepted'
            session.meet_link = meet_link
            session.save(update_fields=['status', 'meet_link'])
            
            logger.info(f"Session {pk} accepted by mentor {request.user.username}")
            
            # Send notification (don't fail transaction if notification fails)
            try:
                send_session_accepted_notification(session)
            except Exception as e:
                logger.error(f"Failed to send acceptance notification: {str(e)}")
            
            return Response(SessionDetailSerializer(session).data)
            
        except Exception as e:
            logger.error(f"Error accepting session {pk}: {str(e)}")
            raise


class SessionDeclineView(APIView):
    permission_classes = [IsMentor]
    throttle_classes   = [UserRateThrottle]

    @transaction.atomic
    def post(self, request, pk):
        try:
            session = Session.objects.select_related('student', 'mentor').get(pk=pk, mentor=request.user)
        except Session.DoesNotExist:
            logger.warning(f"Session {pk} not found for mentor {request.user.username}")
            return Response({'error': 'Session not found.'}, status=status.HTTP_404_NOT_FOUND)
        
        try:
            if 'declined' not in VALID_TRANSITIONS.get(session.status, []):
                logger.warning(f"Invalid transition attempt: {session.status} -> declined for session {pk}")
                return Response(
                    {'error': f"Cannot decline a session with status '{session.status}'."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            session.status = 'declined'
            session.save(update_fields=['status'])
            
            logger.info(f"Session {pk} declined by mentor {request.user.username}")
            
            try:
                send_session_declined_notification(session)
            except Exception as e:
                logger.error(f"Failed to send decline notification: {str(e)}")
            
            return Response(SessionDetailSerializer(session).data)
            
        except Exception as e:
            logger.error(f"Error declining session {pk}: {str(e)}")
            raise


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
        
        if session.status not in ['pending', 'accepted']:
            return Response({'error': 'Only pending or accepted sessions can be cancelled.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if cancellation is within 24 hours of session
        hours_until_session = (session.requested_time - timezone.now()).total_seconds() / 3600
        
        if hours_until_session < 24 and session.status == 'accepted':
            # Late cancellation - apply penalty
            request.user.apply_cancellation_penalty()
            warning_message = (
                f"Session cancelled. Note: Cancelling within 24 hours of the session time "
                f"has been recorded. Your reliability score is now {request.user.reliability_score:.0f}/100. "
            )
            if request.user.is_restricted():
                restriction_end = request.user.restriction_until.strftime('%B %d, %Y at %I:%M %p')
                warning_message += (
                    f"Due to multiple late cancellations, you are temporarily restricted from booking "
                    f"new sessions until {restriction_end}."
                )
        else:
            warning_message = None
        
        session.status = 'cancelled'
        session.save(update_fields=['status'])
        send_session_cancelled_notification(session, request.user)
        
        response_data = SessionDetailSerializer(session).data
        if warning_message:
            response_data['warning'] = warning_message
        
        return Response(response_data)


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


# ─────────────────────────────────────────────
# Mentor Favorites (Student bookmarks)
# ─────────────────────────────────────────────
class MentorFavoriteListView(generics.ListAPIView):
    serializer_class   = MentorFavoriteSerializer
    permission_classes = [IsStudent]

    def get_queryset(self):
        return MentorFavorite.objects.filter(student=self.request.user).select_related('mentor', 'mentor__mentor_profile')


class MentorFavoriteToggleView(APIView):
    permission_classes = [IsStudent]

    def post(self, request, mentor_id):
        try:
            mentor_user = User.objects.get(pk=mentor_id, role='mentor')
        except User.DoesNotExist:
            return Response({'error': 'Mentor not found.'}, status=status.HTTP_404_NOT_FOUND)
        
        # Check if already favorited
        favorite = MentorFavorite.objects.filter(student=request.user, mentor=mentor_user).first()
        
        if favorite:
            # Remove from favorites
            favorite.delete()
            return Response({'is_favorited': False, 'message': 'Removed from favorites'})
        else:
            # Add to favorites
            MentorFavorite.objects.create(student=request.user, mentor=mentor_user)
            return Response({'is_favorited': True, 'message': 'Added to favorites'}, status=status.HTTP_201_CREATED)


# ─────────────────────────────────────────────
# Saved Searches
# ─────────────────────────────────────────────
class SavedSearchListCreateView(generics.ListCreateAPIView):
    serializer_class   = SavedSearchSerializer
    permission_classes = [IsStudent]

    def get_queryset(self):
        return SavedSearch.objects.filter(student=self.request.user)

    def perform_create(self, serializer):
        serializer.save(student=self.request.user)


class SavedSearchDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class   = SavedSearchSerializer
    permission_classes = [IsStudent]

    def get_queryset(self):
        return SavedSearch.objects.filter(student=self.request.user)


# ─────────────────────────────────────────────
# Mentor Availability Slots
# ─────────────────────────────────────────────
class MentorAvailabilityView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        """Get available time slots for a mentor"""
        try:
            profile = MentorProfile.objects.get(pk=pk, is_verified=True)
        except MentorProfile.DoesNotExist:
            return Response({'error': 'Mentor not found.'}, status=status.HTTP_404_NOT_FOUND)
        
        # Get date range from query params (default: next 14 days)
        from datetime import datetime, timedelta
        import pytz
        
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')
        
        if start_date_str:
            try:
                start_date = datetime.fromisoformat(start_date_str.replace('Z', '+00:00'))
            except ValueError:
                return Response({'error': 'Invalid start_date format. Use ISO format.'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            start_date = datetime.now(pytz.UTC)
        
        if end_date_str:
            try:
                end_date = datetime.fromisoformat(end_date_str.replace('Z', '+00:00'))
            except ValueError:
                return Response({'error': 'Invalid end_date format. Use ISO format.'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            end_date = start_date + timedelta(days=14)
        
        # Get available slots
        slots = profile.get_available_slots(start_date, end_date)
        
        # Get existing sessions to mark booked slots
        existing_sessions = Session.objects.filter(
            mentor=profile.user,
            status__in=['pending', 'accepted'],
            requested_time__gte=start_date,
            requested_time__lte=end_date
        ).values_list('requested_time', flat=True)
        
        booked_times = [dt.isoformat() for dt in existing_sessions]
        
        return Response({
            'mentor_id': profile.id,
            'mentor_username': profile.user.username,
            'timezone': profile.timezone,
            'available_slots': slots,
            'booked_times': booked_times,
            'total_slots': len(slots),
        })


# ─────────────────────────────────────────────
# Real-Time Messaging (Phase 3)
# ─────────────────────────────────────────────
class MessageListCreateView(generics.ListCreateAPIView):
    serializer_class   = MessageDetailSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Get messages between current user and another user"""
        user_id = self.request.query_params.get('user_id')
        if not user_id:
            return Message.objects.none()
        
        return Message.objects.filter(
            Q(sender=self.request.user, recipient_id=user_id) |
            Q(sender_id=user_id, recipient=self.request.user)
        ).select_related('sender', 'recipient').order_by('-created_at')

    def perform_create(self, serializer):
        recipient_id = self.request.data.get('recipient_id')
        try:
            recipient = User.objects.get(pk=recipient_id)
        except User.DoesNotExist:
            raise serializers.ValidationError({'recipient_id': 'User not found.'})
        
        serializer.save(sender=self.request.user, recipient=recipient)


class ConversationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get list of conversations (unique users)"""
        from django.db.models import Max, Q
        
        # Get all unique users this user has messaged
        conversations = Message.objects.filter(
            Q(sender=request.user) | Q(recipient=request.user)
        ).values('sender_id', 'recipient_id').distinct()
        
        user_ids = set()
        for conv in conversations:
            if conv['sender_id'] != request.user.id:
                user_ids.add(conv['sender_id'])
            if conv['recipient_id'] != request.user.id:
                user_ids.add(conv['recipient_id'])
        
        conversation_data = []
        for user_id in user_ids:
            other_user = User.objects.get(pk=user_id)
            
            # Get last message
            last_message = Message.objects.filter(
                Q(sender=request.user, recipient_id=user_id) |
                Q(sender_id=user_id, recipient=request.user)
            ).order_by('-created_at').first()
            
            # Get unread count
            unread_count = Message.objects.filter(
                sender_id=user_id,
                recipient=request.user,
                is_read=False
            ).count()
            
            conversation_data.append({
                'user_id': other_user.id,
                'username': other_user.username,
                'unread_count': unread_count,
                'last_message': last_message.content if last_message else '',
                'last_message_time': last_message.created_at if last_message else None,
            })
        
        # Sort by last message time
        conversation_data.sort(key=lambda x: x['last_message_time'] or timezone.now(), reverse=True)
        
        serializer = ConversationSerializer(conversation_data, many=True)
        return Response(serializer.data)


class MessageMarkAsReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            message = Message.objects.get(pk=pk, recipient=request.user)
        except Message.DoesNotExist:
            return Response({'error': 'Message not found.'}, status=status.HTTP_404_NOT_FOUND)
        
        message.is_read = True
        message.read_at = timezone.now()
        message.save(update_fields=['is_read', 'read_at'])
        
        return Response(MessageDetailSerializer(message).data)


class UnreadMessageCountView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get total unread message count"""
        unread_count = Message.objects.filter(
            recipient=request.user,
            is_read=False
        ).count()
        
        return Response({'unread_count': unread_count})


# ─────────────────────────────────────────────
# Session Analytics (Phase 3)
# ─────────────────────────────────────────────
class SessionAnalyticsDetailView(generics.RetrieveUpdateAPIView):
    serializer_class   = SessionAnalyticsSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = SessionAnalytics.objects.select_related('session', 'student', 'mentor')
        
        # Only allow viewing own analytics
        if user.role == 'student':
            return qs.filter(student=user)
        elif user.role == 'mentor':
            return qs.filter(mentor=user)
        
        return qs.none()


class StudentAnalyticsView(APIView):
    permission_classes = [IsStudent]

    def get(self, request):
        """Get student analytics dashboard data"""
        from django.db.models import Count, Avg, Q
        from datetime import timedelta
        
        # Get all completed sessions for this student
        sessions = Session.objects.filter(
            student=request.user,
            status='completed'
        ).select_related('mentor')
        
        # Calculate metrics
        total_sessions = sessions.count()
        completed_sessions = total_sessions  # All are completed by filter
        
        # Calculate total hours (assuming 1 hour per session)
        total_hours = total_sessions * 1.0
        
        # Get unique mentors
        unique_mentors = sessions.values('mentor').distinct().count()
        
        # Get average satisfaction rating
        analytics = SessionAnalytics.objects.filter(
            student=request.user,
            satisfaction_rating__isnull=False
        )
        avg_satisfaction = (
            analytics.aggregate(Avg('satisfaction_rating'))['satisfaction_rating__avg'] or 0.0
        )
        
        # Get all skills learned
        all_skills = []
        for analytic in analytics:
            if analytic.skills_learned:
                all_skills.extend(analytic.skills_learned)
        unique_skills = list(set(all_skills))
        
        # Get total goals achieved
        total_goals = analytics.aggregate(Count('goals_achieved'))['goals_achieved__count'] or 0
        
        return Response({
            'total_hours': total_hours,
            'total_sessions': total_sessions,
            'completed_sessions': completed_sessions,
            'unique_mentors': unique_mentors,
            'average_satisfaction': round(avg_satisfaction, 2),
            'skills_learned': unique_skills,
            'total_goals_achieved': total_goals,
        })


class MentorAnalyticsView(APIView):
    permission_classes = [IsMentor]

    def get(self, request):
        """Get mentor analytics dashboard data"""
        from django.db.models import Count, Avg, Q
        
        # Get all completed sessions for this mentor
        sessions = Session.objects.filter(
            mentor=request.user,
            status='completed'
        ).select_related('student')
        
        # Calculate metrics
        total_sessions = sessions.count()
        completed_sessions = total_sessions
        
        # Calculate total hours
        total_hours = total_sessions * 1.0
        
        # Get unique students
        unique_students = sessions.values('student').distinct().count()
        
        # Get average rating from reviews
        reviews = Review.objects.filter(session__mentor=request.user)
        avg_rating = (
            reviews.aggregate(Avg('rating'))['rating__avg'] or 0.0
        )
        
        # Get analytics data
        analytics = SessionAnalytics.objects.filter(
            mentor=request.user
        )
        
        # Average student engagement
        avg_engagement = (
            analytics.filter(student_engagement__isnull=False).aggregate(
                Avg('student_engagement')
            )['student_engagement__avg'] or 0.0
        )
        
        # Average mentor effectiveness
        avg_effectiveness = (
            analytics.filter(mentor_effectiveness__isnull=False).aggregate(
                Avg('mentor_effectiveness')
            )['mentor_effectiveness__avg'] or 0.0
        )
        
        # Get all topics covered (from session goals)
        all_topics = []
        for session in sessions:
            if session.goal:
                all_topics.append(session.goal)
        unique_topics = list(set(all_topics))[:10]  # Top 10 topics
        
        return Response({
            'total_hours': total_hours,
            'total_students': unique_students,
            'completed_sessions': completed_sessions,
            'average_rating': round(avg_rating, 2),
            'average_student_engagement': round(avg_engagement, 2),
            'average_effectiveness': round(avg_effectiveness, 2),
            'topics_covered': unique_topics,
        })
