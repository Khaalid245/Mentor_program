from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Mentor, StudentApplication

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['id','username','email','first_name','last_name','password','password2']

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError({"password": "Passwords do not match."})
        return data

    def create(self, validated_data):
        validated_data.pop('password2')
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user

class MentorSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Mentor
        fields = ['id', 'user', 'specialization', 'bio', 'available']

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
            'gpa','course','certificate','transcript','passport_photo',
            'recommendation_letter','status','feedback','consultation_date',
            'created_at','updated_at'
        ]
