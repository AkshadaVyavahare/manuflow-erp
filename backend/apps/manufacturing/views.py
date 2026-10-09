from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.core.exceptions import ValidationError
from .models import WorkOrder
from .serializers import WorkOrderSerializer
from .services import ManufacturingService

class WorkOrderViewSet(viewsets.ModelViewSet):
    queryset = WorkOrder.objects.all().prefetch_related('allocations__item')
    serializer_class = WorkOrderSerializer

    @action(detail=True, methods=['post'], url_path='allocate')
    def allocate(self, request, pk=None):
        try:
            wo = ManufacturingService.allocate_work_order(pk)
            return Response(WorkOrderSerializer(wo).data)
        except ValidationError as e:
            return Response(getattr(e, 'message_dict', str(e)), status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='complete')
    def complete(self, request, pk=None):
        try:
            wo = ManufacturingService.complete_work_order(pk)
            return Response(WorkOrderSerializer(wo).data)
        except ValidationError as e:
            return Response(getattr(e, 'message_dict', str(e)), status=status.HTTP_400_BAD_REQUEST)
