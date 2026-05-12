from rest_framework import generics, filters
from django_filters.rest_framework import DjangoFilterBackend
from apps.authentication.permissions import IsAdminOrStaff, IsAdmin
from .models import Payment
from .serializers import PaymentSerializer


class PaymentListView(generics.ListCreateAPIView):
    serializer_class = PaymentSerializer
    queryset = Payment.objects.select_related('order__customer', 'recorded_by')
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['payment_method', 'order']
    search_fields = ['order__order_number', 'order__customer__full_name']
    ordering_fields = ['payment_date', 'amount', 'created_at']
    ordering = ['-payment_date']

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdmin()]
        return [IsAdminOrStaff()]


class PaymentDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = PaymentSerializer
    queryset = Payment.objects.select_related('order__customer', 'recorded_by')

    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [IsAdmin()]
        return [IsAdminOrStaff()]
