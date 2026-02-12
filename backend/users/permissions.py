"""RBAC: permission classes that check user role permissions."""

from rest_framework import permissions


class HasPermission(permissions.BasePermission):
    """
    Requires the user to have a specific permission code (from their role).
    Use as: permission_classes = [HasPermission]
    and set .required_permission on the view class, or pass required_permission= in as_view().
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        required = getattr(view, "required_permission", None)
        if not required:
            return True
        profile = getattr(request.user, "profile", None)
        if not profile:
            return False
        return required in profile.get_permissions()


class IsAdministrator(permissions.BasePermission):
    """Only users with role name Administrator."""

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        profile = getattr(request.user, "profile", None)
        if not profile or not profile.role:
            return False
        return profile.role.name == "Administrator"
