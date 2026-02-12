from django.contrib import admin
from .models import SavedQuestion


@admin.register(SavedQuestion)
class SavedQuestionAdmin(admin.ModelAdmin):
    list_display = ("title", "user", "created_at", "updated_at")
    list_filter = ("created_at",)
    search_fields = ("title", "natural_language")
    raw_id_fields = ("user",)
