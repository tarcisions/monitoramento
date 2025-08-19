import time
from prometheus_client import Counter, Histogram, Gauge, generate_latest, CONTENT_TYPE_LATEST
from fastapi import Response
import structlog

logger = structlog.get_logger()

# Métricas do RPA
rpa_job_duration_seconds = Histogram(
    'rpa_job_duration_seconds',
    'Duração das execuções de robôs RPA',
    ['robot_slug', 'status']
)

rpa_job_success_total = Counter(
    'rpa_job_success_total',
    'Total de execuções bem-sucedidas',
    ['robot_slug']
)

rpa_job_failure_total = Counter(
    'rpa_job_failure_total',
    'Total de execuções com falha',
    ['robot_slug']
)

rpa_job_in_progress = Gauge(
    'rpa_job_in_progress',
    'Execuções atualmente em progresso',
    ['robot_slug']
)

rpa_events_total = Counter(
    'rpa_events_total',
    'Total de eventos RPA',
    ['robot_slug', 'event_type']
)

# Métricas da API
api_requests_total = Counter(
    'api_requests_total',
    'Total de requisições da API',
    ['method', 'endpoint', 'status_code']
)

api_request_duration_seconds = Histogram(
    'api_request_duration_seconds',
    'Duração das requisições da API',
    ['method', 'endpoint']
)

# Métricas do WebSocket
websocket_connections = Gauge(
    'websocket_connections',
    'Conexões WebSocket ativas'
)

class MetricsService:
    def __init__(self):
        self.execution_start_times = {}
        
    def record_execution_start(self, robot_slug: str, execution_id: str):
        """Registra o início de uma execução"""
        self.execution_start_times[execution_id] = time.time()
        rpa_job_in_progress.labels(robot_slug=robot_slug).inc()
        rpa_events_total.labels(robot_slug=robot_slug, event_type="start").inc()
        logger.info("Execução iniciada registrada", robot_slug=robot_slug, execution_id=execution_id)
        
    def record_execution_finish(self, robot_slug: str, execution_id: str, status: str):
        """Registra o fim de uma execução"""
        start_time = self.execution_start_times.pop(execution_id, None)
        if start_time:
            duration = time.time() - start_time
            rpa_job_duration_seconds.labels(robot_slug=robot_slug, status=status).observe(duration)
            
        rpa_job_in_progress.labels(robot_slug=robot_slug).dec()
        
        if status == "concluida":
            rpa_job_success_total.labels(robot_slug=robot_slug).inc()
            rpa_events_total.labels(robot_slug=robot_slug, event_type="finish").inc()
        else:
            rpa_job_failure_total.labels(robot_slug=robot_slug).inc()
            rpa_events_total.labels(robot_slug=robot_slug, event_type="error").inc()
            
        logger.info("Execução finalizada registrada", robot_slug=robot_slug, execution_id=execution_id, status=status)
        
    def record_execution_pause(self, robot_slug: str, execution_id: str):
        """Registra pausa de execução"""
        rpa_events_total.labels(robot_slug=robot_slug, event_type="pause").inc()
        logger.info("Pausa registrada", robot_slug=robot_slug, execution_id=execution_id)
        
    def record_execution_resume(self, robot_slug: str, execution_id: str):
        """Registra continuação de execução"""
        rpa_events_total.labels(robot_slug=robot_slug, event_type="resume").inc()
        logger.info("Continuação registrada", robot_slug=robot_slug, execution_id=execution_id)
        
    def record_execution_stop(self, robot_slug: str, execution_id: str):
        """Registra parada de execução"""
        if execution_id in self.execution_start_times:
            del self.execution_start_times[execution_id]
        rpa_job_in_progress.labels(robot_slug=robot_slug).dec()
        rpa_events_total.labels(robot_slug=robot_slug, event_type="stop").inc()
        logger.info("Parada registrada", robot_slug=robot_slug, execution_id=execution_id)
        
    def record_api_request(self, method: str, endpoint: str, status_code: int, duration: float):
        """Registra uma requisição da API"""
        api_requests_total.labels(method=method, endpoint=endpoint, status_code=str(status_code)).inc()
        api_request_duration_seconds.labels(method=method, endpoint=endpoint).observe(duration)
        
    def increment_websocket_connections(self):
        """Incrementa contador de conexões WebSocket"""
        websocket_connections.inc()
        
    def decrement_websocket_connections(self):
        """Decrementa contador de conexões WebSocket"""
        websocket_connections.dec()

def get_metrics():
    """Retorna as métricas no formato Prometheus"""
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)

# Instância global
metrics_service = MetricsService()
