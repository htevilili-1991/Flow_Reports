from rest_framework import serializers
from .models import SavedQuestion


class SavedQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = SavedQuestion
        fields = ("id", "title", "natural_language", "generated_sql", "created_at", "updated_at")
        read_only_fields = ("created_at", "updated_at")


class SavedQuestionListSerializer(serializers.ModelSerializer):
    class Meta:
        model = SavedQuestion
        fields = ("id", "title", "natural_language", "created_at", "updated_at")
