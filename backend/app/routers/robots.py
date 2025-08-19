from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import datetime, timedelta
from ..database import get_db
from ..models import Robot, Execution, User
from ..schemas import Robot as RobotSchema, RobotCreate, RobotUpdate, RobotRegister, RobotCommand, RobotHeartbeat, DashboardStats
from ..auth import get_current_active_user, require_admin, require_operator
from ..redis_service import redis_service
from ..telegram_service import telegram_service
from ..metrics import metrics_service
from ..websocket import websocket_manager
import structlog

logger = structlog.get_logger()
router = APIRouter()

@router.get("/", response_model=List[RobotSchema])
async def list_robots(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[str] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    query = db.query(Robot)
    if status:
        query = query.filter(Robot.status == status)
    
    robots = query.offset(skip).limit(limit).all()
    return robots

@router.post("/", response_model=RobotSchema)
async def create_robot(
    robot: RobotCreate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    # Verificar se slug já existe
    existing = db.query(Robot).filter(Robot.slug == robot.slug).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Já existe um robô com este slug"
        )
    
    db_robot = Robot(**robot.dict())
    db.add(db_robot)
    db.commit()
    db.refresh(db_robot)
    
    logger.info("Robô criado", robot_id=str(db_robot.id), slug=robot.slug, user_id=str(current_user.id))
    
    # Notificar via WebSocket
    await websocket_manager.broadcast_status({
        "event": "robot_created",
        "robot": {
            "id": str(db_robot.id),
            "nome": db_robot.nome,
            "slug": db_robot.slug,
            "status": db_robot.status
        }
    })
    
    return db_robot

@router.get("/{robot_id}", response_model=RobotSchema)
async def get_robot(
    robot_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    robot = db.query(Robot).filter(Robot.id == robot_id).first()
    if not robot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Robô não encontrado"
        )
    return robot

@router.put("/{robot_id}", response_model=RobotSchema)
async def update_robot(
    robot_id: UUID,
    robot_update: RobotUpdate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    robot = db.query(Robot).filter(Robot.id == robot_id).first()
    if not robot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Robô não encontrado"
        )
    
    update_data = robot_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(robot, field, value)
    
    robot.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(robot)
    
    logger.info("Robô atualizado", robot_id=str(robot.id), user_id=str(current_user.id))
    
    return robot

@router.delete("/{robot_id}")
async def delete_robot(
    robot_id: UUID,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    robot = db.query(Robot).filter(Robot.id == robot_id).first()
    if not robot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Robô não encontrado"
        )
    
    db.delete(robot)
    db.commit()
    
    logger.info("Robô deletado", robot_id=str(robot.id), user_id=str(current_user.id))
    
    return {"message": "Robô deletado com sucesso"}

@router.post("/register", response_model=RobotSchema)
async def register_robot(robot_data: RobotRegister, db: Session = Depends(get_db)):
    """Endpoint para robôs se registrarem automaticamente"""
    robot = db.query(Robot).filter(Robot.slug == robot_data.slug).first()
    
    if robot:
        # Atualizar informações se necessário
        robot.nome = robot_data.nome
        if robot_data.descricao:
            robot.descricao = robot_data.descricao
        robot.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(robot)
        logger.info("Robô re-registrado", robot_id=str(robot.id), slug=robot_data.slug)
    else:
        # Criar novo robô
        robot = Robot(
            slug=robot_data.slug,
            nome=robot_data.nome,
            descricao=robot_data.descricao
        )
        db.add(robot)
        db.commit()
        db.refresh(robot)
        logger.info("Novo robô registrado", robot_id=str(robot.id), slug=robot_data.slug)
    
    return robot

@router.post("/{robot_id}/start")
async def start_robot(
    robot_id: UUID,
    current_user: User = Depends(require_operator),
    db: Session = Depends(get_db)
):
    robot = db.query(Robot).filter(Robot.id == robot_id).first()
    if not robot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Robô não encontrado"
        )
    
    if robot.status == "executando":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Robô já está executando"
        )
    
    # Criar nova execução
    execution = Execution(robot_id=robot_id)
    db.add(execution)
    
    # Atualizar status do robô
    robot.status = "executando"
    robot.ultima_execucao_at = datetime.utcnow()
    robot.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(execution)
    
    # Enviar comando via Redis
    command = {
        "action": "start",
        "execution_id": str(execution.id),
        "timestamp": datetime.utcnow().isoformat()
    }
    redis_service.publish_command(str(robot_id), command)
    redis_service.set_robot_command(str(robot_id), command)
    
    # Registrar métricas
    metrics_service.record_execution_start(robot.slug, str(execution.id))
    
    # Notificar via WebSocket
    await websocket_manager.broadcast_status({
        "event": "robot_started",
        "robot_id": str(robot_id),
        "execution_id": str(execution.id)
    })
    
    # Enviar notificação Telegram se configurado
    if robot.telegram_bot_id and robot.telegram_chat_id:
        message = telegram_service.format_robot_notification(
            robot.nome, 
            "inicio", 
            {
                "execution_id": str(execution.id),
                "started_at": execution.started_at.strftime("%d/%m/%Y %H:%M:%S")
            }
        )
        await telegram_service.send_message(
            str(robot.telegram_bot_id),
            robot.telegram_chat_id,
            message
        )
    
    logger.info("Robô iniciado", robot_id=str(robot_id), execution_id=str(execution.id), user_id=str(current_user.id))
    
    return {"message": "Robô iniciado com sucesso", "execution_id": str(execution.id)}

