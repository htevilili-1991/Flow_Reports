from rest_framework import serializers
from .models import Dashboard, FilterPreset


class DashboardSerializer(serializers.ModelSerializer):
    data_source_name = serializers.SerializerMethodField()

    class Meta:
        model = Dashboard
        fields = (
            "id",
            "name",
            "data_source",
            "data_source_name",
            "layout",
            "widgets",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("created_at", "updated_at")

    def get_data_source_name(self, obj):
        return obj.data_source.name if obj.data_source_id else None

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)


class FilterPresetSerializer(serializers.ModelSerializer):
    class Meta:
        model = FilterPreset
        fields = ("id", "name", "dashboard", "filters", "created_at")
        read_only_fields = ("created_at",)

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)


class DashboardLayoutUpdateSerializer(serializers.Serializer):
    layout = serializers.JSONField()
    widgets = serializers.JSONField(required=False)
