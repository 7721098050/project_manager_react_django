
from django.db import models

class Employee(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)

    def __str__(self):
        return self.name

class Project(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    assigned_employee = models.ForeignKey('Employee', on_delete=models.SET_NULL, null=True, blank=True, related_name="projects")
    completion_time = models.DurationField(null=True, blank=True)

    def save(self, *args, **kwargs):
        if self.start_date and self.end_date:
            self.completion_time = self.end_date - self.start_date
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title

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
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    completion_time = models.DurationField(null=True, blank=True)

    class Meta:
        ordering = ["project", "order"]
        unique_together = ("project", "order")

    def save(self, *args, **kwargs):
        if self.start_date and self.end_date:
            self.completion_time = self.end_date - self.start_date
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.project.title} - {self.order}. {self.name}"
