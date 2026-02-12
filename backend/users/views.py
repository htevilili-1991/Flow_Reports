from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from django.contrib.auth.models import User

from .models import UserProfile
from .serializers import (
    UserSerializer,
    LoginSerializer,
    MeUserSerializer,
    RoleSerializer,
    UserListSerializer,
    UserRoleUpdateSerializer,
)
from .permissions import IsAdministrator


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            token, _ = Token.objects.get_or_create(user=user)
            return Response(
                {"token": token.key, "user_id": user.pk, "email": user.email},
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            username = serializer.validated_data["username"]
            password = serializer.validated_data["password"]
            user = authenticate(request, username=username, password=password)
            if user is not None:
                token, _ = Token.objects.get_or_create(user=user)
                return Response(
                    {"token": token.key, "user_id": user.pk, "email": user.email}
                )
            return Response(
                {"error": "Invalid Credentials"}, status=status.HTTP_401_UNAUTHORIZED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.is_authenticated and hasattr(request.user, "auth_token"):
            try:
                request.user.auth_token.delete()
            except Exception:
                pass
        return Response(status=status.HTTP_200_OK)


# ----- JWT + RBAC -----


class MeView(APIView):
    """Current user with role and permissions (for frontend RBAC)."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        UserProfile.objects.get_or_create(user=request.user)
        request.user.refresh_from_db()
        serializer = MeUserSerializer(request.user)
        return Response(serializer.data)


class RolesListView(APIView):
    """List all roles (for admin UI and role assignment)."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        from .models import Role

        roles = Role.objects.all()
        serializer = RoleSerializer(roles, many=True)
        return Response(serializer.data)


class UserListView(APIView):
    """List users (Administrator only)."""

    permission_classes = [IsAuthenticated, IsAdministrator]

    def get(self, request):
        users = User.objects.all().order_by("id")
        serializer = UserListSerializer(users, many=True)
        return Response(serializer.data)


class UserRoleUpdateView(APIView):
    """Update a user's role (Administrator only)."""

    permission_classes = [IsAuthenticated, IsAdministrator]

    def patch(self, request, user_id):
        user = User.objects.filter(pk=user_id).first()
        if not user:
            return Response(
                {"error": "User not found"}, status=status.HTTP_404_NOT_FOUND
            )
        serializer = UserRoleUpdateSerializer(data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        profile, _ = UserProfile.objects.get_or_create(user=user)
        profile.role = serializer.validated_data["role_id"]
        profile.save()
        return Response(UserListSerializer(user).data)