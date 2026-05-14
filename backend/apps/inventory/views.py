from rest_framework import generics, filters, status
from rest_framework.views import APIView
from rest_framework.response import Response
from apps.authentication.permissions import IsAdminOrStaff, IsAdmin
from .models import InventoryItem, InventoryTransaction
from .serializers import InventoryItemSerializer, InventoryTransactionSerializer, StockAdjustSerializer


class InventoryListView(generics.ListCreateAPIView):
    serializer_class = InventoryItemSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'category']
    ordering_fields = ['name', 'category', 'quantity', 'created_at']

    def get_queryset(self):
        qs = InventoryItem.objects.all()
        category = self.request.query_params.get('category')
        if category:
            qs = qs.filter(category=category)
        active = self.request.query_params.get('is_active')
        if active is not None:
            qs = qs.filter(is_active=active.lower() == 'true')
        return qs

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdmin()]
        return [IsAdminOrStaff()]


class InventoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = InventoryItemSerializer
    queryset = InventoryItem.objects.all()

    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [IsAdmin()]
        return [IsAdminOrStaff()]


class StockAdjustView(APIView):
    permission_classes = (IsAdminOrStaff,)

    def post(self, request, pk):
        try:
            item = InventoryItem.objects.get(pk=pk)
        except InventoryItem.DoesNotExist:
            return Response({'error': 'Item not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = StockAdjustSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        qty = serializer.validated_data['quantity']
        notes = serializer.validated_data.get('notes', '')

        item.quantity += qty
        if item.quantity < 0:
            item.quantity = 0
        item.save()

        InventoryTransaction.objects.create(
            item=item,
            transaction_type='in' if qty > 0 else 'adjustment',
            quantity=abs(qty),
            notes=notes,
            created_by=request.user,
        )

        return Response(InventoryItemSerializer(item).data)


class InventoryTransactionListView(generics.ListAPIView):
    permission_classes = (IsAdminOrStaff,)
    serializer_class = InventoryTransactionSerializer

    def get_queryset(self):
        qs = InventoryTransaction.objects.select_related('item', 'order', 'created_by')
        item_id = self.request.query_params.get('item_id')
        if item_id:
            qs = qs.filter(item_id=item_id)
        return qs
