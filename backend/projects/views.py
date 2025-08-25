from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from datetime import timedelta, date
from .models import Employee, Project, Task
from .serializers import EmployeeSerializer, ProjectSerializer, TaskSerializer

class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.all().order_by("name")
    serializer_class = EmployeeSerializer

    @action(detail=True, methods=["get"])
    def projects(self, request, pk=None):
        """Get all projects assigned to this employee"""
        employee = self.get_object()
        projects = employee.projects.all()
        serializer = ProjectSerializer(projects, many=True)
        return Response(serializer.data)

class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all().order_by("-created_at").prefetch_related("tasks", "assigned_employee")
    serializer_class = ProjectSerializer

    @action(detail=True, methods=["get"])
    def tasks(self, request, pk=None):
        """Get all tasks for this project"""
        tasks = Task.objects.filter(project_id=pk).order_by("order")
        return Response(TaskSerializer(tasks, many=True).data)
    
@action(detail=False, methods=["get"])
def stats(self, request):
    """Get overall project statistics"""
    projects = Project.objects.all()
    total_projects = projects.count()
    total_tasks = Task.objects.count()
    completed_tasks = Task.objects.filter(status='done').count()
    
    return Response({
        'total_projects': total_projects,
        'total_tasks': total_tasks,
        'completed_tasks': completed_tasks,
        'completion_rate': round((completed_tasks / total_tasks) * 100) if total_tasks > 0 else 0
    })
     
    @action(detail=True, methods=["post"])
    def auto_schedule(self, request, pk=None):
        """Auto-schedule all tasks in this project starting from project start date"""
        project = self.get_object()
        
        if not project.start_date:
            return Response(
                {"error": "Project must have a start date to auto-schedule tasks"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        tasks = project.tasks.order_by('order')
        current_date = project.start_date
        
        with transaction.atomic():
            for task in tasks:
                # Skip weekends for start date
                while current_date.weekday() >= 5:  # Saturday = 5, Sunday = 6
                    current_date += timedelta(days=1)
                
                task.start_date = current_date
                task.save()  # This will auto-calculate end_date
                
                # Next task starts day after this one ends
                if task.end_date:
                    current_date = task.end_date + timedelta(days=1)
        
        # Return updated project with tasks
        serializer = self.get_serializer(project)
        return Response(serializer.data)

class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.select_related("project").all().order_by("project_id", "order")
    serializer_class = TaskSerializer

    def add_business_days(self, start_date, days):
        """Add business days to a date, excluding weekends"""
        current = start_date
        added_days = 0
        
        while added_days < days:
            current += timedelta(days=1)
            # Skip weekends (Monday=0, Sunday=6)
            if current.weekday() < 5:
                added_days += 1
        
        return current

    def cascade_delay(self, task, old_end_date, new_end_date):
        """Cascade delay to all subsequent tasks in the project"""
        if not old_end_date or not new_end_date:
            return
        
        delta = new_end_date - old_end_date
        if delta == timedelta(0):
            return
        
        # Get all subsequent tasks
        following_tasks = Task.objects.filter(
            project=task.project, 
            order__gt=task.order
        ).order_by("order")
        
        for following_task in following_tasks:
            if following_task.start_date:
                following_task.start_date = following_task.start_date + delta
            if following_task.end_date:
                following_task.end_date = following_task.end_date + delta
            following_task.save(skip_auto_end_date=True)  # Skip auto-calculation to preserve manual adjustments

    def update(self, request, *args, **kwargs):
        """Enhanced update with cascade logic"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        old_end_date = instance.end_date
        old_start_date = instance.start_date

        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            # Save the updated task
            updated_instance = serializer.save()
            
            # Handle cascade logic
            new_end_date = updated_instance.end_date
            new_start_date = updated_instance.start_date
            
            # If end date changed, cascade the delay
            if old_end_date and new_end_date and new_end_date != old_end_date:
                self.cascade_delay(updated_instance, old_end_date, new_end_date)
            
            # If start date changed but completion_days stayed same, recalculate and cascade
            elif (old_start_date and new_start_date and new_start_date != old_start_date 
                  and updated_instance.completion_days):
                # Recalculate end date based on new start date
                new_calculated_end = updated_instance.calculate_end_date()
                if new_calculated_end:
                    updated_instance.end_date = new_calculated_end
                    updated_instance.save(skip_auto_end_date=True)
                    
                    # Cascade to following tasks
                    if old_end_date:
                        self.cascade_delay(updated_instance, old_end_date, new_calculated_end)

        return Response(self.get_serializer(updated_instance).data)

    @action(detail=True, methods=["post"])
    def shift(self, request, pk=None):
        """Shift a task by N business days and cascade to following tasks"""
        instance = self.get_object()
        days = int(request.data.get("days", 0))
        
        if days == 0:
            return Response({"error": "Days parameter is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        old_end_date = instance.end_date
        
        with transaction.atomic():
            # Shift start date by business days
            if instance.start_date:
                if days > 0:
                    new_start = self.add_business_days(instance.start_date, days)
                else:
                    # For negative days, subtract business days
                    new_start = instance.start_date
                    remaining_days = abs(days)
                    while remaining_days > 0:
                        new_start -= timedelta(days=1)
                        if new_start.weekday() < 5:  # Business day
                            remaining_days -= 1
                
                instance.start_date = new_start
                instance.save()  # This will auto-recalculate end_date
                
                # Cascade to following tasks
                if old_end_date and instance.end_date:
                    self.cascade_delay(instance, old_end_date, instance.end_date)
        
        return Response(self.get_serializer(instance).data)

    @action(detail=True, methods=["post"])
    def set_completion_days(self, request, pk=None):
        """Set completion days and auto-calculate end date, then cascade"""
        instance = self.get_object()
        completion_days = int(request.data.get("completion_days", 1))
        
        if completion_days < 1:
            return Response(
                {"error": "Completion days must be at least 1"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        old_end_date = instance.end_date
        
        with transaction.atomic():
            instance.completion_days = completion_days
            if instance.start_date:
                instance.end_date = instance.calculate_end_date()
            instance.save(skip_auto_end_date=True)
            
            # Cascade delay to following tasks
            if old_end_date and instance.end_date:
                self.cascade_delay(instance, old_end_date, instance.end_date)
        
        return Response(self.get_serializer(instance).data)

    @action(detail=False, methods=["get"])
    def project_timeline(self, request):
        """Get timeline view of all tasks across projects"""
        tasks = self.get_queryset().filter(
            start_date__isnull=False,
            end_date__isnull=False
        ).select_related('project')
        
        timeline_data = []
        for task in tasks:
            timeline_data.append({
                'id': task.id,
                'name': task.name,
                'project': task.project.title,
                'start': task.start_date,
                'end': task.end_date,
                'status': task.status,
                'completion_days': task.completion_days,
                'assigned_to': task.project.assigned_employee.name if task.project.assigned_employee else None
            })
        
        return Response(timeline_data)