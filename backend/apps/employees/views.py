from datetime import date, timedelta
from rest_framework import generics, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from apps.authentication.permissions import IsAdminOrStaff, IsAdmin
from .models import Employee, Attendance
from .serializers import EmployeeSerializer, AttendanceSerializer


class EmployeeListView(generics.ListCreateAPIView):
    serializer_class = EmployeeSerializer
    queryset = Employee.objects.all()
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['full_name', 'phone']
    ordering_fields = ['full_name', 'per_day_income', 'joined_date']

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdmin()]
        return [IsAdminOrStaff()]

    def get_queryset(self):
        qs = Employee.objects.all()
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            qs = qs.filter(is_active=is_active.lower() == 'true')
        return qs


class EmployeeDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = EmployeeSerializer
    queryset = Employee.objects.all()

    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [IsAdmin()]
        return [IsAdminOrStaff()]


class WeeklyAttendanceView(APIView):
    permission_classes = (IsAdminOrStaff,)

    def get(self, request):
        week_start_str = request.query_params.get('week_start')
        if week_start_str:
            try:
                week_start = date.fromisoformat(week_start_str)
            except ValueError:
                return Response({'error': 'Invalid date format. Use YYYY-MM-DD.'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            today = date.today()
            week_start = today - timedelta(days=today.weekday())

        week_end = week_start + timedelta(days=6)
        dates = [week_start + timedelta(days=i) for i in range(7)]

        employees = Employee.objects.filter(is_active=True)
        attendances = Attendance.objects.filter(
            date__range=[week_start, week_end]
        ).select_related('employee')

        att_lookup = {}
        for att in attendances:
            emp_id = att.employee_id
            if emp_id not in att_lookup:
                att_lookup[emp_id] = {}
            att_lookup[emp_id][str(att.date)] = float(att.hours)

        result = []
        grand_total_days = 0
        grand_total_salary = 0

        for emp in employees:
            emp_att = att_lookup.get(emp.id, {})
            attendance_by_date = {}
            total_days = 0
            for d in dates:
                d_str = str(d)
                val = emp_att.get(d_str, 0)
                attendance_by_date[d_str] = val
                total_days += val

            per_day = float(emp.per_day_income)
            total_salary = total_days * per_day
            grand_total_days += total_days
            grand_total_salary += total_salary

            result.append({
                'id': emp.id,
                'full_name': emp.full_name,
                'per_day_income': per_day,
                'attendance': attendance_by_date,
                'total_days': total_days,
                'total_salary': total_salary,
            })

        return Response({
            'week_start': str(week_start),
            'week_end': str(week_end),
            'dates': [str(d) for d in dates],
            'employees': result,
            'grand_total_days': grand_total_days,
            'grand_total_salary': grand_total_salary,
        })

    def post(self, request):
        employee_id = request.data.get('employee_id')
        date_str = request.data.get('date')
        hours = request.data.get('hours', 0)

        if not employee_id or not date_str:
            return Response({'error': 'employee_id and date are required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            employee = Employee.objects.get(pk=employee_id)
        except Employee.DoesNotExist:
            return Response({'error': 'Employee not found.'}, status=status.HTTP_404_NOT_FOUND)

        att, _ = Attendance.objects.update_or_create(
            employee=employee,
            date=date_str,
            defaults={'hours': hours, 'recorded_by': request.user}
        )

        return Response({'id': att.id, 'employee_id': employee_id, 'date': date_str, 'hours': float(att.hours)})
