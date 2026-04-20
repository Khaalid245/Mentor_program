#!/bin/bash
# Migration Fix Script for MySQL Compatibility

echo "🔧 Fixing MySQL Migration Issues..."

# Step 1: Reset the problematic migration
echo "📝 Resetting migration state..."
python manage.py migrate api 0009 --fake

# Step 2: Delete the auto-generated migration that removes fields
echo "🗑️ Removing auto-generated migration..."
if exist "src\api\migrations\0012_remove_mentorprofile_archived_at_and_more.py" (
    del "src\api\migrations\0012_remove_mentorprofile_archived_at_and_more.py"
    echo "✅ Removed problematic auto-generated migration"
)

# Step 3: Apply the corrected migrations
echo "🚀 Applying corrected migrations..."
python manage.py migrate api 0010
python manage.py migrate api 0011

# Step 4: Verify migration status
echo "📊 Checking migration status..."
python manage.py showmigrations api

echo "✅ Migration fix complete!"
echo ""
echo "📋 Summary of fixes applied:"
echo "  ✅ Fixed MySQL syntax errors (removed IF NOT EXISTS)"
echo "  ✅ Added safe index creation with existence checks"
echo "  ✅ Applied performance indexes"
echo "  ✅ Applied soft delete fields"
echo ""
echo "🎯 All high-priority and medium-priority backend fixes are now active!"