from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('authentication', '0001_initial'),
        ('employees', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='AttendanceHistory',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('date', models.DateField()),
                ('old_hours', models.DecimalField(decimal_places=1, max_digits=4)),
                ('new_hours', models.DecimalField(decimal_places=1, max_digits=4)),
                ('changed_at', models.DateTimeField(auto_now_add=True)),
                ('employee', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='attendance_history', to='employees.employee')),
                ('changed_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='authentication.customuser')),
            ],
            options={'db_table': 'attendance_history', 'ordering': ['-changed_at']},
        ),
    ]
