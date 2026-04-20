"""
Enterprise Database Optimization System
Provides indexes, connection pooling, query optimization, and monitoring
"""
import time
import logging
from typing import Any, Dict, List, Optional, Type
from django.db import models, connection
from django.db.models import QuerySet, Prefetch
from django.core.cache import cache
from django.conf import settings
from contextlib import contextmanager


class DatabaseOptimizer:
    """Database optimization utilities"""
    
    @staticmethod
    def get_query_count() -> int:
        """Get current query count for monitoring"""
        return len(connection.queries)
    
    @staticmethod
    def log_queries(logger: logging.Logger, operation: str):
        """Log database queries for debugging"""
        if settings.DEBUG:
            query_count = len(connection.queries)
            logger.debug(f"{operation} executed {query_count} queries")
            
            for query in connection.queries[-10:]:  # Log last 10 queries
                logger.debug(f"Query: {query['sql'][:200]}... Time: {query['time']}s")
    
    @staticmethod
    @contextmanager
    def query_monitor(operation_name: str):
        """Context manager to monitor query performance"""
        start_queries = len(connection.queries)
        start_time = time.time()
        
        try:
            yield
        finally:
            end_time = time.time()
            end_queries = len(connection.queries)
            
            query_count = end_queries - start_queries
            execution_time = end_time - start_time
            
            logger = logging.getLogger('api.database')
            logger.info(
                f"Database operation: {operation_name}",
                extra={
                    'operation': operation_name,
                    'query_count': query_count,
                    'execution_time': execution_time,
                    'queries_per_second': query_count / execution_time if execution_time > 0 else 0
                }
            )
            
            # Log slow operations
            if execution_time > 1.0 or query_count > 10:
                logger.warning(
                    f"Slow database operation detected: {operation_name}",
                    extra={
                        'operation': operation_name,
                        'query_count': query_count,
                        'execution_time': execution_time,
                        'threshold_exceeded': 'time' if execution_time > 1.0 else 'queries'
                    }
                )


class OptimizedQuerySet(QuerySet):
    """Optimized QuerySet with built-in performance monitoring"""
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._prefetch_optimized = False
        self._select_optimized = False
    
    def with_select_related(self, *fields):
        """Add select_related with tracking"""
        self._select_optimized = True
        return self.select_related(*fields)
    
    def with_prefetch_related(self, *lookups):
        """Add prefetch_related with tracking"""
        self._prefetch_optimized = True
        return self.prefetch_related(*lookups)
    
    def execute_with_monitoring(self, operation_name: str):
        """Execute query with performance monitoring"""
        with DatabaseOptimizer.query_monitor(operation_name):
            return list(self)


class OptimizedManager(models.Manager):
    """Manager with built-in query optimization"""
    
    def get_queryset(self):
        return OptimizedQuerySet(self.model, using=self._db)
    
    def get_optimized_queryset(self, select_related: Optional[List[str]] = None, 
                             prefetch_related: Optional[List[str]] = None):
        """Get optimized queryset with common optimizations"""
        qs = self.get_queryset()
        
        if select_related:
            qs = qs.select_related(*select_related)
        
        if prefetch_related:
            qs = qs.prefetch_related(*prefetch_related)
        
        return qs


class CachedQueryMixin:
    """Mixin for models to add caching capabilities"""
    
    CACHE_TIMEOUT = 300  # 5 minutes default
    
    @classmethod
    def get_cache_key(cls, identifier: str, suffix: str = "") -> str:
        """Generate cache key for model"""
        app_label = cls._meta.app_label
        model_name = cls._meta.model_name
        return f"{app_label}:{model_name}:{identifier}:{suffix}"
    
    @classmethod
    def get_cached_object(cls, pk: int, timeout: Optional[int] = None) -> Optional['CachedQueryMixin']:
        """Get object from cache or database"""
        cache_key = cls.get_cache_key(str(pk), "object")
        
        # Try cache first
        obj = cache.get(cache_key)
        if obj is not None:
            return obj
        
        # Get from database
        try:
            obj = cls.objects.get(pk=pk)
            cache.set(cache_key, obj, timeout or cls.CACHE_TIMEOUT)
            return obj
        except cls.DoesNotExist:
            return None
    
    def invalidate_cache(self):
        """Invalidate cache for this object"""
        cache_key = self.get_cache_key(str(self.pk), "object")
        cache.delete(cache_key)
    
    def save(self, *args, **kwargs):
        """Save with cache invalidation"""
        super().save(*args, **kwargs)
        self.invalidate_cache()
    
    def delete(self, *args, **kwargs):
        """Delete with cache invalidation"""
        self.invalidate_cache()
        super().delete(*args, **kwargs)


