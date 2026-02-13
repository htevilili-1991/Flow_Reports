from django.contrib import admin
from .models import Dashboard, FilterPreset


@admin.register(Dashboard)
class DashboardAdmin(admin.ModelAdmin):
    list_display = ("name", "user", "updated_at")
    list_filter = ("updated_at",)
    search_fields = ("name",)
    raw_id_fields = ("user",)


@admin.register(FilterPreset)
class FilterPresetAdmin(admin.ModelAdmin):
    list_display = ("name", "user", "dashboard", "created_at")
    list_filter = ("created_at",)
    raw_id_fields = ("user", "dashboard")
