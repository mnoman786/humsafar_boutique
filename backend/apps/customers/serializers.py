from rest_framework import serializers
from .models import Customer


class CustomerSerializer(serializers.ModelSerializer):
    total_orders = serializers.ReadOnlyField()

    class Meta:
        model = Customer
        fields = (
            'id', 'full_name', 'phone', 'alternate_phone',
            'address', 'city', 'notes', 'total_orders',
            'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')


class CustomerBriefSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = ('id', 'full_name', 'phone', 'city')
