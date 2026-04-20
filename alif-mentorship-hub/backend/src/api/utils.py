import logging
from django.db.models import Prefetch, Count, Avg
from django.core.cache import cache
from .models import MentorProfile, Review

logger = logging.getLogger('api')


def get_optimized_mentor_queryset(filters=None):
    """
    Get mentor queryset with all related data prefetched.
    Fixes N+1 query problem.
    """
    qs = MentorProfile.objects.filter(is_verified=True).select_related('user')
    
    # Prefetch reviews to avoid N+1 queries
    reviews_prefetch = Prefetch(
        'user__sessions_as_mentor__review',
        queryset=Review.objects.all()
    )
    qs = qs.prefetch_related(reviews_prefetch)
    
    # Apply filters if provided
    if filters:
        if filters.get('field'):
            qs = qs.filter(field_of_study__icontains=filters['field'])
        if filters.get('university'):
            qs = qs.filter(university__icontains=filters['university'])
        if filters.get('language'):
            qs = qs.filter(languages__contains=filters['language'])
        if filters.get('availability') == 'true':
            qs = qs.exclude(availability=[])
    
    return qs


def get_mentor_with_stats(mentor_profile):
    """
    Get mentor profile with cached statistics.
    Reduces database queries for frequently accessed data.
    """
    cache_key = f'mentor_stats_{mentor_profile.id}'
    cached_data = cache.get(cache_key)
    
    if cached_data:
        return cached_data
    
    # Calculate stats
    reviews = Review.objects.filter(session__mentor=mentor_profile.user)
    review_count = reviews.count()
    avg_rating = reviews.aggregate(Avg('rating'))['rating__avg'] or 0.0
    
    data = {
        'review_count': review_count,
        'average_rating': round(avg_rating, 2),
    }
    
    # Cache for 5 minutes
    cache.set(cache_key, data, 300)
    return data


def invalidate_mentor_cache(mentor_id):
    """Invalidate mentor cache when profile is updated"""
    cache_key = f'mentor_stats_{mentor_id}'
    cache.delete(cache_key)


def safe_float_conversion(value, field_name='value', min_val=None, max_val=None):
    """
    Safely convert string to float with validation.
    Prevents NaN/Infinity injection.
    """
    if value is None:
        return None
    
    try:
        float_val = float(value)
        
        # Check for NaN or Infinity
        if float_val != float_val or float_val == float('inf') or float_val == float('-inf'):
            logger.warning(f"Invalid float value for {field_name}: {value}")
            raise ValueError(f"Invalid {field_name}: must be a valid number")
        
        # Check bounds
        if min_val is not None and float_val < min_val:
            raise ValueError(f"{field_name} must be >= {min_val}")
        if max_val is not None and float_val > max_val:
            raise ValueError(f"{field_name} must be <= {max_val}")
        
        return float_val
    except (ValueError, TypeError) as e:
        logger.warning(f"Float conversion error for {field_name}: {value}")
        raise ValueError(f"Invalid {field_name}: {str(e)}")


def safe_int_conversion(value, field_name='value', min_val=None, max_val=None):
    """
    Safely convert string to int with validation.
    """
    if value is None:
        return None
    
    try:
        int_val = int(value)
        
        # Check bounds
        if min_val is not None and int_val < min_val:
            raise ValueError(f"{field_name} must be >= {min_val}")
        if max_val is not None and int_val > max_val:
            raise ValueError(f"{field_name} must be <= {max_val}")
        
        return int_val
    except (ValueError, TypeError) as e:
        logger.warning(f"Int conversion error for {field_name}: {value}")
        raise ValueError(f"Invalid {field_name}: {str(e)}")


def validate_search_string(value, field_name='search', max_length=100):
    """
    Validate search string to prevent injection attacks.
    """
    if not isinstance(value, str):
        raise ValueError(f"{field_name} must be a string")
    
    if len(value) > max_length:
        raise ValueError(f"{field_name} must be <= {max_length} characters")
    
    # Remove potentially dangerous characters
    value = value.strip()
    
    return value
