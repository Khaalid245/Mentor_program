from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone


def send_session_request_notification(session):
    """Notify mentor when student requests a session"""
    if not session.mentor.email:
        return
    
    subject = f'New session request from {session.student.username}'
    message = f"""
Hello {session.mentor.username},

{session.student.username} has requested a mentorship session with you.

Session Details:
- Requested Time: {session.requested_time.strftime('%B %d, %Y at %I:%M %p')}
- Goal: {session.goal}

Please log in to your dashboard to accept or decline this request.

Best regards,
Alif Mentorship Hub
    """.strip()
    
    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[session.mentor.email],
        fail_silently=True,
    )


def send_session_accepted_notification(session):
    """Notify student when mentor accepts their session"""
    if not session.student.email:
        return
    
    subject = f'{session.mentor.username} accepted your session request!'
    message = f"""
Hello {session.student.username},

Great news! {session.mentor.username} has accepted your session request.

Session Details:
- Time: {session.requested_time.strftime('%B %d, %Y at %I:%M %p')}
- Goal: {session.goal}
- Meeting Link: {session.meet_link or 'Will be provided soon'}

Please log in to your dashboard to view the meeting details.

Best regards,
Alif Mentorship Hub
    """.strip()
    
    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[session.student.email],
        fail_silently=True,
    )


def send_session_declined_notification(session):
    """Notify student when mentor declines their session"""
    if not session.student.email:
        return
    
    subject = f'Session request update from {session.mentor.username}'
    message = f"""
Hello {session.student.username},

Unfortunately, {session.mentor.username} is unable to accept your session request for {session.requested_time.strftime('%B %d, %Y at %I:%M %p')}.

Don't worry! You can:
- Request a different time with the same mentor
- Browse other mentors who might be available

Log in to your dashboard to explore more mentors.

Best regards,
Alif Mentorship Hub
    """.strip()
    
    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[session.student.email],
        fail_silently=True,
    )


def send_session_completed_notification(session):
    """Notify student when session is marked as completed"""
    if not session.student.email:
        return
    
    subject = f'Your session with {session.mentor.username} is complete!'
    message = f"""
Hello {session.student.username},

Your mentorship session with {session.mentor.username} has been completed.

We'd love to hear about your experience! Please take a moment to leave a review for {session.mentor.username}.

Log in to your dashboard to submit your review.

Best regards,
Alif Mentorship Hub
    """.strip()
    
    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[session.student.email],
        fail_silently=True,
    )


def send_session_reminder(session):
    """Send reminder 24 hours before session"""
    hours_until = (session.requested_time - timezone.now()).total_seconds() / 3600
    if not (23 <= hours_until <= 25):  # Only send if 23-25 hours away
        return
    
    # Notify student
    if session.student.email:
        subject = f'Reminder: Session with {session.mentor.username} tomorrow'
        message = f"""
Hello {session.student.username},

This is a reminder that you have a mentorship session scheduled for tomorrow.

Session Details:
- Time: {session.requested_time.strftime('%B %d, %Y at %I:%M %p')}
- Mentor: {session.mentor.username}
- Meeting Link: {session.meet_link or 'Check your dashboard'}

See you there!

Best regards,
Alif Mentorship Hub
        """.strip()
        
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[session.student.email],
            fail_silently=True,
        )
    
    # Notify mentor
    if session.mentor.email:
        subject = f'Reminder: Session with {session.student.username} tomorrow'
        message = f"""
Hello {session.mentor.username},

This is a reminder that you have a mentorship session scheduled for tomorrow.

Session Details:
- Time: {session.requested_time.strftime('%B %d, %Y at %I:%M %p')}
- Student: {session.student.username}
- Goal: {session.goal}

See you there!

Best regards,
Alif Mentorship Hub
        """.strip()
        
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[session.mentor.email],
            fail_silently=True,
        )


def send_mentor_verified_notification(mentor_profile):
    """Notify mentor when admin verifies their profile"""
    if not mentor_profile.user.email:
        return
    
    subject = 'Congratulations! Your mentor profile has been verified'
    message = f"""
Hello {mentor_profile.user.username},

Great news! Your mentor profile has been verified by our team.

You are now visible to students and can start receiving session requests.

Profile Details:
- University: {mentor_profile.university}
- Field of Study: {mentor_profile.field_of_study}
- Graduation Year: {mentor_profile.graduation_year}

Log in to your dashboard to update your availability and start mentoring!

Best regards,
Alif Mentorship Hub
    """.strip()
    
    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[mentor_profile.user.email],
        fail_silently=True,
    )


def send_report_resolved_notification(report):
    """Notify reporter when admin resolves their report"""
    if not report.reporter.email:
        return
    
    subject = f'Your report has been resolved'
    message = f"""
Hello {report.reporter.username},

Your report regarding {report.reported_user.username} has been reviewed and resolved by our team.

Report Details:
- Reason: {report.get_reason_display()}
- Status: {report.get_status_display()}

Admin Note: {report.admin_note}

Thank you for helping us maintain a safe and professional community.

Best regards,
Alif Mentorship Hub
    """.strip()
    
    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[report.reporter.email],
        fail_silently=True,
    )


def send_session_cancelled_notification(session, cancelled_by):
    """Notify the other party when session is cancelled"""
    if cancelled_by == session.student:
        # Student cancelled, notify mentor
        if not session.mentor.email:
            return
        recipient = session.mentor
        canceller = session.student
    else:
        # Mentor or admin cancelled, notify student
        if not session.student.email:
            return
        recipient = session.student
        canceller = cancelled_by
    
    subject = f'Session cancelled by {canceller.username}'
    message = f"""
Hello {recipient.username},

Your scheduled session has been cancelled.

Session Details:
- Originally scheduled: {session.requested_time.strftime('%B %d, %Y at %I:%M %p')}
- Cancelled by: {canceller.username}

You can browse other mentors or reschedule with a different time.

Best regards,
Alif Mentorship Hub
    """.strip()
    
    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[recipient.email],
        fail_silently=True,
    )
