from rest_framework import serializers
from .models import WorkOrder, MaterialAllocation

class MaterialAllocationSerializer(serializers.ModelSerializer):
    item_sku = serializers.CharField(source='item.sku', read_only=True)
    item_name = serializers.CharField(source='item.name', read_only=True)

    class Meta:
        model = MaterialAllocation
        fields = ['id', 'item', 'item_sku', 'item_name', 'quantity', 'status']

class WorkOrderSerializer(serializers.ModelSerializer):
    allocations = MaterialAllocationSerializer(many=True, read_only=True)

    class Meta:
        model = WorkOrder
        fields = ['id', 'wo_number', 'bom', 'quantity', 'status', 'created_at', 'allocations']
