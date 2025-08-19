from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import TelegramBot, User
from ..schemas import TelegramBot as TelegramBotSchema, TelegramBotCreate, TelegramBotUpdate
from ..auth import get_current_active_user, require_admin
from ..telegram_service import telegram_service
import structlog

logger = structlog.get_logger()
router = APIRouter()

@router.get("/", response_model=List[TelegramBotSchema])
async def list_telegram_bots(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    bots = db.query(TelegramBot).offset(skip).limit(limit).all()
    return bots

@router.post("/", response_model=TelegramBotSchema)
async def create_telegram_bot(
    bot: TelegramBotCreate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    db_bot = TelegramBot(**bot.dict())
    db.add(db_bot)
    db.commit()
    db.refresh(db_bot)
    
    # Adicionar ao serviço do Telegram se estiver ativo
    if db_bot.ativo:
        telegram_service.add_bot(str(db_bot.id), db_bot.token)
    
    logger.info("Bot do Telegram criado", bot_id=str(db_bot.id), nome=bot.nome, user_id=str(current_user.id))
    
    return db_bot

@router.get("/{bot_id}", response_model=TelegramBotSchema)
async def get_telegram_bot(
    bot_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    bot = db.query(TelegramBot).filter(TelegramBot.id == bot_id).first()
    if not bot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bot do Telegram não encontrado"
        )
    return bot

@router.put("/{bot_id}", response_model=TelegramBotSchema)
async def update_telegram_bot(
    bot_id: UUID,
    bot_update: TelegramBotUpdate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    bot = db.query(TelegramBot).filter(TelegramBot.id == bot_id).first()
    if not bot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bot do Telegram não encontrado"
        )
    
    update_data = bot_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(bot, field, value)
    
    db.commit()
    db.refresh(bot)
    
    # Atualizar no serviço do Telegram
    if bot.ativo:
        telegram_service.add_bot(str(bot.id), bot.token)
    else:
        telegram_service.remove_bot(str(bot.id))
    
    logger.info("Bot do Telegram atualizado", bot_id=str(bot.id), user_id=str(current_user.id))
    
    return bot

@router.delete("/{bot_id}")
async def delete_telegram_bot(
    bot_id: UUID,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    bot = db.query(TelegramBot).filter(TelegramBot.id == bot_id).first()
    if not bot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bot do Telegram não encontrado"
        )
    
    # Remover do serviço do Telegram
    telegram_service.remove_bot(str(bot_id))
    
    db.delete(bot)
    db.commit()
    
    logger.info("Bot do Telegram deletado", bot_id=str(bot_id), user_id=str(current_user.id))
    
    return {"message": "Bot do Telegram deletado com sucesso"}

@router.post("/{bot_id}/test")
async def test_telegram_bot(
    bot_id: UUID,
    chat_id: str = Query(..., description="ID do chat para teste"),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    bot = db.query(TelegramBot).filter(TelegramBot.id == bot_id).first()
    if not bot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bot do Telegram não encontrado"
        )
    
    # Testar bot
    success = await telegram_service.test_bot(bot.token, chat_id)
    
    if success:
        logger.info("Teste do bot bem-sucedido", bot_id=str(bot_id), chat_id=chat_id, user_id=str(current_user.id))
        return {"message": "Mensagem de teste enviada com sucesso"}
    else:
        logger.warning("Teste do bot falhou", bot_id=str(bot_id), chat_id=chat_id, user_id=str(current_user.id))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Falha ao enviar mensagem de teste. Verifique o token e chat ID."
        )
