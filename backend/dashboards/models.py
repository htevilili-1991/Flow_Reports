from django.db import models
from django.conf import settings


class Dashboard(models.Model):
    """Dashboard with grid layout and widget configs (react-grid-layout format). One data source only."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="dashboards",
    )
    data_source = models.ForeignKey(
        "data_sources.DataSource",
        on_delete=models.CASCADE,
        related_name="dashboards",
        null=True,
        blank=True,
    )
    name = models.CharField(max_length=255)
    # react-grid-layout: { "lg": [ { i, x, y, w, h, ... }, ... ] } or array of items
    layout = models.JSONField(default=dict)
    # Widget configs: { "widgetId": { type, questionId, chartType, title, ... } }
    widgets = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self):
        return self.name


class FilterPreset(models.Model):
    """Saved filter combination for a dashboard (or global)."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="filter_presets",
    )
    name = models.CharField(max_length=255)
    dashboard = models.ForeignKey(
        Dashboard,
        on_delete=models.CASCADE,
        related_name="filter_presets",
        null=True,
        blank=True,
    )
    # { "date_range": { "start", "end" }, "filters": { "field": value or [values] } }
    filters = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.name
