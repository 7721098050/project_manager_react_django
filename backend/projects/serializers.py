from rest_framework import serializers
from .models import Employee, Project, Task
from datetime import timedelta

class EmployeeSerializer(serializers.ModelSerializer):
    project_count = serializers.SerializerMethodField()
    department_display = serializers.CharField(source='get_department_display', read_only=True)
    
    class Meta:
        model = Employee
        fields = ["id", "name", "email", "department", "department_display", "created_at", "project_count"]
        read_only_fields = ["created_at", "department_display"]
    
    def get_project_count(self, obj):
        return obj.projects.count()

class TaskSerializer(serializers.ModelSerializer):
    business_days = serializers.SerializerMethodField()
    
    class Meta:
        model = Task
        fields = [
            "id", "project", "name", "description", "order", 
            "start_date", "end_date", "completion_days", "status", 
            "completion_time", "business_days", "created_at", "updated_at"
        ]
        read_only_fields = ["completion_time", "project", "created_at", "updated_at", "business_days"]

    def get_business_days(self, obj):
        """Calculate actual business days between start and end date"""
        if not obj.start_date or not obj.end_date:
            return None
        
        current = obj.start_date
        days = 0
        while current < obj.end_date:
            current += timedelta(days=1)
            if current.weekday() < 5:  # Monday to Friday
                days += 1
        return days

    def update(self, instance, validated_data):
        # Handle completion_days update
        if 'completion_days' in validated_data and instance.start_date:
            instance.completion_days = validated_data['completion_days']
            instance.end_date = instance.calculate_end_date()
            validated_data['end_date'] = instance.end_date
        
        # Handle start_date update
        if 'start_date' in validated_data and instance.completion_days:
            instance.start_date = validated_data['start_date']
            if instance.start_date:
                instance.end_date = instance.calculate_end_date()
                validated_data['end_date'] = instance.end_date
        
        return super().update(instance, validated_data)

class ProjectSerializer(serializers.ModelSerializer):
    tasks = TaskSerializer(many=True, required=False)
    assigned_employee_detail = EmployeeSerializer(source="assigned_employee", read_only=True)
    task_count = serializers.SerializerMethodField()
    completed_tasks = serializers.SerializerMethodField()
    completion_percentage = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            "id", "title", "description", "start_date", "end_date", 
            "assigned_employee", "assigned_employee_detail", "completion_time", 
            "tasks", "task_count", "completed_tasks", "completion_percentage",
            "created_at", "updated_at"
        ]
        read_only_fields = ["completion_time", "created_at", "updated_at"]

    def get_task_count(self, obj):
        return obj.tasks.count()
    
    def get_completed_tasks(self, obj):
        return obj.tasks.filter(status='done').count()
    
    def get_completion_percentage(self, obj):
        total = obj.tasks.count()
        if total == 0:
            return 0
        completed = obj.tasks.filter(status='done').count()
        return round((completed / total) * 100)

    def create(self, validated_data):
        tasks_data = validated_data.pop("tasks", [])
        project = Project.objects.create(**validated_data)
        
        for i, task_data in enumerate(tasks_data, start=1):
            task = Task.objects.create(
                project=project, 
                order=task_data.get("order", i),
                name=task_data["name"],
                description=task_data.get("description", ""),
                start_date=task_data.get("start_date"),
                completion_days=task_data.get("completion_days", 1),
                status=task_data.get("status", "pending")
            )
            # The save method will auto-calculate end_date
        
        return project

    def update(self, instance, validated_data):
        tasks_data = validated_data.pop("tasks", None)
        
        # Update project fields
        for attr, val in validated_data.items():
            setattr(instance, attr, val)
        instance.save()
        
        # Handle tasks if provided
        if tasks_data is not None:
            # Clear existing tasks and recreate
            instance.tasks.all().delete()
            for i, task_data in enumerate(tasks_data, start=1):
                Task.objects.create(
                    project=instance,
                    order=task_data.get("order", i),
                    name=task_data["name"],
                    description=task_data.get("description", ""),
                    start_date=task_data.get("start_date"),
                    completion_days=task_data.get("completion_days", 1),
                    status=task_data.get("status", "pending")
                )
        
        return instance