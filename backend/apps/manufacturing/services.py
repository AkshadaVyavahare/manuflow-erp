from django.db import transaction
from django.core.exceptions import ValidationError
from decimal import Decimal
from apps.inventory.models import Item, StockLedger
from apps.manufacturing.models import WorkOrder, MaterialAllocation

class ManufacturingService:
    @staticmethod
    @transaction.atomic
    def allocate_work_order(work_order_id: int):
        wo = WorkOrder.objects.select_for_update().get(id=work_order_id)
        if wo.status != WorkOrder.Status.DRAFT:
            raise ValidationError("Work order is not in DRAFT state.")

        shortages = []
        allocations_to_create = []

        for comp in wo.bom.components.select_related('component_item').all():
            gross_qty = comp.quantity_required * (wo.quantity / wo.bom.yield_quantity)
            adjusted_qty = gross_qty * (Decimal('1.00') + (comp.scrap_rate_pct / Decimal('100.00')))

            item = Item.objects.select_for_update().get(id=comp.component_item_id)
            available = item.on_hand - item.allocated

            if available < adjusted_qty:
                shortages.append({
                    'item': item.sku,
                    'required': float(adjusted_qty),
                    'available': float(available)
                })
            else:
                allocations_to_create.append((item, adjusted_qty))

        if shortages:
            raise ValidationError({"error": "Insufficient inventory", "shortages": shortages})

        for item, qty in allocations_to_create:
            item.allocated += qty
            item.save(update_fields=['allocated'])

            MaterialAllocation.objects.create(
                work_order=wo,
                item=item,
                quantity=qty,
                status=MaterialAllocation.AllocationStatus.RESERVED
            )

        wo.status = WorkOrder.Status.ALLOCATED
        wo.save(update_fields=['status'])
        return wo

    @staticmethod
    @transaction.atomic
    def complete_work_order(work_order_id: int):
        wo = WorkOrder.objects.select_for_update().get(id=work_order_id)
        if wo.status not in [WorkOrder.Status.ALLOCATED, WorkOrder.Status.IN_PROGRESS]:
            raise ValidationError("Work Order cannot be completed without prior material allocation.")

        for alloc in wo.allocations.filter(status=MaterialAllocation.AllocationStatus.RESERVED):
            item = Item.objects.select_for_update().get(id=alloc.item_id)
            item.on_hand -= alloc.quantity
            item.allocated -= alloc.quantity
            item.save(update_fields=['on_hand', 'allocated'])

            alloc.status = MaterialAllocation.AllocationStatus.CONSUMED
            alloc.save(update_fields=['status'])

            StockLedger.objects.create(
                item=item,
                quantity=-alloc.quantity,
                movement_type=StockLedger.MovementType.PRODUCTION_CONSUMPTION,
                reference_id=wo.wo_number
            )

        fg_item = Item.objects.select_for_update().get(id=wo.bom.finished_item_id)
        fg_item.on_hand += wo.quantity
        fg_item.save(update_fields=['on_hand'])

        StockLedger.objects.create(
            item=fg_item,
            quantity=wo.quantity,
            movement_type=StockLedger.MovementType.PRODUCTION_OUTPUT,
            reference_id=wo.wo_number
        )

        wo.status = WorkOrder.Status.COMPLETED
        wo.save(update_fields=['status'])
        return wo
