from django.db import models
from django.utils import timezone
import logging

logger = logging.getLogger('api')


class SoftDeleteManager(models.Manager):
    """Manager that excludes soft-deleted objects by default"""
    
    def get_queryset(self):
        return super().get_queryset().filter(deleted_at__isnull=True)
    
    def with_deleted(self):
        """Include soft-deleted objects"""
        return super().get_queryset()
    
    def deleted_only(self):
        """Only soft-deleted objects"""
        return super().get_queryset().filter(deleted_at__isnull=False)


class SoftDeleteMixin(models.Model):
    """Mixin to add soft delete functionality to models"""
    
    deleted_at = models.DateTimeField(null=True, blank=True, db_index=True)
    deleted_by = models.ForeignKey(
        'User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='%(class)s_deleted_objects'
    )
    
    objects = SoftDeleteManager()
    all_objects = models.Manager()  # Access to all objects including deleted
    
    class Meta:
        abstract = True
    
    def soft_delete(self, user=None):
        """Soft delete the object"""
        self.deleted_at = timezone.now()
        if user:
            self.deleted_by = user
        self.save(update_fields=['deleted_at', 'deleted_by'])
        logger.info(f"Soft deleted {self.__class__.__name__} {self.pk} by {user}")
    
    def restore(self, user=None):
        """Restore a soft-deleted object"""
        self.deleted_at = None
        self.deleted_by = None
        self.save(update_fields=['deleted_at', 'deleted_by'])
        logger.info(f"Restored {self.__class__.__name__} {self.pk} by {user}")
    
    def hard_delete(self):
        """Permanently delete the object"""
        logger.warning(f"Hard deleting {self.__class__.__name__} {self.pk}")
        super().delete()
    
    @property
    def is_deleted(self):
        """Check if object is soft-deleted"""
        return self.deleted_at is not None
    
    def delete(self, using=None, keep_parents=False):
        """Override delete to perform soft delete by default"""
        self.soft_delete()


class ArchiveMixin(models.Model):
    """Mixin to add archiving functionality"""
    
    archived_at = models.DateTimeField(null=True, blank=True, db_index=True)
    archived_by = models.ForeignKey(
        'User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='%(class)s_archived_objects'
    )
    
    class Meta:
        abstract = True
    
    def archive(self, user=None):
        """Archive the object"""
        self.archived_at = timezone.now()
        if user:
            self.archived_by = user
        self.save(update_fields=['archived_at', 'archived_by'])
        logger.info(f"Archived {self.__class__.__name__} {self.pk} by {user}")
    
    def unarchive(self, user=None):
        """Unarchive the object"""
        self.archived_at = None
        self.archived_by = None
        self.save(update_fields=['archived_at', 'archived_by'])
        logger.info(f"Unarchived {self.__class__.__name__} {self.pk} by {user}")
    
    @property
    def is_archived(self):
        """Check if object is archived"""
        return self.archived_at is not None


class ActiveManager(models.Manager):
    """Manager that excludes archived and soft-deleted objects"""
    
    def get_queryset(self):
        qs = super().get_queryset()
        # Exclude soft-deleted objects if model has SoftDeleteMixin
        if hasattr(self.model, 'deleted_at'):
            qs = qs.filter(deleted_at__isnull=True)
        # Exclude archived objects if model has ArchiveMixin
        if hasattr(self.model, 'archived_at'):
            qs = qs.filter(archived_at__isnull=True)
        return qs