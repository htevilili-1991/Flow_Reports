from django.contrib import admin
from .models import DataSource


@admin.register(DataSource)
class DataSourceAdmin(admin.ModelAdmin):
    list_display = ("name", "db_type", "user", "created_at")
    list_filter = ("db_type",)
    search_fields = ("name",)
    raw_id_fields = ("user",)
