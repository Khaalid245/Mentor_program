from .models import AuditLog


def create_audit_log(admin, action, target_user=None, target_id=None, detail=""):
    """
    Helper function to create an audit log entry.
    
    Args:
        admin: User object (the admin performing the action)
        action: str (one of the ACTION_CHOICES from AuditLog model)
        target_user: User object (optional, the user the action was performed on)
        target_id: int (optional, the id of the object acted on)
        detail: str (human readable description of what happened)
    
    Returns:
        AuditLog object
    """
    return AuditLog.objects.create(
        admin=admin,
        action=action,
        target_user=target_user,
        target_id=target_id,
        detail=detail
    )
