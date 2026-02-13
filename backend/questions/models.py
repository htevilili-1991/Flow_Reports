from django.db import models
from django.conf import settings


class SavedQuestion(models.Model):
    """A natural-language question with optional generated SQL."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="saved_questions",
    )
    data_source = models.ForeignKey(
        "data_sources.DataSource",
        on_delete=models.CASCADE,
        related_name="saved_questions",
        null=True,
        blank=True,
    )
    title = models.CharField(max_length=255)
    natural_language = models.TextField(
        help_text="The question in natural language",
    )
    generated_sql = models.TextField(
        blank=True,
        help_text="Generated SQL (read-only SELECT)",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self):
        return self.title
