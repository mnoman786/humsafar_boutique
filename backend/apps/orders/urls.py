from django.urls import path
from .views import (
    OrderListView, OrderDetailView, OrderStatusUpdateView,
    OrderImageUploadView, OrderTrackView
)

urlpatterns = [
    path('', OrderListView.as_view(), name='order_list'),
    path('track/', OrderTrackView.as_view(), name='order_track'),
    path('<int:pk>/', OrderDetailView.as_view(), name='order_detail'),
    path('<int:pk>/update-status/', OrderStatusUpdateView.as_view(), name='order_status_update'),
    path('<int:pk>/images/', OrderImageUploadView.as_view(), name='order_images'),
]
