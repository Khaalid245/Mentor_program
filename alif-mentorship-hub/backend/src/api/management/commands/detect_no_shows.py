from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from api.models import Session


class Command(BaseCommand):
    help = 'Detect no-shows and apply penalties (run this daily via cron)'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Checking for no-shows...'))
        
        # Find accepted sessions where:
        # 1. Session time has passed (more than 2 hours ago to give grace period)
        # 2. Status is still 'accepted' (not marked as completed)
        cutoff_time = timezone.now() - timedelta(hours=2)
        no_show_sessions = Session.objects.filter(
            status='accepted',
            requested_time__lt=cutoff_time
        ).select_related('student', 'mentor')
        
        no_show_count = 0
        
        for session in no_show_sessions:
            # Mark session as cancelled
            session.status = 'cancelled'
            session.mentor_notes = 'Automatically cancelled due to no-show (session not marked as completed)'
            session.save(update_fields=['status', 'mentor_notes'])
            
            # Apply penalty to student (assuming student is responsible for no-show)
            # In a more sophisticated system, you'd determine who was responsible
            session.student.apply_no_show_penalty()
            
            no_show_count += 1
            
            self.stdout.write(
                self.style.WARNING(
                    f'No-show detected: Session #{session.id} ({session.student.username} → {session.mentor.username})'
                )
            )
            self.stdout.write(
                f'  Student reliability score: {session.student.reliability_score:.0f}/100'
            )
            if session.student.is_restricted():
                self.stdout.write(
                    self.style.ERROR(
                        f'  Student restricted until: {session.student.restriction_until}'
                    )
                )
        
        if no_show_count == 0:
            self.stdout.write(self.style.SUCCESS('No no-shows detected.'))
        else:
            self.stdout.write(
                self.style.SUCCESS(
                    f'\nProcessed {no_show_count} no-show(s). Penalties applied.'
                )
            )
        
        self.stdout.write(
            self.style.WARNING(
                '\nNote: Schedule this command to run daily via cron:\n'
                '0 2 * * * cd /path/to/project && python src/manage.py detect_no_shows'
            )
        )
