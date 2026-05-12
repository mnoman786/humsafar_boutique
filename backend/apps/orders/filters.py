import django_filters
from .models import Order


class OrderFilter(django_filters.FilterSet):
    status = django_filters.CharFilter(field_name='status', lookup_expr='exact')
    date_from = django_filters.DateFilter(field_name='created_at__date', lookup_expr='gte')
    date_to = django_filters.DateFilter(field_name='created_at__date', lookup_expr='lte')
    expected_from = django_filters.DateFilter(field_name='expected_delivery_date', lookup_expr='gte')
    expected_to = django_filters.DateFilter(field_name='expected_delivery_date', lookup_expr='lte')
    customer_id = django_filters.NumberFilter(field_name='customer__id')

    class Meta:
        model = Order
        fields = ['status', 'date_from', 'date_to', 'customer_id']
