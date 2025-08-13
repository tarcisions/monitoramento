from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from .models import Robot, Execution, Log
from .telegram_bot import (
    notify_robot_error_sync,
    notify_execution_completed_sync,
    notify_execution_failed_sync,
    notify_critical_log_sync
)
import logging

logger = logging.getLogger(__name__)


@receiver(post_save, sender=Robot)
def robot_status_changed(sender, instance, created, **kwargs):
    """Signal para mudanças de status do robô"""
    if not created and instance.status == 'ERROR':
        # Notificar quando robô entra em estado de erro
        try:
            notify_robot_error_sync(
                robot_name=instance.name,
                error_message=f"Robô {instance.name} entrou em estado de erro"
            )
        except Exception as e:
            logger.error(f"Erro ao enviar notificação de erro do robô: {e}")


@receiver(post_save, sender=Execution)
def execution_status_changed(sender, instance, created, **kwargs):
    """Signal para mudanças de status de execução"""
    if not created:  # Apenas para atualizações, não criações
        if instance.status == 'COMPLETED':
            # Notificar conclusão de execução
            try:
                duration_str = None
                if instance.duration:
                    total_seconds = int(instance.duration.total_seconds())
                    hours, remainder = divmod(total_seconds, 3600)
                    minutes, seconds = divmod(remainder, 60)
                    
                    if hours > 0:
                        duration_str = f"{hours}h {minutes}m {seconds}s"
                    elif minutes > 0:
                        duration_str = f"{minutes}m {seconds}s"
                    else:
                        duration_str = f"{seconds}s"
                
                notify_execution_completed_sync(
                    robot_name=instance.robot.name,
                    task_name=instance.task_name,
                    duration=duration_str
                )
            except Exception as e:
                logger.error(f"Erro ao enviar notificação de conclusão: {e}")
        
        elif instance.status == 'FAILED':
            # Notificar falha na execução
            try:
                notify_execution_failed_sync(
                    robot_name=instance.robot.name,
                    task_name=instance.task_name,
                    error_message=instance.error_message or "Erro não especificado"
                )
            except Exception as e:
                logger.error(f"Erro ao enviar notificação de falha: {e}")


@receiver(post_save, sender=Log)
def log_created(sender, instance, created, **kwargs):
    """Signal para novos logs"""
    if created and instance.level == 'CRITICAL':
        # Notificar logs críticos
        try:
            notify_critical_log_sync(
                robot_name=instance.robot.name,
                log_message=instance.message
            )
        except Exception as e:
            logger.error(f"Erro ao enviar notificação de log crítico: {e}")


# Signal personalizado para detectar robôs offline
@receiver(pre_save, sender=Robot)
def check_robot_offline(sender, instance, **kwargs):
    """Verificar se robô ficou offline"""
    if instance.pk:  # Apenas para atualizações
        try:
            old_instance = Robot.objects.get(pk=instance.pk)
            
            # Se o robô estava ativo e agora está inativo
            if old_instance.is_active and not instance.is_active:
                from .telegram_bot import telegram_notifier
                try:
                    telegram_notifier.send_message_sync(
                        f"📴 Robô {instance.name} ficou offline.\n"
                        f"Última atividade: {old_instance.last_seen.strftime('%d/%m/%Y %H:%M:%S')}"
                    )
                except Exception as e:
                    logger.error(f"Erro ao enviar notificação de robô offline: {e}")
        except Robot.DoesNotExist:
            pass

