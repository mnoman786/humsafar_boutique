from django.urls import path
from .views import CustomerListView, CustomerDetailView

urlpatterns = [
    path('', CustomerListView.as_view(), name='customer_list'),
    path('<int:pk>/', CustomerDetailView.as_view(), name='customer_detail'),
]
