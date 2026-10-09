from django.db import models
from apps.partners.models import BusinessPartner
from apps.inventory.models import Item
from decimal import Decimal

class SalesOrder(models.Model):
    class Status(models.TextChoices):
        DRAFT = 'DRAFT', 'Draft'
        CONFIRMED = 'CONFIRMED', 'Confirmed'
        IN_PRODUCTION = 'IN_PRODUCTION', 'In Production'
        READY_TO_DISPATCH = 'READY_TO_DISPATCH', 'Ready to Dispatch'
        DISPATCHED = 'DISPATCHED', 'Dispatched'
        CANCELLED = 'CANCELLED', 'Cancelled'

    order_number = models.CharField(max_length=64, unique=True, db_index=True)
    customer = models.ForeignKey(
        BusinessPartner,
        on_delete=models.PROTECT,
        limit_choices_to={'partner_type': BusinessPartner.PartnerType.CUSTOMER}
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    created_at = models.DateTimeField(auto_now_add=True)

class SalesOrderLine(models.Model):
    sales_order = models.ForeignKey(SalesOrder, on_delete=models.CASCADE, related_name='lines')
    item = models.ForeignKey(
        Item,
        on_delete=models.PROTECT,
        limit_choices_to={'item_type': Item.ItemType.FINISHED}
    )
    quantity = models.DecimalField(max_digits=12, decimal_places=4)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)

class Invoice(models.Model):
    class PaymentStatus(models.TextChoices):
        PENDING = 'PENDING', 'Pending Payment'
        PAID = 'PAID', 'Paid'

    invoice_number = models.CharField(max_length=64, unique=True)
    sales_order = models.OneToOneField(SalesOrder, on_delete=models.PROTECT, related_name='invoice')
    customer = models.ForeignKey(BusinessPartner, on_delete=models.PROTECT)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_status = models.CharField(max_length=20, choices=PaymentStatus.choices, default=PaymentStatus.PENDING)
    issued_at = models.DateTimeField(auto_now_add=True)
