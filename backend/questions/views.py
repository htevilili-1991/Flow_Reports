from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404

from .models import SavedQuestion
from .serializers import SavedQuestionSerializer, SavedQuestionListSerializer
from .nl_to_sql import generate_sql_from_nl, validate_and_sanitize_sql
from .run_query import run_read_only_query


class SavedQuestionListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = SavedQuestion.objects.filter(user=request.user)
        data_source_id = request.query_params.get("data_source_id")
        if data_source_id:
            qs = qs.filter(data_source_id=data_source_id)
        serializer = SavedQuestionListSerializer(qs, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = SavedQuestionSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save(user=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class SavedQuestionDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, request, pk):
        return get_object_or_404(SavedQuestion, pk=pk, user=request.user)

    def get(self, request, pk):
        obj = self.get_object(request, pk)
        serializer = SavedQuestionSerializer(obj)
        return Response(serializer.data)

    def patch(self, request, pk):
        obj = self.get_object(request, pk)
        serializer = SavedQuestionSerializer(obj, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, pk):
        obj = self.get_object(request, pk)
        obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class GenerateSqlView(APIView):
    """Generate SQL from natural language (NL→SQL). Optionally pass question_id to update saved question."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        natural_language = request.data.get("natural_language", "").strip()
        if not natural_language:
            return Response(
                {"error": "natural_language is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        sql, err = generate_sql_from_nl(natural_language)
        if err:
            return Response({"error": err, "generated_sql": ""}, status=status.HTTP_400_BAD_REQUEST)
        question_id = request.data.get("question_id")
        if question_id:
            q = get_object_or_404(SavedQuestion, pk=question_id, user=request.user)
            q.generated_sql = sql
            q.save(update_fields=["generated_sql", "updated_at"])
        return Response({"generated_sql": sql})


class RunQueryView(APIView):
    """Run a saved question's SQL or ad-hoc SQL (read-only)."""

    permission_classes = [IsAuthenticated]

    def post(self, request, pk=None):
        # Option 1: run by saved question id
        question_id = request.data.get("question_id")
        if question_id:
            q = get_object_or_404(SavedQuestion, pk=question_id, user=request.user)
            sql = q.generated_sql
            if not sql:
                return Response(
                    {"error": "This question has no generated SQL. Generate SQL first."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        else:
            sql = request.data.get("sql", "").strip()
            if not sql:
                return Response(
                    {"error": "Provide 'question_id' or 'sql'."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        rows, err = run_read_only_query(sql)
        if err:
            return Response({"error": err, "rows": []}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"rows": rows})
