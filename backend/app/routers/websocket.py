from typing import Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from ..websocket import websocket_manager
from ..metrics import metrics_service
import structlog

logger = structlog.get_logger()
router = APIRouter()

@router.websocket("/logs")
async def websocket_logs(
    websocket: WebSocket,
    robot_id: Optional[str] = Query(None),
    execution_id: Optional[str] = Query(None)
):
    await websocket_manager.connect_logs(websocket, robot_id, execution_id)
    metrics_service.increment_websocket_connections()
    
    try:
        while True:
            # Manter conexão viva - apenas receber mensagens de ping
            await websocket.receive_text()
    except WebSocketDisconnect:
        websocket_manager.disconnect_logs(websocket)
        metrics_service.decrement_websocket_connections()
        logger.info("Cliente desconectado dos logs via WebSocket")

@router.websocket("/status")
async def websocket_status(websocket: WebSocket):
    await websocket_manager.connect_status(websocket)
    metrics_service.increment_websocket_connections()
    
    try:
        while True:
            # Manter conexão viva - apenas receber mensagens de ping
            await websocket.receive_text()
    except WebSocketDisconnect:
        websocket_manager.disconnect_status(websocket)
        metrics_service.decrement_websocket_connections()
        logger.info("Cliente desconectado do status via WebSocket")
