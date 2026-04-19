from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User, MentorProfile, Session, Review, StudentFeedback, Resource, Report, AuditLog, PlatformSettings, AdminNotificationSettings


# ─────────────────────────────────────────────
# Auth — Register
# ─────────────────────────────────────────────
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    role = serializers.ChoiceField(choices=['student', 'mentor'])

    class Meta:
        model = User
        fields = ('username', 'password', 'role', 'phone', 'first_name', 'last_name')
        extra_kwargs = {
            'first_name': {'required': False},
            'last_name':  {'required': False},
        }

    def validate_username(self, value):
        # Check if username exists and is deactivated
        try:
            existing_user = User.objects.get(username=value)
            if existing_user.is_deactivated:
                raise serializers.ValidationError("This username is not available.")
        except User.DoesNotExist:
            pass
        return value

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        if user.role == 'mentor':
            MentorProfile.objects.create(
                user=user,
                university='',
                graduation_year=2024,
                field_of_study='',
            )
        return user


# ─────────────────────────────────────────────
# Auth — Admin Me (account settings)
# ─────────────────────────────────────────────
class AdminMeSerializer(serializers.ModelSerializer):
    current_password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    new_password     = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model  = User
        fields = ('id', 'username', 'email', 'current_password', 'new_password')
        read_only_fields = ('id',)

    def validate(self, data):
        new_pw = data.get('new_password', '')
        cur_pw = data.get('current_password', '')
        if new_pw:
            if not cur_pw:
                raise serializers.ValidationError({'current_password': 'Required when changing password.'})
            if not self.instance.check_password(cur_pw):
                raise serializers.ValidationError({'current_password': 'Incorrect password.'})
            if len(new_pw) < 8:
                raise serializers.ValidationError({'new_password': 'Minimum 8 characters.'})
        return data

    def update(self, instance, validated_data):
        validated_data.pop('current_password', None)
        new_pw = validated_data.pop('new_password', None)
        for attr, val in validated_data.items():
            setattr(instance, attr, val)
        if new_pw:
            instance.set_password(new_pw)
        instance.save()
        return instance


# ─────────────────────────────────────────────
# Mentor Profile
# ─────────────────────────────────────────────
class MentorProfileSerializer(serializers.ModelSerializer):
    user_id      = serializers.IntegerField(source='user.id', read_only=True)
    username     = serializers.CharField(source='user.username', read_only=True)
    first_name   = serializers.CharField(source='user.first_name', read_only=True)
    last_name    = serializers.CharField(source='user.last_name', read_only=True)
    review_count = serializers.SerializerMethodField()

    class Meta:
        model  = MentorProfile
        fields = (
            'id', 'user_id', 'username', 'first_name', 'last_name',
            'university', 'graduation_year', 'field_of_study',
            'bio', 'linkedin_url', 'availability',
            'is_verified', 'average_rating', 'review_count',
            'profile_completeness', 'years_of_experience', 'languages',
        )
        read_only_fields = ('id', 'user_id', 'username', 'first_name', 'last_name',
                            'is_verified', 'average_rating', 'review_count', 'profile_completeness')

    def get_review_count(self, obj):
        return Review.objects.filter(session__mentor=obj.user).count()


class MentorProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model  = MentorProfile
        fields = ('university', 'graduation_year', 'field_of_study',
                  'bio', 'linkedin_url', 'availability', 'years_of_experience', 'languages')


# ─────────────────────────────────────────────
# Session
# ─────────────────────────────────────────────
class SessionSerializer(serializers.ModelSerializer):
    student_username = serializers.CharField(source='student.username', read_only=True)
    mentor_username  = serializers.CharField(source='mentor.username', read_only=True)
    mentor_id        = serializers.IntegerField(write_only=True)

    class Meta:
        model  = Session
        fields = (
            'id', 'student_username', 'mentor_id', 'mentor_username',
            'status', 'requested_time', 'goal',
            'meet_link', 'mentor_notes', 'created_at',
        )
        read_only_fields = ('id', 'student_username', 'mentor_username',
                            'status', 'meet_link', 'mentor_notes', 'created_at')

    def validate_mentor_id(self, value):
        try:
            mentor_user = User.objects.get(pk=value, role='mentor')
        except User.DoesNotExist:
            raise serializers.ValidationError("No mentor found with this id.")
        try:
            profile = mentor_user.mentor_profile
        except MentorProfile.DoesNotExist:
            raise serializers.ValidationError("This mentor has no profile.")
        if not profile.is_verified:
            raise serializers.ValidationError("This mentor is not yet verified.")
        return value

    def create(self, validated_data):
        mentor_id = validated_data.pop('mentor_id')
        mentor    = User.objects.get(pk=mentor_id)
        return Session.objects.create(mentor=mentor, **validated_data)


