import os
import time
import structlog
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from .database import engine, get_db
from .models import Base, User, TelegramBot, Robot
from .auth import get_password_hash
from .metrics import metrics_service, get_metrics
from .telegram_service import telegram_service
from .routers import auth, robots, executions, telegram_bots, websocket as ws
import uuid

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

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Iniciando RPA Monitor Backend")
    
    # Criar tabelas
    Base.metadata.create_all(bind=engine)
    
    # Seed inicial
    db = next(get_db())
    try:
        # Criar usuário admin se não existir
        if not db.query(User).filter(User.email == "admin@rpamonitor.com").first():
            admin_user = User(
                id=uuid.uuid4(),
                nome="Administrador",
                email="admin@rpamonitor.com",
                senha_hash=get_password_hash("admin123"),
                role="admin"
            )
            db.add(admin_user)
            
        # Criar bot Telegram dummy se não existir
        if not db.query(TelegramBot).filter(TelegramBot.nome == "Bot Demo").first():
            demo_bot = TelegramBot(
                id=uuid.uuid4(),
                nome="Bot Demo",
                token="1234567890:ABCDEF1234567890abcdef1234567890abc",
                default_chat_id="-1001234567890",
                ativo=False
            )
            db.add(demo_bot)
            
        # Criar robô demo se não existir
        if not db.query(Robot).filter(Robot.slug == "robo-demo").first():
            demo_robot = Robot(
                id=uuid.uuid4(),
                slug="robo-demo",
                nome="Robô Demo",
                descricao="Robô de demonstração do sistema",
                status="idle"
            )
            db.add(demo_robot)
            
        db.commit()
        logger.info("Seed inicial criado com sucesso")
    except Exception as e:
        logger.error("Erro no seed inicial", error=str(e))
        db.rollback()
    finally:
        db.close()
        
    # Carregar bots do Telegram ativos
    db = next(get_db())
    try:
        active_bots = db.query(TelegramBot).filter(TelegramBot.ativo == True).all()
        for bot in active_bots:
            telegram_service.add_bot(str(bot.id), bot.token)
        logger.info("Bots do Telegram carregados", count=len(active_bots))
    except Exception as e:
        logger.error("Erro ao carregar bots do Telegram", error=str(e))
    finally:
        db.close()
    
    yield
    
    # Shutdown
    logger.info("Finalizando RPA Monitor Backend")

app = FastAPI(
    title="RPA Monitor API",
    description="Sistema de Monitoramento de Máquinas e RPA",
    version="1.0.0",
    lifespan=lifespan
)

# CORS
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:5000,http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Middleware de métricas
@app.middleware("http")
async def metrics_middleware(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    
    # Registrar métricas
    endpoint = request.url.path
    if endpoint.startswith("/api"):
        metrics_service.record_api_request(
            method=request.method,
            endpoint=endpoint,
            status_code=response.status_code,
            duration=process_time
        )
    
    return response

# Middleware de logging
@app.middleware("http")
async def logging_middleware(request: Request, call_next):
    start_time = time.time()
    
    response = await call_next(request)
    
    process_time = time.time() - start_time
    
    if request.url.path.startswith("/api"):
        logger.info(
            "API Request",
            method=request.method,
            path=request.url.path,
            status_code=response.status_code,
            duration=round(process_time, 3)
        )
    
    return response

# Routers
app.include_router(auth.router, prefix="/api/auth", tags=["Autenticação"])
app.include_router(robots.router, prefix="/api/robots", tags=["Robôs"])
app.include_router(executions.router, prefix="/api/executions", tags=["Execuções"])
app.include_router(telegram_bots.router, prefix="/api/telegram-bots", tags=["Telegram Bots"])
app.include_router(ws.router, prefix="/ws", tags=["WebSocket"])

# Endpoint de métricas
@app.get("/metrics")
async def metrics():
    return get_metrics()

# Health check
@app.get("/api/health")
async def health_check():
    return {"status": "ok", "service": "rpa-monitor-backend"}

# Root endpoint
@app.get("/api")
async def root():
    return {"message": "RPA Monitor API", "version": "1.0.0"}

# Exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("Erro não tratado", error=str(exc), path=request.url.path)
    return JSONResponse(
        status_code=500,
        content={"detail": "Erro interno do servidor"}
    )

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run(app, host=host, port=port)
