from django.db import models


class Role(models.Model):
    """Role for RBAC. Permissions is a list of permission codes (e.g. reports.view, data_sources.manage)."""
    name = models.CharField(max_length=64, unique=True)
    permissions = models.JSONField(
        default=list,
        help_text="List of permission codes, e.g. ['reports.view', 'reports.edit', 'users.manage']",
    )

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class UserProfile(models.Model):
    user = models.OneToOneField("auth.User", on_delete=models.CASCADE)
    bio = models.TextField(blank=True)
    role = models.ForeignKey(
        Role, on_delete=models.SET_NULL, null=True, blank=True, related_name="users"
    )

    def __str__(self):
        return self.user.username

    def get_permissions(self):
        """Return list of permission codes for this user (from role)."""
        if self.role:
            return list(self.role.permissions) if self.role.permissions else []
        return []
