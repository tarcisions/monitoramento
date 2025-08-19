import os
import asyncio
from typing import Optional, Dict, Any
from telegram import Bot
from telegram.error import TelegramError
import structlog

logger = structlog.get_logger()

class TelegramService:
    def __init__(self):
        self.bots: Dict[str, Bot] = {}
        
    def add_bot(self, bot_id: str, token: str):
        """Adiciona um bot à lista de bots disponíveis"""
        try:
            bot = Bot(token=token)
            self.bots[bot_id] = bot
            logger.info("Bot do Telegram adicionado", bot_id=bot_id)
        except Exception as e:
            logger.error("Erro ao adicionar bot do Telegram", bot_id=bot_id, error=str(e))
            
    def remove_bot(self, bot_id: str):
        """Remove um bot da lista"""
        if bot_id in self.bots:
            del self.bots[bot_id]
            logger.info("Bot do Telegram removido", bot_id=bot_id)
            
    async def send_message(self, bot_id: str, chat_id: str, message: str) -> bool:
        """Envia uma mensagem via Telegram"""
        try:
            if bot_id not in self.bots:
                logger.warning("Bot não encontrado", bot_id=bot_id)
                return False
                
            bot = self.bots[bot_id]
            await bot.send_message(chat_id=chat_id, text=message, parse_mode='HTML')
            logger.info("Mensagem enviada via Telegram", bot_id=bot_id, chat_id=chat_id)
            return True
        except TelegramError as e:
            logger.error("Erro do Telegram", bot_id=bot_id, chat_id=chat_id, error=str(e))
            return False
        except Exception as e:
            logger.error("Erro geral ao enviar mensagem", bot_id=bot_id, chat_id=chat_id, error=str(e))
            return False
            
    async def test_bot(self, token: str, chat_id: str) -> bool:
        """Testa se um bot e chat ID funcionam"""
        try:
            bot = Bot(token=token)
            await bot.send_message(chat_id=chat_id, text="🤖 Teste de conexão do RPA Monitor - Funcionando!")
            return True
        except Exception as e:
            logger.error("Erro no teste do bot", error=str(e))
            return False

    def format_robot_notification(self, robot_name: str, event: str, details: Dict[str, Any]) -> str:
        """Formata uma notificação para o robô"""
        event_icons = {
            "inicio": "🚀",
            "conclusao": "✅", 
            "falha": "❌",
            "pausa": "⏸️",
            "continuacao": "▶️",
            "parada": "⏹️"
        }
        
        icon = event_icons.get(event, "🤖")
        
        if event == "inicio":
            return f"{icon} <b>Execução Iniciada</b>\n\nRobô: {robot_name}\nID: {details.get('execution_id', 'N/A')}\nIniciado em: {details.get('started_at', 'N/A')}"
            
        elif event == "conclusao":
            duration = details.get('duration', 0)
            items = details.get('items_processed', 0)
            return f"{icon} <b>Execução Concluída</b>\n\nRobô: {robot_name}\nDuração: {duration:.1f}s\nItens processados: {items}"
            
        elif event == "falha":
            error = details.get('error', 'Erro desconhecido')
            return f"{icon} <b>Execução Falhou</b>\n\nRobô: {robot_name}\nErro: {error}"
            
        elif event == "pausa":
            return f"{icon} <b>Execução Pausada</b>\n\nRobô: {robot_name}\nPausado pelo usuário"
            
        elif event == "continuacao":
            return f"{icon} <b>Execução Retomada</b>\n\nRobô: {robot_name}\nContinuando execução..."
            
        elif event == "parada":
            return f"{icon} <b>Execução Parada</b>\n\nRobô: {robot_name}\nParado pelo usuário"
            
        return f"{icon} Evento: {event}\nRobô: {robot_name}"

# Instância global
telegram_service = TelegramService()
