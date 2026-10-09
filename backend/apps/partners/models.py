from django.db import models

class BusinessPartner(models.Model):
    class PartnerType(models.TextChoices):
        CUSTOMER = 'CUSTOMER', 'Customer'
        SUPPLIER = 'SUPPLIER', 'Supplier'

    partner_type = models.CharField(max_length=16, choices=PartnerType.choices)
    name = models.CharField(max_length=255)
    tax_id = models.CharField(max_length=64, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=32, blank=True)
    payment_terms_days = models.PositiveIntegerField(default=30)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"[{self.partner_type}] {self.name}"
