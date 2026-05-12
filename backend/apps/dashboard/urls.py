from django.urls import path
from .views import DashboardStatsView, DashboardChartsView, DashboardRecentView

urlpatterns = [
    path('stats/', DashboardStatsView.as_view(), name='dashboard_stats'),
    path('charts/', DashboardChartsView.as_view(), name='dashboard_charts'),
    path('recent/', DashboardRecentView.as_view(), name='dashboard_recent'),
]
