from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from datetime import timedelta
from .models import Employee, Project, Task
from .serializers import EmployeeSerializer, ProjectSerializer, TaskSerializer

class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.all().order_by("id")
    serializer_class = EmployeeSerializer

class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all().order_by("-id").prefetch_related("tasks", "assigned_employee")
    serializer_class = ProjectSerializer

    @action(detail=True, methods=["get"])
    def tasks(self, request, pk=None):
        tasks = Task.objects.filter(project_id=pk).order_by("order")
        return Response(TaskSerializer(tasks, many=True).data)

class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.select_related("project").all().order_by("project_id", "order")
    serializer_class = TaskSerializer

    def update(self, request, *args, **kwargs):
        # When a task's end_date changes, shift subsequent tasks by the delta (cascade delay).
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        old_end = instance.end_date

        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            self.perform_update(serializer)
            instance.refresh_from_db()
            new_end = instance.end_date

            if old_end and new_end and new_end != old_end:
                delta = new_end - old_end
                following = Task.objects.filter(project=instance.project, order__gt=instance.order).order_by("order")
                for t in following:
                    if t.start_date:
                        t.start_date = t.start_date + delta
                    if t.end_date:
                        t.end_date = t.end_date + delta
                    t.save()

        return Response(self.get_serializer(instance).data)

    @action(detail=True, methods=["post"])
    def shift(self, request, pk=None):
        # Shift a task by N days (positive or negative) and cascade.
        instance = self.get_object()
        days = int(request.data.get("days", 0))
        delta = timedelta(days=days)
        with transaction.atomic():
            if instance.start_date:
                instance.start_date = instance.start_date + delta
            if instance.end_date:
                instance.end_date = instance.end_date + delta
            instance.save()
            following = Task.objects.filter(project=instance.project, order__gt=instance.order).order_by("order")
            for t in following:
                if t.start_date:
                    t.start_date = t.start_date + delta
                if t.end_date:
                    t.end_date = t.end_date + delta
                t.save()
        return Response(self.get_serializer(instance).data)
