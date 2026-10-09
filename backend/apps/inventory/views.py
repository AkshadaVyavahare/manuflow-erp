from rest_framework import viewsets, serializers
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Sum
from decimal import Decimal
from .models import Item, StockLedger
from apps.sales.models import SalesOrder, Invoice
from apps.manufacturing.models import WorkOrder
from apps.procurement.models import PurchaseOrder

class ItemSerializer(serializers.ModelSerializer):
    available_stock = serializers.DecimalField(max_digits=12, decimal_places=4, read_only=True)

    class Meta:
        model = Item
        fields = ['id', 'sku', 'name', 'item_type', 'unit_of_measure', 'on_hand', 'allocated', 'available_stock', 'safety_stock']

class ItemViewSet(viewsets.ModelViewSet):
    queryset = Item.objects.all().order_by('item_type', 'sku')
    serializer_class = ItemSerializer

class StockLedgerSerializer(serializers.ModelSerializer):
    item_sku = serializers.CharField(source='item.sku', read_only=True)
    item_name = serializers.CharField(source='item.name', read_only=True)

    class Meta:
        model = StockLedger
        fields = ['id', 'item_sku', 'item_name', 'quantity', 'movement_type', 'reference_id', 'timestamp']

class StockLedgerViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = StockLedger.objects.all().select_related('item').order_by('-id')
    serializer_class = StockLedgerSerializer

class DashboardAnalyticsView(APIView):
    def get(self, request):
        total_revenue = Invoice.objects.aggregate(total=Sum('total_amount'))['total'] or Decimal('0.00')
        total_work_orders = WorkOrder.objects.count()
        completed_work_orders = WorkOrder.objects.filter(status=WorkOrder.Status.COMPLETED).count()
        total_pos = PurchaseOrder.objects.count()

        total_raw_items = Item.objects.filter(item_type=Item.ItemType.RAW).count()
        total_fg_items = Item.objects.filter(item_type=Item.ItemType.FINISHED).count()

        pipeline = {
            'draft': WorkOrder.objects.filter(status=WorkOrder.Status.DRAFT).count(),
            'allocated': WorkOrder.objects.filter(status=WorkOrder.Status.ALLOCATED).count(),
            'completed': completed_work_orders,
        }

        return Response({
            'total_revenue': float(total_revenue),
            'total_work_orders': total_work_orders,
            'completed_work_orders': completed_work_orders,
            'total_pos': total_pos,
            'total_raw_items': total_raw_items,
            'total_fg_items': total_fg_items,
            'pipeline': pipeline,
        })
