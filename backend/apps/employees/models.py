from django.db import models
from apps.authentication.models import CustomUser


class Employee(models.Model):
    full_name = models.CharField(max_length=100)
    phone = models.CharField(max_length=20, blank=True)
    per_day_income = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    joined_date = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'employees'
        ordering = ['full_name']

    def __str__(self):
        return self.full_name


class Attendance(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='attendances')
    date = models.DateField()
    hours = models.DecimalField(max_digits=4, decimal_places=1, default=0)
    notes = models.TextField(blank=True)
    recorded_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'attendance'
        unique_together = [('employee', 'date')]
        ordering = ['date']

    def __str__(self):
        return f'{self.employee.full_name} — {self.date} ({self.hours})'


class AttendanceHistory(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='attendance_history')
    date = models.DateField()
    old_hours = models.DecimalField(max_digits=4, decimal_places=1)
    new_hours = models.DecimalField(max_digits=4, decimal_places=1)
    changed_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True)
    changed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'attendance_history'
        ordering = ['-changed_at']

    def __str__(self):
        return f'{self.employee.full_name} {self.date}: {self.old_hours}→{self.new_hours}'
