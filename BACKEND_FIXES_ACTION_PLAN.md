# 🔧 BACKEND FIXES - ACTION PLAN

## Priority 1: CRITICAL FIXES (Do First - 8 Hours)

### Fix 1: NaN Injection Vulnerability
**File**: `backend/src/api/views.py`  
**Lines**: 132-133, 156  
**Time**: 1 hour

```python
# ADD THIS HELPER FUNCTION AT TOP OF FILE
import math
import logging

logger = logging.getLogger(__name__)

def validate_float_param(value, min_val=0, max_val=100, param_name="value"):
    """Safely validate and convert float parameters"""
    if not value:
        return None
    
    try:
        num = float(value)
        
        # Check for NaN and Infinity
        if math.isnan(num) or math.isinf(num):
            logger.warning(f"Invalid {param_name}: {value} (NaN/Infinity)")
            return None
        
        # Check range
        if not (min_val <= num <= max_val):
            logger.warning(f"Invalid {param_name}: {value} (out of range {min_val}-{max_val})")
            return None
        
        return num
    except (ValueError, TypeError):
        logger.warning(f"Invalid {param_name}: {value} (not a number)")
        return None

# REPLACE THIS IN MentorListView.get_queryset():
# OLD CODE (lines 132-133):
# rating_min = self.request.query_params.get('rating_min')
# if rating_min:
#     try:
#         qs = qs.filter(average_rating__gte=float(rating_min))
#     except ValueError:
#         pass

# NEW CODE:
rating_min = validate_float_param(
    self.request.query_params.get('rating_min'),
    min_val=0,
    max_val=5,
    param_name="rating_min"
)
if rating_min is not None:
    qs = qs.filter(average_rating__gte=rating_min)

# ALSO FIX line 156 (experience_min):
experience_min = validate_float_param(
    self.request.query_params.get('experience_min'),
    min_val=0,
    max_val=50,
    param_name="experience_min"
)
if experience_min is not None:
    qs = qs.filter(years_of_experience__gte=int(experience_min))

# ALSO FIX reliability_min:
reliability_min = validate_float_param(
    self.request.query_params.get('reliability_min'),
    min_val=0,
    max_val=100,
    param_name="reliability_min"
)
if reliability_min is not None:
    qs = qs.filter(user__reliability_score__gte=reliability_min)
```

---

### Fix 2: Add Input Validation
**File**: `backend/src/api/views.py`  
**Time**: 1.5 hours

```python
# ADD THESE VALIDATION FUNCTIONS
def validate_search_param(value, max_length=100):
    """Validate search parameter"""
    if not value:
        return None
    
    search = str(value).strip()
    if len(search) > max_length:
        logger.warning(f"Search too long: {len(search)} chars")
        return None
    
    return search

def validate_page_param(value, max_page=10000):
    """Validate page parameter"""
    try:
        page = int(value)
        if page < 1 or page > max_page:
            logger.warning(f"Invalid page: {page}")
            return 1
        return page
    except (ValueError, TypeError):
        return 1

# USE IN VIEWS:
class AdminSessionListView(generics.ListAPIView):
    def get_queryset(self):
        qs = Session.objects.select_related('student', 'mentor').order_by('-created_at')
        
        # Status filter
        status_filter = self.request.query_params.get('status')
        if status_filter in ['pending', 'accepted', 'declined', 'completed', 'cancelled']:
            qs = qs.filter(status=status_filter)
        
        # Search with validation
        search = validate_search_param(self.request.query_params.get('search'))
        if search:
            qs = qs.filter(
                Q(student__username__icontains=search) | 
                Q(mentor__username__icontains=search)
            )
        
        return qs
```

---

### Fix 3: Add Error Handling
**File**: `backend/src/api/views.py`  
**Time**: 2 hours

