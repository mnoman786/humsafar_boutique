from decimal import Decimal
from rest_framework import generics, filters, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django_filters.rest_framework import DjangoFilterBackend
from apps.authentication.permissions import IsAdminOrStaff
from .models import Order, OrderStatusHistory, UploadedImage
from .serializers import (
    OrderSerializer, OrderListSerializer, OrderStatusUpdateSerializer,
    OrderTrackSerializer, UploadedImageSerializer
)
from .filters import OrderFilter


class OrderListView(generics.ListCreateAPIView):
    permission_classes = (IsAdminOrStaff,)
    queryset = Order.objects.select_related('customer', 'created_by').prefetch_related('images', 'payments')
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = OrderFilter
    search_fields = ['order_number', 'customer__full_name', 'customer__phone']
    ordering_fields = ['created_at', 'expected_delivery_date', 'total_amount', 'status']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return OrderSerializer
        return OrderListSerializer

    def get_parsers(self):
        if self.request.method == 'POST':
            return [MultiPartParser(), FormParser(), JSONParser()]
        return super().get_parsers()


class OrderDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = (IsAdminOrStaff,)
    serializer_class = OrderSerializer
    queryset = Order.objects.select_related('customer', 'created_by').prefetch_related(
        'status_history__changed_by', 'images', 'payments', 'materials__item'
    )
    parser_classes = [MultiPartParser, FormParser, JSONParser]


class OrderStatusUpdateView(APIView):
    permission_classes = (IsAdminOrStaff,)

    def post(self, request, pk):
        try:
            order = Order.objects.get(pk=pk)
        except Order.DoesNotExist:
            return Response({'error': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = OrderStatusUpdateSerializer(data=request.data)
        if serializer.is_valid():
            new_status = serializer.validated_data['status']
            notes = serializer.validated_data.get('notes', '')
            delivered_date = serializer.validated_data.get('delivered_date')

            from apps.inventory.models import InventoryTransaction

            # Restore stock when cancelling
            if new_status == 'cancelled' and order.status != 'cancelled':
                for material in order.materials.select_related('item'):
                    material.item.quantity += material.quantity
                    material.item.save()
                    InventoryTransaction.objects.create(
                        item=material.item, order=order,
                        transaction_type='in',
                        quantity=material.quantity,
                        notes=f'Restored: order {order.order_number} cancelled',
                        created_by=request.user,
                    )

            # Re-deduct stock when reactivating a cancelled order
            elif order.status == 'cancelled' and new_status != 'cancelled':
                for material in order.materials.select_related('item'):
                    material.item.quantity = max(Decimal('0'), material.item.quantity - material.quantity)
                    material.item.save()
                    InventoryTransaction.objects.create(
                        item=material.item, order=order,
                        transaction_type='out',
                        quantity=material.quantity,
                        notes=f'Re-deducted: order {order.order_number} reactivated',
                        created_by=request.user,
                    )

            order.status = new_status
            if delivered_date:
                order.delivered_date = delivered_date
            order.save()

            OrderStatusHistory.objects.create(
                order=order,
                status=new_status,
                changed_by=request.user,
                notes=notes
            )

            order = Order.objects.select_related('customer', 'created_by').prefetch_related(
                'status_history__changed_by', 'images', 'payments', 'materials__item'
            ).get(pk=pk)
            return Response(OrderSerializer(order, context={'request': request}).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class OrderImageUploadView(APIView):
    permission_classes = (IsAdminOrStaff,)
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, pk):
        try:
            order = Order.objects.get(pk=pk)
        except Order.DoesNotExist:
            return Response({'error': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

        images = request.FILES.getlist('images')
        created = []
        for img in images:
            obj = UploadedImage.objects.create(order=order, image=img)
            created.append(UploadedImageSerializer(obj, context={'request': request}).data)

        return Response(created, status=status.HTTP_201_CREATED)

    def delete(self, request, pk):
        image_id = request.data.get('image_id')
        try:
            img = UploadedImage.objects.get(pk=image_id, order__pk=pk)
            img.image.delete(save=False)
            img.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except UploadedImage.DoesNotExist:
            return Response({'error': 'Image not found.'}, status=status.HTTP_404_NOT_FOUND)


class OrderTrackView(APIView):
    permission_classes = (AllowAny,)

    def get(self, request):
        order_number = request.query_params.get('order_number', '').strip().upper()
        phone = request.query_params.get('phone', '').strip()

        if not order_number or not phone:
            return Response(
                {'error': 'Order number and phone are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            order = Order.objects.select_related('customer').prefetch_related(
                'status_history', 'images'
            ).get(
                order_number=order_number,
                customer__phone=phone
            )
        except Order.DoesNotExist:
            return Response(
                {'error': 'No order found with the provided details.'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = OrderTrackSerializer(order, context={'request': request})
        return Response(serializer.data)
