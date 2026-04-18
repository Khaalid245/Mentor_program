from rest_framework.permissions import BasePermission


class IsStudent(BasePermission):
    """Grants access only to authenticated users with role == 'student'."""
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == 'student'
        )


class IsMentor(BasePermission):
    """Grants access only to authenticated users with role == 'mentor'."""
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == 'mentor'
        )


class IsAdmin(BasePermission):
    """Grants access only to authenticated users with role == 'admin'."""
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == 'admin'
        )
