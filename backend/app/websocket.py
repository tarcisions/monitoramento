import json
import asyncio
from typing import Set, Optional
from fastapi import WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
import structlog

logger = structlog.get_logger()

class WebSocketManager:
    def __init__(self):
        # Conexões ativas organizadas por tipo
        self.log_connections: Set[WebSocket] = set()
        self.status_connections: Set[WebSocket] = set()
        
    async def connect_logs(self, websocket: WebSocket, robot_id: Optional[str] = None, execution_id: Optional[str] = None):
        """Conecta um cliente aos logs ao vivo"""
        await websocket.accept()
        connection_info = {
            "websocket": websocket,
            "robot_id": robot_id,
            "execution_id": execution_id
        }
        self.log_connections.add(websocket)
        logger.info("Cliente conectado aos logs", robot_id=robot_id, execution_id=execution_id)
        
    async def connect_status(self, websocket: WebSocket):
        """Conecta um cliente às atualizações de status"""
        await websocket.accept()
        self.status_connections.add(websocket)
        logger.info("Cliente conectado ao status")
        
    def disconnect_logs(self, websocket: WebSocket):
        """Desconecta um cliente dos logs"""
        self.log_connections.discard(websocket)
        logger.info("Cliente desconectado dos logs")
        
    def disconnect_status(self, websocket: WebSocket):
        """Desconecta um cliente do status"""
        self.status_connections.discard(websocket)
        logger.info("Cliente desconectado do status")
        
    async def broadcast_log(self, log_data: dict, robot_id: Optional[str] = None, execution_id: Optional[str] = None):
        """Transmite um log para todos os clientes conectados"""
        if not self.log_connections:
            return
            
        message = json.dumps({
            "type": "log",
            "data": log_data,
            "robot_id": robot_id,
            "execution_id": execution_id
        })
        
        # Lista de conexões para remover (se falharem)
        disconnected = []
        
        for connection in self.log_connections:
            try:
                await connection.send_text(message)
            except Exception as e:
                logger.warning("Erro ao enviar log via WebSocket", error=str(e))
                disconnected.append(connection)
                
        # Remove conexões que falharam
        for connection in disconnected:
            self.log_connections.discard(connection)
            
    async def broadcast_status(self, status_data: dict):
        """Transmite uma atualização de status para todos os clientes conectados"""
        if not self.status_connections:
            return
            
        message = json.dumps({
            "type": "status",
            "data": status_data
        })
        
        # Lista de conexões para remover (se falharem)
        disconnected = []
        
        for connection in self.status_connections:
            try:
                await connection.send_text(message)
            except Exception as e:
                logger.warning("Erro ao enviar status via WebSocket", error=str(e))
                disconnected.append(connection)
                
        # Remove conexões que falharam
        for connection in disconnected:
            self.status_connections.discard(connection)
            
    async def send_notification(self, notification: dict):
        """Envia uma notificação para todos os clientes conectados"""
        message = json.dumps({
            "type": "notification",
            "data": notification
        })
        
        all_connections = self.log_connections.union(self.status_connections)
        disconnected = []
        
        for connection in all_connections:
            try:
                await connection.send_text(message)
            except Exception as e:
                logger.warning("Erro ao enviar notificação via WebSocket", error=str(e))
                disconnected.append(connection)
                
        # Remove conexões que falharam
        for connection in disconnected:
            self.log_connections.discard(connection)
            self.status_connections.discard(connection)

# Instância global
websocket_manager = WebSocketManager()
