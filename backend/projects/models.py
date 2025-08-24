from django.db import models
from datetime import timedelta, date
from django.utils import timezone

class Employee(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['name']

class Project(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    assigned_employee = models.ForeignKey('Employee', on_delete=models.SET_NULL, null=True, blank=True, related_name="projects")
    completion_time = models.DurationField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if self.start_date and self.end_date:
            self.completion_time = self.end_date - self.start_date
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title

    class Meta:
        ordering = ['-created_at']

class Task(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("in_progress", "In Progress"),
        ("done", "Done"),
        ("blocked", "Blocked"),
    ]
    
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="tasks")
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=1)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    completion_days = models.PositiveIntegerField(default=1, help_text="Duration in business days (excluding weekends)")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    completion_time = models.DurationField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["project", "order"]
        unique_together = ("project", "order")

    def add_business_days(self, start_date, days):
        """Add business days to a date, excluding weekends"""
        current = start_date
        added_days = 0
        
        while added_days < days:
            current += timedelta(days=1)
            # Skip weekends (Monday=0, Sunday=6)
            if current.weekday() < 5:  # Monday to Friday
                added_days += 1
        
        return current

    def calculate_end_date(self):
        """Calculate end date based on start date and completion days"""
        if self.start_date and self.completion_days:
            return self.add_business_days(self.start_date, self.completion_days)
        return None

    def save(self, *args, **kwargs):
        # Auto-calculate end_date if start_date and completion_days are set
        if self.start_date and self.completion_days and not kwargs.get('skip_auto_end_date'):
            self.end_date = self.calculate_end_date()
        
        # Calculate completion_time
        if self.start_date and self.end_date:
            self.completion_time = self.end_date - self.start_date
            
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.project.title} - {self.order}. {self.name}"