from rest_framework import viewsets, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from decimal import Decimal
from .models import SalesOrder, SalesOrderLine, Invoice
from apps.manufacturing.models import WorkOrder
from apps.engineering.models import BOMHeader
from apps.inventory.models import Item, StockLedger

class InvoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Invoice
        fields = ['id', 'invoice_number', 'total_amount', 'payment_status', 'issued_at']

class SalesOrderLineSerializer(serializers.ModelSerializer):
    item_sku = serializers.CharField(source='item.sku', read_only=True)
    item_name = serializers.CharField(source='item.name', read_only=True)

    class Meta:
        model = SalesOrderLine
        fields = ['id', 'item', 'item_sku', 'item_name', 'quantity', 'unit_price']

class SalesOrderSerializer(serializers.ModelSerializer):
    lines = SalesOrderLineSerializer(many=True, read_only=True)
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    invoice = InvoiceSerializer(read_only=True)

    class Meta:
        model = SalesOrder
        fields = ['id', 'order_number', 'customer', 'customer_name', 'status', 'created_at', 'lines', 'invoice']

    @transaction.atomic
    def create(self, validated_data):
        lines_data = self.context['request'].data.get('lines', [])
        so = SalesOrder.objects.create(**validated_data)
        for line in lines_data:
            SalesOrderLine.objects.create(
                sales_order=so,
                item_id=line['item_id'],
                quantity=Decimal(str(line['quantity'])),
                unit_price=Decimal(str(line['unit_price']))
            )
        return so

class SalesOrderViewSet(viewsets.ModelViewSet):
    queryset = SalesOrder.objects.all().prefetch_related('lines__item', 'customer', 'invoice').order_by('-id')
    serializer_class = SalesOrderSerializer

    @action(detail=True, methods=['post'], url_path='confirm-and-plan')
    @transaction.atomic
    def confirm_and_plan(self, request, pk=None):
        so = self.get_object()
        if so.status != SalesOrder.Status.DRAFT:
            return Response({'error': 'Only DRAFT orders can be confirmed'}, status=status.HTTP_400_BAD_REQUEST)

        created_wos = []
        for line in so.lines.all():
            bom = BOMHeader.objects.filter(finished_item=line.item, is_active=True).first()
            if not bom:
                return Response(
                    {'error': f'No active BOM found for item {line.item.sku}'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            wo_number = f"WO-{so.order_number}-{line.id}"
            wo = WorkOrder.objects.create(
                wo_number=wo_number,
                bom=bom,
                quantity=line.quantity,
                status=WorkOrder.Status.DRAFT
            )
            created_wos.append(wo.wo_number)

        so.status = SalesOrder.Status.IN_PRODUCTION
        so.save(update_fields=['status'])
        return Response({'status': 'Order Confirmed', 'created_work_orders': created_wos})

    @action(detail=True, methods=['post'], url_path='dispatch-and-invoice')
    @transaction.atomic
    def dispatch_and_invoice(self, request, pk=None):
        so = self.get_object()
        if so.status == SalesOrder.Status.DISPATCHED:
            return Response({'error': 'Order is already dispatched'}, status=status.HTTP_400_BAD_REQUEST)

        total_amount = Decimal('0.00')

        for line in so.lines.all():
            item = Item.objects.select_for_update().get(id=line.item_id)
            if item.on_hand < line.quantity:
                return Response(
                    {'error': f'Cannot dispatch: Only {item.on_hand} {item.sku} on hand, need {line.quantity}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            total_amount += line.quantity * line.unit_price

        for line in so.lines.all():
            item = Item.objects.select_for_update().get(id=line.item_id)
            item.on_hand -= line.quantity
            item.save(update_fields=['on_hand'])

            StockLedger.objects.create(
                item=item,
                quantity=-line.quantity,
                movement_type=StockLedger.MovementType.DISPATCH,
                reference_id=so.order_number
            )

        invoice_number = f"INV-{so.order_number}"
        inv = Invoice.objects.create(
            invoice_number=invoice_number,
            sales_order=so,
            customer=so.customer,
            total_amount=total_amount
        )

        so.status = SalesOrder.Status.DISPATCHED
        so.save(update_fields=['status'])
        return Response(SalesOrderSerializer(so).data)

    @action(detail=True, methods=['post'], url_path='record-payment')
    def record_payment(self, request, pk=None):
        so = self.get_object()
        if not hasattr(so, 'invoice'):
            return Response({'error': 'No invoice issued for this order'}, status=status.HTTP_400_BAD_REQUEST)
        inv = so.invoice
        inv.payment_status = Invoice.PaymentStatus.PAID
        inv.save(update_fields=['payment_status'])
        return Response({'status': 'Payment Received', 'invoice_number': inv.invoice_number})
