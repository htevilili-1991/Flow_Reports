from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404

from .models import DataSource, SavedVisualization
from .serializers import (
    DataSourceSerializer,
    DataSourceCreateSerializer,
    TestConnectionSerializer,
    SavedVisualizationSerializer,
)
from .connection import test_connection
from .run_query import get_schema, run_sql
from .query_cache import get_cached_result, set_cached_result, invalidate_data_source


class DataSourceListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = DataSource.objects.filter(user=request.user)
        serializer = DataSourceSerializer(qs, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = DataSourceCreateSerializer(
            data=request.data,
            context={"request": request},
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response(DataSourceSerializer(serializer.instance).data, status=status.HTTP_201_CREATED)


class DataSourceDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, request, pk):
        return get_object_or_404(DataSource, pk=pk, user=request.user)

    def get(self, request, pk):
        obj = self.get_object(request, pk)
        serializer = DataSourceSerializer(obj)
        return Response(serializer.data)

    def patch(self, request, pk):
        obj = self.get_object(request, pk)
        data = request.data.copy()
        config = data.get("config")
        if config is not None and isinstance(config, dict) and config.get("password") == "********":
            existing = (obj.config or {}).copy()
            existing.update(config)
            existing.pop("password", None)
            if (obj.config or {}).get("password"):
                existing["password"] = obj.config["password"]
            data["config"] = existing
        serializer = DataSourceCreateSerializer(
            obj, data=data, partial=True, context={"request": request}
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response(DataSourceSerializer(serializer.instance).data)

    def delete(self, request, pk):
        obj = self.get_object(request, pk)
        obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class TestConnectionView(APIView):
    """Test a connection before saving. Accepts db_type + config, or data_source_id."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        data_source_id = request.data.get("data_source_id")
        if data_source_id:
            ds = get_object_or_404(DataSource, pk=data_source_id, user=request.user)
            success, message = test_connection(ds.db_type, ds.config)
        else:
            ser = TestConnectionSerializer(data=request.data)
            if not ser.is_valid():
                return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)
            success, message = test_connection(
                ser.validated_data["db_type"],
                ser.validated_data["config"],
            )
        return Response(
            {"success": success, "message": message},
            status=status.HTTP_200_OK if success else status.HTTP_400_BAD_REQUEST,
        )


class DataSourceSchemaView(APIView):
    """GET schema (tables and columns) for a data source."""

    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        ds = get_object_or_404(DataSource, pk=pk, user=request.user)
        tables, err = get_schema(ds)
        if err:
            return Response({"error": err, "tables": []}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"tables": tables})


class DataSourceRunQueryView(APIView):
    """POST run read-only SQL or get columns for a table. Body: { "sql": "..." } or { "table_name": "..." }, optional "refresh": true to bypass cache."""

    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        ds = get_object_or_404(DataSource, pk=pk, user=request.user)
        sql = request.data.get("sql")
        table_name = request.data.get("table_name")
        refresh = request.data.get("refresh") is True

        if sql and isinstance(sql, str) and sql.strip():
            sql = sql.strip()
            if not refresh:
                cached = get_cached_result(ds.id, "sql", sql)
                if cached is not None:
                    return Response({"rows": cached["rows"], "columns": cached["columns"], "cached": True})
            rows, columns, err = run_sql(ds, sql)
            if err:
                return Response({"error": err, "rows": [], "columns": []}, status=status.HTTP_400_BAD_REQUEST)
            set_cached_result(ds.id, "sql", sql, rows, columns)
            return Response({"rows": rows, "columns": columns})
        if table_name and isinstance(table_name, str) and table_name.strip():
            table_name = table_name.strip()
            safe_name = "".join(c for c in table_name if c.isalnum() or c in "._")
            if safe_name != table_name:
                return Response({"error": "Invalid table name.", "rows": [], "columns": []}, status=status.HTTP_400_BAD_REQUEST)
            if not refresh:
                cached = get_cached_result(ds.id, "table", table_name)
                if cached is not None:
                    return Response({"rows": cached["rows"], "columns": cached["columns"], "cached": True})
            gen_sql = f'SELECT * FROM "{safe_name}"' if ds.db_type == "sqlite" else f"SELECT * FROM `{safe_name}`" if ds.db_type == "mysql" else f'SELECT * FROM "{safe_name}"'
            rows, columns, err = run_sql(ds, gen_sql)
            if err:
                return Response({"error": err, "rows": [], "columns": []}, status=status.HTTP_400_BAD_REQUEST)
            set_cached_result(ds.id, "table", table_name, rows, columns)
            return Response({"rows": rows, "columns": columns})
        return Response(
            {"error": "Provide 'sql' or 'table_name'.", "rows": [], "columns": []},
            status=status.HTTP_400_BAD_REQUEST,
        )


class DataSourceRefreshCacheView(APIView):
    """POST invalidate query cache for this data source. Body optional: { "table_name": "..." } or { "sql": "..." } to clear only that query."""

    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        ds = get_object_or_404(DataSource, pk=pk, user=request.user)
        table_name = request.data.get("table_name")
        sql = request.data.get("sql")
        deleted = invalidate_data_source(ds.id, table_name=table_name if table_name else None, sql=sql if sql else None)
        return Response({"invalidated": deleted})


class DataSourceVisualizationListCreateView(APIView):
    """List or create visualizations for a data source."""

    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        ds = get_object_or_404(DataSource, pk=pk, user=request.user)
        qs = SavedVisualization.objects.filter(data_source=ds, user=request.user)
        serializer = SavedVisualizationSerializer(qs, many=True)
        return Response(serializer.data)

    def post(self, request, pk):
        ds = get_object_or_404(DataSource, pk=pk, user=request.user)
        data = request.data.copy()
        data["data_source"] = pk
        serializer = SavedVisualizationSerializer(
            data=data,
            context={"request": request},
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class DataSourceVisualizationDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, request, ds_pk, viz_pk):
        get_object_or_404(DataSource, pk=ds_pk, user=request.user)
        return get_object_or_404(
            SavedVisualization,
            pk=viz_pk,
            data_source_id=ds_pk,
            user=request.user,
        )

    def get(self, request, ds_pk, viz_pk):
        obj = self.get_object(request, ds_pk, viz_pk)
        return Response(SavedVisualizationSerializer(obj).data)

    def patch(self, request, ds_pk, viz_pk):
        obj = self.get_object(request, ds_pk, viz_pk)
        serializer = SavedVisualizationSerializer(
            obj, data=request.data, partial=True, context={"request": request}
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, ds_pk, viz_pk):
        obj = self.get_object(request, ds_pk, viz_pk)
        obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
