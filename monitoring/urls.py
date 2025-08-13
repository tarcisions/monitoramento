from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Router para ViewSets
router = DefaultRouter()
router.register(r'robots', views.RobotViewSet)
router.register(r'executions', views.ExecutionViewSet)
router.register(r'commands', views.CommandViewSet)

app_name = 'monitoring'

urlpatterns = [
    # Dashboard
    path('', views.dashboard_view, name='dashboard'),
    
    # API endpoints
    path('api/', include(router.urls)),
    path('api/logs/', views.LogCreateAPIView.as_view(), name='api-logs-create'),
    path('api/logs/list/', views.LogListAPIView.as_view(), name='api-logs-list'),
    path('api/status/', views.StatusCreateAPIView.as_view(), name='api-status-create'),
    path('api/control/', views.ControlAPIView.as_view(), name='api-control'),
    path('api/dashboard/', views.DashboardAPIView.as_view(), name='api-dashboard'),
    path('api/health/', views.health_check, name='api-health'),
]

