from django.urls import path
from .views import (
    DashboardListCreateView,
    DashboardDetailView,
    DashboardLayoutView,
    FilterPresetListCreateView,
    FilterPresetDetailView,
)

urlpatterns = [
    path("", DashboardListCreateView.as_view(), name="dashboard_list_create"),
    path("<int:pk>/", DashboardDetailView.as_view(), name="dashboard_detail"),
    path("<int:pk>/layout/", DashboardLayoutView.as_view(), name="dashboard_layout"),
    path("<int:pk>/filter-presets/", FilterPresetListCreateView.as_view(), name="filter_preset_list_create"),
    path("filter-presets/<int:pk>/", FilterPresetDetailView.as_view(), name="filter_preset_detail"),
]
