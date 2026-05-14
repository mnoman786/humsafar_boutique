from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'


class IsAdminOrStaff(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['admin', 'staff']


class IsAdminOrStaffOrUser(BasePermission):
    """Grants access to admin, staff, and user roles (attendance + employees endpoints)."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['admin', 'staff', 'user']
