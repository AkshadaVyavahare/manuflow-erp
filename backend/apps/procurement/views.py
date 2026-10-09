from rest_framework import viewsets, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from .models import PurchaseOrder, PurchaseOrderLine
from apps.inventory.models import Item, StockLedger

class PurchaseOrderLineSerializer(serializers.ModelSerializer):
    item_sku = serializers.CharField(source='item.sku', read_only=True)
    item_name = serializers.CharField(source='item.name', read_only=True)

    class Meta:
        model = PurchaseOrderLine
        fields = ['id', 'item', 'item_sku', 'item_name', 'quantity', 'unit_cost']

class PurchaseOrderSerializer(serializers.ModelSerializer):
    lines = PurchaseOrderLineSerializer(many=True, read_only=True)
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)

    class Meta:
        model = PurchaseOrder
        fields = ['id', 'po_number', 'supplier', 'supplier_name', 'status', 'created_at', 'lines']

class PurchaseOrderViewSet(viewsets.ModelViewSet):
    queryset = PurchaseOrder.objects.all().prefetch_related('lines__item', 'supplier').order_by('-id')
    serializer_class = PurchaseOrderSerializer

    @action(detail=True, methods=['post'], url_path='receive-goods')
    @transaction.atomic
    def receive_goods(self, request, pk=None):
        """Processes Goods Receipt Note (GRN): increments on_hand stock and logs to StockLedger."""
        po = self.get_object()
        if po.status == PurchaseOrder.Status.RECEIVED:
            return Response({'error': 'Purchase order has already been received'}, status=status.HTTP_400_BAD_REQUEST)

        for line in po.lines.all():
            item = Item.objects.select_for_update().get(id=line.item_id)
            item.on_hand += line.quantity
            item.save(update_fields=['on_hand'])

            StockLedger.objects.create(
                item=item,
                quantity=line.quantity,
                movement_type=StockLedger.MovementType.INBOUND_PO,
                reference_id=po.po_number
            )

        po.status = PurchaseOrder.Status.RECEIVED
        po.save(update_fields=['status'])

        return Response(PurchaseOrderSerializer(po).data)
