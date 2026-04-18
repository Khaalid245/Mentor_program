from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User, MentorProfile, Session, Review, Resource


# ─────────────────────────────────────────────
# Auth
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

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        # Auto-create blank MentorProfile when role is mentor
        if user.role == 'mentor':
            MentorProfile.objects.create(
                user=user,
                university='',
                graduation_year=2024,
                field_of_study='',
            )
        return user


# ─────────────────────────────────────────────
# Mentor Profile
# ─────────────────────────────────────────────
class MentorProfileSerializer(serializers.ModelSerializer):
    user_id    = serializers.IntegerField(source='user.id', read_only=True)
    username   = serializers.CharField(source='user.username', read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name  = serializers.CharField(source='user.last_name', read_only=True)

    class Meta:
        model  = MentorProfile
        fields = (
            'id', 'user_id', 'username', 'first_name', 'last_name',
            'university', 'graduation_year', 'field_of_study',
            'bio', 'linkedin_url', 'availability',
            'is_verified', 'average_rating',
        )
        read_only_fields = ('id', 'user_id', 'username', 'first_name', 'last_name',
                            'is_verified', 'average_rating')


class MentorProfileUpdateSerializer(serializers.ModelSerializer):
    """Used by mentor to update their own profile — restricted fields only."""
    class Meta:
        model  = MentorProfile
        fields = ('university', 'graduation_year', 'field_of_study',
                  'bio', 'linkedin_url', 'availability')


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
    """Full detail — used for retrieve, includes nested mentor profile summary."""
    student_username  = serializers.CharField(source='student.username', read_only=True)
    mentor_username   = serializers.CharField(source='mentor.username', read_only=True)
    mentor_profile_id = serializers.IntegerField(source='mentor.mentor_profile.id', read_only=True)
    has_review        = serializers.SerializerMethodField()

    class Meta:
        model  = Session
        fields = (
            'id', 'student_username', 'mentor_username', 'mentor_profile_id',
            'status', 'requested_time', 'goal',
            'meet_link', 'mentor_notes', 'created_at', 'has_review',
        )

    def get_has_review(self, obj):
        return hasattr(obj, 'review')


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
# Resource
# ─────────────────────────────────────────────
class ResourceSerializer(serializers.ModelSerializer):
    author_username = serializers.CharField(source='author.username', read_only=True)

    class Meta:
        model  = Resource
        fields = ('id', 'title', 'category', 'body', 'author_username', 'published_at')
        read_only_fields = ('id', 'author_username', 'published_at')