class DatabaseIndexes:
    """Database index definitions for optimization"""
    
    @staticmethod
    def get_user_indexes():
        """Get indexes for User model"""
        return [
            models.Index(fields=['username'], name='user_username_idx'),
            models.Index(fields=['email'], name='user_email_idx'),
            models.Index(fields=['role'], name='user_role_idx'),
            models.Index(fields=['is_active', 'is_suspended'], name='user_status_idx'),
            models.Index(fields=['date_joined'], name='user_date_joined_idx'),
            models.Index(fields=['reliability_score'], name='user_reliability_idx'),
        ]
    
    @staticmethod
    def get_mentor_profile_indexes():
        """Get indexes for MentorProfile model"""
        return [
            models.Index(fields=['user'], name='mentor_user_idx'),
            models.Index(fields=['is_verified'], name='mentor_verified_idx'),
            models.Index(fields=['field_of_study'], name='mentor_field_idx'),
            models.Index(fields=['university'], name='mentor_university_idx'),
            models.Index(fields=['average_rating'], name='mentor_rating_idx'),
            models.Index(fields=['years_of_experience'], name='mentor_experience_idx'),
            models.Index(fields=['is_verified', 'average_rating'], name='mentor_verified_rating_idx'),
        ]
    
    @staticmethod
    def get_session_indexes():
        """Get indexes for Session model"""
        return [
            models.Index(fields=['student'], name='session_student_idx'),
            models.Index(fields=['mentor'], name='session_mentor_idx'),
            models.Index(fields=['status'], name='session_status_idx'),
            models.Index(fields=['requested_time'], name='session_time_idx'),
            models.Index(fields=['created_at'], name='session_created_idx'),
            models.Index(fields=['student', 'status'], name='session_student_status_idx'),
            models.Index(fields=['mentor', 'status'], name='session_mentor_status_idx'),
            models.Index(fields=['status', 'requested_time'], name='session_status_time_idx'),
        ]
    
    @staticmethod
    def get_review_indexes():
        """Get indexes for Review model"""
        return [
            models.Index(fields=['session'], name='review_session_idx'),
            models.Index(fields=['rating'], name='review_rating_idx'),
            models.Index(fields=['created_at'], name='review_created_idx'),
        ]
    
    @staticmethod
    def get_message_indexes():
        """Get indexes for Message model"""
        return [
            models.Index(fields=['sender'], name='message_sender_idx'),
            models.Index(fields=['recipient'], name='message_recipient_idx'),
            models.Index(fields=['is_read'], name='message_read_idx'),
            models.Index(fields=['created_at'], name='message_created_idx'),
            models.Index(fields=['sender', 'recipient', '-created_at'], name='message_conversation_idx'),
            models.Index(fields=['recipient', 'is_read'], name='message_unread_idx'),
        ]


