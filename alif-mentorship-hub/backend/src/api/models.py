from django.db import models
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError


def validate_file_size(file):
    """Reject files larger than 5MB."""
    limit = 5 * 1024 * 1024
    if file.size > limit:
        raise ValidationError("File size must not exceed 5MB.")

# ---------------------------------------
# Mentor Model (created by Admin)
# ---------------------------------------
class Mentor(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='mentor_profile')
    specialization = models.CharField(max_length=100)
    bio = models.TextField(blank=True, null=True)
    available = models.BooleanField(default=True)

    # NEW optional fields
    profile_picture = models.ImageField(upload_to='mentor_profiles/', blank=True, null=True)
    phone_number = models.CharField(max_length=20, blank=True, null=True)

    def __str__(self):
        return f"{self.user.username} - {self.specialization}"

    @property
    def name(self):
        return f"{self.user.first_name} {self.user.last_name}"

    @property
    def email(self):
        return self.user.email


# ---------------------------------------
# Career Path Model (managed by Admin)
# ---------------------------------------
class CareerPath(models.Model):
    title = models.CharField(max_length=150, unique=True)
    description = models.TextField()
    skills_required = models.TextField(blank=True, null=True)
    university_options = models.TextField(blank=True, null=True)
    scholarship_info = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name='career_paths'
    )

    def __str__(self):
        return self.title

    class Meta:
        ordering = ['title']


# ---------------------------------------
# Student Goal Model
# ---------------------------------------
class StudentGoal(models.Model):
    STATUS_CHOICES = [
        ('Exploring', 'Exploring'),
        ('Decided', 'Decided'),
        ('Applying', 'Applying'),
        ('Enrolled', 'Enrolled'),
    ]

    student = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name='goal'
    )
    career_path = models.ForeignKey(
        CareerPath, on_delete=models.SET_NULL, null=True, related_name='student_goals'
    )
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default='Exploring'
    )
    mentor_notes = models.TextField(blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.student.username} → {self.career_path} ({self.status})"


# ---------------------------------------
# Mentorship Session Model
# ---------------------------------------
class MentorshipSession(models.Model):
    OUTCOME_CHOICES = [
        ('Scheduled', 'Scheduled'),
        ('Completed', 'Completed'),
        ('Cancelled', 'Cancelled'),
    ]

    application = models.ForeignKey(
        'StudentApplication',
        on_delete=models.CASCADE,
        related_name='sessions'
    )
    mentor = models.ForeignKey(
        'Mentor',
        on_delete=models.CASCADE,
        related_name='sessions'
    )
    scheduled_at = models.DateTimeField()
    notes = models.TextField(blank=True, null=True)
    outcome = models.CharField(
        max_length=20, choices=OUTCOME_CHOICES, default='Scheduled'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Session: {self.application.user.username} with {self.mentor.user.username} on {self.scheduled_at}"

    class Meta:
        ordering = ['-scheduled_at']


# ---------------------------------------
# Student Application Model
# ---------------------------------------
class StudentApplication(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='application')

    # Personal info
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    dob = models.DateField()
    gender = models.CharField(max_length=20)
    national_id = models.CharField(max_length=50)
    phone = models.CharField(max_length=20)
    email = models.EmailField()
    address = models.CharField(max_length=255)

    # Academic info
    previous_school = models.CharField(max_length=255)
    previous_grade = models.CharField(max_length=100)
    gpa = models.DecimalField(max_digits=4, decimal_places=2)
    course = models.CharField(max_length=255)

    # Career guidance fields
    mentorship_interest = models.CharField(max_length=100, blank=True, null=True)
    career_goals = models.TextField(blank=True, null=True)
    why_mentorship = models.TextField(blank=True, null=True)

    # Documents
    certificate = models.FileField(upload_to='documents/certificates/', validators=[validate_file_size])
    transcript = models.FileField(upload_to='documents/transcripts/', null=True, blank=True, validators=[validate_file_size])
    passport_photo = models.FileField(upload_to='documents/passports/', validators=[validate_file_size])
    recommendation_letter = models.FileField(upload_to='documents/recommendations/', null=True, blank=True, validators=[validate_file_size])

    # Mentor assignment
    mentor = models.ForeignKey(
        Mentor, on_delete=models.SET_NULL, null=True, blank=True, related_name='students'
    )

    # Application review
    STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('Under Review', 'Under Review'),
        ('Approved', 'Approved'),
        ('Rejected', 'Rejected'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')
    feedback = models.TextField(blank=True, null=True)
    consultation_date = models.DateTimeField(blank=True, null=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} - {self.course} ({self.status})"

    class Meta:
        ordering = ['-created_at']
