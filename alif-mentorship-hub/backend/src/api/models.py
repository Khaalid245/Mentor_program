from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db.models.signals import post_save
from django.dispatch import receiver


# ─────────────────────────────────────────────
# Custom User
# ─────────────────────────────────────────────
class User(AbstractUser):
    ROLE_CHOICES = [
        ('student', 'Student'),
        ('mentor',  'Mentor'),
        ('admin',   'Admin'),
    ]
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='student')
    phone = models.CharField(max_length=20, blank=True)
    is_suspended    = models.BooleanField(default=False)
    is_deactivated  = models.BooleanField(default=False)
    
    # Cancellation tracking
    cancellation_count = models.IntegerField(default=0)
    no_show_count = models.IntegerField(default=0)
    reliability_score = models.FloatField(default=100.0)

    def save(self, *args, **kwargs):
        # Keep Django's is_staff in sync with the admin role so the
        # Django admin panel stays accessible for admin users.
        if self.role == 'admin':
            self.is_staff = True
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.username} ({self.role})"


# ─────────────────────────────────────────────
# Mentor Profile
# ─────────────────────────────────────────────
class MentorProfile(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='mentor_profile',
        db_index=True,
    )
    university       = models.CharField(max_length=200)
    graduation_year  = models.PositiveIntegerField()
    field_of_study   = models.CharField(max_length=200)
    bio              = models.TextField(blank=True)
    linkedin_url     = models.URLField(blank=True)
    # Stores a list of available time slots, e.g.:
    # [{"day": "Monday", "start": "09:00", "end": "17:00"}]
    availability     = models.JSONField(default=list, blank=True)
    # Set to True by admin only — controls whether profile is visible to students
    is_verified      = models.BooleanField(default=False)
    # Denormalised average — recalculated by signal every time a Review is saved
    average_rating   = models.FloatField(default=0.0)
    
    # Profile completeness tracking
    profile_completeness = models.IntegerField(default=0)
    years_of_experience = models.IntegerField(default=0)
    languages = models.JSONField(default=list, blank=True)

    def calculate_completeness(self):
        """Calculate profile completeness percentage (0-100)"""
        score = 0
        if self.bio and len(self.bio) >= 50:
            score += 25
        if self.linkedin_url:
            score += 15
        if self.field_of_study:
            score += 15
        if self.university:
            score += 15
        if self.years_of_experience > 0:
            score += 10
        if self.languages:
            score += 10
        if self.availability:
            score += 10
        return score
    
    def save(self, *args, **kwargs):
        self.profile_completeness = self.calculate_completeness()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.user.get_full_name()} — {self.field_of_study} ({self.university})"


# ─────────────────────────────────────────────
# Session
# ─────────────────────────────────────────────
class Session(models.Model):
    STATUS_CHOICES = [
        ('pending',   'Pending'),
        ('accepted',  'Accepted'),
        ('declined',  'Declined'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]

    student = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='sessions_as_student',
        db_index=True,
    )
    mentor = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='sessions_as_mentor',
        db_index=True,
    )
    status         = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    requested_time = models.DateTimeField()
    goal           = models.CharField(max_length=200)
    # Provided by mentor when accepting the session
    meet_link      = models.URLField(blank=True, null=True)
    # Added by mentor after the session is completed
    mentor_notes   = models.TextField(blank=True, null=True)
    created_at     = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return (
            f"Session #{self.pk}: {self.student.username} → "
            f"{self.mentor.username} | {self.status} | {self.requested_time:%Y-%m-%d %H:%M}"
        )


# ─────────────────────────────────────────────
# Review
# ─────────────────────────────────────────────
class Review(models.Model):
    # OneToOne enforces one review per session
    session = models.OneToOneField(
        Session,
        on_delete=models.CASCADE,
        related_name='review',
        db_index=True,
    )
    rating  = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    comment    = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    # NOTE: "student only" write rule is enforced in the serializer/view (Phase 2),
    # not here — the model stores data, business rules live in the API layer.

    def __str__(self):
        return f"Review for Session #{self.session_id} — {self.rating}/5"


# ─────────────────────────────────────────────
# Student Feedback (Mentor → Student)
# ─────────────────────────────────────────────
class StudentFeedback(models.Model):
    session = models.OneToOneField(
        Session,
        on_delete=models.CASCADE,
        related_name='student_feedback',
        db_index=True,
    )
    engagement_rating = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="How engaged was the student during the session?"
    )
    preparedness_rating = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="How prepared was the student for the session?"
    )
    feedback_text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Feedback for Session #{self.session_id} — Engagement: {self.engagement_rating}/5"


