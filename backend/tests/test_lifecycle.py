import pytest
from decimal import Decimal
from apps.inventory.models import Item, StockLedger
from apps.partners.models import BusinessPartner
from apps.engineering.models import BOMHeader, BOMItem
from apps.manufacturing.models import WorkOrder
from apps.manufacturing.services import ManufacturingService
from apps.sales.models import SalesOrder, SalesOrderLine, Invoice

@pytest.mark.django_db
def test_full_manufacturing_lifecycle():
    # 1. Setup Customer & Raw Items
    customer = BusinessPartner.objects.create(name="Apex Corp", partner_type="CUSTOMER")
    raw_steel = Item.objects.create(
        sku="TEST-STL", name="Steel Test", item_type="RAW",
        on_hand=Decimal("100.00"), allocated=Decimal("0.00")
    )
    fg_mount = Item.objects.create(
        sku="TEST-MNT", name="Mount Test", item_type="FINISHED",
        on_hand=Decimal("0.00"), allocated=Decimal("0.00")
    )

    # 2. Setup BOM: 1 Mount requires 5.0 Steel
    bom = BOMHeader.objects.create(code="BOM-TEST-MNT", finished_item=fg_mount, yield_quantity=Decimal("1.00"))
    BOMItem.objects.create(bom=bom, component_item=raw_steel, quantity_required=Decimal("5.00"), scrap_rate_pct=Decimal("0.00"))

    # 3. Create Work Order for 10 Mounts (requires 50.0 Steel)
    wo = WorkOrder.objects.create(wo_number="WO-TEST-001", bom=bom, quantity=Decimal("10.00"))

    # 4. Allocate (Reserve)
    ManufacturingService.allocate_work_order(wo.id)
    raw_steel.refresh_from_db()
    assert raw_steel.allocated == Decimal("50.0000")
    assert raw_steel.available_stock == Decimal("50.0000")

    # 5. Complete Production
    ManufacturingService.complete_work_order(wo.id)
    raw_steel.refresh_from_db()
    fg_mount.refresh_from_db()
    assert raw_steel.on_hand == Decimal("50.0000")
    assert raw_steel.allocated == Decimal("0.0000")
    assert fg_mount.on_hand == Decimal("10.0000")

    # 6. Verify Stock Ledger has consumption and output movements
    movements = list(StockLedger.objects.filter(reference_id=wo.wo_number))
    assert len(movements) == 2
