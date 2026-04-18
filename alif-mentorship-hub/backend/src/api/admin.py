from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, MentorProfile, Session, Review, Resource


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Platform Role', {'fields': ('role', 'phone')}),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Platform Role', {'fields': ('role', 'phone')}),
    )
    list_display = ('username', 'email', 'role', 'is_staff', 'is_active')
    list_filter  = ('role', 'is_staff', 'is_active')
    search_fields = ('username', 'email', 'first_name', 'last_name')


@admin.register(MentorProfile)
class MentorProfileAdmin(admin.ModelAdmin):
    list_display  = ('user', 'university', 'field_of_study', 'graduation_year', 'is_verified', 'average_rating')
    list_filter   = ('is_verified',)
    search_fields = ('user__username', 'user__email', 'university', 'field_of_study')
    readonly_fields = ('average_rating',)
    # Admin can toggle is_verified directly from the list view
    list_editable = ('is_verified',)


@admin.register(Session)
class SessionAdmin(admin.ModelAdmin):
    list_display  = ('pk', 'student', 'mentor', 'status', 'requested_time', 'created_at')
    list_filter   = ('status',)
    search_fields = ('student__username', 'mentor__username')
    readonly_fields = ('created_at',)


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display  = ('session', 'rating', 'created_at')
    readonly_fields = ('created_at',)


@admin.register(Resource)
class ResourceAdmin(admin.ModelAdmin):
    list_display  = ('title', 'category', 'author', 'published_at')
    list_filter   = ('category',)
    search_fields = ('title', 'author__username')