class SessionDetailSerializer(serializers.ModelSerializer):
    student_username  = serializers.CharField(source='student.username', read_only=True)
    mentor_username   = serializers.CharField(source='mentor.username', read_only=True)
    mentor_profile_id = serializers.IntegerField(source='mentor.mentor_profile.id', read_only=True)
    mentor_field      = serializers.CharField(source='mentor.mentor_profile.field_of_study', read_only=True)
    has_review        = serializers.SerializerMethodField()
    has_report        = serializers.SerializerMethodField()
    has_student_feedback = serializers.SerializerMethodField()

    class Meta:
        model  = Session
        fields = (
            'id', 'student_username', 'mentor_username', 'mentor_profile_id', 'mentor_field',
            'status', 'requested_time', 'goal',
            'meet_link', 'mentor_notes', 'created_at', 'has_review', 'has_report', 'has_student_feedback',
        )

    def get_has_review(self, obj):
        return hasattr(obj, 'review')

    def get_has_report(self, obj):
        return hasattr(obj, 'report')
    
    def get_has_student_feedback(self, obj):
        return hasattr(obj, 'student_feedback')


# ─────────────────────────────────────────────
# Review
# ─────────────────────────────────────────────
class ReviewSerializer(serializers.ModelSerializer):
    student_username = serializers.CharField(source='session.student.username', read_only=True)

    class Meta:
        model  = Review
        fields = ('id', 'student_username', 'rating', 'comment', 'created_at')
        read_only_fields = ('id', 'student_username', 'created_at')

    def validate_rating(self, value):
        if not (1 <= value <= 5):
            raise serializers.ValidationError("Rating must be between 1 and 5.")
        return value


# ─────────────────────────────────────────────
# Student Feedback (Mentor → Student)
# ─────────────────────────────────────────────
class StudentFeedbackSerializer(serializers.ModelSerializer):
    mentor_username = serializers.CharField(source='session.mentor.username', read_only=True)

    class Meta:
        model = StudentFeedback
        fields = ('id', 'mentor_username', 'engagement_rating', 'preparedness_rating', 'feedback_text', 'created_at')
        read_only_fields = ('id', 'mentor_username', 'created_at')

    def validate_engagement_rating(self, value):
        if not (1 <= value <= 5):
            raise serializers.ValidationError("Rating must be between 1 and 5.")
        return value

    def validate_preparedness_rating(self, value):
        if not (1 <= value <= 5):
            raise serializers.ValidationError("Rating must be between 1 and 5.")
        return value


# ─────────────────────────────────────────────
# Report
# ─────────────────────────────────────────────
class ReportSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Report
        fields = ('reason', 'details')

    def validate_details(self, value):
        if len(value.strip()) < 10:
            raise serializers.ValidationError("Details must be at least 10 characters.")
        return value


class AdminReportSerializer(serializers.ModelSerializer):
    reporter_username = serializers.CharField(source='reporter.username', read_only=True)
    reported_user_username = serializers.CharField(source='reported_user.username', read_only=True)
    reported_user_id = serializers.IntegerField(source='reported_user.id', read_only=True)
    resolved_by_username = serializers.CharField(source='resolved_by.username', read_only=True)
    session_info = serializers.SerializerMethodField()

    class Meta:
        model  = Report
        fields = (
            'id', 'reason', 'details', 'status', 'created_at',
            'reporter_username', 'reported_user_username', 'reported_user_id',
            'admin_note', 'resolved_at', 'resolved_by_username', 'session_info',
        )

    def get_session_info(self, obj):
        return {
            'id': obj.session.id,
            'requested_time': obj.session.requested_time,
            'goal': obj.session.goal,
        }