```python
# REPLACE SessionAcceptView.post() with:
class SessionAcceptView(APIView):
    permission_classes = [IsMentor]

    def post(self, request, pk):
        try:
            session = Session.objects.get(pk=pk, mentor=request.user)
        except Session.DoesNotExist:
            logger.warning(f"Session {pk} not found for mentor {request.user.id}")
            return Response(
                {'error': 'Session not found or you do not have permission.'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error retrieving session {pk}: {str(e)}", exc_info=True)
            return Response(
                {'error': 'An unexpected error occurred.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        try:
            # Validate status transition
            if 'accepted' not in VALID_TRANSITIONS.get(session.status, []):
                return Response(
                    {'error': f'Cannot accept a session with status {session.status}.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Validate meet_link
            meet_link = request.data.get('meet_link', '').strip()
            if not meet_link:
                return Response(
                    {'error': 'meet_link is required when accepting a session.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if len(meet_link) > 500:
                return Response(
                    {'error': 'meet_link is too long.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Update session
            session.status = 'accepted'
            session.meet_link = meet_link
            session.save(update_fields=['status', 'meet_link'])
            
            logger.info(f"Session {session.id} accepted by mentor {request.user.id}")
            send_session_accepted_notification(session)
            
            return Response(SessionDetailSerializer(session).data)
        
        except Exception as e:
            logger.error(f"Error accepting session {pk}: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Failed to accept session. Please try again.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
```

---

### Fix 4: Add Pagination
**File**: `backend/src/api/views.py`  
**Time**: 1 hour

```python
# ADD AT TOP OF FILE
from rest_framework.pagination import PageNumberPagination

class StandardPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100
    page_size_query_description = 'Number of results per page'

# ADD TO VIEWS:
class MentorListView(generics.ListAPIView):
    serializer_class = MentorProfileSerializer
    permission_classes = [AllowAny]
    pagination_class = StandardPagination  # ✅ ADD THIS
    
    # ... rest of code ...

class AdminSessionListView(generics.ListAPIView):
    serializer_class = SessionDetailSerializer
    permission_classes = [IsAdmin]
    pagination_class = StandardPagination  # ✅ ADD THIS
    
    # ... rest of code ...
```

---

### Fix 5: Add Rate Limiting
**File**: `backend/src/api/views.py`  
**Time**: 1 hour

```python
# ADD AT TOP OF FILE
from rest_framework.throttling import UserRateThrottle, AnonRateThrottle

class StudentThrottle(UserRateThrottle):
    scope = 'student'

class MentorThrottle(UserRateThrottle):
    scope = 'mentor'

class AnonThrottle(AnonRateThrottle):
    scope = 'anon'

# ADD TO settings.py
REST_FRAMEWORK = {
    'DEFAULT_THROTTLE_CLASSES': [
        'api.throttles.AnonThrottle',
        'api.throttles.StudentThrottle',
        'api.throttles.MentorThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '20/hour',
        'student': '100/hour',
        'mentor': '100/hour',
    }
}

# ADD TO VIEWS:
class MentorListView(generics.ListAPIView):
    throttle_classes = [AnonThrottle]  # ✅ ADD THIS
    # ... rest of code ...

class SessionListCreateView(generics.ListCreateAPIView):
    throttle_classes = [StudentThrottle]  # ✅ ADD THIS
    # ... rest of code ...
```

---

## Priority 2: HIGH PRIORITY FIXES (Next - 12 Hours)

### Fix 6: Fix N+1 Query Problem
**File**: `backend/src/api/views.py`  
**Time**: 2 hours

```python
# REPLACE MentorListView.get_queryset() with:
from django.db.models import Prefetch, Count, Exists, OuterRef

def get_queryset(self):
    qs = MentorProfile.objects.filter(is_verified=True).select_related('user')
    
    # Add review count annotation
    qs = qs.annotate(review_count=Count('user__sessions_as_mentor__review'))
    
    # Add favorited status if user is authenticated
    if self.request.user.is_authenticated and self.request.user.role == 'student':
        qs = qs.annotate(
            is_favorited=Exists(
                MentorFavorite.objects.filter(
                    student=self.request.user,
                    mentor=OuterRef('user')
                )
            )
        )
    
    # ... rest of filtering and sorting ...
    return qs

# UPDATE SERIALIZER:
class MentorProfileSerializer(serializers.ModelSerializer):
    def get_review_count(self, obj):
        # Use annotated value instead of querying
        return getattr(obj, 'review_count', 0)
    
    def get_is_favorited(self, obj):
        # Use annotated value instead of querying
        return getattr(obj, 'is_favorited', False)
```

---

### Fix 7: Add Database Indexes
**File**: `backend/src/api/models.py`  
**Time**: 1 hour

