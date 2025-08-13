from django.core.management.base import BaseCommand
from monitoring.telegram_bot import telegram_notifier


class Command(BaseCommand):
    help = 'Testa a integração com Telegram Bot'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--message',
            type=str,
            default='🤖 Teste de integração do Sistema de Monitoramento de Robôs',
            help='Mensagem de teste a ser enviada'
        )
    
    def handle(self, *args, **options):
        message = options['message']
        
        if not telegram_notifier.is_configured():
            self.stdout.write(
                self.style.WARNING(
                    'Telegram bot não configurado. '
                    'Configure TELEGRAM_BOT_TOKEN e TELEGRAM_CHAT_ID nas variáveis de ambiente.'
                )
            )
            return
        
        self.stdout.write('Enviando mensagem de teste via Telegram...')
        
        success = telegram_notifier.send_message_sync(message)
        
        if success:
            self.stdout.write(
                self.style.SUCCESS(
                    'Mensagem enviada com sucesso via Telegram!'
                )
            )
        else:
            self.stdout.write(
                self.style.ERROR(
                    'Falha ao enviar mensagem via Telegram. Verifique os logs.'
                )
            )

