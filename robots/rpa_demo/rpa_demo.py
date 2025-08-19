import asyncio
import json
import os
import time
import signal
import random
from datetime import datetime
from typing import Optional, Dict, Any
import httpx
from prometheus_client import start_http_server, Counter, Histogram, Gauge
import structlog

# Configurar logging estruturado
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()

# Configurações
API_URL = os.getenv("API_URL", "http://localhost:8000/api")
ROBOT_SLUG = os.getenv("ROBOT_SLUG", "robo-demo")
ROBOT_NAME = os.getenv("ROBOT_NAME", "Robô Demo")
HEARTBEAT_INTERVAL = int(os.getenv("HEARTBEAT_INTERVAL", "5"))
COMMAND_POLL_INTERVAL = int(os.getenv("COMMAND_POLL_INTERVAL", "2"))

# Métricas Prometheus
RUNS = Counter("robot_runs_total", "Execucoes por resultado", ["robot", "result"])
DURATION = Histogram("robot_task_duration_seconds", "Duracao por passo", ["robot", "step"])
IN_PROGRESS = Gauge("robot_in_progress", "Execucao em progresso", ["robot"])

class RPADemo:
    def __init__(self):
        self.robot_id: Optional[str] = None
        self.current_execution_id: Optional[str] = None
        self.is_running = True
        self.is_paused = False
        self.current_step = 0
        self.total_steps = 5
        
    async def log_structured(self, level: str, message: str, **extra):
        """Loga no formato estruturado esperado pelo sistema"""
        log_entry = {
            "ts": datetime.utcnow().isoformat() + "Z",
            "nivel": level,
            "robot": ROBOT_SLUG,
            "mensagem": message,
            **extra
        }
        
        if self.current_execution_id:
            log_entry["run_id"] = self.current_execution_id
            
        print(json.dumps(log_entry), flush=True)
        
        # Também enviar para a API se tivermos uma execução ativa
        if self.current_execution_id:
            try:
                async with httpx.AsyncClient(timeout=5) as client:
                    await client.post(
                        f"{API_URL}/executions/logs",
                        json={
                            "execution_id": self.current_execution_id,
                            "nivel": level,
                            "mensagem": message,
                            "dados": extra if extra else None
                        }
                    )
            except Exception as e:
                logger.warning("Erro ao enviar log para API", error=str(e))
    
    async def register_robot(self) -> str:
        """Registra o robô na API e retorna o ID"""
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.post(
                    f"{API_URL}/robots/register",
                    json={
                        "slug": ROBOT_SLUG,
                        "nome": ROBOT_NAME,
                        "descricao": "Robô de demonstração que simula tarefas de RPA"
                    }
                )
                response.raise_for_status()
                robot_data = response.json()
                robot_id = robot_data["id"]
                
                await self.log_structured("INFO", "Robô registrado com sucesso", robot_id=robot_id)
                return robot_id
                
        except Exception as e:
            await self.log_structured("ERROR", "Erro ao registrar robô", error=str(e))
            raise
    
    async def send_heartbeat(self):
        """Envia heartbeat para a API"""
        if not self.robot_id:
            return
            
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                await client.post(
                    f"{API_URL}/robots/{self.robot_id}/heartbeat",
                    json={
                        "run_id": self.current_execution_id,
                        "ts": time.time(),
                        "status": "pausado" if self.is_paused else ("executando" if self.current_execution_id else "idle")
                    }
                )
        except Exception as e:
            await self.log_structured("WARNING", "Erro ao enviar heartbeat", error=str(e))
    
    async def get_next_command(self) -> Optional[Dict[str, Any]]:
        """Obtém o próximo comando da API"""
        if not self.robot_id:
            return None
            
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                response = await client.get(f"{API_URL}/robots/{self.robot_id}/next-command")
                response.raise_for_status()
                command = response.json()
                
                if command:
                    await self.log_structured("INFO", "Comando recebido", command=command)
                    
                return command
                
        except Exception as e:
            await self.log_structured("WARNING", "Erro ao obter comando", error=str(e))
            return None
    
    async def start_execution(self, execution_id: str):
        """Inicia uma nova execução"""
        self.current_execution_id = execution_id
        self.current_step = 0
        self.is_paused = False
        
        IN_PROGRESS.labels(robot=ROBOT_SLUG).set(1)
        
        await self.log_structured("INFO", "Execução iniciada", execution_id=execution_id)
        
        try:
            success = True
            
            # Simular processamento com múltiplos passos
            for step in range(1, self.total_steps + 1):
                self.current_step = step
                
                # Verificar comandos a cada passo
                command = await self.get_next_command()
                if command:
                    if command.get("action") == "pause":
                        self.is_paused = True
                        await self.log_structured("INFO", "Execução pausada", step=step)
                        
                    elif command.get("action") == "stop":
                        await self.log_structured("INFO", "Execução parada pelo usuário", step=step)
                        await self.finish_execution("cancelada")
                        return
                
                # Aguardar enquanto pausado
                while self.is_paused:
                    await asyncio.sleep(1)
                    command = await self.get_next_command()
                    if command and command.get("action") == "resume":
                        self.is_paused = False
                        await self.log_structured("INFO", "Execução retomada", step=step)
                    elif command and command.get("action") == "stop":
                        await self.log_structured("INFO", "Execução parada pelo usuário", step=step)
                        await self.finish_execution("cancelada")
                        return
                
                # Executar passo
                with DURATION.labels(robot=ROBOT_SLUG, step=f"passo_{step}").time():
                    await self.log_structured("INFO", f"Executando passo {step}/{self.total_steps}", step=step)
                    
                    # Simular trabalho (1-3 segundos)
                    await asyncio.sleep(random.uniform(1.0, 3.0))
                    
                    # Simular falha ocasional (5% de chance)
                    if random.random() < 0.05:
                        error_msg = f"Erro simulado no passo {step}"
                        await self.log_structured("ERROR", error_msg, step=step)
                        success = False
                        break
                    
                    # Simular processamento de itens
                    items_processed = random.randint(10, 50)
                    await self.log_structured("INFO", f"Passo {step} concluído", 
                                            step=step, items_processed=items_processed)
                
                # Enviar heartbeat
                await self.send_heartbeat()
            
            # Finalizar execução
            if success:
                await self.finish_execution("concluida")
            else:
                await self.finish_execution("falha", "Erro durante processamento")
                
        except Exception as e:
            await self.log_structured("ERROR", "Erro inesperado na execução", error=str(e))
            await self.finish_execution("falha", str(e))
    
    async def finish_execution(self, status: str, error: Optional[str] = None):
        """Finaliza a execução atual"""
        if not self.current_execution_id:
            return
            
        execution_id = self.current_execution_id
        
        try:
            # Calcular itens processados (simulado)
            items_processed = self.current_step * random.randint(10, 50)
            
            async with httpx.AsyncClient(timeout=10) as client:
                await client.post(
                    f"{API_URL}/executions/{execution_id}/finish",
                    json={
                        "status": status,
                        "erro": error,
                        "itens_processados": items_processed
                    }
                )
            
            # Atualizar métricas
            IN_PROGRESS.labels(robot=ROBOT_SLUG).set(0)
            
            if status == "concluida":
                RUNS.labels(robot=ROBOT_SLUG, result="success").inc()
                await self.log_structured("INFO", "Execução concluída com sucesso", 
                                        execution_id=execution_id, items_processed=items_processed)
            else:
                RUNS.labels(robot=ROBOT_SLUG, result="failure").inc()
                await self.log_structured("ERROR", f"Execução finalizada com status: {status}", 
                                        execution_id=execution_id, error=error)
            
        except Exception as e:
            await self.log_structured("ERROR", "Erro ao finalizar execução", error=str(e))
        finally:
            self.current_execution_id = None
            self.current_step = 0
            self.is_paused = False
    
    async def main_loop(self):
        """Loop principal do robô"""
        await self.log_structured("INFO", "Iniciando Robô Demo")
        
        # Registrar robô
        self.robot_id = await self.register_robot()
        
        # Loop principal
        while self.is_running:
            try:
                # Verificar comandos
                command = await self.get_next_command()
                
                if command:
                    action = command.get("action")
                    
                    if action == "start" and not self.current_execution_id:
                        # Iniciar nova execução - precisamos confirmar primeiro
                        try:
                            async with httpx.AsyncClient(timeout=10) as client:
                                # Para simplificar, vamos assumir que o comando já tem o execution_id
                                # Em uma implementação real, precisaríamos confirmar o início
                                execution_id = command.get("execution_id")
                                if execution_id:
                                    await self.start_execution(execution_id)
                                else:
                                    await self.log_structured("WARNING", "Comando start sem execution_id")
                        except Exception as e:
                            await self.log_structured("ERROR", "Erro ao processar comando start", error=str(e))
                
                # Enviar heartbeat periodicamente
                await self.send_heartbeat()
                
                # Aguardar próximo ciclo
                await asyncio.sleep(COMMAND_POLL_INTERVAL)
                
            except KeyboardInterrupt:
                break
            except Exception as e:
                await self.log_structured("ERROR", "Erro no loop principal", error=str(e))
                await asyncio.sleep(5)  # Aguardar antes de tentar novamente
        
        await self.log_structured("INFO", "Robô Demo finalizado")

def signal_handler(signum, frame):
    """Handler para sinais de sistema"""
    print("Sinal recebido, finalizando robô...", flush=True)

async def main():
    """Função principal"""
    # Configurar handlers de sinal
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    # Iniciar servidor de métricas
    start_http_server(9101)
    logger.info("Servidor de métricas iniciado na porta 9101")
    
    # Executar robô
    robot = RPADemo()
    try:
        await robot.main_loop()
    except KeyboardInterrupt:
        robot.is_running = False
        logger.info("Robô finalizado pelo usuário")

if __name__ == "__main__":
    asyncio.run(main())
