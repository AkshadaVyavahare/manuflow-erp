from django.db import models
from decimal import Decimal

class Item(models.Model):
    class ItemType(models.TextChoices):
        RAW = 'RAW', 'Raw Material'
        WIP = 'WIP', 'Work In Progress'
        FINISHED = 'FINISHED', 'Finished Good'

    sku = models.CharField(max_length=64, unique=True, db_index=True)
    name = models.CharField(max_length=255)
    item_type = models.CharField(max_length=16, choices=ItemType.choices)
    unit_of_measure = models.CharField(max_length=16, default='PCS')
    safety_stock = models.DecimalField(max_digits=12, decimal_places=4, default=Decimal('0.0000'))
    on_hand = models.DecimalField(max_digits=12, decimal_places=4, default=Decimal('0.0000'))
    allocated = models.DecimalField(max_digits=12, decimal_places=4, default=Decimal('0.0000'))

    @property
    def available_stock(self) -> Decimal:
        return self.on_hand - self.allocated

    def __str__(self):
        return f"{self.sku} - {self.name}"

class StockLedger(models.Model):
    class MovementType(models.TextChoices):
        INBOUND_PO = 'INBOUND_PO', 'Purchase Order Receipt'
        ALLOCATION = 'ALLOCATION', 'Reserved for Work Order'
        PRODUCTION_CONSUMPTION = 'PROD_CONSUMPTION', 'Consumed in Production'
        PRODUCTION_OUTPUT = 'PROD_OUTPUT', 'Finished Good Output'
        DISPATCH = 'DISPATCH', 'Sales Order Dispatch'

    item = models.ForeignKey(Item, on_delete=models.PROTECT, related_name='ledger_entries')
    quantity = models.DecimalField(max_digits=12, decimal_places=4)
    movement_type = models.CharField(max_length=32, choices=MovementType.choices)
    reference_id = models.CharField(max_length=64, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
