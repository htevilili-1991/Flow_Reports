from django.contrib import admin
from .models import DataSource, SavedVisualization


@admin.register(DataSource)
class DataSourceAdmin(admin.ModelAdmin):
    list_display = ("name", "db_type", "user", "created_at")
    list_filter = ("db_type",)
    search_fields = ("name",)
    raw_id_fields = ("user",)


@admin.register(SavedVisualization)
class SavedVisualizationAdmin(admin.ModelAdmin):
    list_display = ("name", "data_source", "chart_type", "user", "updated_at")
    list_filter = ("chart_type", "data_source")
    search_fields = ("name",)
    raw_id_fields = ("user", "data_source", "question")
