from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404

from .models import Dashboard, FilterPreset
from .serializers import (
    DashboardSerializer,
    DashboardLayoutUpdateSerializer,
    FilterPresetSerializer,
)


class DashboardListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Dashboard.objects.filter(user=request.user)
        serializer = DashboardSerializer(qs, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = DashboardSerializer(
            data=request.data,
            context={"request": request},
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        try:
            instance = serializer.save()
            return Response(
                DashboardSerializer(instance).data,
                status=status.HTTP_201_CREATED,
            )
        except Exception as e:
            return Response(
                {"detail": "Server error while creating dashboard.", "error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class DashboardDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, request, pk):
        return get_object_or_404(Dashboard, pk=pk, user=request.user)

    def get(self, request, pk):
        obj = self.get_object(request, pk)
        serializer = DashboardSerializer(obj)
        return Response(serializer.data)

    def patch(self, request, pk):
        obj = self.get_object(request, pk)
        serializer = DashboardSerializer(
            obj, data=request.data, partial=True, context={"request": request}
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, pk):
        obj = self.get_object(request, pk)
        obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class DashboardLayoutView(APIView):
    """Update only layout and/or widgets (for builder save)."""

    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        dashboard = get_object_or_404(Dashboard, pk=pk, user=request.user)
        ser = DashboardLayoutUpdateSerializer(data=request.data, partial=True)
        if not ser.is_valid():
            return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)
        if "layout" in ser.validated_data:
            dashboard.layout = ser.validated_data["layout"]
        if "widgets" in ser.validated_data:
            dashboard.widgets = ser.validated_data["widgets"]
        dashboard.save(update_fields=["layout", "widgets", "updated_at"])
        return Response(DashboardSerializer(dashboard).data)


# Filter presets
class FilterPresetListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk=None):
        qs = FilterPreset.objects.filter(user=request.user)
        if pk:
            qs = qs.filter(dashboard_id=pk)
        serializer = FilterPresetSerializer(qs, many=True)
        return Response(serializer.data)

    def post(self, request, pk=None):
        data = request.data.copy()
        if pk:
            get_object_or_404(Dashboard, pk=pk, user=request.user)
            data["dashboard"] = pk
        serializer = FilterPresetSerializer(
            data=data,
            context={"request": request},
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class FilterPresetDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, request, pk):
        return get_object_or_404(FilterPreset, pk=pk, user=request.user)

    def get(self, request, pk):
        obj = self.get_object(request, pk)
        return Response(FilterPresetSerializer(obj).data)

    def patch(self, request, pk):
        obj = self.get_object(request, pk)
        serializer = FilterPresetSerializer(
            obj, data=request.data, partial=True, context={"request": request}
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, pk):
        obj = self.get_object(request, pk)
        obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
