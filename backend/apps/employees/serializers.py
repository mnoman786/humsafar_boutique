from rest_framework import serializers
from .models import Employee, Attendance, AttendanceHistory


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


class AttendanceHistorySerializer(serializers.ModelSerializer):
    changed_by_name = serializers.SerializerMethodField()

    class Meta:
        model = AttendanceHistory
        fields = ('id', 'date', 'old_hours', 'new_hours', 'changed_by_name', 'changed_at')

    def get_changed_by_name(self, obj):
        return obj.changed_by.full_name if obj.changed_by else 'System'
