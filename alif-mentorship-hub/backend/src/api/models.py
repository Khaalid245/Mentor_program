from django.db import models
from django.contrib.auth.models import User

# ---------------------------------------
# Mentor Model (created by Admin)
# ---------------------------------------
class Mentor(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='mentor_profile')
    specialization = models.CharField(max_length=100)
    bio = models.TextField(blank=True, null=True)
    available = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.user.username} - {self.specialization}"

    @property
    def name(self):
        return f"{self.user.first_name} {self.user.last_name}"

    @property
    def email(self):
        return self.user.email

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

    # Documents
    certificate = models.FileField(upload_to='documents/certificates/')
    transcript = models.FileField(upload_to='documents/transcripts/', null=True, blank=True)
    passport_photo = models.FileField(upload_to='documents/passports/')
    recommendation_letter = models.FileField(upload_to='documents/recommendations/')

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
