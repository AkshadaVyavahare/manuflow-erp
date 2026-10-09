from django.db import models
from apps.inventory.models import Item
from apps.engineering.models import BOMHeader

class WorkOrder(models.Model):
    class Status(models.TextChoices):
        DRAFT = 'DRAFT', 'Draft'
        ALLOCATED = 'ALLOCATED', 'Materials Reserved'
        IN_PROGRESS = 'IN_PROGRESS', 'Production Active'
        COMPLETED = 'COMPLETED', 'Finished & Stocked'
        CANCELLED = 'CANCELLED', 'Cancelled'

    wo_number = models.CharField(max_length=64, unique=True, db_index=True)
    bom = models.ForeignKey(BOMHeader, on_delete=models.PROTECT)
    quantity = models.DecimalField(max_digits=12, decimal_places=4)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class MaterialAllocation(models.Model):
    class AllocationStatus(models.TextChoices):
        RESERVED = 'RESERVED', 'Reserved'
        CONSUMED = 'CONSUMED', 'Consumed'
        RELEASED = 'RELEASED', 'Released'

    work_order = models.ForeignKey(WorkOrder, on_delete=models.CASCADE, related_name='allocations')
    item = models.ForeignKey(Item, on_delete=models.PROTECT)
    quantity = models.DecimalField(max_digits=12, decimal_places=4)
    status = models.CharField(max_length=16, choices=AllocationStatus.choices, default=AllocationStatus.RESERVED)
