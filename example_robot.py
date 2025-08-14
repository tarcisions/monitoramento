#!/usr/bin/env python3
"""
Robô de Exemplo para Sistema de Monitoramento
Este script simula um robô que:
- Envia logs periódicos para a API
- Envia status de sistema para a API
- Recebe comandos do backend via WebSocket
- Simula execução de tarefas com delays
"""

import asyncio
import websockets
import requests
import json
import time
import random
import threading
import logging
import argparse
import signal
from datetime import datetime
from typing import Dict, Any

# Configuração de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('ExampleRobot')


class ExampleRobot:
    """Robô de exemplo que simula operações e se comunica com o sistema de monitoramento"""
    
    def __init__(self, name: str, server_url: str = "http://129.148.32.147:8001"):
        self.name = name
        self.server_url = server_url.rstrip('/')
        self.api_base = f"{self.server_url}/api"
        self.ws_url = f"ws://129.148.32.147:8001/ws/robot/{name}/"

        
        # Estado do robô
        self.status = "IDLE"
        self.is_running = False
        self.current_task = None
        self.task_thread = None
        self.websocket = None
        self.websocket_thread = None
        
        # Estatísticas simuladas
        self.cpu_usage = 0.0
        self.memory_usage = 0.0
        self.disk_usage = 0.0
        self.network_status = True
        
        # Controle de execução
        self.should_stop = False
        
        # Configurar handler para sinais
        signal.signal(signal.SIGINT, self.signal_handler)
        signal.signal(signal.SIGTERM, self.signal_handler)
    
    def signal_handler(self, signum, frame):
        logger.info(f"Recebido sinal {signum}. Parando robô...")
        self.should_stop = True
        self.stop()
    
    def start(self):
        logger.info(f"Iniciando robô {self.name}...")
        self.is_running = True
        self.should_stop = False

        # Iniciar WebSocket em thread separada
        self.websocket_thread = threading.Thread(target=self.run_websocket, daemon=True)
        self.websocket_thread.start()

        # Iniciar loop principal
        asyncio.run(self.run_main_loop())
    
    async def run_main_loop(self):
        last_status_update = 0
        last_heartbeat = 0

        while self.is_running and not self.should_stop:
            try:
                current_time = time.time()

                if current_time - last_status_update > 30:
                    self.send_status_update()
                    last_status_update = current_time

                if current_time - last_heartbeat > 10:
                    self.send_heartbeat()
                    last_heartbeat = current_time

                self.update_system_stats()
                await asyncio.sleep(1)

            except Exception as e:
                logger.error(f"Erro no loop principal: {e}")
                self.send_log("ERROR", f"Erro no loop principal: {e}")
                await asyncio.sleep(5)
    
    def stop(self):
        logger.info(f"Parando robô {self.name}...")
        self.is_running = False
        self.should_stop = True
        self.current_task = None
        if self.websocket:
            asyncio.create_task(self.websocket.close())
    
    def run_websocket(self):
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        while self.is_running and not self.should_stop:
            try:
                loop.run_until_complete(self.websocket_handler())
            except Exception as e:
                logger.error(f"Erro no WebSocket: {e}")
                time.sleep(5)
        loop.close()
    
    async def websocket_handler(self):
        try:
            async with websockets.connect(self.ws_url) as websocket:
                self.websocket = websocket
                logger.info("WebSocket conectado")
                await self.send_websocket_message({
                    'type': 'heartbeat',
                    'robot_name': self.name,
                    'timestamp': datetime.now().isoformat()
                })
                async for message in websocket:
                    await self.handle_websocket_message(json.loads(message))
        except websockets.exceptions.ConnectionClosed:
            logger.warning("Conexão WebSocket fechada")
        except Exception as e:
            logger.error(f"Erro no WebSocket: {e}")
        finally:
            self.websocket = None
    
    async def send_websocket_message(self, message: Dict[str, Any]):
        if self.websocket:
            try:
                await self.websocket.send(json.dumps(message))
            except Exception as e:
                logger.error(f"Erro ao enviar mensagem WebSocket: {e}")
    
    async def handle_websocket_message(self, message: Dict[str, Any]):
        message_type = message.get('type')
        if message_type == 'command':
            await self.handle_command(message.get('data', {}))
        elif message_type == 'pending_commands':
            for command in message.get('data', []):
                await self.handle_command(command)
        elif message_type == 'heartbeat_ack':
            logger.debug("Heartbeat confirmado")
    
    async def handle_command(self, command: Dict[str, Any]):
        command_type = command.get('command_type')
        command_id = command.get('id')
        logger.info(f"Recebido comando: {command_type} (ID: {command_id})")
        self.send_log("INFO", f"Executando comando: {command_type}")
        try:
            if command_type == 'START':
                await self.execute_start_command()
            elif command_type == 'STOP':
                await self.execute_stop_command()
            elif command_type == 'RESTART':
                await self.execute_restart_command()
            elif command_type == 'PAUSE':
                await self.execute_pause_command()
            elif command_type == 'RESUME':
                await self.execute_resume_command()
            else:
                logger.warning(f"Comando desconhecido: {command_type}")
                await self.send_command_response(command_id, 'FAILED', f"Comando desconhecido: {command_type}")
                return
            await self.send_command_response(command_id, 'EXECUTED', f"Comando {command_type} executado com sucesso")
        except Exception as e:
            logger.error(f"Erro ao executar comando {command_type}: {e}")
            await self.send_command_response(command_id, 'FAILED', str(e))
    
    async def send_command_response(self, command_id: int, status: str, response: str):
        await self.send_websocket_message({
            'type': 'command_response',
            'command_id': command_id,
            'status': status,
            'response': response
        })
    
    async def execute_start_command(self):
        if self.status == "RUNNING":
            raise Exception("Robô já está executando")
        self.status = "RUNNING"
        self.send_log("INFO", "Robô iniciado")
        if not self.task_thread or not self.task_thread.is_alive():
            self.task_thread = threading.Thread(target=self.simulate_task, daemon=True)
            self.task_thread.start()
    
    async def execute_stop_command(self):
        self.status = "STOPPED"
        self.current_task = None
        self.send_log("INFO", "Robô parado")
    
    async def execute_restart_command(self):
        await self.execute_stop_command()
        await asyncio.sleep(2)
        await self.execute_start_command()
        self.send_log("INFO", "Robô reiniciado")
    
    async def execute_pause_command(self):
        if self.status == "RUNNING":
            self.status = "IDLE"
            self.send_log("INFO", "Robô pausado")
        else:
            raise Exception("Robô não está executando")
    
    async def execute_resume_command(self):
        if self.status == "IDLE":
            self.status = "RUNNING"
            self.send_log("INFO", "Robô retomado")
        else:
            raise Exception("Robô não está pausado")
    
    def simulate_task(self):
        task_names = [
            "Processamento de dados",
            "Análise de imagens",
            "Coleta de informações",
            "Backup de arquivos",
            "Verificação de sistema",
            "Limpeza de cache",
            "Atualização de configurações"
        ]
        task_name = random.choice(task_names)
        self.current_task = task_name
        logger.info(f"Iniciando tarefa: {task_name}")
        self.send_log("INFO", f"Iniciando tarefa: {task_name}")
        total_steps = random.randint(5, 15)
        for step in range(1, total_steps + 1):
            if self.status != "RUNNING" or self.should_stop:
                self.send_log("WARNING", f"Tarefa {task_name} interrompida")
                break
            time.sleep(random.uniform(2, 8))
            progress = (step / total_steps) * 100
            self.send_log("INFO", f"Progresso da tarefa {task_name}: {progress:.1f}%")
            if random.random() < 0.05:
                error_msg = f"Erro simulado na tarefa {task_name} (passo {step})"
                self.send_log("ERROR", error_msg)
                self.status = "ERROR"
                return
        if self.status == "RUNNING":
            self.send_log("INFO", f"Tarefa {task_name} concluída com sucesso")
            self.status = "IDLE"
        self.current_task = None
    
    def update_system_stats(self):
        self.cpu_usage = max(0, min(100, self.cpu_usage + random.uniform(-5, 5)))
        self.memory_usage = max(0, min(100, self.memory_usage + random.uniform(-3, 3)))
        self.disk_usage = max(0, min(100, self.disk_usage + random.uniform(-1, 1)))
        if random.random() < 0.01:
            self.network_status = False
            self.send_log("WARNING", "Problema de conectividade de rede detectado")
        elif not self.network_status and random.random() < 0.3:
            self.network_status = True
            self.send_log("INFO", "Conectividade de rede restaurada")
    
    def send_log(self, level: str, message: str, source: str = "robot"):
        try:
            data = {
                'robot_name': self.name,
                'level': level,
                'message': message,
                'source': source
            }
            response = requests.post(f"{self.api_base}/logs/", json=data, timeout=5)
            if response.status_code != 201:
                logger.error(f"Erro ao enviar log: {response.status_code}")
        except Exception as e:
            logger.error(f"Erro ao enviar log: {e}")
    
    def send_status_update(self):
        try:
            data = {
                'robot_name': self.name,
                'status': self.status,
                'cpu_usage': round(self.cpu_usage, 2),
                'memory_usage': round(self.memory_usage, 2),
                'disk_usage': round(self.disk_usage, 2),
                'network_status': self.network_status,
                'custom_data': {
                    'current_task': self.current_task,
                    'uptime': time.time(),
                    'version': '1.0.0'
                }
            }
            response = requests.post(f"{self.api_base}/status/", json=data, timeout=5)
            if response.status_code == 201:
                logger.debug("Status atualizado com sucesso")
            else:
                logger.error(f"Erro ao enviar status: {response.status_code}")
        except Exception as e:
            logger.error(f"Erro ao enviar status: {e}")
    
    def send_heartbeat(self):
        if self.websocket:
            asyncio.create_task(self.send_websocket_message({
                'type': 'heartbeat',
                'robot_name': self.name,
                'timestamp': datetime.now().isoformat()
            }))


def main():
    parser = argparse.ArgumentParser(description='Robô de Exemplo para Sistema de Monitoramento')
    parser.add_argument('--name', '-n', default='robot_exemplo', help='Nome do robô')
    parser.add_argument('--server', '-s', default='http://129.148.32.147:8000', help='URL do servidor')
    parser.add_argument('--verbose', '-v', action='store_true', help='Modo verboso')
    args = parser.parse_args()

    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)

    robot = ExampleRobot(args.name, args.server)
    try:
        robot.start()
    except KeyboardInterrupt:
        logger.info("Interrompido pelo usuário")
    except Exception as e:
        logger.error(f"Erro fatal: {e}")
    finally:
        robot.stop()
        logger.info("Robô finalizado")


if __name__ == "__main__":
    main()
