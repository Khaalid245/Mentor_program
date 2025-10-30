from django.contrib import admin
from django.contrib.auth.models import User, Group
from django import forms
from .models import Mentor, StudentApplication

# Hide default User and Group
admin.site.unregister(User)
admin.site.unregister(Group)

# Custom form for Mentor
class MentorForm(forms.ModelForm):
    username = forms.CharField(max_length=150, required=True)
    password = forms.CharField(max_length=128, required=True, widget=forms.PasswordInput)
    confirm_password = forms.CharField(max_length=128, required=True, widget=forms.PasswordInput)
    first_name = forms.CharField(max_length=100, required=True)
    last_name = forms.CharField(max_length=100, required=True)
    email = forms.EmailField(required=True)

    class Meta:
        model = Mentor
        fields = (
            'username', 'password', 'confirm_password',
            'first_name', 'last_name', 'email',
            'specialization', 'bio', 'available'
        )

    def clean(self):
        cleaned_data = super().clean()
        password = cleaned_data.get("password")
        confirm_password = cleaned_data.get("confirm_password")
        username = cleaned_data.get("username")
        email = cleaned_data.get("email")

        if password != confirm_password:
            raise forms.ValidationError("Passwords do not match.")

        if User.objects.filter(username=username).exists():
            raise forms.ValidationError("Username already exists.")

        if User.objects.filter(email=email).exists():
            raise forms.ValidationError("Email already exists.")
        return cleaned_data

# Mentor Admin
@admin.register(Mentor)
class MentorAdmin(admin.ModelAdmin):
    form = MentorForm
    list_display = ('get_full_name', 'get_email', 'get_username', 'specialization', 'available')
    search_fields = ('user__username', 'user__email', 'specialization')
    list_filter = ('available', 'specialization')

    def save_model(self, request, obj, form, change):
        if not obj.pk:
            user = User.objects.create_user(
                username=form.cleaned_data['username'],
                password=form.cleaned_data['password'],
                email=form.cleaned_data['email'],
                first_name=form.cleaned_data['first_name'],
                last_name=form.cleaned_data['last_name']
            )
            obj.user = user
        super().save_model(request, obj, form, change)

    def get_full_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}"
    get_full_name.short_description = "Name"

    def get_email(self, obj):
        return obj.user.email
    get_email.short_description = "Email"

    def get_username(self, obj):
        return obj.user.username
    get_username.short_description = "Username"

# Student Application Admin
@admin.register(StudentApplication)
class StudentApplicationAdmin(admin.ModelAdmin):
    list_display = (
        'first_name', 'last_name', 'email', 'course',
        'status', 'mentor', 'consultation_date', 'created_at'
    )
    list_filter = ('status', 'course', 'mentor')
    search_fields = ('first_name', 'last_name', 'email', 'mentor__user__username')
    ordering = ('-created_at',)
    list_per_page = 25
