from django.urls import path
from .views import EmployeeListView, EmployeeDetailView, WeeklyAttendanceView, AttendanceHistoryView

urlpatterns = [
    path('', EmployeeListView.as_view(), name='employee_list'),
    path('<int:pk>/', EmployeeDetailView.as_view(), name='employee_detail'),
    path('attendance/', WeeklyAttendanceView.as_view(), name='weekly_attendance'),
    path('attendance/history/', AttendanceHistoryView.as_view(), name='attendance_history'),
]
