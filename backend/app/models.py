from sqlalchemy import Column, String, Boolean, DateTime, Integer, Float, Text, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from .database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nome = Column(String, nullable=False)
    email = Column(String, nullable=False, unique=True)
    senha_hash = Column(String, nullable=False)
    role = Column(String, nullable=False, default="operador")
    ativo = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

class TelegramBot(Base):
    __tablename__ = "telegram_bots"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nome = Column(String, nullable=False)
    token = Column(String, nullable=False)
    default_chat_id = Column(String)
    ativo = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())
    
    robots = relationship("Robot", back_populates="telegram_bot")

class Robot(Base):
    __tablename__ = "robots"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    slug = Column(String, nullable=False, unique=True)
    nome = Column(String, nullable=False)
    descricao = Column(String)
    status = Column(String, nullable=False, default="idle")
    ultima_execucao_at = Column(DateTime)
    telegram_bot_id = Column(UUID(as_uuid=True), ForeignKey("telegram_bots.id"))
    telegram_chat_id = Column(String)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())
    
    telegram_bot = relationship("TelegramBot", back_populates="robots")
    executions = relationship("Execution", back_populates="robot", cascade="all, delete-orphan")

class Execution(Base):
    __tablename__ = "executions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    robot_id = Column(UUID(as_uuid=True), ForeignKey("robots.id"), nullable=False)
    status = Column(String, nullable=False, default="em_andamento")
    started_at = Column(DateTime, nullable=False, server_default=func.now())
    finished_at = Column(DateTime)
    erro = Column(Text)
    itens_processados = Column(Integer, nullable=False, default=0)
    duracao_segundos = Column(Float)
    parametros = Column(JSON)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    
    robot = relationship("Robot", back_populates="executions")
    logs = relationship("ExecutionLog", back_populates="execution", cascade="all, delete-orphan")

class ExecutionLog(Base):
    __tablename__ = "execution_logs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    execution_id = Column(UUID(as_uuid=True), ForeignKey("executions.id"), nullable=False)
    ts = Column(DateTime, nullable=False, server_default=func.now())
    nivel = Column(String, nullable=False)
    mensagem = Column(Text, nullable=False)
    dados = Column(JSON)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    
    execution = relationship("Execution", back_populates="logs")
