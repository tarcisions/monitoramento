from celery import shared_task
from django.utils import timezone
from django.conf import settings
import redis
import json
import subprocess
import time
import logging

from core.models import ExecucaoRobo, LogExecucao

logger = logging.getLogger(__name__)

redis_client = redis.from_url(settings.REDIS_URL)

@shared_task(bind=True)
def executar_job_task(self, execucao_id):
    try:
        execucao = ExecucaoRobo.objects.get(id=execucao_id)
        
        execucao.status = 'running'
        execucao.save()
        
        comando = {
            'acao': 'start',
            'execucao_id': execucao.id,
            'job_comando': execucao.job.comando,
            'parametros': execucao.parametros,
            'timeout_s': execucao.job.timeout_s
        }
        
        canal = f"rpa:commands:{execucao.robo.token_agente}"
        redis_client.publish(canal, json.dumps(comando))
        
        logger.info(f"Comando de execução enviado para robô {execucao.robo.nome}")
        
        max_tentativas = 300
        tentativas = 0
        
        while tentativas < max_tentativas:
            execucao.refresh_from_db()
            
            if execucao.status in ['success', 'failed', 'stopped']:
                break
            
            time.sleep(1)
            tentativas += 1
        
        if tentativas >= max_tentativas:
            execucao.status = 'failed'
            execucao.mensagem = 'Timeout da execução'
            execucao.finalizado_em = timezone.now()
            execucao.save()
            
            logger.error(f"Timeout na execução {execucao.id}")
        
        return {
            'status': execucao.status,
            'mensagem': execucao.mensagem,
            'duracao': execucao.duracao_segundos
        }
        
    except ExecucaoRobo.DoesNotExist:
        logger.error(f"Execução {execucao_id} não encontrada")
        return {'erro': 'Execução não encontrada'}
    
    except Exception as e:
        logger.error(f"Erro na execução {execucao_id}: {str(e)}")
        return {'erro': str(e)}

@shared_task
def pausar_execucao_task(execucao_id):
    try:
        execucao = ExecucaoRobo.objects.get(id=execucao_id)
        
        comando = {
            'acao': 'pause',
            'execucao_id': execucao.id
        }
        
        canal = f"rpa:commands:{execucao.robo.token_agente}"
        redis_client.publish(canal, json.dumps(comando))
        
        execucao.status = 'paused'
        execucao.save()
        
        logger.info(f"Comando de pausa enviado para execução {execucao.id}")
        
    except ExecucaoRobo.DoesNotExist:
        logger.error(f"Execução {execucao_id} não encontrada para pausar")

@shared_task
def parar_execucao_task(execucao_id):
    try:
        execucao = ExecucaoRobo.objects.get(id=execucao_id)
        
        comando = {
            'acao': 'stop',
            'execucao_id': execucao.id
        }
        
        canal = f"rpa:commands:{execucao.robo.token_agente}"
        redis_client.publish(canal, json.dumps(comando))
        
        execucao.status = 'stopped'
        execucao.finalizado_em = timezone.now()
        execucao.save()
        
        logger.info(f"Comando de parada enviado para execução {execucao.id}")
        
    except ExecucaoRobo.DoesNotExist:
        logger.error(f"Execução {execucao_id} não encontrada para parar")

@shared_task
def retomar_execucao_task(execucao_id):
    try:
        execucao = ExecucaoRobo.objects.get(id=execucao_id)
        
        comando = {
            'acao': 'resume',
            'execucao_id': execucao.id
        }
        
        canal = f"rpa:commands:{execucao.robo.token_agente}"
        redis_client.publish(canal, json.dumps(comando))
        
        execucao.status = 'running'
        execucao.save()
        
        logger.info(f"Comando de retomada enviado para execução {execucao.id}")
        
    except ExecucaoRobo.DoesNotExist:
        logger.error(f"Execução {execucao_id} não encontrada para retomar")

@shared_task
def verificar_execucoes_orfas():
    from datetime import timedelta
    
    timeout = timezone.now() - timedelta(minutes=10)
    
    execucoes_orfas = ExecucaoRobo.objects.filter(
        status='running',
        iniciado_em__lt=timeout
    )
    
    for execucao in execucoes_orfas:
        if not execucao.robo.status_conexao == 'conectado':
            execucao.status = 'failed'
            execucao.mensagem = 'Robô desconectado durante execução'
            execucao.finalizado_em = timezone.now()
            execucao.save()
            
            logger.warning(f"Execução órfã detectada e marcada como falha: {execucao.id}")

@shared_task
def limpar_logs_antigos():
    from datetime import timedelta
    
    limite = timezone.now() - timedelta(days=30)
    
    logs_removidos = LogExecucao.objects.filter(timestamp__lt=limite).delete()[0]
    
    logger.info(f"Limpeza concluída: {logs_removidos} logs removidos")
    
    return {'logs_removidos': logs_removidos}

@shared_task
def atualizar_metricas_prometheus():
    from .metrics import (
        atualizar_metrica_estado_robo,
        atualizar_metrica_execucao_duracao,
        atualizar_metrica_jobs_executados,
        atualizar_metrica_execucoes_falhas
    )
    
    atualizar_metrica_estado_robo()
    atualizar_metrica_execucao_duracao()
    atualizar_metrica_jobs_executados()
    atualizar_metrica_execucoes_falhas()
    
    logger.info("Métricas Prometheus atualizadas")