```python
# UPDATE Session model:
class Session(models.Model):
    # ... existing fields ...
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['student', '-created_at']),
            models.Index(fields=['mentor', '-created_at']),
            models.Index(fields=['status', '-created_at']),
            models.Index(fields=['requested_time']),
            models.Index(fields=['student', 'status']),
            models.Index(fields=['mentor', 'status']),
        ]

# UPDATE Review model:
class Review(models.Model):
    # ... existing fields ...
    
    class Meta:
        indexes = [
            models.Index(fields=['session__mentor', '-created_at']),
        ]

# UPDATE Report model:
class Report(models.Model):
    # ... existing fields ...
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', '-created_at']),
            models.Index(fields=['reporter', '-created_at']),
            models.Index(fields=['reported_user', '-created_at']),
        ]

# RUN MIGRATIONS:
# python manage.py makemigrations
# python manage.py migrate
```

---

### Fix 8: Add Caching
**File**: `backend/src/api/views.py`  
**Time**: 2 hours

```python
# ADD AT TOP OF FILE
from django.core.cache import cache
from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator

# CACHE MENTOR LIST
@method_decorator(cache_page(60 * 5), name='dispatch')  # Cache for 5 minutes
class MentorListView(generics.ListAPIView):
    # ... rest of code ...

# CACHE MENTOR DETAIL
@method_decorator(cache_page(60 * 10), name='dispatch')  # Cache for 10 minutes
class MentorDetailView(generics.RetrieveAPIView):
    # ... rest of code ...

# CACHE RESOURCES
@method_decorator(cache_page(60 * 15), name='dispatch')  # Cache for 15 minutes
class ResourceListCreateView(generics.ListCreateAPIView):
    # ... rest of code ...
```

---

### Fix 9: Add Transaction Management
**File**: `backend/src/api/views.py`  
**Time**: 1.5 hours

```python
# ADD AT TOP OF FILE
from django.db import transaction

# UPDATE SessionCancelView:
class SessionCancelView(APIView):
    permission_classes = [IsStudent]

    @transaction.atomic
    def post(self, request, pk):
        try:
            session = Session.objects.select_for_update().get(pk=pk, student=request.user)
        except Session.DoesNotExist:
            return Response({'error': 'Session not found.'}, status=status.HTTP_404_NOT_FOUND)
        
        if session.status not in ['pending', 'accepted']:
            return Response(
                {'error': 'Only pending or accepted sessions can be cancelled.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Check if cancellation is within 24 hours
            hours_until_session = (session.requested_time - timezone.now()).total_seconds() / 3600
            
            if hours_until_session < 24 and session.status == 'accepted':
                # Apply penalty atomically
                request.user.apply_cancellation_penalty()
                warning_message = f"Session cancelled. Your reliability score is now {request.user.reliability_score:.0f}/100."
                if request.user.is_restricted():
                    restriction_end = request.user.restriction_until.strftime('%B %d, %Y at %I:%M %p')
                    warning_message += f" You are restricted until {restriction_end}."
            else:
                warning_message = None
            
            # Update session
            session.status = 'cancelled'
            session.save(update_fields=['status'])
            
            send_session_cancelled_notification(session, request.user)
            
            response_data = SessionDetailSerializer(session).data
            if warning_message:
                response_data['warning'] = warning_message
            
            return Response(response_data)
        
        except Exception as e:
            logger.error(f"Error cancelling session {pk}: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Failed to cancel session.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
```

---

### Fix 10: Add Logging
**File**: `backend/src/api/views.py`  
**Time**: 2 hours

```python
# ADD AT TOP OF FILE
import logging

logger = logging.getLogger(__name__)

# ADD LOGGING TO ALL CRITICAL OPERATIONS:
class SessionListCreateView(generics.ListCreateAPIView):
    def perform_create(self, serializer):
        try:
            if self.request.user.is_restricted():
                logger.warning(f"Restricted user {self.request.user.id} attempted to book session")
                raise PermissionDenied("Your account is restricted")
            
            session = serializer.save(student=self.request.user)
            logger.info(f"Session {session.id} created by student {self.request.user.id} for mentor {session.mentor.id}")
            send_session_request_notification(session)
        
        except Exception as e:
            logger.error(f"Error creating session for student {self.request.user.id}: {str(e)}", exc_info=True)
            raise

# ADD TO settings.py
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': 'logs/django.log',
            'formatter': 'verbose',
        },
        'console': {
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['file', 'console'],
        'level': 'INFO',
    },
}
```

---

### Fix 11: Refactor High Complexity Function
**File**: `backend/src/api/views.py`  
**Time**: 2 hours

