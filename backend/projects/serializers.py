
from rest_framework import serializers
from .models import Employee, Project, Task

class EmployeeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Employee
        fields = "__all__"

class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = ["id", "project", "name", "description", "order", "start_date", "end_date", "status", "completion_time"]
        read_only_fields = ["completion_time", "project"]

class ProjectSerializer(serializers.ModelSerializer):
    tasks = TaskSerializer(many=True, required=False)
    assigned_employee_detail = EmployeeSerializer(source="assigned_employee", read_only=True)

    class Meta:
        model = Project
        fields = ["id", "title", "description", "start_date", "end_date", "assigned_employee", "assigned_employee_detail", "completion_time", "tasks"]
        read_only_fields = ["completion_time"]

    def create(self, validated_data):
        tasks_data = validated_data.pop("tasks", [])
        project = Project.objects.create(**validated_data)
        for i, t in enumerate(tasks_data, start=1):
            Task.objects.create(project=project, order=t.get("order", i),
                                name=t["name"],
                                description=t.get("description", ""),
                                start_date=t.get("start_date"),
                                end_date=t.get("end_date"),
                                status=t.get("status", "pending"))
        return project

    def update(self, instance, validated_data):
        for attr, val in validated_data.items():
            setattr(instance, attr, val)
        instance.save()
        return instance