# ─────────────────────────────────────────────
# Resource
# ─────────────────────────────────────────────
class ResourceSerializer(serializers.ModelSerializer):
    author_username = serializers.CharField(source='author.username', read_only=True)

    class Meta:
        model  = Resource
        fields = ('id', 'title', 'category', 'body', 'author_username', 'published_at')
        read_only_fields = ('id', 'author_username', 'published_at')


# ─────────────────────────────────────────────
# Platform Settings
# ─────────────────────────────────────────────
class PlatformSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model  = PlatformSettings
        fields = ('platform_name', 'contact_email', 'maintenance_mode')


# ─────────────────────────────────────────────
# Admin Notification Settings
# ─────────────────────────────────────────────
class AdminNotificationSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model  = AdminNotificationSettings
        fields = (
            'notify_new_mentor', 'notify_mentor_verified',
            'notify_new_session', 'notify_session_completed',
        )


# ─────────────────────────────────────────────
# Audit Log
# ─────────────────────────────────────────────
class AuditLogSerializer(serializers.ModelSerializer):
    admin_username = serializers.CharField(source='admin.username', read_only=True)
    target_username = serializers.CharField(source='target_user.username', read_only=True)

    class Meta:
        model  = AuditLog
        fields = (
            'id', 'action', 'detail', 'created_at',
            'admin_username', 'target_username', 'target_id',
        )
class AdminUserListSerializer(serializers.ModelSerializer):
    mentor_profile = serializers.SerializerMethodField()

    class Meta:
        model  = User
        fields = (
            'id', 'username', 'email', 'phone', 'role',
            'is_suspended', 'is_deactivated', 'is_active',
            'date_joined', 'last_login', 'mentor_profile',
        )

    def get_mentor_profile(self, obj):
        if obj.role != 'mentor':
            return None
        try:
            p = obj.mentor_profile
            return {
                'university':    p.university,
                'field_of_study': p.field_of_study,
                'is_verified':   p.is_verified,
                'average_rating': p.average_rating,
            }
        except Exception:
            return None


class AdminSessionSummarySerializer(serializers.ModelSerializer):
    other_party = serializers.SerializerMethodField()

    class Meta:
        model  = Session
        fields = ('id', 'status', 'requested_time', 'goal', 'other_party', 'created_at')

    def get_other_party(self, obj):
        user = self.context.get('user')
        if user and obj.student_id == user.id:
            return obj.mentor.username
        return obj.student.username


class AdminUserDetailSerializer(serializers.ModelSerializer):
    mentor_profile = serializers.SerializerMethodField()
    recent_sessions = serializers.SerializerMethodField()
    review_count    = serializers.SerializerMethodField()

    class Meta:
        model  = User
        fields = (
            'id', 'username', 'email', 'phone', 'role',
            'is_suspended', 'is_deactivated', 'is_active',
            'date_joined', 'last_login',
            'mentor_profile', 'recent_sessions', 'review_count',
        )

    def get_mentor_profile(self, obj):
        if obj.role != 'mentor':
            return None
        try:
            p = obj.mentor_profile
            return {
                'university':     p.university,
                'field_of_study': p.field_of_study,
                'graduation_year': p.graduation_year,
                'bio':            p.bio,
                'is_verified':    p.is_verified,
                'average_rating': p.average_rating,
            }
        except Exception:
            return None

    def get_recent_sessions(self, obj):
        if obj.role == 'student':
            qs = Session.objects.filter(student=obj).select_related('mentor').order_by('-created_at')[:20]
        else:
            qs = Session.objects.filter(mentor=obj).select_related('student').order_by('-created_at')[:20]
        return AdminSessionSummarySerializer(qs, many=True, context={'user': obj}).data

    def get_review_count(self, obj):
        if obj.role == 'student':
            return Review.objects.filter(session__student=obj).count()
        return Review.objects.filter(session__mentor=obj).count()
