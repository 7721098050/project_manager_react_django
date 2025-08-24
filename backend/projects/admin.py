
from django.contrib import admin
from .models import Employee, Project, Task

@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "email")

class TaskInline(admin.TabularInline):
    model = Task
    extra = 0

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "start_date", "end_date", "assigned_employee", "completion_time")
    inlines = [TaskInline]

@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ("id", "project", "order", "name", "start_date", "end_date", "status", "completion_time")
    list_filter = ("project", "status")
