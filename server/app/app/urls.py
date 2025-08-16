from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from api.metrics import metricas_prometheus

def health_check(request):
    return JsonResponse({'status': 'ok', 'message': 'Sistema operacional'})

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
    path('health/', health_check),
    path('metrics/', metricas_prometheus),
]