@router.post("/{robot_id}/pause")
async def pause_robot(
    robot_id: UUID,
    current_user: User = Depends(require_operator),
    db: Session = Depends(get_db)
):
    robot = db.query(Robot).filter(Robot.id == robot_id).first()
    if not robot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Robô não encontrado"
        )
    
    if robot.status != "executando":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Robô não está executando"
        )
    
    # Atualizar status
    robot.status = "pausado"
    robot.updated_at = datetime.utcnow()
    db.commit()
    
    # Enviar comando
    command = {
        "action": "pause",
        "timestamp": datetime.utcnow().isoformat()
    }
    redis_service.publish_command(str(robot_id), command)
    redis_service.set_robot_command(str(robot_id), command)
    
    # Obter execução atual
    current_execution = db.query(Execution).filter(
        Execution.robot_id == robot_id,
        Execution.status == "em_andamento"
    ).first()
    
    if current_execution:
        metrics_service.record_execution_pause(robot.slug, str(current_execution.id))
    
    # Notificar via WebSocket
    await websocket_manager.broadcast_status({
        "event": "robot_paused",
        "robot_id": str(robot_id)
    })
    
    # Enviar notificação Telegram se configurado
    if robot.telegram_bot_id and robot.telegram_chat_id:
        message = telegram_service.format_robot_notification(robot.nome, "pausa", {})
        await telegram_service.send_message(
            str(robot.telegram_bot_id),
            robot.telegram_chat_id,
            message
        )
    
    logger.info("Robô pausado", robot_id=str(robot_id), user_id=str(current_user.id))
    
    return {"message": "Robô pausado com sucesso"}

@router.post("/{robot_id}/resume")
async def resume_robot(
    robot_id: UUID,
    current_user: User = Depends(require_operator),
    db: Session = Depends(get_db)
):
    robot = db.query(Robot).filter(Robot.id == robot_id).first()
    if not robot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Robô não encontrado"
        )
    
    if robot.status != "pausado":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Robô não está pausado"
        )
    
    # Atualizar status
    robot.status = "executando"
    robot.updated_at = datetime.utcnow()
    db.commit()
    
    # Enviar comando
    command = {
        "action": "resume",
        "timestamp": datetime.utcnow().isoformat()
    }
    redis_service.publish_command(str(robot_id), command)
    redis_service.set_robot_command(str(robot_id), command)
    
    # Obter execução atual
    current_execution = db.query(Execution).filter(
        Execution.robot_id == robot_id,
        Execution.status == "em_andamento"
    ).first()
    
    if current_execution:
        metrics_service.record_execution_resume(robot.slug, str(current_execution.id))
    
    # Notificar via WebSocket
    await websocket_manager.broadcast_status({
        "event": "robot_resumed",
        "robot_id": str(robot_id)
    })
    
    # Enviar notificação Telegram se configurado
    if robot.telegram_bot_id and robot.telegram_chat_id:
        message = telegram_service.format_robot_notification(robot.nome, "continuacao", {})
        await telegram_service.send_message(
            str(robot.telegram_bot_id),
            robot.telegram_chat_id,
            message
        )
    
    logger.info("Robô retomado", robot_id=str(robot_id), user_id=str(current_user.id))
    
    return {"message": "Robô retomado com sucesso"}

