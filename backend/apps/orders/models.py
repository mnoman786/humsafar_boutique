from django.db import models
from django.utils import timezone
from apps.customers.models import Customer
from apps.authentication.models import CustomUser
import uuid


def generate_order_number():
    from datetime import date
    today = date.today()
    prefix = f'HB-{today.strftime("%Y%m%d")}'
    count = Order.objects.filter(order_number__startswith=prefix).count()
    return f'{prefix}-{str(count + 1).zfill(4)}'


def order_image_path(instance, filename):
    ext = filename.rsplit('.', 1)[-1]
    return f'orders/{instance.order.order_number}/{uuid.uuid4().hex}.{ext}'


class Order(models.Model):
    STATUS_CHOICES = [
        ('waiting', 'Waiting'),
        ('running', 'Running'),
        ('completed', 'Completed'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
    ]

    order_number = models.CharField(max_length=30, unique=True, editable=False)
    customer = models.ForeignKey(Customer, on_delete=models.PROTECT, related_name='orders')
    cloth_type = models.CharField(max_length=100)
    cloth_color = models.CharField(max_length=100)
    quantity = models.PositiveIntegerField(default=1)
    design_details = models.TextField(blank=True)
    measurement_details = models.TextField(blank=True)

    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    advance_payment = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    remaining_payment = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='waiting')
    expected_delivery_date = models.DateField(null=True, blank=True)
    delivered_date = models.DateField(null=True, blank=True)

    customer_notes = models.TextField(blank=True)
    admin_notes = models.TextField(blank=True)
    extra_notes = models.TextField(blank=True)

    created_by = models.ForeignKey(
        CustomUser, on_delete=models.SET_NULL, null=True, related_name='created_orders'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'orders'
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.order_number:
            self.order_number = generate_order_number()
        # Only recalculate from advance_payment when the signal hasn't already set it.
        # The payment signal uses queryset.update(remaining_payment=...) which bypasses
        # this save(), so this branch only runs on normal order saves.
        update_fields = kwargs.get('update_fields')
        if update_fields is None or 'remaining_payment' not in update_fields:
            from django.db.models import Sum
            total_paid = self.payments.aggregate(total=Sum('amount'))['total'] or 0 if self.pk else 0
            self.remaining_payment = self.total_amount - self.advance_payment - total_paid
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.order_number} - {self.customer.full_name}'

    @property
    def total_paid(self):
        return sum(p.amount for p in self.payments.all())

    @property
    def balance_due(self):
        return self.total_amount - self.advance_payment - self.total_paid


class OrderStatusHistory(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='status_history')
    status = models.CharField(max_length=20, choices=Order.STATUS_CHOICES)
    changed_by = models.ForeignKey(
        CustomUser, on_delete=models.SET_NULL, null=True, related_name='status_changes'
    )
    notes = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'order_status_history'
        ordering = ['timestamp']

    def __str__(self):
        return f'{self.order.order_number} → {self.status}'


class UploadedImage(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to=order_image_path)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'order_images'
        ordering = ['uploaded_at']

    def __str__(self):
        return f'Image for {self.order.order_number}'
