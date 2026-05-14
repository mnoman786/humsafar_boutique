from django.db import models
from apps.authentication.models import CustomUser


class InventoryItem(models.Model):
    CATEGORY_CHOICES = [
        ('fabric', 'Fabric'),
        ('thread', 'Thread'),
        ('accessory', 'Accessory'),
        ('other', 'Other'),
    ]
    UNIT_CHOICES = [
        ('meters', 'Meters'),
        ('yards', 'Yards'),
        ('pieces', 'Pieces'),
        ('kg', 'Kilograms'),
        ('grams', 'Grams'),
        ('tola', 'Tola'),
    ]

    name = models.CharField(max_length=200)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='fabric')
    unit = models.CharField(max_length=20, choices=UNIT_CHOICES, default='meters')
    quantity = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    low_stock_threshold = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    cost_per_unit = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'inventory_items'
        ordering = ['category', 'name']

    def __str__(self):
        return f'{self.name} ({self.quantity} {self.unit})'

    @property
    def is_low_stock(self):
        return self.quantity <= self.low_stock_threshold


class OrderMaterial(models.Model):
    order = models.ForeignKey('orders.Order', on_delete=models.CASCADE, related_name='materials')
    item = models.ForeignKey(InventoryItem, on_delete=models.PROTECT, related_name='order_usages')
    quantity = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        db_table = 'order_materials'
        unique_together = ('order', 'item')

    def __str__(self):
        return f'{self.order.order_number} — {self.item.name} x{self.quantity}'


class InventoryTransaction(models.Model):
    TYPE_CHOICES = [
        ('in', 'Stock In'),
        ('out', 'Stock Out'),
        ('adjustment', 'Adjustment'),
    ]

    item = models.ForeignKey(InventoryItem, on_delete=models.CASCADE, related_name='transactions')
    order = models.ForeignKey('orders.Order', on_delete=models.SET_NULL, null=True, blank=True, related_name='inventory_transactions')
    transaction_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, related_name='inventory_transactions')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'inventory_transactions'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.transaction_type} {self.quantity} of {self.item.name}'
