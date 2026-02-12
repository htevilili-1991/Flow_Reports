from django.urls import path
from .views import (
    SavedQuestionListCreateView,
    SavedQuestionDetailView,
    GenerateSqlView,
    RunQueryView,
)

urlpatterns = [
    path("", SavedQuestionListCreateView.as_view(), name="saved_question_list_create"),
    path("<int:pk>/", SavedQuestionDetailView.as_view(), name="saved_question_detail"),
    path("generate-sql/", GenerateSqlView.as_view(), name="generate_sql"),
    path("run/", RunQueryView.as_view(), name="run_query"),
]
