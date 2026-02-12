from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404

from .models import DataSource
from .serializers import DataSourceSerializer, DataSourceCreateSerializer, TestConnectionSerializer
from .connection import test_connection


class DataSourceListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = DataSource.objects.filter(user=request.user)
        serializer = DataSourceSerializer(qs, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = DataSourceCreateSerializer(data=request.data)
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
        serializer = DataSourceCreateSerializer(obj, data=data, partial=True)
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
