from django.db import models
from django.conf import settings


class DataSource(models.Model):
    DB_TYPES = [
        ("postgresql", "PostgreSQL"),
        ("mysql", "MySQL"),
        ("sqlite", "SQLite"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="data_sources",
    )
    name = models.CharField(max_length=255)
    db_type = models.CharField(max_length=20, choices=DB_TYPES)
    # Connection config: PostgreSQL/MySQL: host, port, database, user, password
    # SQLite: path
    config = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self):
        return self.name
