# BACKEND FIXES REQUIRED FOR STUDENT DASHBOARD

## 1. Add review_count to MentorProfileSerializer

In serializers.py, update MentorProfileSerializer:

```python
class MentorProfileSerializer(serializers.ModelSerializer):
    user_id    = serializers.IntegerField(source='user.id', read_only=True)
    username   = serializers.CharField(source='user.username', read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name  = serializers.CharField(source='user.last_name', read_only=True)
    review_count = serializers.SerializerMethodField()  # ADD THIS

    class Meta:
        model  = MentorProfile
        fields = (
            'id', 'user_id', 'username', 'first_name', 'last_name',
            'university', 'graduation_year', 'field_of_study',
            'bio', 'linkedin_url', 'availability',
            'is_verified', 'average_rating', 'review_count',  # ADD review_count HERE
        )
        read_only_fields = ('id', 'user_id', 'username', 'first_name', 'last_name',
                            'is_verified', 'average_rating', 'review_count')  # ADD HERE

    def get_review_count(self, obj):  # ADD THIS METHOD
        from .models import Review, Session
        return Review.objects.filter(session__mentor=obj.user).count()
```

## 2. Add mentor_field to SessionDetailSerializer

In serializers.py, update SessionDetailSerializer:

```python
class SessionDetailSerializer(serializers.ModelSerializer):
    student_username  = serializers.CharField(source='student.username', read_only=True)
    mentor_username   = serializers.CharField(source='mentor.username', read_only=True)
    mentor_profile_id = serializers.IntegerField(source='mentor.mentor_profile.id', read_only=True)
    mentor_field      = serializers.CharField(source='mentor.mentor_profile.field_of_study', read_only=True)  # ADD THIS
    has_review        = serializers.SerializerMethodField()
    has_report        = serializers.SerializerMethodField()

    class Meta:
        model  = Session
        fields = (
            'id', 'student_username', 'mentor_username', 'mentor_profile_id', 'mentor_field',  # ADD mentor_field
            'status', 'requested_time', 'goal',
            'meet_link', 'mentor_notes', 'created_at', 'has_review', 'has_report',
        )
```

## 3. OPTIONAL: Add student stats endpoint for efficiency

In views.py, add new view:

```python
class StudentStatsView(APIView):
    permission_classes = [IsStudent]

    def get(self, request):
        user = request.user
        return Response({
            'completed_count': Session.objects.filter(student=user, status='completed').count(),
            'pending_count': Session.objects.filter(student=user, status='pending').count(),
            'accepted_count': Session.objects.filter(student=user, status='accepted').count(),
            'total_sessions': Session.objects.filter(student=user).count(),
        })
```

In urls.py, add:

```python
path('students/stats/', StudentStatsView.as_view(), name='student-stats'),
```

This would allow frontend to call GET /api/students/stats/ instead of fetching full session lists just for counts.

## PRIORITY:
- **HIGH**: Fix #1 (review_count) - Frontend shows "undefined reviews"
- **MEDIUM**: Fix #2 (mentor_field) - Frontend can work without it but better UX
- **LOW**: Fix #3 (stats endpoint) - Current approach works, just less efficient

## TESTING CHECKLIST:
- [ ] GET /api/mentors/ returns review_count for each mentor
- [ ] GET /api/sessions/ returns mentor_field for each session
- [ ] GET /api/students/stats/ returns all counts (if implemented)
- [ ] Frontend mentor cards show correct review count
- [ ] Frontend session cards show mentor's field of study