@router.post("/{robot_id}/stop")
async def stop_robot(
    robot_id: UUID,
    current_user: User = Depends(require_operator),
    db: Session = Depends(get_db)
):
    robot = db.query(Robot).filter(Robot.id == robot_id).first()
    if not robot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Robô não encontrado"
        )
    
    if robot.status not in ["executando", "pausado"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Robô não está executando nem pausado"
        )
    
    # Atualizar status
    robot.status = "parado"
    robot.updated_at = datetime.utcnow()
    
    # Finalizar execução atual
    current_execution = db.query(Execution).filter(
        Execution.robot_id == robot_id,
        Execution.status == "em_andamento"
    ).first()
    
    if current_execution:
        current_execution.status = "cancelada"
        current_execution.finished_at = datetime.utcnow()
        if current_execution.started_at:
            current_execution.duracao_segundos = (
                current_execution.finished_at - current_execution.started_at
            ).total_seconds()
    
    db.commit()
    
    # Enviar comando
    command = {
        "action": "stop",
        "timestamp": datetime.utcnow().isoformat()
    }
    redis_service.publish_command(str(robot_id), command)
    redis_service.set_robot_command(str(robot_id), command)
    
    if current_execution:
        metrics_service.record_execution_stop(robot.slug, str(current_execution.id))
    
    # Notificar via WebSocket
    await websocket_manager.broadcast_status({
        "event": "robot_stopped",
        "robot_id": str(robot_id)
    })
    
    # Enviar notificação Telegram se configurado
    if robot.telegram_bot_id and robot.telegram_chat_id:
        message = telegram_service.format_robot_notification(robot.nome, "parada", {})
        await telegram_service.send_message(
            str(robot.telegram_bot_id),
            robot.telegram_chat_id,
            message
        )
    
    logger.info("Robô parado", robot_id=str(robot_id), user_id=str(current_user.id))
    
    return {"message": "Robô parado com sucesso"}

@router.get("/{robot_id}/next-command")
async def get_next_command(robot_id: UUID, db: Session = Depends(get_db)):
    """Endpoint para robôs obterem o próximo comando (polling)"""
    robot = db.query(Robot).filter(Robot.id == robot_id).first()
    if not robot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Robô não encontrado"
        )
    
    command = redis_service.get_robot_command(str(robot_id))
    return command or {}

@router.post("/{robot_id}/heartbeat")
async def robot_heartbeat(
    robot_id: UUID,
    heartbeat: RobotHeartbeat,
    db: Session = Depends(get_db)
):
    """Endpoint para robôs enviarem heartbeat"""
    robot = db.query(Robot).filter(Robot.id == robot_id).first()
    if not robot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Robô não encontrado"
        )
    
    # Atualizar status no Redis
    status_data = {
        "robot_id": str(robot_id),
        "timestamp": heartbeat.ts,
        "status": heartbeat.status or robot.status,
        "run_id": str(heartbeat.run_id) if heartbeat.run_id else None
    }
    redis_service.set_robot_status(str(robot_id), status_data)
    
    # Atualizar última execução se necessário
    if heartbeat.run_id:
        robot.ultima_execucao_at = datetime.utcnow()
        robot.updated_at = datetime.utcnow()
        db.commit()
    
    return {"status": "ok"}

@router.get("/stats/dashboard", response_model=DashboardStats)
async def get_dashboard_stats(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Obter estatísticas para o dashboard"""
    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    yesterday_start = today_start - timedelta(days=1)
    
    # Robôs online (status != idle)
    robots_online = db.query(Robot).filter(Robot.status != "idle").count()
    
    # Execuções hoje
    executions_today = db.query(Execution).filter(
        Execution.started_at >= today_start
    ).count()
    
    # Execuções ontem
    executions_yesterday = db.query(Execution).filter(
        Execution.started_at >= yesterday_start,
        Execution.started_at < today_start
    ).count()
    
    # Taxa de sucesso hoje
    successful_today = db.query(Execution).filter(
        Execution.started_at >= today_start,
        Execution.status == "concluida"
    ).count()
    
    success_rate = (successful_today / executions_today * 100) if executions_today > 0 else 0
    
    # Falhas hoje
    failures_today = db.query(Execution).filter(
        Execution.started_at >= today_start,
        Execution.status == "falha"
    ).count()
    
    # Falhas ontem
    failures_yesterday = db.query(Execution).filter(
        Execution.started_at >= yesterday_start,
        Execution.started_at < today_start,
        Execution.status == "falha"
    ).count()
    
    # Calcular mudanças
    exec_change = executions_today - executions_yesterday
    exec_change_str = f"+{exec_change}" if exec_change > 0 else str(exec_change)
    if executions_yesterday > 0:
        exec_percent = (exec_change / executions_yesterday) * 100
        exec_change_str = f"{exec_change_str} ({exec_percent:+.1f}%)"
    
    fail_change = failures_today - failures_yesterday
    fail_change_str = f"{fail_change:+d} vs ontem"
    
    return DashboardStats(
        robots_online=robots_online,
        executions_today=executions_today,
        success_rate=round(success_rate, 1),
        failures_today=failures_today,
        robots_change="+1 hoje",  # Placeholder
        executions_change=exec_change_str,
        success_change="+2.1%",  # Placeholder
        failures_change=fail_change_str
    )
