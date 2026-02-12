from django.urls import path
from .views import DataSourceListCreateView, DataSourceDetailView, TestConnectionView

urlpatterns = [
    path("", DataSourceListCreateView.as_view(), name="data_source_list_create"),
    path("test/", TestConnectionView.as_view(), name="data_source_test"),
    path("<int:pk>/", DataSourceDetailView.as_view(), name="data_source_detail"),
]
