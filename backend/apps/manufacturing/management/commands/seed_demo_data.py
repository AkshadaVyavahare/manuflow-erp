from django.core.management.base import BaseCommand
from apps.authentication.models import User
from apps.partners.models import BusinessPartner
from apps.inventory.models import Item
from apps.engineering.models import BOMHeader, BOMItem
from apps.manufacturing.models import WorkOrder
from apps.sales.models import SalesOrder, SalesOrderLine
from decimal import Decimal

class Command(BaseCommand):
    help = "Seeds demo data for ManuFlow ERP"

    def handle(self, *args, **options):
        user, created = User.objects.get_or_create(
            email="admin@manuflow.local",
            defaults={"first_name": "Admin", "last_name": "User", "role": "ADMIN", "is_staff": True, "is_superuser": True}
        )
        if created:
            user.set_password("AdminPass123!")
            user.save()

        client, _ = BusinessPartner.objects.get_or_create(
            name="Apex Engineering Ltd",
            defaults={"partner_type": "CUSTOMER", "email": "purchasing@apex.com"}
        )

        steel_rod, _ = Item.objects.get_or_create(
            sku="RAW-STL-001",
            defaults={"name": "Steel Alloy Rod 20mm", "item_type": "RAW", "unit_of_measure": "MTR", "on_hand": Decimal("150.0000"), "allocated": Decimal("0.0000")}
        )

        screws, _ = Item.objects.get_or_create(
            sku="RAW-SCR-002",
            defaults={"name": "M6 Hex Bolt Pack", "item_type": "RAW", "unit_of_measure": "PACK", "on_hand": Decimal("50.0000"), "allocated": Decimal("0.0000")}
        )

        bracket, _ = Item.objects.get_or_create(
            sku="FG-BRK-900",
            defaults={"name": "Heavy Duty Mount Bracket", "item_type": "FINISHED", "unit_of_measure": "PCS", "on_hand": Decimal("0.0000"), "allocated": Decimal("0.0000")}
        )

        bom, _ = BOMHeader.objects.get_or_create(
            code="BOM-BRK-900-V1",
            defaults={"finished_item": bracket, "version": 1, "yield_quantity": Decimal("1.0000")}
        )

        BOMItem.objects.get_or_create(bom=bom, component_item=steel_rod, defaults={"quantity_required": Decimal("2.5000"), "scrap_rate_pct": Decimal("5.00")})
        BOMItem.objects.get_or_create(bom=bom, component_item=screws, defaults={"quantity_required": Decimal("1.0000"), "scrap_rate_pct": Decimal("0.00")})

        # Sample Sales Order
        so, so_created = SalesOrder.objects.get_or_create(
            order_number="SO-2026-101",
            defaults={"customer": client, "status": "DRAFT"}
        )
        if so_created:
            SalesOrderLine.objects.create(sales_order=so, item=bracket, quantity=Decimal("5.0000"), unit_price=Decimal("120.00"))

        self.stdout.write(self.style.SUCCESS("Demo database successfully seeded with Sales Order and Catalog!"))
