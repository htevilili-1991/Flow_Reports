from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile, Role


class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ("id", "name", "permissions")


class UserProfileSerializer(serializers.ModelSerializer):
    role = RoleSerializer(read_only=True)

    class Meta:
        model = UserProfile
        fields = ("id", "bio", "role")


class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(required=False)

    class Meta:
        model = User
        fields = ("id", "username", "email", "password", "profile")
        extra_kwargs = {"password": {"write_only": True}}

    def create(self, validated_data):
        profile_data = validated_data.pop("profile", None)
        user = User.objects.create_user(**validated_data)
        if profile_data:
            UserProfile.objects.filter(user=user).update(**profile_data)
        else:
            UserProfile.objects.get_or_create(user=user)
        return user


class MeUserSerializer(serializers.Serializer):
    """Current user with role and permissions for frontend RBAC."""

    id = serializers.IntegerField()
    username = serializers.CharField()
    email = serializers.EmailField()
    role = serializers.SerializerMethodField()
    permissions = serializers.SerializerMethodField()

    def get_role(self, obj):
        profile = getattr(obj, "profile", None)
        if profile and profile.role:
            return {"id": profile.role.id, "name": profile.role.name}
        return None

    def get_permissions(self, obj):
        profile = getattr(obj, "profile", None)
        if profile:
            return profile.get_permissions()
        return []


class UserListSerializer(serializers.ModelSerializer):
    """User list with role for admin."""

    role = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ("id", "username", "email", "is_active", "role")

    def get_role(self, obj):
        profile = getattr(obj, "profile", None)
        if profile and profile.role:
            return {"id": profile.role.id, "name": profile.role.name}
        return None


class UserRoleUpdateSerializer(serializers.Serializer):
    role_id = serializers.PrimaryKeyRelatedField(queryset=Role.objects.all())


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)