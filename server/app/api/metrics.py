from prometheus_client import Counter, Gauge, Histogram, generate_latest, CONTENT_TYPE_LATEST
from django.http import HttpResponse
from django.utils import timezone
from datetime import timedelta
from core.models import Robo, ExecucaoRobo, StatusRobo

rpa_estado_robo = Gauge(
    'rpa_estado_robo',
    'Estado atual do robô (0=idle, 1=running, 2=paused)',
    ['robo_nome', 'robo_host']
)

rpa_execucao_duracao_segundos = Histogram(
    'rpa_execucao_duracao_segundos',
    'Duração das execuções em segundos',
    ['robo_nome', 'job_nome', 'status'],
    buckets=[1, 5, 10, 30, 60, 300, 600, 1800, 3600, float('inf')]
)

rpa_jobs_executados_total = Counter(
    'rpa_jobs_executados_total',
    'Total de jobs executados',
    ['robo_nome', 'job_nome', 'status']
)

rpa_execucoes_falhas_total = Counter(
    'rpa_execucoes_falhas_total',
    'Total de execuções que falharam',
    ['robo_nome', 'job_nome', 'motivo']
)

rpa_cpu_percent = Gauge(
    'rpa_cpu_percent',
    'Percentual de CPU do robô',
    ['robo_nome', 'robo_host']
)

rpa_memoria_percent = Gauge(
    'rpa_memoria_percent',
    'Percentual de memória do robô',
    ['robo_nome', 'robo_host']
)

rpa_robos_conectados = Gauge(
    'rpa_robos_conectados',
    'Número de robôs conectados'
)

rpa_execucoes_ativas = Gauge(
    'rpa_execucoes_ativas',
    'Número de execuções ativas'
)

def atualizar_metrica_estado_robo():
    for robo in Robo.objects.filter(ativo=True):
        labels = [robo.nome, robo.host]
        
        try:
            status = robo.status
            if status.estado_atual == 'idle':
                valor = 0
            elif status.estado_atual == 'running':
                valor = 1
            elif status.estado_atual == 'paused':
                valor = 2
            else:
                valor = 0
                
            rpa_estado_robo.labels(*labels).set(valor)
            
            rpa_cpu_percent.labels(*labels).set(status.cpu_percent)
            rpa_memoria_percent.labels(*labels).set(status.memoria_percent)
            
        except StatusRobo.DoesNotExist:
            rpa_estado_robo.labels(*labels).set(0)
            rpa_cpu_percent.labels(*labels).set(0)
            rpa_memoria_percent.labels(*labels).set(0)

def atualizar_metrica_execucao_duracao():
    agora = timezone.now()
    inicio_dia = agora.replace(hour=0, minute=0, second=0, microsecond=0)
    
    execucoes = ExecucaoRobo.objects.filter(
        iniciado_em__gte=inicio_dia,
        status__in=['success', 'failed'],
        finalizado_em__isnull=False
    )
    
    for execucao in execucoes:
        labels = [execucao.robo.nome, execucao.job.nome, execucao.status]
        duracao = execucao.duracao_segundos
        
        rpa_execucao_duracao_segundos.labels(*labels).observe(duracao)

def atualizar_metrica_jobs_executados():
    agora = timezone.now()
    inicio_dia = agora.replace(hour=0, minute=0, second=0, microsecond=0)
    
    execucoes = ExecucaoRobo.objects.filter(iniciado_em__gte=inicio_dia)
    
    contadores = {}
    for execucao in execucoes:
        key = (execucao.robo.nome, execucao.job.nome, execucao.status)
        contadores[key] = contadores.get(key, 0) + 1
    
    for (robo_nome, job_nome, status), count in contadores.items():
        rpa_jobs_executados_total.labels(robo_nome, job_nome, status)._value._value = count

def atualizar_metrica_execucoes_falhas():
    agora = timezone.now()
    inicio_dia = agora.replace(hour=0, minute=0, second=0, microsecond=0)
    
    execucoes_falhas = ExecucaoRobo.objects.filter(
        iniciado_em__gte=inicio_dia,
        status='failed'
    )
    
    contadores = {}
    for execucao in execucoes_falhas:
        motivo = execucao.mensagem[:50] if execucao.mensagem else 'erro_desconhecido'
        key = (execucao.robo.nome, execucao.job.nome, motivo)
        contadores[key] = contadores.get(key, 0) + 1
    
    for (robo_nome, job_nome, motivo), count in contadores.items():
        rpa_execucoes_falhas_total.labels(robo_nome, job_nome, motivo)._value._value = count

def atualizar_metricas_gerais():
    agora = timezone.now()
    limite_conexao = agora - timedelta(minutes=5)
    
    robos_conectados = Robo.objects.filter(
        ativo=True,
        ultimo_ping__gte=limite_conexao
    ).count()
    
    execucoes_ativas = ExecucaoRobo.objects.filter(
        status__in=['running', 'paused', 'queued']
    ).count()
    
    rpa_robos_conectados.set(robos_conectados)
    rpa_execucoes_ativas.set(execucoes_ativas)

def metricas_prometheus(request):
    atualizar_metrica_estado_robo()
    atualizar_metricas_gerais()
    
    metrics = generate_latest()
    return HttpResponse(metrics, content_type=CONTENT_TYPE_LATEST)
