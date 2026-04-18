from django.core.management.base import BaseCommand
from django.utils import timezone
from api.models import User, MentorProfile, Session, Review, Resource


class Command(BaseCommand):
    help = "Seed the database with test users: 1 admin, 2 mentors, 2 students."

    def handle(self, *args, **options):
        self.stdout.write("\n── Seeding test users ──────────────────────────────")

        # ── Admin ─────────────────────────────────────────────────────────────
        admin = self._create_user(
            username="admin",
            password="Admin1234!",
            role="admin",
            email="admin@alifhub.so",
            phone="0611000001",
        )
        self.stdout.write(self.style.SUCCESS(f"  ✓ Admin     → username: admin       / password: Admin1234!"))

        # ── Mentors ───────────────────────────────────────────────────────────
        mentor1 = self._create_user(
            username="mentor_amina",
            password="Mentor1234!",
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
        self.stdout.write(self.style.SUCCESS(f"  ✓ Mentor 1  → username: mentor_amina / password: Mentor1234! (verified)"))

        mentor2 = self._create_user(
            username="mentor_hassan",
            password="Mentor1234!",
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
        self.stdout.write(self.style.WARNING(f"  ✓ Mentor 2  → username: mentor_hassan / password: Mentor1234! (pending verification)"))

        # ── Students ──────────────────────────────────────────────────────────
        student1 = self._create_user(
            username="student_fadumo",
            password="Student1234!",
            role="student",
            email="fadumo@alifhub.so",
            phone="0611000004",
        )
        self.stdout.write(self.style.SUCCESS(f"  ✓ Student 1 → username: student_fadumo / password: Student1234!"))

        student2 = self._create_user(
            username="student_omar",
            password="Student1234!",
            role="student",
            email="omar@alifhub.so",
            phone="0611000005",
        )
        self.stdout.write(self.style.SUCCESS(f"  ✓ Student 2 → username: student_omar  / password: Student1234!"))

        # ── Sample session (student1 → mentor1, completed with review) ────────
        self._create_sample_session(student1, mentor1, student2)

        self.stdout.write("\n── Summary ─────────────────────────────────────────")
        self.stdout.write("  Role     Username           Password")
        self.stdout.write("  ──────── ────────────────── ────────────")
        self.stdout.write("  admin    admin              Admin1234!")
        self.stdout.write("  mentor   mentor_amina       Mentor1234!  (verified)")
        self.stdout.write("  mentor   mentor_hassan      Mentor1234!  (needs admin verification)")
        self.stdout.write("  student  student_fadumo     Student1234!")
        self.stdout.write("  student  student_omar       Student1234!")
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