class QueryOptimizer:
    """Query optimization utilities"""
    
    @staticmethod
    def optimize_mentor_list_query():
        """Optimized query for mentor listings"""
        from api.models import MentorProfile, Review
        
        # Prefetch reviews to avoid N+1 queries
        reviews_prefetch = Prefetch(
            'user__sessions_as_mentor__review',
            queryset=Review.objects.select_related('session__student')
        )
        
        return MentorProfile.objects.filter(
            is_verified=True
        ).select_related(
            'user'
        ).prefetch_related(
            reviews_prefetch
        ).order_by('-average_rating', '-id')
    
    @staticmethod
    def optimize_session_list_query(user):
        """Optimized query for session listings"""
        from api.models import Session
        
        qs = Session.objects.select_related(
            'student', 'mentor', 'mentor__mentor_profile'
        ).prefetch_related(
            'review', 'report', 'student_feedback'
        )
        
        if user.role == 'student':
            qs = qs.filter(student=user)
        elif user.role == 'mentor':
            qs = qs.filter(mentor=user)
        
        return qs.order_by('-created_at')
    
    @staticmethod
    def optimize_user_detail_query(user_id: int):
        """Optimized query for user detail view"""
        from api.models import User
        
        return User.objects.select_related(
            'mentor_profile'
        ).prefetch_related(
            'sessions_as_student__mentor__mentor_profile',
            'sessions_as_mentor__student',
            'favorite_mentors__mentor__mentor_profile'
        ).get(pk=user_id)
    
    @staticmethod
    def get_mentor_stats(mentor_user):
        """Get mentor statistics with optimized queries"""
        from api.models import Session, Review
        from django.db.models import Count, Avg
        
        # Single query to get all stats
        stats = Session.objects.filter(
            mentor=mentor_user,
            status='completed'
        ).aggregate(
            total_sessions=Count('id'),
            avg_rating=Avg('review__rating')
        )
        
        return {
            'total_sessions': stats['total_sessions'] or 0,
            'average_rating': round(stats['avg_rating'] or 0, 2),
        }
    
    @staticmethod
    def get_student_stats(student_user):
        """Get student statistics with optimized queries"""
        from api.models import Session
        from django.db.models import Count
        
        stats = Session.objects.filter(
            student=student_user
        ).aggregate(
            total_sessions=Count('id'),
            completed_sessions=Count('id', filter=models.Q(status='completed'))
        )
        
        return {
            'total_sessions': stats['total_sessions'] or 0,
            'completed_sessions': stats['completed_sessions'] or 0,
        }


class DatabaseConnectionPool:
    """Database connection pool management"""
    
    @staticmethod
    def get_connection_info():
        """Get current connection information"""
        return {
            'vendor': connection.vendor,
            'queries_count': len(connection.queries),
            'is_usable': connection.is_usable(),
        }
    
    @staticmethod
    def test_connection():
        """Test database connection"""
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                return True
        except Exception:
            return False
    
    @staticmethod
    def get_connection_stats():
        """Get connection pool statistics"""
        stats = {
            'connection_usable': connection.is_usable(),
            'total_queries': len(connection.queries),
        }
        
        # Add database-specific stats
        if hasattr(connection, 'connection') and connection.connection:
            if connection.vendor == 'mysql':
                try:
                    with connection.cursor() as cursor:
                        cursor.execute("SHOW STATUS LIKE 'Threads_connected'")
                        result = cursor.fetchone()
                        if result:
                            stats['active_connections'] = int(result[1])
                except Exception:
                    pass
            
            elif connection.vendor == 'postgresql':
                try:
                    with connection.cursor() as cursor:
                        cursor.execute(
                            "SELECT count(*) FROM pg_stat_activity WHERE state = 'active'"
                        )
                        result = cursor.fetchone()
                        if result:
                            stats['active_connections'] = result[0]
                except Exception:
                    pass
        
        return stats


# Utility functions for common optimizations
def bulk_create_optimized(model_class: Type[models.Model], objects: List[models.Model], 
                         batch_size: int = 1000) -> List[models.Model]:
    """Optimized bulk create with batching"""
    created_objects = []
    
    for i in range(0, len(objects), batch_size):
        batch = objects[i:i + batch_size]
        created_batch = model_class.objects.bulk_create(batch, batch_size=batch_size)
        created_objects.extend(created_batch)
    
    return created_objects


def bulk_update_optimized(objects: List[models.Model], fields: List[str], 
                         batch_size: int = 1000) -> None:
    """Optimized bulk update with batching"""
    if not objects:
        return
    
    model_class = objects[0].__class__
    
    for i in range(0, len(objects), batch_size):
        batch = objects[i:i + batch_size]
        model_class.objects.bulk_update(batch, fields, batch_size=batch_size)


def execute_raw_query_safely(query: str, params: Optional[List] = None) -> List[Dict[str, Any]]:
    """Execute raw query safely with monitoring"""
    logger = logging.getLogger('api.database')
    
    with DatabaseOptimizer.query_monitor(f"raw_query: {query[:50]}..."):
        with connection.cursor() as cursor:
            cursor.execute(query, params or [])
            columns = [col[0] for col in cursor.description]
            results = [dict(zip(columns, row)) for row in cursor.fetchall()]
            
            logger.info(f"Raw query executed, returned {len(results)} rows")
            return results