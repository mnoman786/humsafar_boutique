from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.db.models import Sum


@receiver(post_save, sender='payments.Payment')
@receiver(post_delete, sender='payments.Payment')
def recalculate_order_remaining(sender, instance, **kwargs):
    """
    After any payment is saved or deleted, recalculate the order's
    remaining_payment = total_amount - advance_payment - sum(all payments).
    Uses queryset .update() to bypass Order.save() and avoid circular signals.
    """
    from apps.orders.models import Order

    order = instance.order
    total_paid = order.payments.aggregate(total=Sum('amount'))['total'] or 0
    new_remaining = order.total_amount - order.advance_payment - total_paid

    Order.objects.filter(pk=order.pk).update(remaining_payment=new_remaining)
