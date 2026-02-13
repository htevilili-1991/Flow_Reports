from rest_framework import serializers
from .models import DataSource, SavedVisualization


def mask_config(config):
    """Return config with password/pass masked for API responses."""
    if not config:
        return config
    out = dict(config)
    if "password" in out and out["password"]:
        out["password"] = "********"
    if "pass" in out and out["pass"]:
        out["pass"] = "********"
    return out


class DataSourceSerializer(serializers.ModelSerializer):
    config = serializers.SerializerMethodField()

    class Meta:
        model = DataSource
        fields = ("id", "name", "db_type", "config", "created_at", "updated_at")
        read_only_fields = ("created_at", "updated_at")

    def get_config(self, obj):
        return mask_config(obj.config)

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)


class DataSourceCreateSerializer(serializers.ModelSerializer):
    """Accept full config including password on create."""

    class Meta:
        model = DataSource
        fields = ("id", "name", "db_type", "config", "created_at", "updated_at")
        read_only_fields = ("created_at", "updated_at")

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)


class TestConnectionSerializer(serializers.Serializer):
    db_type = serializers.ChoiceField(choices=["postgresql", "mysql", "sqlite"])
    config = serializers.JSONField()


class SavedVisualizationSerializer(serializers.ModelSerializer):
    question_title = serializers.SerializerMethodField()

    class Meta:
        model = SavedVisualization
        fields = (
            "id",
            "data_source",
            "name",
            "table_name",
            "sql",
            "question",
            "question_title",
            "chart_type",
            "column_mapping",
            "chart_options",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("created_at", "updated_at")

    def get_question_title(self, obj):
        return obj.question.title if obj.question_id else None

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)
