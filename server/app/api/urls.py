from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .viewsets import (
    RoboViewSet, JobViewSet, ExecucaoRoboViewSet, 
    LogExecucaoViewSet, StatusRoboViewSet
)

router = DefaultRouter()
router.register(r'robos', RoboViewSet)
router.register(r'jobs', JobViewSet)
router.register(r'execucoes', ExecucaoRoboViewSet)
router.register(r'logs', LogExecucaoViewSet)
router.register(r'status', StatusRoboViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