```python
# REFACTOR MentorListView.get_queryset() to reduce complexity
class MentorListView(generics.ListAPIView):
    def get_queryset(self):
        qs = MentorProfile.objects.filter(is_verified=True).select_related('user')
        qs = self._apply_filters(qs)
        qs = self._apply_sorting(qs)
        return qs

    def _apply_filters(self, qs):
        """Apply all filter parameters"""
        # Basic filters
        field = self.request.query_params.get('field')
        if field:
            qs = qs.filter(field_of_study__icontains=field)
        
        university = self.request.query_params.get('university')
        if university:
            qs = qs.filter(university__icontains=university)
        
        # Advanced filters with validation
        rating_min = validate_float_param(self.request.query_params.get('rating_min'), 0, 5)
        if rating_min is not None:
            qs = qs.filter(average_rating__gte=rating_min)
        
        experience_min = validate_float_param(self.request.query_params.get('experience_min'), 0, 50)
        if experience_min is not None:
            qs = qs.filter(years_of_experience__gte=int(experience_min))
        
        language = self.request.query_params.get('language')
        if language:
            qs = qs.filter(languages__contains=language)
        
        availability = self.request.query_params.get('availability')
        if availability == 'true':
            qs = qs.exclude(availability=[])
        
        reliability_min = validate_float_param(self.request.query_params.get('reliability_min'), 0, 100)
        if reliability_min is not None:
            qs = qs.filter(user__reliability_score__gte=reliability_min)
        
        return qs

    def _apply_sorting(self, qs):
        """Apply sorting parameter"""
        sort_by = self.request.query_params.get('sort', 'newest')
        
        if sort_by == 'rating':
            qs = qs.order_by('-average_rating', '-id')
        elif sort_by == 'reviews':
            from django.db.models import Count
            qs = qs.annotate(review_count=Count('user__sessions_as_mentor__review'))
            qs = qs.order_by('-review_count', '-id')
        elif sort_by == 'experience':
            qs = qs.order_by('-years_of_experience', '-id')
        elif sort_by == 'reliability':
            qs = qs.order_by('-user__reliability_score', '-id')
        else:
            qs = qs.order_by('-id')
        
        return qs
```

---

## Priority 3: MEDIUM PRIORITY FIXES (Next 2 Weeks - 8 Hours)

### Fix 12: Add API Documentation
**File**: `backend/src/api/views.py`  
**Time**: 2 hours

```python
# ADD AT TOP OF FILE
from drf_spectacular.utils import extend_schema, OpenApiParameter

# ADD DOCUMENTATION TO VIEWS:
class MentorListView(generics.ListAPIView):
    @extend_schema(
        description="List all verified mentors with optional filtering and sorting",
        parameters=[
            OpenApiParameter('field', str, description='Filter by field of study'),
            OpenApiParameter('rating_min', float, description='Minimum rating (0-5)'),
            OpenApiParameter('experience_min', int, description='Minimum years of experience'),
            OpenApiParameter('language', str, description='Filter by language'),
            OpenApiParameter('availability', str, description='Filter by availability (true/false)'),
            OpenApiParameter('reliability_min', float, description='Minimum reliability score (0-100)'),
            OpenApiParameter('sort', str, description='Sort by: rating, reviews, experience, reliability, newest'),
            OpenApiParameter('page', int, description='Page number'),
            OpenApiParameter('page_size', int, description='Results per page (max 100)'),
        ],
        responses=MentorProfileSerializer(many=True),
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)
```

---

## TOTAL ESTIMATED TIME: 28 Hours

**Breakdown**:
- Priority 1 (Critical): 8 hours
- Priority 2 (High): 12 hours
- Priority 3 (Medium): 8 hours

**Recommended Schedule**:
- Day 1-2: Priority 1 fixes (8 hours)
- Day 3-4: Priority 2 fixes (12 hours)
- Day 5-6: Priority 3 fixes (8 hours)

---

## TESTING CHECKLIST

After implementing fixes:

- [ ] Test NaN injection protection
- [ ] Test input validation
- [ ] Test error handling
- [ ] Test pagination
- [ ] Test rate limiting
- [ ] Test N+1 query fix (check query count)
- [ ] Test caching
- [ ] Test transaction rollback
- [ ] Test logging output
- [ ] Test API documentation
- [ ] Run full test suite
- [ ] Performance test (response time < 500ms)

---

**Status**: Ready to implement  
**Priority**: HIGH - Do before production deployment
