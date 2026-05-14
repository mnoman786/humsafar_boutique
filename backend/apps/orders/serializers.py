from rest_framework import serializers
from apps.customers.serializers import CustomerBriefSerializer
from .models import Order, OrderStatusHistory, UploadedImage


class UploadedImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = UploadedImage
        fields = ('id', 'image', 'uploaded_at')
        read_only_fields = ('id', 'uploaded_at')


class OrderStatusHistorySerializer(serializers.ModelSerializer):
    changed_by_name = serializers.SerializerMethodField()

    class Meta:
        model = OrderStatusHistory
        fields = ('id', 'status', 'changed_by_name', 'notes', 'timestamp')

    def get_changed_by_name(self, obj):
        return obj.changed_by.full_name if obj.changed_by else 'System'


class OrderListSerializer(serializers.ModelSerializer):
    customer = CustomerBriefSerializer(read_only=True)
    customer_id = serializers.PrimaryKeyRelatedField(
        write_only=True, source='customer',
        queryset=__import__('apps.customers.models', fromlist=['Customer']).Customer.objects.all()
    )

    class Meta:
        model = Order
        fields = (
            'id', 'order_number', 'customer', 'customer_id', 'status',
            'total_amount', 'advance_payment', 'remaining_payment',
            'order_date', 'expected_delivery_date', 'created_at',
        )
        read_only_fields = ('id', 'order_number', 'remaining_payment', 'created_at')


class OrderSerializer(serializers.ModelSerializer):
    customer = CustomerBriefSerializer(read_only=True)
    customer_id = serializers.PrimaryKeyRelatedField(
        write_only=True, source='customer',
        queryset=__import__('apps.customers.models', fromlist=['Customer']).Customer.objects.all()
    )
    status_history = OrderStatusHistorySerializer(many=True, read_only=True)
    images = UploadedImageSerializer(many=True, read_only=True)
    total_paid = serializers.ReadOnlyField()
    balance_due = serializers.ReadOnlyField()
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = (
            'id', 'order_number', 'customer', 'customer_id',
            'cloth_type', 'cloth_color', 'quantity',
            'design_details', 'measurement_details',
            'total_amount', 'advance_payment', 'remaining_payment',
            'total_paid', 'balance_due',
            'status', 'order_date', 'expected_delivery_date', 'delivered_date',
            'customer_notes', 'admin_notes', 'extra_notes',
            'created_by_name', 'created_at', 'updated_at',
            'status_history', 'images',
        )
        read_only_fields = ('id', 'order_number', 'remaining_payment', 'created_at', 'updated_at')

    def get_created_by_name(self, obj):
        return obj.created_by.full_name if obj.created_by else None

    def create(self, validated_data):
        request = self.context.get('request')
        validated_data['created_by'] = request.user if request else None
        order = super().create(validated_data)
        OrderStatusHistory.objects.create(
            order=order,
            status=order.status,
            changed_by=request.user if request else None,
            notes='Order created'
        )
        if request:
            for img in request.FILES.getlist('images'):
                UploadedImage.objects.create(order=order, image=img)
        return order


class OrderStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Order.STATUS_CHOICES)
    notes = serializers.CharField(required=False, allow_blank=True)
    delivered_date = serializers.DateField(required=False, allow_null=True)


class OrderTrackSerializer(serializers.ModelSerializer):
    customer_name = serializers.SerializerMethodField()
    status_history = OrderStatusHistorySerializer(many=True, read_only=True)
    images = UploadedImageSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = (
            'order_number', 'customer_name', 'cloth_type', 'cloth_color',
            'status', 'expected_delivery_date', 'delivered_date',
            'total_amount', 'advance_payment', 'remaining_payment',
            'status_history', 'images',
        )

    def get_customer_name(self, obj):
        return obj.customer.full_name
