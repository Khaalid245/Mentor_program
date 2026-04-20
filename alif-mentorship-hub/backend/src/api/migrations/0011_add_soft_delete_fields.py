# Generated migration for soft delete functionality - MySQL compatible

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0010_add_performance_indexes'),
    ]

    operations = [
        # Add soft delete fields to Session model
        migrations.AddField(
            model_name='session',
            name='deleted_at',
            field=models.DateTimeField(blank=True, db_index=True, null=True),
        ),
        migrations.AddField(
            model_name='session',
            name='deleted_by',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='session_deleted_objects', to='api.user'),
        ),
        
        # Add soft delete fields to Review model
        migrations.AddField(
            model_name='review',
            name='deleted_at',
            field=models.DateTimeField(blank=True, db_index=True, null=True),
        ),
        migrations.AddField(
            model_name='review',
            name='deleted_by',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='review_deleted_objects', to='api.user'),
        ),
        
        # Add soft delete fields to Report model
        migrations.AddField(
            model_name='report',
            name='deleted_at',
            field=models.DateTimeField(blank=True, db_index=True, null=True),
        ),
        migrations.AddField(
            model_name='report',
            name='deleted_by',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='report_deleted_objects', to='api.user'),
        ),
        
        # Add archive fields to MentorProfile model
        migrations.AddField(
            model_name='mentorprofile',
            name='archived_at',
            field=models.DateTimeField(blank=True, db_index=True, null=True),
        ),
        migrations.AddField(
            model_name='mentorprofile',
            name='archived_by',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='mentorprofile_archived_objects', to='api.user'),
        ),
        
        # Add archive fields to Resource model
        migrations.AddField(
            model_name='resource',
            name='archived_at',
            field=models.DateTimeField(blank=True, db_index=True, null=True),
        ),
        migrations.AddField(
            model_name='resource',
            name='archived_by',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='resource_archived_objects', to='api.user'),
        ),
        
        # Add version tracking fields
        migrations.AddField(
            model_name='mentorprofile',
            name='version',
            field=models.PositiveIntegerField(default=1),
        ),
        migrations.AddField(
            model_name='session',
            name='version',
            field=models.PositiveIntegerField(default=1),
        ),
    ]