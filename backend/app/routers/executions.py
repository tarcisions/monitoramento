from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import datetime
from ..database import get_db
from ..models import Execution, ExecutionLog, Robot, User
from ..schemas import Execution as ExecutionSchema, ExecutionFinish, ExecutionLog as ExecutionLogSchema, ExecutionLogCreate
from ..auth import get_current_active_user
from ..metrics import metrics_service
from ..telegram_service import telegram_service
from ..websocket import websocket_manager
import structlog

logger = structlog.get_logger()
router = APIRouter()

@router.get("/", response_model=List[ExecutionSchema])
async def list_executions(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    robot_id: Optional[UUID] = Query(None),
    status: Optional[str] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    query = db.query(Execution)
    
    if robot_id:
        query = query.filter(Execution.robot_id == robot_id)
    if status:
        query = query.filter(Execution.status == status)
    
    executions = query.order_by(desc(Execution.started_at)).offset(skip).limit(limit).all()
    return executions

@router.get("/{execution_id}", response_model=ExecutionSchema)
async def get_execution(
    execution_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    execution = db.query(Execution).filter(Execution.id == execution_id).first()
    if not execution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Execução não encontrada"
        )
    return execution

@router.get("/{execution_id}/logs", response_model=List[ExecutionLogSchema])
async def get_execution_logs(
    execution_id: UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(1000, ge=1, le=10000),
    nivel: Optional[str] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Verificar se a execução existe
    execution = db.query(Execution).filter(Execution.id == execution_id).first()
    if not execution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Execução não encontrada"
        )
    
    query = db.query(ExecutionLog).filter(ExecutionLog.execution_id == execution_id)
    
    if nivel:
        query = query.filter(ExecutionLog.nivel == nivel)
    
    logs = query.order_by(ExecutionLog.ts).offset(skip).limit(limit).all()
    return logs

@router.post("/{execution_id}/finish")
async def finish_execution(
    execution_id: UUID,
    finish_data: ExecutionFinish,
    db: Session = Depends(get_db)
):
    """Endpoint para robôs finalizarem execuções"""
    execution = db.query(Execution).filter(Execution.id == execution_id).first()
    if not execution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Execução não encontrada"
        )
    
    if execution.status != "em_andamento":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Execução não está em andamento"
        )
    
    # Atualizar execução
    execution.status = finish_data.status
    execution.finished_at = datetime.utcnow()
    execution.erro = finish_data.erro
    execution.itens_processados = finish_data.itens_processados or 0
    
    if execution.started_at:
        execution.duracao_segundos = (
            execution.finished_at - execution.started_at
        ).total_seconds()
    
    # Atualizar status do robô
    robot = db.query(Robot).filter(Robot.id == execution.robot_id).first()
    if robot:
        robot.status = "idle"
        robot.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(execution)
    
    # Registrar métricas
    if robot:
        metrics_service.record_execution_finish(robot.slug, str(execution.id), execution.status)
    
    # Notificar via WebSocket
    await websocket_manager.broadcast_status({
        "event": "execution_finished",
        "execution_id": str(execution.id),
        "robot_id": str(execution.robot_id),
        "status": execution.status,
        "duration": execution.duracao_segundos
    })
    
    # Enviar notificação Telegram se configurado
    if robot and robot.telegram_bot_id and robot.telegram_chat_id:
        if execution.status == "concluida":
            event = "conclusao"
            details = {
                "duration": execution.duracao_segundos or 0,
                "items_processed": execution.itens_processados
            }
        else:
            event = "falha"
            details = {"error": execution.erro or "Erro desconhecido"}
        
        message = telegram_service.format_robot_notification(robot.nome, event, details)
        await telegram_service.send_message(
            str(robot.telegram_bot_id),
            robot.telegram_chat_id,
            message
        )
    
    logger.info(
        "Execução finalizada",
        execution_id=str(execution.id),
        robot_id=str(execution.robot_id),
        status=execution.status,
        duration=execution.duracao_segundos
    )
    
    return {"message": "Execução finalizada com sucesso"}

@router.post("/logs", response_model=ExecutionLogSchema)
async def create_execution_log(
    log_data: ExecutionLogCreate,
    db: Session = Depends(get_db)
):
    """Endpoint para robôs enviarem logs estruturados"""
    # Verificar se a execução existe
    execution = db.query(Execution).filter(Execution.id == log_data.execution_id).first()
    if not execution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Execução não encontrada"
        )
    
    # Criar log
    db_log = ExecutionLog(**log_data.dict())
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    
    # Obter robô para o WebSocket
    robot = db.query(Robot).filter(Robot.id == execution.robot_id).first()
    
    # Enviar via WebSocket
    await websocket_manager.broadcast_log(
        {
            "id": str(db_log.id),
            "execution_id": str(db_log.execution_id),
            "ts": db_log.ts.isoformat(),
            "nivel": db_log.nivel,
            "mensagem": db_log.mensagem,
            "dados": db_log.dados,
            "robot_slug": robot.slug if robot else None
        },
        robot_id=str(execution.robot_id) if robot else None,
        execution_id=str(execution.id)
    )
    
    return db_log