# ─────────────────────────────────────────────
# Report
# ─────────────────────────────────────────────
class Report(models.Model):
    REASON_CHOICES = [
        ('inappropriate_behavior', 'Inappropriate behavior'),
        ('no_show', 'No show'),
        ('unprofessional', 'Unprofessional'),
        ('other', 'Other'),
    ]
    
    STATUS_CHOICES = [
        ('open', 'Open'),
        ('resolved', 'Resolved'),
        ('dismissed', 'Dismissed'),
    ]

    reporter = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='reports_filed',
        db_index=True,
    )
    reported_user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='reports_received',
        db_index=True,
    )
    session = models.OneToOneField(
        Session,
        on_delete=models.CASCADE,
        related_name='report',
        db_index=True,
    )
    reason = models.CharField(max_length=30, choices=REASON_CHOICES)
    details = models.TextField(max_length=500)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='open')
    admin_note = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(blank=True, null=True)
    resolved_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reports_resolved',
        db_index=True,
    )

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Report #{self.pk}: {self.reporter.username} → {self.reported_user.username} | {self.reason}"


# ─────────────────────────────────────────────
# Audit Log
# ─────────────────────────────────────────────
class AuditLog(models.Model):
    ACTION_CHOICES = [
        ('verify_mentor', 'Verify mentor'),
        ('reject_mentor', 'Reject mentor'),
        ('suspend_user', 'Suspend user'),
        ('unsuspend_user', 'Unsuspend user'),
        ('deactivate_user', 'Deactivate user'),
        ('cancel_session', 'Cancel session'),
        ('resolve_report', 'Resolve report'),
        ('dismiss_report', 'Dismiss report'),
        ('publish_resource', 'Publish resource'),
        ('edit_resource', 'Edit resource'),
        ('delete_resource', 'Delete resource'),
        ('update_platform_settings', 'Update platform settings'),
    ]

    admin = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='audit_logs',
        db_index=True,
    )
    action = models.CharField(max_length=30, choices=ACTION_CHOICES)
    target_user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audit_logs_as_target',
        db_index=True,
    )
    target_id = models.IntegerField(null=True, blank=True)
    detail = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"AuditLog #{self.pk}: {self.admin.username} - {self.action}"


# ─────────────────────────────────────────────
# Resource
# ─────────────────────────────────────────────
class Resource(models.Model):
    CATEGORY_CHOICES = [
        ('university',    'University'),
        ('scholarships',  'Scholarships'),
        ('career',        'Career'),
        ('student_life',  'Student Life'),
    ]

    title        = models.CharField(max_length=300)
    category     = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    body         = models.TextField()
    author       = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='resources',
        db_index=True,
    )
    published_at = models.DateTimeField()

    class Meta:
        ordering = ['-published_at']

    def __str__(self):
        return f"{self.title} [{self.category}]"


# ─────────────────────────────────────────────
# Signal — recompute MentorProfile.average_rating
# whenever a Review is created or updated
# ─────────────────────────────────────────────
@receiver(post_save, sender=Review)
def update_mentor_average_rating(sender, instance, **kwargs):
    mentor_user = instance.session.mentor
    try:
        profile = mentor_user.mentor_profile
    except MentorProfile.DoesNotExist:
        return

    reviews = Review.objects.filter(session__mentor=mentor_user)
    count = reviews.count()
    if count == 0:
        profile.average_rating = 0.0
    else:
        total = sum(r.rating for r in reviews)
        profile.average_rating = round(total / count, 2)
    profile.save(update_fields=['average_rating'])


# ─────────────────────────────────────────────
# Platform Settings — singleton
# ─────────────────────────────────────────────
class PlatformSettings(models.Model):
    platform_name    = models.CharField(max_length=200, default='Alif Mentorship')
    contact_email    = models.EmailField(blank=True, default='')
    maintenance_mode = models.BooleanField(default=False)

    class Meta:
        verbose_name = 'Platform Settings'

    def __str__(self):
        return self.platform_name

    @classmethod
    def get_solo(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


# ─────────────────────────────────────────────
# Admin Notification Settings — per admin user
# ─────────────────────────────────────────────
class AdminNotificationSettings(models.Model):
    admin = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='notification_settings',
        db_index=True,
    )
    notify_new_mentor       = models.BooleanField(default=True)
    notify_mentor_verified  = models.BooleanField(default=True)
    notify_new_session      = models.BooleanField(default=False)
    notify_session_completed = models.BooleanField(default=False)

    def __str__(self):
        return f'Notification settings for {self.admin.username}'
