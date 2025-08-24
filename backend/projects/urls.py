
from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import EmployeeViewSet, ProjectViewSet, TaskViewSet

router = DefaultRouter()
router.register(r'employees', EmployeeViewSet, basename='employee')
router.register(r'projects', ProjectViewSet, basename='project')
router.register(r'tasks', TaskViewSet, basename='task')

urlpatterns = [
    path('', include(router.urls)),
]
