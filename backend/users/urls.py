from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import (
    RegisterView,
    LoginView,
    LogoutView,
    MeView,
    RolesListView,
    UserListView,
    UserRoleUpdateView,
)
urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("logout/", LogoutView.as_view(), name="logout"),
    # JWT
    path("token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    # RBAC
    path("me/", MeView.as_view(), name="me"),
    path("roles/", RolesListView.as_view(), name="roles_list"),
    path("users/", UserListView.as_view(), name="user_list"),
    path("users/<int:user_id>/role/", UserRoleUpdateView.as_view(), name="user_role_update"),
]