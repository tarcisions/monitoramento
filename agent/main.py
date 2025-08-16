import os
import json
import time
import redis
import subprocess
import threading
import signal
import psutil
from datetime import datetime
from http.server import HTTPServer, BaseHTTPRequestHandler
from prometheus_client import Counter, Gauge, generate_latest, CONTENT_TYPE_LATEST
import logging

logging.basicConfig(
    level=logging.INFO,
    format='{"level": "%(levelname)s", "time": "%(asctime)s", "logger": "agent", "message": "%(message)s"}',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('/logs/agent.log')
    ]
)

logger = logging.getLogger(__name__)

REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
AGENT_TOKEN = os.getenv('AGENT_TOKEN', 'token-agente-padrao')
AGENT_NAME = os.getenv('AGENT_NAME', 'agente-desconhecido')

redis_client = redis.from_url(REDIS_URL)

estado_atual = Gauge('rpa_agente_estado', 'Estado do agente (0=idle, 1=running, 2=paused)', ['agente_nome'])
execucoes_total = Counter('rpa_agente_execucoes_total', 'Total de execuções', ['agente_nome', 'status'])
cpu_usage = Gauge('rpa_agente_cpu_percent', 'Uso de CPU', ['agente_nome'])
memoria_usage = Gauge('rpa_agente_memoria_percent', 'Uso de memória', ['agente_nome'])

