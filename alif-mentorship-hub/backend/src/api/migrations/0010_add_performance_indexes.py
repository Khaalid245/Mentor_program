# Safe MySQL-compatible migration for performance indexes

from django.db import migrations, connection


def create_indexes_safely(apps, schema_editor):
    """Create indexes only if they don't already exist"""
    
    indexes_to_create = [
        ('idx_mentorprofile_is_verified', 'api_mentorprofile', 'is_verified'),
        ('idx_mentorprofile_average_rating', 'api_mentorprofile', 'average_rating'),
        ('idx_mentorprofile_years_experience', 'api_mentorprofile', 'years_of_experience'),
        ('idx_session_status', 'api_session', 'status'),
        ('idx_session_requested_time', 'api_session', 'requested_time'),
        ('idx_user_role', 'api_user', 'role'),
        ('idx_user_reliability_score', 'api_user', 'reliability_score'),
        ('idx_user_is_suspended', 'api_user', 'is_suspended'),
        ('idx_user_is_deactivated', 'api_user', 'is_deactivated'),
        ('idx_review_rating', 'api_review', 'rating'),
        ('idx_report_status', 'api_report', 'status'),
        ('idx_auditlog_action', 'api_auditlog', 'action'),
    ]
    
    composite_indexes = [
        ('idx_mentorprofile_verified_rating', 'api_mentorprofile', 'is_verified, average_rating'),
        ('idx_session_mentor_status', 'api_session', 'mentor_id, status'),
        ('idx_session_student_status', 'api_session', 'student_id, status'),
    ]
    
    with connection.cursor() as cursor:
        # Get existing indexes
        cursor.execute("""
            SELECT DISTINCT INDEX_NAME 
            FROM INFORMATION_SCHEMA.STATISTICS 
            WHERE TABLE_SCHEMA = DATABASE()
        """)
        existing_indexes = {row[0] for row in cursor.fetchall()}
        
        # Create single-column indexes
        for index_name, table_name, column_name in indexes_to_create:
            if index_name not in existing_indexes:
                try:
                    cursor.execute(f"CREATE INDEX {index_name} ON {table_name} ({column_name});")
                    print(f"Created index: {index_name}")
                except Exception as e:
                    print(f"Failed to create index {index_name}: {str(e)}")
            else:
                print(f"Index {index_name} already exists, skipping")
        
        # Create composite indexes
        for index_name, table_name, columns in composite_indexes:
            if index_name not in existing_indexes:
                try:
                    cursor.execute(f"CREATE INDEX {index_name} ON {table_name} ({columns});")
                    print(f"Created composite index: {index_name}")
                except Exception as e:
                    print(f"Failed to create composite index {index_name}: {str(e)}")
            else:
                print(f"Composite index {index_name} already exists, skipping")


def drop_indexes_safely(apps, schema_editor):
    """Drop indexes safely"""
    
    indexes_to_drop = [
        'idx_mentorprofile_is_verified',
        'idx_mentorprofile_average_rating', 
        'idx_mentorprofile_years_experience',
        'idx_session_status',
        'idx_session_requested_time',
        'idx_user_role',
        'idx_user_reliability_score',
        'idx_user_is_suspended',
        'idx_user_is_deactivated',
        'idx_review_rating',
        'idx_report_status',
        'idx_auditlog_action',
        'idx_mentorprofile_verified_rating',
        'idx_session_mentor_status',
        'idx_session_student_status',
    ]
    
    with connection.cursor() as cursor:
        # Get existing indexes
        cursor.execute("""
            SELECT DISTINCT INDEX_NAME, TABLE_NAME
            FROM INFORMATION_SCHEMA.STATISTICS 
            WHERE TABLE_SCHEMA = DATABASE()
        """)
        existing_indexes = {row[0]: row[1] for row in cursor.fetchall()}
        
        for index_name in indexes_to_drop:
            if index_name in existing_indexes:
                table_name = existing_indexes[index_name]
                try:
                    cursor.execute(f"DROP INDEX {index_name} ON {table_name};")
                    print(f"Dropped index: {index_name}")
                except Exception as e:
                    print(f"Failed to drop index {index_name}: {str(e)}")


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0009_rename_api_message_sender_recipient_created_idx_api_message_sender__06dc5a_idx_and_more'),
    ]

    operations = [
        migrations.RunPython(
            create_indexes_safely,
            reverse_code=drop_indexes_safely,
        ),
    ]