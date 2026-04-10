from django.contrib import admin
from django.contrib.auth.models import User, Group
from django import forms
from django.utils.translation import gettext_lazy as _
from .models import Mentor, StudentApplication, CareerPath, StudentGoal

# Hide default User and Group
# (If they are not registered/unregistered in your project this may raise — but since your prior file did this, we keep it.)
try:
    admin.site.unregister(User)
except Exception:
    pass

try:
    admin.site.unregister(Group)
except Exception:
    pass


# Custom form for Mentor
class MentorForm(forms.ModelForm):
    # Always show username/email/name fields so admin can edit them.
    username = forms.CharField(max_length=150, required=True)
    first_name = forms.CharField(max_length=100, required=True)
    last_name = forms.CharField(max_length=100, required=True)
    email = forms.EmailField(required=True)

    # Creation-only password fields (required on create)
    password = forms.CharField(max_length=128, required=False, widget=forms.PasswordInput, label=_("Password"))
    confirm_password = forms.CharField(
        max_length=128, required=False, widget=forms.PasswordInput, label=_("Confirm password")
    )

    # Edit-only optional password change
    new_password = forms.CharField(
        max_length=128, required=False, widget=forms.PasswordInput, label=_("New password")
    )
    confirm_new_password = forms.CharField(
        max_length=128, required=False, widget=forms.PasswordInput, label=_("Confirm new password")
    )

    # Mentor model fields (including new ones)
    profile_picture = forms.ImageField(required=False)
    phone_number = forms.CharField(max_length=20, required=False)

    class Meta:
        model = Mentor
        fields = (
            'username', 'first_name', 'last_name', 'email',
            'password', 'confirm_password',
            'new_password', 'confirm_new_password',
            'specialization', 'bio', 'available',
            'profile_picture', 'phone_number',
        )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        # If editing an existing Mentor (instance exists), creation password fields are not required.
        if self.instance and self.instance.pk:
            self.fields['password'].required = False
            self.fields['confirm_password'].required = False

            # Populate user fields with existing user data by default (helps admin)
            try:
                self.initial.setdefault('username', self.instance.user.username)
                self.initial.setdefault('first_name', self.instance.user.first_name)
                self.initial.setdefault('last_name', self.instance.user.last_name)
                self.initial.setdefault('email', self.instance.user.email)
            except Exception:
                # in case user relation is missing (shouldn't happen), ignore
                pass
        else:
            # Creating new mentor: require creation password fields
            self.fields['password'].required = True
            self.fields['confirm_password'].required = True

    def clean(self):
        cleaned_data = super().clean()

        username = cleaned_data.get("username")
        email = cleaned_data.get("email")

        # Validate username uniqueness (exclude current user's username if editing)
        if username:
            qs = User.objects.filter(username=username)
            if self.instance and getattr(self.instance, 'user', None):
                qs = qs.exclude(pk=self.instance.user.pk)
            if qs.exists():
                raise forms.ValidationError({"username": "Username already exists."})

        # Validate email uniqueness
        if email:
            qs = User.objects.filter(email=email)
            if self.instance and getattr(self.instance, 'user', None):
                qs = qs.exclude(pk=self.instance.user.pk)
            if qs.exists():
                raise forms.ValidationError({"email": "Email already exists."})

        # Password logic:
        # - If creating: password & confirm_password must exist and match
        # - If editing and new_password provided: new_password & confirm_new_password must match
        password = cleaned_data.get("password")
        confirm_password = cleaned_data.get("confirm_password")
        new_password = cleaned_data.get("new_password")
        confirm_new_password = cleaned_data.get("confirm_new_password")

        if not (self.instance and self.instance.pk):
            # creating new mentor
            if not password or not confirm_password:
                raise forms.ValidationError({"password": "Password and confirmation are required."})
            if password != confirm_password:
                raise forms.ValidationError({"password": "Passwords do not match."})
        else:
            # editing: only validate if new_password was provided
            if new_password or confirm_new_password:
                if new_password != confirm_new_password:
                    raise forms.ValidationError({"new_password": "New passwords do not match."})

        return cleaned_data


# Mentor Admin
@admin.register(Mentor)
class MentorAdmin(admin.ModelAdmin):
    form = MentorForm
    list_display = ('get_full_name', 'get_email', 'get_username', 'specialization', 'available')
    search_fields = ('user__username', 'user__email', 'specialization')
    list_filter = ('available', 'specialization')

    def get_fieldsets(self, request, obj=None):
        # obj is None when creating, has a value when editing
        if obj is None:
            # CREATE — show creation password fields only
            return [
                ('Account Info', {
                    'fields': ('username', 'first_name', 'last_name', 'email')
                }),
                ('Set Password', {
                    'fields': ('password', 'confirm_password')
                }),
                ('Mentor Profile', {
                    'fields': ('specialization', 'bio', 'available', 'profile_picture', 'phone_number')
                }),
            ]
        else:
            # EDIT — show change password fields only
            return [
                ('Account Info', {
                    'fields': ('username', 'first_name', 'last_name', 'email')
                }),
                ('Change Password', {
                    'fields': ('new_password', 'confirm_new_password'),
                    'description': 'Leave blank to keep the current password.',
                }),
                ('Mentor Profile', {
                    'fields': ('specialization', 'bio', 'available', 'profile_picture', 'phone_number')
                }),
            ]

    def save_model(self, request, obj, form, change):
        """
        On create:
          - create a new User and set password (already validated above)
          - attach to Mentor

        On edit:
          - update user fields (username, email, first/last)
          - if new_password provided, set_password and save user
        """
        cleaned = form.cleaned_data

        if not obj.pk:
            # create new user
            user = User.objects.create_user(
                username=cleaned['username'],
                email=cleaned['email'],
                first_name=cleaned['first_name'],
                last_name=cleaned['last_name'],
            )
            # set password (create_user already sets password if provided, but using set_password ensures consistency)
            user.set_password(cleaned['password'])
            user.save()

            # attach and save mentor
            obj.user = user
            # profile_picture and phone_number are model fields and will be saved by super().save_model
        else:
            # updating existing mentor: update linked user info
            user = obj.user
            # update username/email/name only if changed
            if cleaned.get('username') and cleaned['username'] != user.username:
                user.username = cleaned['username']
            if cleaned.get('email') and cleaned['email'] != user.email:
                user.email = cleaned['email']
            if cleaned.get('first_name') is not None and cleaned['first_name'] != user.first_name:
                user.first_name = cleaned['first_name']
            if cleaned.get('last_name') is not None and cleaned['last_name'] != user.last_name:
                user.last_name = cleaned['last_name']

            # If new password provided, set it
            new_password = cleaned.get('new_password')
            if new_password:
                user.set_password(new_password)

            user.save()

        # Now let Django save the Mentor instance fields (including new profile_picture, phone_number)
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


@admin.register(CareerPath)
class CareerPathAdmin(admin.ModelAdmin):
    list_display = ('title', 'created_by')
    search_fields = ('title',)


@admin.register(StudentGoal)
class StudentGoalAdmin(admin.ModelAdmin):
    list_display = ('student', 'career_path', 'status', 'updated_at')
    list_filter = ('status', 'career_path')
    search_fields = ('student__username',)


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
