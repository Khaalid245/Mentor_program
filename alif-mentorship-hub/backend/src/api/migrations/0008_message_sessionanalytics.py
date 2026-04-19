# Generated migration for Phase 3 messaging and analytics

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django.core.validators


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0007_mentorprofile_timezone'),
    ]

    operations = [
        migrations.CreateModel(
            name='Message',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('content', models.TextField()),
                ('is_read', models.BooleanField(default=False)),
                ('read_at', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('recipient', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='received_messages', to=settings.AUTH_USER_MODEL, db_index=True)),
                ('sender', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='sent_messages', to=settings.AUTH_USER_MODEL, db_index=True)),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='SessionAnalytics',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('skills_learned', models.JSONField(blank=True, default=list)),
                ('goals_achieved', models.IntegerField(default=0)),
                ('satisfaction_rating', models.IntegerField(blank=True, null=True, validators=[django.core.validators.MinValueValidator(1), django.core.validators.MaxValueValidator(5)])),
                ('student_engagement', models.IntegerField(blank=True, null=True, validators=[django.core.validators.MinValueValidator(1), django.core.validators.MaxValueValidator(5)])),
                ('mentor_effectiveness', models.IntegerField(blank=True, null=True, validators=[django.core.validators.MinValueValidator(1), django.core.validators.MaxValueValidator(5)])),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('mentor', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='mentor_analytics', to=settings.AUTH_USER_MODEL, db_index=True)),
                ('session', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='analytics', to='api.session', db_index=True)),
                ('student', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='student_analytics', to=settings.AUTH_USER_MODEL, db_index=True)),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='message',
            index=models.Index(fields=['sender', 'recipient', '-created_at'], name='api_message_sender_recipient_created_idx'),
        ),
        migrations.AddIndex(
            model_name='message',
            index=models.Index(fields=['is_read', 'recipient'], name='api_message_is_read_recipient_idx'),
        ),
    ]
