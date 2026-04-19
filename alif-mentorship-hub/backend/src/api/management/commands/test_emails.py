from django.core.management.base import BaseCommand
from api.models import User, Session, MentorProfile
from api.email import (
    send_session_request_notification,
    send_session_accepted_notification,
    send_mentor_verified_notification,
)


class Command(BaseCommand):
    help = 'Test email notifications system'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Testing email notifications...'))
        
        # Test 1: Session request notification
        try:
            session = Session.objects.filter(status='pending').first()
            if session:
                self.stdout.write('Sending session request notification...')
                send_session_request_notification(session)
                self.stdout.write(self.style.SUCCESS('✓ Session request email sent'))
            else:
                self.stdout.write(self.style.WARNING('No pending sessions found'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'✗ Session request failed: {e}'))
        
        # Test 2: Session accepted notification
        try:
            session = Session.objects.filter(status='accepted').first()
            if session:
                self.stdout.write('Sending session accepted notification...')
                send_session_accepted_notification(session)
                self.stdout.write(self.style.SUCCESS('✓ Session accepted email sent'))
            else:
                self.stdout.write(self.style.WARNING('No accepted sessions found'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'✗ Session accepted failed: {e}'))
        
        # Test 3: Mentor verified notification
        try:
            profile = MentorProfile.objects.filter(is_verified=True).first()
            if profile:
                self.stdout.write('Sending mentor verified notification...')
                send_mentor_verified_notification(profile)
                self.stdout.write(self.style.SUCCESS('✓ Mentor verified email sent'))
            else:
                self.stdout.write(self.style.WARNING('No verified mentors found'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'✗ Mentor verified failed: {e}'))
        
        self.stdout.write(self.style.SUCCESS('\nEmail test complete! Check console output above.'))
