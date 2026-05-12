from django.db import models


class Customer(models.Model):
    full_name = models.CharField(max_length=200)
    phone = models.CharField(max_length=20, unique=True)
    alternate_phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'customers'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.full_name} ({self.phone})'

    @property
    def total_orders(self):
        return self.orders.count()
