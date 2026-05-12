from rest_framework import generics, filters
from django_filters.rest_framework import DjangoFilterBackend
from apps.authentication.permissions import IsAdminOrStaff
from .models import Customer
from .serializers import CustomerSerializer


class CustomerListView(generics.ListCreateAPIView):
    permission_classes = (IsAdminOrStaff,)
    serializer_class = CustomerSerializer
    queryset = Customer.objects.all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['full_name', 'phone', 'city']
    ordering_fields = ['full_name', 'created_at']
    ordering = ['-created_at']


class CustomerDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = (IsAdminOrStaff,)
    serializer_class = CustomerSerializer
    queryset = Customer.objects.all()