class AgenteRPA:
    def __init__(self):
        self.processo_atual = None
        self.execucao_atual = None
        self.status = 'idle'
        self.pausado = False
        self.rodando = True
        
        signal.signal(signal.SIGTERM, self.sinal_parada)
        signal.signal(signal.SIGINT, self.sinal_parada)
    
    def sinal_parada(self, signum, frame):
        logger.info("Sinal de parada recebido")
        self.rodando = False
        if self.processo_atual:
            self.parar_processo()
    
    def iniciar_servidor_metricas(self):
        class MetricsHandler(BaseHTTPRequestHandler):
            def do_GET(self):
                if self.path == '/metrics':
                    self.send_response(200)
                    self.send_header('Content-Type', CONTENT_TYPE_LATEST)
                    self.end_headers()
                    metrics = generate_latest()
                    self.wfile.write(metrics)
                else:
                    self.send_response(404)
                    self.end_headers()
            
            def log_message(self, format, *args):
                pass
        
        server = HTTPServer(('0.0.0.0', 9100), MetricsHandler)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        logger.info("Servidor de métricas iniciado na porta 9100")
    
    def atualizar_metricas(self):
        try:
            if self.status == 'idle':
                valor_estado = 0
            elif self.status == 'running':
                valor_estado = 1
            elif self.status == 'paused':
                valor_estado = 2
            else:
                valor_estado = 0
            
            estado_atual.labels(AGENT_NAME).set(valor_estado)
            
            process = psutil.Process()
            cpu_percent = process.cpu_percent()
            memoria_percent = process.memory_percent()
            
            cpu_usage.labels(AGENT_NAME).set(cpu_percent)
            memoria_usage.labels(AGENT_NAME).set(memoria_percent)
            
        except Exception as e:
            logger.error(f"Erro ao atualizar métricas: {e}")
    
    def enviar_status(self):
        try:
            status_data = {
                'agente_id': AGENT_NAME,
                'status': self.status,
                'timestamp': datetime.now().isoformat(),
                'execucao_id': self.execucao_atual,
                'pid': self.processo_atual.pid if self.processo_atual else None
            }
            
            redis_client.publish('rpa:status', json.dumps(status_data))
            
        except Exception as e:
            logger.error(f"Erro ao enviar status: {e}")
    
    def executar_comando(self, comando_data):
        try:
            acao = comando_data.get('acao')
            execucao_id = comando_data.get('execucao_id')
            
            if acao == 'start':
                return self.iniciar_execucao(comando_data)
            elif acao == 'pause':
                return self.pausar_execucao()
            elif acao == 'stop':
                return self.parar_execucao()
            elif acao == 'resume':
                return self.retomar_execucao()
            else:
                logger.warning(f"Ação desconhecida: {acao}")
                return False
                
        except Exception as e:
            logger.error(f"Erro ao executar comando: {e}")
            return False
    
    def iniciar_execucao(self, comando_data):
        if self.processo_atual:
            logger.warning("Já existe um processo em execução")
            return False
        
        job_comando = comando_data.get('job_comando')
        parametros = comando_data.get('parametros', {})
        timeout_s = comando_data.get('timeout_s', 300)
        execucao_id = comando_data.get('execucao_id')
        
        self.execucao_atual = execucao_id
        
        try:
            env = os.environ.copy()
            env.update({f'PARAM_{k.upper()}': str(v) for k, v in parametros.items()})
            
            self.processo_atual = subprocess.Popen(
                job_comando,
                shell=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                env=env,
                text=True
            )
            
            self.status = 'running'
            self.pausado = False
            
            logger.info(f"Execução {execucao_id} iniciada com PID {self.processo_atual.pid}")
            
            def monitorar_processo():
                try:
                    saida, _ = self.processo_atual.communicate(timeout=timeout_s)
                    
                    if self.processo_atual.returncode == 0:
                        self.status = 'success'
                        execucoes_total.labels(AGENT_NAME, 'success').inc()
                        logger.info(f"Execução {execucao_id} concluída com sucesso")
                    else:
                        self.status = 'failed'
                        execucoes_total.labels(AGENT_NAME, 'failed').inc()
                        logger.error(f"Execução {execucao_id} falhou com código {self.processo_atual.returncode}")
                    
                    logger.info(f"Saída do comando: {saida}")
                    
                except subprocess.TimeoutExpired:
                    self.processo_atual.kill()
                    self.status = 'failed'
                    execucoes_total.labels(AGENT_NAME, 'timeout').inc()
                    logger.error(f"Execução {execucao_id} expirou após {timeout_s} segundos")
                
                except Exception as e:
                    self.status = 'failed'
                    execucoes_total.labels(AGENT_NAME, 'error').inc()
                    logger.error(f"Erro durante execução {execucao_id}: {e}")
                
                finally:
                    self.processo_atual = None
                    if not self.pausado:
                        self.status = 'idle'
                    self.execucao_atual = None
            
            thread = threading.Thread(target=monitorar_processo, daemon=True)
            thread.start()
            
            return True
            
        except Exception as e:
            logger.error(f"Erro ao iniciar execução: {e}")
            self.status = 'failed'
            self.processo_atual = None
            self.execucao_atual = None
            return False
    
    def pausar_execucao(self):
        if not self.processo_atual:
            return False
        
        try:
            self.processo_atual.send_signal(signal.SIGSTOP)
            self.status = 'paused'
            self.pausado = True
            logger.info(f"Execução {self.execucao_atual} pausada")
            return True
        except Exception as e:
            logger.error(f"Erro ao pausar execução: {e}")
            return False
    
    def retomar_execucao(self):
        if not self.processo_atual or not self.pausado:
            return False
        
        try:
            self.processo_atual.send_signal(signal.SIGCONT)
            self.status = 'running'
            self.pausado = False
            logger.info(f"Execução {self.execucao_atual} retomada")
            return True
        except Exception as e:
            logger.error(f"Erro ao retomar execução: {e}")
            return False
    
    def parar_execucao(self):
        if not self.processo_atual:
            return False
        
        try:
            self.processo_atual.terminate()
            time.sleep(2)
            
            if self.processo_atual.poll() is None:
                self.processo_atual.kill()
            
            self.status = 'stopped'
            self.pausado = False
            logger.info(f"Execução {self.execucao_atual} parada")
            
            self.processo_atual = None
            self.execucao_atual = None
            self.status = 'idle'
            
            return True
        except Exception as e:
            logger.error(f"Erro ao parar execução: {e}")
            return False
    
    def parar_processo(self):
        if self.processo_atual:
            try:
                self.processo_atual.terminate()
                time.sleep(2)
                if self.processo_atual.poll() is None:
                    self.processo_atual.kill()
            except:
                pass
    
    def executar(self):
        logger.info(f"Agente {AGENT_NAME} iniciado")
        
        self.iniciar_servidor_metricas()
        
        pubsub = redis_client.pubsub()
        canal_comandos = f"rpa:commands:{AGENT_TOKEN}"
        pubsub.subscribe(canal_comandos)
        
        logger.info(f"Escutando comandos no canal: {canal_comandos}")
        
        contador_status = 0
        
        try:
            while self.rodando:
                try:
                    message = pubsub.get_message(timeout=1)
                    
                    if message and message['type'] == 'message':
                        try:
                            comando_data = json.loads(message['data'])
                            logger.info(f"Comando recebido: {comando_data}")
                            self.executar_comando(comando_data)
                        except json.JSONDecodeError:
                            logger.error("Erro ao decodificar comando JSON")
                    
                    contador_status += 1
                    if contador_status >= 30:
                        self.enviar_status()
                        self.atualizar_metricas()
                        contador_status = 0
                    
                    time.sleep(1)
                    
                except redis.ConnectionError:
                    logger.error("Erro de conexão com Redis, tentando reconectar...")
                    time.sleep(5)
                    try:
                        redis_client.ping()
                        pubsub = redis_client.pubsub()
                        pubsub.subscribe(canal_comandos)
                    except:
                        logger.error("Falha ao reconectar ao Redis")
                
                except Exception as e:
                    logger.error(f"Erro no loop principal: {e}")
                    time.sleep(1)
        
        except KeyboardInterrupt:
            logger.info("Interrupção do usuário recebida")
        
        finally:
            self.parar_processo()
            pubsub.close()
            logger.info("Agente finalizado")

if __name__ == '__main__':
    agente = AgenteRPA()
    agente.executar()
