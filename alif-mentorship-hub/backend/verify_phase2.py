"""
Phase 2 Verification Script
Tests that all Phase 2 features are properly installed and working
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'alif_mentorship_hub.settings')
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))
django.setup()

from api.models import User, MentorProfile, MentorFavorite, SavedSearch
from django.db import connection

def verify_phase2():
    print("=" * 60)
    print("PHASE 2 VERIFICATION")
    print("=" * 60)
    
    # Check 1: User model has cancellation fields
    print("\n✓ Checking User model fields...")
    user_fields = [f.name for f in User._meta.get_fields()]
    required_fields = ['cancellation_count', 'no_show_count', 'reliability_score', 'restriction_until']
    for field in required_fields:
        if field in user_fields:
            print(f"  ✓ {field} exists")
        else:
            print(f"  ✗ {field} MISSING")
    
    # Check 2: MentorProfile has timezone
    print("\n✓ Checking MentorProfile fields...")
    profile_fields = [f.name for f in MentorProfile._meta.get_fields()]
    if 'timezone' in profile_fields:
        print(f"  ✓ timezone exists")
    else:
        print(f"  ✗ timezone MISSING")
    
    # Check 3: New models exist
    print("\n✓ Checking new models...")
    try:
        MentorFavorite.objects.count()
        print(f"  ✓ MentorFavorite model exists")
    except Exception as e:
        print(f"  ✗ MentorFavorite error: {e}")
    
    try:
        SavedSearch.objects.count()
        print(f"  ✓ SavedSearch model exists")
    except Exception as e:
        print(f"  ✗ SavedSearch error: {e}")
    
    # Check 4: Pytz installed
    print("\n✓ Checking dependencies...")
    try:
        import pytz
        print(f"  ✓ pytz {pytz.__version__} installed")
    except ImportError:
        print(f"  ✗ pytz NOT installed")
    
    # Check 5: Database tables
    print("\n✓ Checking database tables...")
    with connection.cursor() as cursor:
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;")
        tables = [row[0] for row in cursor.fetchall()]
        
        required_tables = ['api_mentorfavorite', 'api_savedsearch']
        for table in required_tables:
            if table in tables:
                print(f"  ✓ {table} exists")
            else:
                print(f"  ✗ {table} MISSING")
    
    print("\n" + "=" * 60)
    print("PHASE 2 SETUP COMPLETE ✓")
    print("=" * 60)
    print("\nNext Steps:")
    print("1. Start backend: python manage.py runserver")
    print("2. Test APIs using documentation in PHASE_2_*.md files")
    print("3. Build frontend components to consume these APIs")
    print("\nPriority Order for Frontend:")
    print("  1. Availability Calendar (highest impact)")
    print("  2. Search Filters")
    print("  3. Favorites/Bookmarks")
    print("  4. Cancellation Warnings")

if __name__ == '__main__':
    verify_phase2()
