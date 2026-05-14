from rest_framework import serializers
from .models import InventoryItem, OrderMaterial, InventoryTransaction


class InventoryItemSerializer(serializers.ModelSerializer):
    is_low_stock = serializers.ReadOnlyField()

    class Meta:
        model = InventoryItem
        fields = (
            'id', 'name', 'category', 'unit', 'quantity',
            'low_stock_threshold', 'cost_per_unit', 'description',
            'is_active', 'is_low_stock', 'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'created_at', 'updated_at')


class OrderMaterialSerializer(serializers.ModelSerializer):
    item_id = serializers.IntegerField(source='item.id', read_only=True)
    item_name = serializers.CharField(source='item.name', read_only=True)
    unit = serializers.CharField(source='item.unit', read_only=True)

    class Meta:
        model = OrderMaterial
        fields = ('id', 'item_id', 'item_name', 'unit', 'quantity')


class InventoryTransactionSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source='item.name', read_only=True)
    order_number = serializers.SerializerMethodField()
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = InventoryTransaction
        fields = (
            'id', 'item_name', 'order_number', 'transaction_type',
            'quantity', 'notes', 'created_by_name', 'created_at',
        )

    def get_order_number(self, obj):
        return obj.order.order_number if obj.order else None

    def get_created_by_name(self, obj):
        return obj.created_by.full_name if obj.created_by else None


class StockAdjustSerializer(serializers.Serializer):
    quantity = serializers.DecimalField(max_digits=10, decimal_places=2)
    notes = serializers.CharField(required=False, allow_blank=True)
