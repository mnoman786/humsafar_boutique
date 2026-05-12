from django.urls import path
from .views import EmployeeListView, EmployeeDetailView, WeeklyAttendanceView

urlpatterns = [
    path('', EmployeeListView.as_view(), name='employee_list'),
    path('<int:pk>/', EmployeeDetailView.as_view(), name='employee_detail'),
    path('attendance/', WeeklyAttendanceView.as_view(), name='weekly_attendance'),
]
