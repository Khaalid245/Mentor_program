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
    restriction_until = models.DateTimeField(null=True, blank=True)

    def save(self, *args, **kwargs):
        # Keep Django's is_staff in sync with the admin role so the
        # Django admin panel stays accessible for admin users.
        if self.role == 'admin':
            self.is_staff = True
        super().save(*args, **kwargs)
    
    def is_restricted(self):
        """Check if user is currently restricted from booking sessions"""
        if not self.restriction_until:
            return False
        from django.utils import timezone
        return timezone.now() < self.restriction_until
    
    def calculate_reliability_score(self):
        """Calculate reliability score based on cancellations and no-shows"""
        # Start at 100, deduct 10 points per cancellation, 20 per no-show
        score = 100.0
        score -= (self.cancellation_count * 10)
        score -= (self.no_show_count * 20)
        return max(0.0, score)  # Never go below 0
    
    def apply_cancellation_penalty(self):
        """Apply penalty for late cancellation (< 24h before session)"""
        self.cancellation_count += 1
        self.reliability_score = self.calculate_reliability_score()
        
        # Restrict user after 3 cancellations (24 hour restriction)
        if self.cancellation_count >= 3:
            from django.utils import timezone
            from datetime import timedelta
            self.restriction_until = timezone.now() + timedelta(hours=24)
        
        self.save(update_fields=['cancellation_count', 'reliability_score', 'restriction_until'])
    
    def apply_no_show_penalty(self):
        """Apply penalty for no-show (session time passed, not marked complete)"""
        self.no_show_count += 1
        self.reliability_score = self.calculate_reliability_score()
        
        # Restrict user after 2 no-shows (48 hour restriction)
        if self.no_show_count >= 2:
            from django.utils import timezone
            from datetime import timedelta
            self.restriction_until = timezone.now() + timedelta(hours=48)
        
        self.save(update_fields=['no_show_count', 'reliability_score', 'restriction_until'])

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
    # Weekly recurring availability slots
    # Format: [{"day": 1, "start_time": "09:00", "end_time": "17:00", "timezone": "Africa/Mogadishu"}]
    # day: 0=Monday, 1=Tuesday, ..., 6=Sunday
    availability     = models.JSONField(default=list, blank=True)
    # Timezone for mentor's availability (default: Africa/Mogadishu)
    timezone         = models.CharField(max_length=50, default='Africa/Mogadishu')
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
    
    def get_available_slots(self, start_date, end_date):
        """Generate list of available time slots between start_date and end_date"""
        from datetime import datetime, timedelta
        import pytz
        
        if not self.availability:
            return []
        
        slots = []
        mentor_tz = pytz.timezone(self.timezone)
        current_date = start_date.date()
        end = end_date.date()
        
        while current_date <= end:
            weekday = current_date.weekday()  # 0=Monday, 6=Sunday
            
            # Check if mentor has availability on this weekday
            for slot in self.availability:
                if slot.get('day') == weekday:
                    # Parse start and end times
                    start_time_str = slot.get('start_time', '09:00')
                    end_time_str = slot.get('end_time', '17:00')
                    
                    # Create datetime objects in mentor's timezone
                    start_hour, start_min = map(int, start_time_str.split(':'))
                    end_hour, end_min = map(int, end_time_str.split(':'))
                    
                    slot_start = mentor_tz.localize(
                        datetime.combine(current_date, datetime.min.time().replace(hour=start_hour, minute=start_min))
                    )
                    slot_end = mentor_tz.localize(
                        datetime.combine(current_date, datetime.min.time().replace(hour=end_hour, minute=end_min))
                    )
                    
                    # Only include future slots
                    if slot_start > datetime.now(mentor_tz):
                        slots.append({
                            'start': slot_start.isoformat(),
                            'end': slot_end.isoformat(),
                            'day_name': current_date.strftime('%A'),
                            'date': current_date.isoformat(),
                        })
            
            current_date += timedelta(days=1)
        
        return slots
    
    def is_available_at(self, requested_datetime):
        """Check if mentor is available at a specific datetime"""
        import pytz
        
        if not self.availability:
            return False
        
        mentor_tz = pytz.timezone(self.timezone)
        requested_time = requested_datetime.astimezone(mentor_tz)
        weekday = requested_time.weekday()
        requested_time_str = requested_time.strftime('%H:%M')
        
        for slot in self.availability:
            if slot.get('day') == weekday:
                start_time = slot.get('start_time', '09:00')
                end_time = slot.get('end_time', '17:00')
                
                if start_time <= requested_time_str <= end_time:
                    return True
        
        return False
    
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


# ─────────────────────────────────────────────
# Mentor Favorites (Student → Mentor bookmarks)
# ─────────────────────────────────────────────
class MentorFavorite(models.Model):
    student = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='favorite_mentors',
        db_index=True,
    )
    mentor = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='favorited_by',
        db_index=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('student', 'mentor')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.student.username} → {self.mentor.username}"


# ─────────────────────────────────────────────
# Saved Search (Student's search preferences)
# ─────────────────────────────────────────────
class SavedSearch(models.Model):
    student = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='saved_searches',
        db_index=True,
    )
    name = models.CharField(max_length=100)
    # Search filters stored as JSON
    filters = models.JSONField(default=dict)
    # Example: {"field": "Software Engineering", "rating_min": 4, "languages": ["English", "Somali"]}
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return f"{self.student.username} - {self.name}"


# ─────────────────────────────────────────────
# Message (Real-time messaging)
# ─────────────────────────────────────────────
class Message(models.Model):
    sender = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='sent_messages',
        db_index=True,
    )
    recipient = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='received_messages',
        db_index=True,
    )
    content = models.TextField()
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['sender', 'recipient', '-created_at']),
            models.Index(fields=['is_read', 'recipient']),
        ]

    def __str__(self):
        return f"Message from {self.sender.username} to {self.recipient.username}"


# ─────────────────────────────────────────────
# Session Analytics
# ─────────────────────────────────────────────
class SessionAnalytics(models.Model):
    session = models.OneToOneField(
        Session,
        on_delete=models.CASCADE,
        related_name='analytics',
        db_index=True,
    )
    student = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='student_analytics',
        db_index=True,
    )
    mentor = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='mentor_analytics',
        db_index=True,
    )
    # Student metrics
    skills_learned = models.JSONField(default=list, blank=True)
    goals_achieved = models.IntegerField(default=0)
    satisfaction_rating = models.IntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    # Mentor metrics
    student_engagement = models.IntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    mentor_effectiveness = models.IntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Analytics for Session #{self.session_id}"
