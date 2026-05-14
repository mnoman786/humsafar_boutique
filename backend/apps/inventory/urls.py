from django.urls import path
from .views import InventoryListView, InventoryDetailView, StockAdjustView, InventoryTransactionListView

urlpatterns = [
    path('', InventoryListView.as_view(), name='inventory_list'),
    path('<int:pk>/', InventoryDetailView.as_view(), name='inventory_detail'),
    path('<int:pk>/adjust/', StockAdjustView.as_view(), name='inventory_adjust'),
    path('transactions/', InventoryTransactionListView.as_view(), name='inventory_transactions'),
]
