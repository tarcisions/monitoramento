import asyncio
import logging
from django.conf import settings
from telegram import Bot
from telegram.error import TelegramError
from asgiref.sync import sync_to_async
from .models import Robot, Execution, Log

logger = logging.getLogger(__name__)


class TelegramNotifier:
    """Classe para envio de notificações via Telegram"""
    
    def __init__(self):
        self.bot_token = settings.TELEGRAM_BOT_TOKEN
        self.chat_id = settings.TELEGRAM_CHAT_ID
        self.bot = None
        
        if self.bot_token and self.chat_id:
            self.bot = Bot(token=self.bot_token)
    
    def is_configured(self):
        """Verificar se o bot está configurado"""
        return self.bot is not None and self.bot_token and self.chat_id
    
    async def send_message(self, message, parse_mode='HTML'):
        """Enviar mensagem via Telegram"""
        if not self.is_configured():
            logger.warning("Telegram bot não configurado. Mensagem não enviada.")
            return False
        
        try:
            await self.bot.send_message(
                chat_id=self.chat_id,
                text=message,
                parse_mode=parse_mode
            )
            logger.info(f"Mensagem enviada via Telegram: {message[:50]}...")
            return True
        except TelegramError as e:
            logger.error(f"Erro ao enviar mensagem via Telegram: {e}")
            return False
        except Exception as e:
            logger.error(f"Erro inesperado ao enviar mensagem via Telegram: {e}")
            return False
    
    def send_message_sync(self, message, parse_mode='HTML'):
        """Versão síncrona para envio de mensagem"""
        if not self.is_configured():
            logger.warning("Telegram bot não configurado. Mensagem não enviada.")
            return False
        
        try:
            # Executar em loop de eventos assíncrono
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            result = loop.run_until_complete(self.send_message(message, parse_mode))
            loop.close()
            return result
        except Exception as e:
            logger.error(f"Erro ao executar envio síncrono: {e}")
            return False
    
    async def notify_robot_error(self, robot_name, error_message):
        """Notificar erro de robô"""
        message = f"""
🚨 <b>ERRO DE ROBÔ</b>

<b>Robô:</b> {robot_name}
<b>Status:</b> ERRO
<b>Mensagem:</b> {error_message}
<b>Timestamp:</b> {self._get_current_time()}

⚠️ Ação necessária para resolver o problema.
        """.strip()
        
        await self.send_message(message)
    
    async def notify_execution_completed(self, robot_name, task_name, duration=None):
        """Notificar conclusão de execução"""
        duration_text = f" em {duration}" if duration else ""
        
        message = f"""
✅ <b>EXECUÇÃO CONCLUÍDA</b>

<b>Robô:</b> {robot_name}
<b>Tarefa:</b> {task_name}
<b>Status:</b> CONCLUÍDA{duration_text}
<b>Timestamp:</b> {self._get_current_time()}

✨ Execução finalizada com sucesso!
        """.strip()
        
        await self.send_message(message)
    
    async def notify_execution_failed(self, robot_name, task_name, error_message):
        """Notificar falha na execução"""
        message = f"""
❌ <b>EXECUÇÃO FALHOU</b>

<b>Robô:</b> {robot_name}
<b>Tarefa:</b> {task_name}
<b>Status:</b> FALHOU
<b>Erro:</b> {error_message}
<b>Timestamp:</b> {self._get_current_time()}

🔧 Verificar logs para mais detalhes.
        """.strip()
        
        await self.send_message(message)
    
    async def notify_robot_offline(self, robot_name, last_seen):
        """Notificar robô offline"""
        message = f"""
📴 <b>ROBÔ OFFLINE</b>

<b>Robô:</b> {robot_name}
<b>Status:</b> OFFLINE
<b>Última atividade:</b> {last_seen}
<b>Timestamp:</b> {self._get_current_time()}

🔍 Verificar conectividade do robô.
        """.strip()
        
        await self.send_message(message)
    
    async def notify_critical_log(self, robot_name, log_message):
        """Notificar log crítico"""
        message = f"""
🔥 <b>LOG CRÍTICO</b>

<b>Robô:</b> {robot_name}
<b>Nível:</b> CRÍTICO
<b>Mensagem:</b> {log_message}
<b>Timestamp:</b> {self._get_current_time()}

⚠️ Atenção imediata necessária!
        """.strip()
        
        await self.send_message(message)
    
    async def notify_system_status(self, total_robots, active_robots, errors_count):
        """Notificar status geral do sistema"""
        message = f"""
📊 <b>STATUS DO SISTEMA</b>

<b>Total de robôs:</b> {total_robots}
<b>Robôs ativos:</b> {active_robots}
<b>Robôs com erro:</b> {errors_count}
<b>Timestamp:</b> {self._get_current_time()}

📈 Relatório de status do sistema de monitoramento.
        """.strip()
        
        await self.send_message(message)
    
    def _get_current_time(self):
        """Obter timestamp atual formatado"""
        from django.utils import timezone
        return timezone.now().strftime('%d/%m/%Y %H:%M:%S')


# Instância global do notificador
telegram_notifier = TelegramNotifier()


# Funções de conveniência para uso em signals e views
def notify_robot_error_sync(robot_name, error_message):
    """Notificar erro de robô (versão síncrona)"""
    message = f"""
🚨 ERRO DE ROBÔ

Robô: {robot_name}
Status: ERRO
Mensagem: {error_message}
Timestamp: {telegram_notifier._get_current_time()}

⚠️ Ação necessária para resolver o problema.
    """.strip()
    
    return telegram_notifier.send_message_sync(message)


def notify_execution_completed_sync(robot_name, task_name, duration=None):
    """Notificar conclusão de execução (versão síncrona)"""
    duration_text = f" em {duration}" if duration else ""
    
    message = f"""
✅ EXECUÇÃO CONCLUÍDA

Robô: {robot_name}
Tarefa: {task_name}
Status: CONCLUÍDA{duration_text}
Timestamp: {telegram_notifier._get_current_time()}

✨ Execução finalizada com sucesso!
    """.strip()
    
    return telegram_notifier.send_message_sync(message)


def notify_execution_failed_sync(robot_name, task_name, error_message):
    """Notificar falha na execução (versão síncrona)"""
    message = f"""
❌ EXECUÇÃO FALHOU

Robô: {robot_name}
Tarefa: {task_name}
Status: FALHOU
Erro: {error_message}
Timestamp: {telegram_notifier._get_current_time()}

🔧 Verificar logs para mais detalhes.
    """.strip()
    
    return telegram_notifier.send_message_sync(message)


def notify_critical_log_sync(robot_name, log_message):
    """Notificar log crítico (versão síncrona)"""
    message = f"""
🔥 LOG CRÍTICO

Robô: {robot_name}
Nível: CRÍTICO
Mensagem: {log_message}
Timestamp: {telegram_notifier._get_current_time()}

⚠️ Atenção imediata necessária!
    """.strip()
    
    return telegram_notifier.send_message_sync(message)

