from django.urls import path
from .views import (
    DataSourceListCreateView,
    DataSourceDetailView,
    TestConnectionView,
    DataSourceSchemaView,
    DataSourceRunQueryView,
    DataSourceRefreshCacheView,
    DataSourceVisualizationListCreateView,
    DataSourceVisualizationDetailView,
)

urlpatterns = [
    path("", DataSourceListCreateView.as_view(), name="data_source_list_create"),
    path("test/", TestConnectionView.as_view(), name="data_source_test"),
    path("<int:pk>/", DataSourceDetailView.as_view(), name="data_source_detail"),
    path("<int:pk>/schema/", DataSourceSchemaView.as_view(), name="data_source_schema"),
    path("<int:pk>/run-query/", DataSourceRunQueryView.as_view(), name="data_source_run_query"),
    path("<int:pk>/refresh-cache/", DataSourceRefreshCacheView.as_view(), name="data_source_refresh_cache"),
    path(
        "<int:pk>/visualizations/",
        DataSourceVisualizationListCreateView.as_view(),
        name="data_source_visualizations",
    ),
    path(
        "<int:ds_pk>/visualizations/<int:viz_pk>/",
        DataSourceVisualizationDetailView.as_view(),
        name="data_source_visualization_detail",
    ),
]
