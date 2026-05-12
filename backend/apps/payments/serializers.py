from rest_framework import serializers
from apps.orders.models import Order
from .models import Payment


class PaymentSerializer(serializers.ModelSerializer):
    order_number = serializers.SerializerMethodField()
    customer_name = serializers.SerializerMethodField()
    recorded_by_name = serializers.SerializerMethodField()
    order_id = serializers.PrimaryKeyRelatedField(
        write_only=True, source='order', queryset=Order.objects.all()
    )

    class Meta:
        model = Payment
        fields = (
            'id', 'order_id', 'order_number', 'customer_name',
            'amount', 'payment_date', 'payment_method',
            'recorded_by_name', 'notes', 'created_at'
        )
        read_only_fields = ('id', 'created_at')

    def get_order_number(self, obj):
        return obj.order.order_number

    def get_customer_name(self, obj):
        return obj.order.customer.full_name

    def get_recorded_by_name(self, obj):
        return obj.recorded_by.full_name if obj.recorded_by else None

    def validate(self, attrs):
        order = attrs.get('order')
        amount = attrs.get('amount', 0)
        if order and amount:
            existing = self.instance
            current_paid = sum(p.amount for p in order.payments.all())
            if existing:
                current_paid -= existing.amount
            balance = order.total_amount - order.advance_payment - current_paid
            if amount > balance:
                raise serializers.ValidationError(
                    {'amount': f'Payment amount exceeds remaining balance of PKR {balance}.'}
                )
        return attrs

    def create(self, validated_data):
        request = self.context.get('request')
        validated_data['recorded_by'] = request.user if request else None
        return super().create(validated_data)
