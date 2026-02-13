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


class SavedVisualization(models.Model):
    """Saved chart/table config for a data source. Dashboards only use viz from one source."""

    CHART_TYPES = [
        ("line", "Line"),
        ("bar", "Bar"),
        ("area", "Area"),
        ("pie", "Pie"),
        ("table", "Table"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="saved_visualizations",
    )
    data_source = models.ForeignKey(
        DataSource,
        on_delete=models.CASCADE,
        related_name="saved_visualizations",
    )
    name = models.CharField(max_length=255)
    # Data: either table_name (schema table) or sql (custom SELECT), or legacy question
    table_name = models.CharField(max_length=255, blank=True)
    sql = models.TextField(blank=True)
    question = models.ForeignKey(
        "questions.SavedQuestion",
        on_delete=models.CASCADE,
        related_name="visualizations",
        null=True,
        blank=True,
    )
    chart_type = models.CharField(max_length=20, choices=CHART_TYPES, default="line")
    # { "x", "y", "series", "label", "value", "tableColumns" }
    column_mapping = models.JSONField(default=dict)
    # Tableau/Superset-style options: title, x_axis_label, y_axis_label, show_legend, color_scheme
    chart_options = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self):
        return self.name
