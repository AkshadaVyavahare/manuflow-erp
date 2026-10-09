from rest_framework import viewsets, serializers
from django.db import transaction
from .models import BOMHeader, BOMItem
from apps.inventory.models import Item

class BOMItemSerializer(serializers.ModelSerializer):
    component_sku = serializers.CharField(source='component_item.sku', read_only=True)
    component_name = serializers.CharField(source='component_item.name', read_only=True)

    class Meta:
        model = BOMItem
        fields = ['id', 'component_item', 'component_sku', 'component_name', 'quantity_required', 'scrap_rate_pct']

class BOMHeaderSerializer(serializers.ModelSerializer):
    components = BOMItemSerializer(many=True, required=False)
    finished_item_sku = serializers.CharField(source='finished_item.sku', read_only=True)
    finished_item_name = serializers.CharField(source='finished_item.name', read_only=True)

    class Meta:
        model = BOMHeader
        fields = ['id', 'code', 'finished_item', 'finished_item_sku', 'finished_item_name', 'version', 'is_active', 'yield_quantity', 'components']

    @transaction.atomic
    def create(self, validated_data):
        components_data = self.context['request'].data.get('components', [])
        bom = BOMHeader.objects.create(**validated_data)
        for comp in components_data:
            BOMItem.objects.create(
                bom=bom,
                component_item_id=comp['component_item_id'],
                quantity_required=comp['quantity_required'],
                scrap_rate_pct=comp.get('scrap_rate_pct', 0)
            )
        return bom

class BOMViewSet(viewsets.ModelViewSet):
    queryset = BOMHeader.objects.all().prefetch_related('components__component_item', 'finished_item')
    serializer_class = BOMHeaderSerializer
