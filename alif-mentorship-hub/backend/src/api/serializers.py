from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Mentor, StudentApplication, MentorshipSession, CareerPath, StudentGoal

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)
    password2 = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ['id','username','email','first_name','last_name','password','password2']

    def validate(self, data):
        # If creating via this serializer, ensure passwords match when provided
        password = data.get('password')
        password2 = data.get('password2')
        if password or password2:
            if password != password2:
                raise serializers.ValidationError({"password": "Passwords do not match."})
        return data

    def create(self, validated_data):
        # used for registration endpoint
        validated_data.pop('password2', None)
        password = validated_data.pop('password', None)

        user = User(**validated_data)
        if password:
            user.set_password(password)
        else:
            # If no password provided for some reason, you may want to set unusable password or raise
            user.set_unusable_password()
        user.save()
        return user


class MentorSerializer(serializers.ModelSerializer):
    # keep nested user read-only (student dashboard will get first_name/last_name/email via this nested user)
    user = UserSerializer(read_only=True)
    # New fields to expose
    profile_picture = serializers.ImageField(read_only=True)
    phone_number = serializers.CharField(read_only=True, allow_null=True)

    class Meta:
        model = Mentor
        fields = ['id', 'user', 'specialization', 'bio', 'available', 'profile_picture', 'phone_number']


class CareerPathSerializer(serializers.ModelSerializer):
    class Meta:
        model = CareerPath
        fields = [
            'id', 'title', 'description',
            'skills_required', 'university_options', 'scholarship_info'
        ]


class StudentGoalSerializer(serializers.ModelSerializer):
    career_path = CareerPathSerializer(read_only=True)
    career_path_id = serializers.PrimaryKeyRelatedField(
        queryset=CareerPath.objects.all(),
        source='career_path',
        write_only=True
    )
    student_name = serializers.SerializerMethodField(read_only=True)
    student_id = serializers.PrimaryKeyRelatedField(read_only=True, source='student')

    class Meta:
        model = StudentGoal
        fields = [
            'id', 'student_id', 'student_name', 'career_path', 'career_path_id',
            'status', 'mentor_notes', 'updated_at'
        ]
        read_only_fields = ['student_id', 'student_name', 'updated_at']

    def get_student_name(self, obj):
        return f"{obj.student.first_name} {obj.student.last_name}".strip()


class MentorshipSessionSerializer(serializers.ModelSerializer):
    # Read-only display fields
    mentor_name = serializers.SerializerMethodField(read_only=True)
    application_id = serializers.PrimaryKeyRelatedField(read_only=True, source='application')

    class Meta:
        model = MentorshipSession
        fields = [
            'id', 'application_id', 'mentor_name',
            'scheduled_at', 'notes', 'outcome',
            'created_at', 'updated_at'
        ]
        # Mentor is set automatically from request.user in the view
        read_only_fields = ['mentor_name', 'application_id', 'created_at', 'updated_at']

    def get_mentor_name(self, obj):
        return f"{obj.mentor.user.first_name} {obj.mentor.user.last_name}".strip()


class StudentApplicationSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    mentor = MentorSerializer(read_only=True)
    mentor_id = serializers.PrimaryKeyRelatedField(
        queryset=Mentor.objects.all(),
        source='mentor',
        write_only=True,
        required=False
    )

    class Meta:
        model = StudentApplication
        fields = [
            'id','user','mentor','mentor_id','first_name','last_name','dob','gender',
            'national_id','phone','email','address','previous_school','previous_grade',
            'gpa','course','mentorship_interest','career_goals','why_mentorship',
            'certificate','transcript','passport_photo',
            'recommendation_letter','status','feedback','consultation_date',
            'created_at','updated_at'
        ]
