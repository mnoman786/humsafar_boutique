from django.contrib import admin
from .models import Order, OrderStatusHistory, UploadedImage


class OrderStatusHistoryInline(admin.TabularInline):
    model = OrderStatusHistory
    extra = 0
    readonly_fields = ('status', 'changed_by', 'timestamp', 'notes')


class UploadedImageInline(admin.TabularInline):
    model = UploadedImage
    extra = 0
    readonly_fields = ('uploaded_at',)


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('order_number', 'customer', 'status', 'total_amount', 'expected_delivery_date', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('order_number', 'customer__full_name', 'customer__phone')
    ordering = ('-created_at',)
    inlines = [OrderStatusHistoryInline, UploadedImageInline]
    readonly_fields = ('order_number', 'remaining_payment', 'created_at', 'updated_at')
