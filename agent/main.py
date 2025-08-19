import os
import time
import json
import logging
import subprocess
from datetime import datetime
from prometheus_client import start_http_server, Gauge, Counter, Histogram
import redis

logging.basicConfig(
    level=logging.INFO,
    format='{"timestamp": "%(asctime)s", "level": "%(levelname)s", "message": "%(message)s", "component": "agent"}',
    handlers=[
        logging.FileHandler('/logs/agent.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

rpa_estado_robo = Gauge('rpa_estado_robo', 'Estado do robo (0=idle, 1=running, 2=paused)', ['robo_nome'])
rpa_execucao_duracao_segundos = Histogram('rpa_execucao_duracao_segundos', 'Duracao da execucao em segundos', ['robo_nome', 'job_nome'])
rpa_jobs_executados_total = Counter('rpa_jobs_executados_total', 'Total de jobs executados', ['robo_nome', 'job_nome', 'status'])
rpa_execucoes_falhas_total = Counter('rpa_execucoes_falhas_total', 'Total de execucoes com falha', ['robo_nome', 'job_nome'])

class RoboAgent:
    def __init__(self):
        self.redis_url = os.getenv('REDIS_URL', 'redis://redis:6379')
        self.agent_token = os.getenv('AGENT_TOKEN', 'default-token')
        self.robo_nome = os.getenv('ROBO_NOME', 'robo-agent')
        self.redis_client = None
        self.current_process = None
        self.estado_atual = 'idle'
        
        try:
            self.redis_client = redis.from_url(self.redis_url)
            self.redis_client.ping()
            logger.info(f"Conectado ao Redis: {self.redis_url}")
        except Exception as e:
            logger.error(f"Erro ao conectar no Redis: {e}")
    
    def atualizar_estado(self, novo_estado):
        self.estado_atual = novo_estado
        estado_map = {'idle': 0, 'running': 1, 'paused': 2}
        rpa_estado_robo.labels(robo_nome=self.robo_nome).set(estado_map.get(novo_estado, 0))
        logger.info(f"Estado atualizado para: {novo_estado}")
    
    def executar_comando(self, comando, job_nome, execucao_id):
        logger.info(f"Iniciando execucao {execucao_id} - Job: {job_nome} - Comando: {comando}")
        
        self.atualizar_estado('running')
        inicio = time.time()
        
        try:
            with rpa_execucao_duracao_segundos.labels(robo_nome=self.robo_nome, job_nome=job_nome).time():
                self.current_process = subprocess.Popen(
                    comando,
                    shell=True,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True
                )
                
                stdout, stderr = self.current_process.communicate()
                return_code = self.current_process.returncode
                
                duracao = time.time() - inicio
                
                if return_code == 0:
                    status = 'success'
                    rpa_jobs_executados_total.labels(robo_nome=self.robo_nome, job_nome=job_nome, status='success').inc()
                    logger.info(f"Execucao {execucao_id} concluida com sucesso em {duracao:.2f}s")
                else:
                    status = 'failed'
                    rpa_jobs_executados_total.labels(robo_nome=self.robo_nome, job_nome=job_nome, status='failed').inc()
                    rpa_execucoes_falhas_total.labels(robo_nome=self.robo_nome, job_nome=job_nome).inc()
                    logger.error(f"Execucao {execucao_id} falhou com codigo {return_code}: {stderr}")
                
                self.atualizar_estado('idle')
                return status, stdout, stderr
                
        except Exception as e:
            self.atualizar_estado('idle')
            rpa_jobs_executados_total.labels(robo_nome=self.robo_nome, job_nome=job_nome, status='failed').inc()
            rpa_execucoes_falhas_total.labels(robo_nome=self.robo_nome, job_nome=job_nome).inc()
            logger.error(f"Erro na execucao {execucao_id}: {e}")
            return 'failed', '', str(e)
    
    def pausar_execucao(self):
        if self.current_process and self.estado_atual == 'running':
            try:
                self.current_process.send_signal(subprocess.signal.SIGSTOP)
                self.atualizar_estado('paused')
                logger.info("Execucao pausada")
            except Exception as e:
                logger.error(f"Erro ao pausar execucao: {e}")
    
    def retomar_execucao(self):
        if self.current_process and self.estado_atual == 'paused':
            try:
                self.current_process.send_signal(subprocess.signal.SIGCONT)
                self.atualizar_estado('running')
                logger.info("Execucao retomada")
            except Exception as e:
                logger.error(f"Erro ao retomar execucao: {e}")
    
    def parar_execucao(self):
        if self.current_process:
            try:
                self.current_process.terminate()
                self.current_process.wait(timeout=5)
                self.atualizar_estado('idle')
                logger.info("Execucao parada")
            except subprocess.TimeoutExpired:
                self.current_process.kill()
                self.atualizar_estado('idle')
                logger.warning("Execucao forcada a parar")
            except Exception as e:
                logger.error(f"Erro ao parar execucao: {e}")
    
    def processar_comandos(self):
        if not self.redis_client:
            return
        
        try:
            message = self.redis_client.blpop(f'commands:{self.robo_nome}', timeout=1)
            if message:
                comando_data = json.loads(message[1])
                acao = comando_data.get('acao')
                
                if acao == 'executar':
                    comando = comando_data.get('comando')
                    job_nome = comando_data.get('job_nome')
                    execucao_id = comando_data.get('execucao_id')
                    self.executar_comando(comando, job_nome, execucao_id)
                elif acao == 'pausar':
                    self.pausar_execucao()
                elif acao == 'retomar':
                    self.retomar_execucao()
                elif acao == 'parar':
                    self.parar_execucao()
                    
        except Exception as e:
            logger.error(f"Erro ao processar comandos: {e}")
    
    def run(self):
        logger.info(f"Iniciando agente do robo: {self.robo_nome}")
        self.atualizar_estado('idle')
        
        start_http_server(9100)
        logger.info("Servidor de metricas iniciado na porta 9100")
        
        while True:
            self.processar_comandos()
            time.sleep(1)

if __name__ == '__main__':
    agent = RoboAgent()
    agent.run()

