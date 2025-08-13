from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    # WebSocket para monitoramento geral (dashboard)
    re_path(r'ws/monitoring/$', consumers.MonitoringConsumer.as_asgi()),
    
    # WebSocket para comunicação específica com robôs
    re_path(r'ws/robot/(?P<robot_name>\w+)/$', consumers.RobotConsumer.as_asgi()),
]

