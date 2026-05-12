from rest_framework import serializers
from .models import Employee, Attendance


class EmployeeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Employee
        fields = ('id', 'full_name', 'phone', 'per_day_income', 'joined_date', 'is_active', 'notes', 'created_at')
        read_only_fields = ('id', 'created_at')


class AttendanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attendance
        fields = ('id', 'employee', 'date', 'hours', 'notes')
        read_only_fields = ('id',)
