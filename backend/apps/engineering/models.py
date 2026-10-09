from django.db import models
from apps.inventory.models import Item
from decimal import Decimal

class BOMHeader(models.Model):
    code = models.CharField(max_length=64, unique=True)
    finished_item = models.ForeignKey(
        Item,
        on_delete=models.PROTECT,
        limit_choices_to={'item_type': Item.ItemType.FINISHED},
        related_name='boms'
    )
    version = models.PositiveIntegerField(default=1)
    is_active = models.BooleanField(default=True)
    yield_quantity = models.DecimalField(max_digits=10, decimal_places=4, default=Decimal('1.0000'))

    class Meta:
        unique_together = ('finished_item', 'version')

    def __str__(self):
        return f"{self.code} (v{self.version}) - {self.finished_item.sku}"

class BOMItem(models.Model):
    bom = models.ForeignKey(BOMHeader, on_delete=models.CASCADE, related_name='components')
    component_item = models.ForeignKey(
        Item,
        on_delete=models.PROTECT,
        limit_choices_to={'item_type': Item.ItemType.RAW},
        related_name='used_in_boms'
    )
    quantity_required = models.DecimalField(max_digits=12, decimal_places=4)
    scrap_rate_pct = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('0.00'))

    def __str__(self):
        return f"{self.component_item.sku} x {self.quantity_required}"
