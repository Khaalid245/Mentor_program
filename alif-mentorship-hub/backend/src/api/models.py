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
