from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
from uuid import UUID

# User schemas
class UserBase(BaseModel):
    nome: str
    email: EmailStr
    role: str = "operador"
    ativo: bool = True

class UserCreate(UserBase):
    senha: str = Field(min_length=6)

class UserLogin(BaseModel):
    email: EmailStr
    senha: str

class User(UserBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Telegram Bot schemas
class TelegramBotBase(BaseModel):
    nome: str
    token: str
    default_chat_id: Optional[str] = None
    ativo: bool = True

class TelegramBotCreate(TelegramBotBase):
    pass

class TelegramBotUpdate(BaseModel):
    nome: Optional[str] = None
    token: Optional[str] = None
    default_chat_id: Optional[str] = None
    ativo: Optional[bool] = None

class TelegramBot(TelegramBotBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Robot schemas
class RobotBase(BaseModel):
    slug: str
    nome: str
    descricao: Optional[str] = None
    telegram_bot_id: Optional[UUID] = None
    telegram_chat_id: Optional[str] = None

class RobotCreate(RobotBase):
    pass

class RobotUpdate(BaseModel):
    nome: Optional[str] = None
    descricao: Optional[str] = None
    telegram_bot_id: Optional[UUID] = None
    telegram_chat_id: Optional[str] = None

class RobotRegister(BaseModel):
    slug: str
    nome: str
    descricao: Optional[str] = None

class Robot(RobotBase):
    id: UUID
    status: str
    ultima_execucao_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    telegram_bot: Optional[TelegramBot] = None
    
    class Config:
        from_attributes = True

# Execution schemas
class ExecutionBase(BaseModel):
    parametros: Optional[Dict[str, Any]] = None

class ExecutionCreate(ExecutionBase):
    robot_id: UUID

class ExecutionFinish(BaseModel):
    status: str
    erro: Optional[str] = None
    itens_processados: Optional[int] = 0

class Execution(ExecutionBase):
    id: UUID
    robot_id: UUID
    status: str
    started_at: datetime
    finished_at: Optional[datetime] = None
    erro: Optional[str] = None
    itens_processados: int
    duracao_segundos: Optional[float] = None
    created_at: datetime
    robot: Optional[Robot] = None
    
    class Config:
        from_attributes = True

# Execution Log schemas
class ExecutionLogBase(BaseModel):
    nivel: str
    mensagem: str
    dados: Optional[Dict[str, Any]] = None

class ExecutionLogCreate(ExecutionLogBase):
    execution_id: UUID

class ExecutionLog(ExecutionLogBase):
    id: UUID
    execution_id: UUID
    ts: datetime
    created_at: datetime
    
    class Config:
        from_attributes = True

# Command schemas
class RobotCommand(BaseModel):
    action: str  # start, pause, resume, stop
    parameters: Optional[Dict[str, Any]] = None

# Heartbeat schema
class RobotHeartbeat(BaseModel):
    run_id: Optional[UUID] = None
    ts: float
    status: Optional[str] = None

# Stats schemas
class DashboardStats(BaseModel):
    robots_online: int
    executions_today: int
    success_rate: float
    failures_today: int
    robots_change: str
    executions_change: str
    success_change: str
    failures_change: str

# Token schemas
class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    email: Optional[str] = None
