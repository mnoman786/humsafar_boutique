from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Count, Sum, Q
from django.db.models.functions import TruncMonth
from django.utils import timezone
from datetime import timedelta
from apps.authentication.permissions import IsAdminOrStaff
from apps.orders.models import Order
from apps.payments.models import Payment
from apps.customers.models import Customer


class DashboardStatsView(APIView):
    permission_classes = (IsAdminOrStaff,)

    def get(self, request):
        now = timezone.now()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        order_counts = Order.objects.aggregate(
            total=Count('id'),
            waiting=Count('id', filter=Q(status='waiting')),
            running=Count('id', filter=Q(status='running')),
            completed=Count('id', filter=Q(status='completed')),
            delivered=Count('id', filter=Q(status='delivered')),
            cancelled=Count('id', filter=Q(status='cancelled')),
        )

        revenue = Order.objects.aggregate(
            total_revenue=Sum('total_amount'),
            monthly_revenue=Sum('total_amount', filter=Q(created_at__gte=month_start)),
        )

        pending_payments = Order.objects.exclude(status='cancelled').aggregate(
            total=Sum('remaining_payment')
        )['total'] or 0

        total_customers = Customer.objects.count()

        return Response({
            'orders': order_counts,
            'total_revenue': revenue['total_revenue'] or 0,
            'monthly_revenue': revenue['monthly_revenue'] or 0,
            'pending_payments': pending_payments,
            'total_customers': total_customers,
        })


class DashboardChartsView(APIView):
    permission_classes = (IsAdminOrStaff,)

    def get(self, request):
        now = timezone.now()
        twelve_months_ago = now - timedelta(days=365)

        monthly_sales = (
            Order.objects
            .filter(created_at__gte=twelve_months_ago)
            .annotate(month=TruncMonth('created_at'))
            .values('month')
            .annotate(orders=Count('id'), revenue=Sum('total_amount'))
            .order_by('month')
        )

        monthly_data = [
            {
                'month': item['month'].strftime('%b %Y'),
                'orders': item['orders'],
                'revenue': float(item['revenue'] or 0),
            }
            for item in monthly_sales
        ]

        status_data = [
            {'status': s[0], 'label': s[1], 'count': Order.objects.filter(status=s[0]).count()}
            for s in Order.STATUS_CHOICES
        ]

        return Response({
            'monthly_sales': monthly_data,
            'order_status': status_data,
        })


class DashboardRecentView(APIView):
    permission_classes = (IsAdminOrStaff,)

    def get(self, request):
        from apps.orders.serializers import OrderListSerializer
        from apps.payments.serializers import PaymentSerializer

        recent_orders = Order.objects.select_related('customer').order_by('-created_at')[:10]
        recent_payments = Payment.objects.select_related('order__customer', 'recorded_by').order_by('-created_at')[:10]
        recent_delivered = Order.objects.select_related('customer').filter(status='delivered').order_by('-updated_at')[:5]

        return Response({
            'recent_orders': OrderListSerializer(recent_orders, many=True, context={'request': request}).data,
            'recent_payments': PaymentSerializer(recent_payments, many=True, context={'request': request}).data,
            'recent_delivered': OrderListSerializer(recent_delivered, many=True, context={'request': request}).data,
        })
