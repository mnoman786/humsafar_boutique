from django.contrib import admin
from .models import Payment


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('order', 'amount', 'payment_method', 'payment_date', 'recorded_by', 'created_at')
    list_filter = ('payment_method', 'payment_date')
    search_fields = ('order__order_number', 'order__customer__full_name')
    ordering = ('-payment_date',)
