from django.db import models
from apps.partners.models import BusinessPartner
from apps.inventory.models import Item

class PurchaseOrder(models.Model):
    class Status(models.TextChoices):
        DRAFT = 'DRAFT', 'Draft PO'
        ISSUED = 'ISSUED', 'Issued to Supplier'
        RECEIVED = 'RECEIVED', 'Goods Received'
        CANCELLED = 'CANCELLED', 'Cancelled'

    po_number = models.CharField(max_length=64, unique=True, db_index=True)
    supplier = models.ForeignKey(
        BusinessPartner,
        on_delete=models.PROTECT,
        limit_choices_to={'partner_type': BusinessPartner.PartnerType.SUPPLIER}
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    created_at = models.DateTimeField(auto_now_add=True)

class PurchaseOrderLine(models.Model):
    purchase_order = models.ForeignKey(PurchaseOrder, on_delete=models.CASCADE, related_name='lines')
    item = models.ForeignKey(
        Item,
        on_delete=models.PROTECT,
        limit_choices_to={'item_type': Item.ItemType.RAW}
    )
    quantity = models.DecimalField(max_digits=12, decimal_places=4)
    unit_cost = models.DecimalField(max_digits=12, decimal_places=2)
