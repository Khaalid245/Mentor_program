from django.core.management.base import BaseCommand
from django.utils import timezone
from api.models import User, MentorProfile, Session, Review, Resource
from api.secrets import secrets_manager
import os


class Command(BaseCommand):
    help = "Seed the database with test users: 1 admin, 2 mentors, 2 students."

    def handle(self, *args, **options):
        self.stdout.write("\n── Seeding test users ──────────────────────────────")
        
        # Get secure passwords from environment or generate them
        admin_password = secrets_manager.get_secret('SEED_ADMIN_PASSWORD', required=False)
        mentor_password = secrets_manager.get_secret('SEED_MENTOR_PASSWORD', required=False)
        student_password = secrets_manager.get_secret('SEED_STUDENT_PASSWORD', required=False)
        
        # If not provided, generate secure passwords
        if not admin_password:
            admin_password = secrets_manager.generate_secure_password()
            self.stdout.write(self.style.WARNING(f"Generated admin password: {admin_password}"))
        
        if not mentor_password:
            mentor_password = secrets_manager.generate_secure_password()
            self.stdout.write(self.style.WARNING(f"Generated mentor password: {mentor_password}"))
        
        if not student_password:
            student_password = secrets_manager.generate_secure_password()
            self.stdout.write(self.style.WARNING(f"Generated student password: {student_password}"))

        # ── Admin ─────────────────────────────────────────────────────────────
        admin = self._create_user(
            username="admin",
            password=admin_password,
            role="admin",
            email="admin@alifhub.so",
            phone="0611000001",
        )
        self.stdout.write(self.style.SUCCESS(f"  ✓ Admin     → username: admin       / password: [SECURE]"))

        # ── Mentors ───────────────────────────────────────────────────────────
        mentor1 = self._create_user(
            username="mentor_amina",
            password=mentor_password,
            role="mentor",
            email="amina@alifhub.so",
            phone="0611000002",
        )
        self._create_mentor_profile(
            user=mentor1,
            university="University of Mogadishu",
            graduation_year=2020,
            field_of_study="Software Engineering",
            bio=(
                "I am a software engineer with 4 years of experience building "
                "web and mobile applications. I am passionate about helping "
                "Somali students break into the tech industry."
            ),
            linkedin_url="https://linkedin.com/in/amina-mentor",
            availability=[
                {"day": "Monday",    "start": "10:00", "end": "12:00"},
                {"day": "Wednesday", "start": "14:00", "end": "16:00"},
                {"day": "Friday",    "start": "09:00", "end": "11:00"},
            ],
            is_verified=True,
        )
        self.stdout.write(self.style.SUCCESS(f"  ✓ Mentor 1  → username: mentor_amina / password: [SECURE] (verified)"))

        mentor2 = self._create_user(
            username="mentor_hassan",
            password=mentor_password,
            role="mentor",
            email="hassan@alifhub.so",
            phone="0611000003",
        )
        self._create_mentor_profile(
            user=mentor2,
            university="Somali National University",
            graduation_year=2019,
            field_of_study="Business Administration",
            bio=(
                "Business consultant and entrepreneur with experience in "
                "East African markets. I help students understand business, "
                "finance, and how to build sustainable careers."
            ),
            linkedin_url="https://linkedin.com/in/hassan-mentor",
            availability=[
                {"day": "Tuesday",  "start": "08:00", "end": "10:00"},
                {"day": "Thursday", "start": "15:00", "end": "17:00"},
            ],
            is_verified=False,  # pending — admin must verify
        )
        self.stdout.write(self.style.WARNING(f"  ✓ Mentor 2  → username: mentor_hassan / password: [SECURE] (pending verification)"))

        # ── Students ──────────────────────────────────────────────────────────
        student1 = self._create_user(
            username="student_fadumo",
            password=student_password,
            role="student",
            email="fadumo@alifhub.so",
            phone="0611000004",
        )
        self.stdout.write(self.style.SUCCESS(f"  ✓ Student 1 → username: student_fadumo / password: [SECURE]"))

        student2 = self._create_user(
            username="student_omar",
            password=student_password,
            role="student",
            email="omar@alifhub.so",
            phone="0611000005",
        )
        self.stdout.write(self.style.SUCCESS(f"  ✓ Student 2 → username: student_omar  / password: [SECURE]"))

        # ── Sample session (student1 → mentor1, completed with review) ────────
        self._create_sample_session(student1, mentor1, student2)

        self.stdout.write("\n── Summary ─────────────────────────────────────────")
        self.stdout.write("  Role     Username           Password")
        self.stdout.write("  ──────── ────────────────── ────────────")
        self.stdout.write("  admin    admin              [SECURE - Check logs above]")
        self.stdout.write("  mentor   mentor_amina       [SECURE - Check logs above]")
        self.stdout.write("  mentor   mentor_hassan      [SECURE - Check logs above]")
        self.stdout.write("  student  student_fadumo     [SECURE - Check logs above]")
        self.stdout.write("  student  student_omar       [SECURE - Check logs above]")
        self.stdout.write("\n  ⚠️  IMPORTANT: Passwords are generated securely and shown above.")
        self.stdout.write("  💡 TIP: Set SEED_ADMIN_PASSWORD, SEED_MENTOR_PASSWORD, SEED_STUDENT_PASSWORD")
        self.stdout.write("          in your .env file to use custom passwords.")
        self.stdout.write("\n  Login at: http://localhost:5173/login")
        self.stdout.write("  Admin panel: http://localhost:8000/admin/\n")

    # ── Helpers ───────────────────────────────────────────────────────────────

    def _create_user(self, username, password, role, email, phone):
        user, created = User.objects.get_or_create(username=username)
        if created:
            user.set_password(password)
            user.role  = role
            user.email = email
            user.phone = phone
            if role == "admin":
                user.is_staff     = True
                user.is_superuser = True
            user.save()
        return user

    def _create_mentor_profile(self, user, university, graduation_year,
                                field_of_study, bio, linkedin_url,
                                availability, is_verified):
        MentorProfile.objects.get_or_create(
            user=user,
            defaults=dict(
                university=university,
                graduation_year=graduation_year,
                field_of_study=field_of_study,
                bio=bio,
                linkedin_url=linkedin_url,
                availability=availability,
                is_verified=is_verified,
            ),
        )

    def _create_sample_session(self, student, mentor, student2):
        """Create one completed session with a review, and one pending session."""
        mentor_user = mentor  # mentor user object

        # Completed session with review
        session1, created = Session.objects.get_or_create(
            student=student,
            mentor=mentor_user,
            defaults=dict(
                status="completed",
                requested_time=timezone.now().replace(hour=10, minute=0, second=0, microsecond=0),
                goal="I want to learn how to start my career in software engineering.",
                meet_link="https://meet.google.com/test-link-001",
                mentor_notes="Fadumo showed great enthusiasm. We discussed Python basics and career roadmap.",
            ),
        )
        if created:
            Review.objects.get_or_create(
                session=session1,
                defaults=dict(rating=5, comment="Amazing session! Very helpful and encouraging."),
            )
            self.stdout.write(self.style.SUCCESS("  ✓ Sample completed session + review created"))

        # Pending session
        Session.objects.get_or_create(
            student=student2,
            mentor=mentor_user,
            defaults=dict(
                status="pending",
                requested_time=timezone.now().replace(hour=14, minute=0, second=0, microsecond=0),
                goal="I need guidance on choosing between engineering and business.",
            ),
        )
        self.stdout.write(self.style.SUCCESS("  ✓ Sample pending session created"))