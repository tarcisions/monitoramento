import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone


class MonitoringConsumer(AsyncWebsocketConsumer):
    """Consumer para monitoramento geral do sistema"""

    async def connect(self):
        # Adicionar à sala de monitoramento geral
        await self.channel_layer.group_add(
            'monitoring',
            self.channel_name
        )
        await self.accept()

        # Enviar dados iniciais
        await self.send_initial_data()

    async def disconnect(self, close_code):
        # Remover da sala de monitoramento
        await self.channel_layer.group_discard(
            'monitoring',
            self.channel_name
        )

    async def receive(self, text_data):
        """Receber mensagens do cliente"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')

            if message_type == 'get_robots':
                await self.send_robots_data()
            elif message_type == 'get_logs':
                await self.send_logs_data(data.get('filters', {}))
            elif message_type == 'ping':
                await self.send(text_data=json.dumps({
                    'type': 'pong',
                    'timestamp': timezone.now().isoformat()
                }))
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Formato JSON inválido'
            }))

    async def send_initial_data(self):
        """Enviar dados iniciais ao conectar"""
        await self.send_robots_data()

    @database_sync_to_async
    def get_robots_data(self):
        """Obter dados dos robôs"""
        from .models import Robot
        from .serializers import RobotSerializer
        robots = Robot.objects.all()
        return RobotSerializer(robots, many=True).data

    @database_sync_to_async
    def get_logs_data(self, filters):
        """Obter dados dos logs com filtros"""
        from .models import Log
        from .serializers import LogSerializer

        queryset = Log.objects.all()

        if filters.get('robot'):
            queryset = queryset.filter(robot__name=filters['robot'])
        if filters.get('level'):
            queryset = queryset.filter(level=filters['level'])

        logs = queryset[:50]  # Limitar a 50 logs
        return LogSerializer(logs, many=True).data

    async def send_robots_data(self):
        """Enviar dados dos robôs"""
        robots_data = await self.get_robots_data()
        await self.send(text_data=json.dumps({
            'type': 'robots_update',
            'data': robots_data
        }))

    async def send_logs_data(self, filters):
        """Enviar dados dos logs"""
        logs_data = await self.get_logs_data(filters)
        await self.send(text_data=json.dumps({
            'type': 'logs_update',
            'data': logs_data
        }))

    # Handlers para mensagens do grupo
    async def send_log(self, event):
        """Enviar novo log para o cliente"""
        await self.send(text_data=json.dumps({
            'type': 'new_log',
            'data': event['log']
        }))

    async def send_status(self, event):
        """Enviar novo status para o cliente"""
        await self.send(text_data=json.dumps({
            'type': 'status_update',
            'data': event['status']
        }))

    async def send_execution(self, event):
        """Enviar nova execução para o cliente"""
        await self.send(text_data=json.dumps({
            'type': 'execution_update',
            'data': event['execution']
        }))


class RobotConsumer(AsyncWebsocketConsumer):
    """Consumer específico para comunicação com robôs"""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.robot_name = None
        self.robot_group_name = None

    async def connect(self):
        # Obter nome do robô da URL
        self.robot_name = self.scope['url_route']['kwargs']['robot_name']
        self.robot_group_name = f'robot_{self.robot_name}'

        # Adicionar à sala específica do robô
        await self.channel_layer.group_add(
            self.robot_group_name,
            self.channel_name
        )
        await self.accept()

        # Atualizar último acesso do robô
        await self.update_robot_last_seen()

        # Enviar comandos pendentes
        await self.send_pending_commands()

    async def disconnect(self, close_code):
        # Remover da sala do robô
        await self.channel_layer.group_discard(
            self.robot_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        """Receber mensagens do robô"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')

            if message_type == 'heartbeat':
                await self.handle_heartbeat(data)
            elif message_type == 'command_response':
                await self.handle_command_response(data)
            elif message_type == 'status_update':
                await self.handle_status_update(data)
            elif message_type == 'log':
                await self.handle_log(data)

        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Formato JSON inválido'
            }))

    @database_sync_to_async
    def update_robot_last_seen(self):
        """Atualizar último acesso do robô"""
        from .models import Robot
        robot, created = Robot.objects.get_or_create(
            name=self.robot_name,
            defaults={'description': f'Robô {self.robot_name}'}
        )
        robot.save()  # Atualiza last_seen automaticamente
        return robot

    @database_sync_to_async
    def get_pending_commands(self):
        """Obter comandos pendentes para o robô"""
        from .models import Command
        from .serializers import CommandSerializer
        commands = Command.objects.filter(
            robot__name=self.robot_name,
            status='PENDING'
        )
        return CommandSerializer(commands, many=True).data

    @database_sync_to_async
    def update_command_status(self, command_id, status, response=None):
        """Atualizar status de um comando"""
        from .models import Command
        try:
            command = Command.objects.get(id=command_id)
            command.status = status
            if response:
                command.response = response
            if status == 'EXECUTED':
                command.executed_at = timezone.now()
            command.save()
            return True
        except Command.DoesNotExist:
            return False

    async def send_pending_commands(self):
        """Enviar comandos pendentes para o robô"""
        commands = await self.get_pending_commands()
        if commands:
            await self.send(text_data=json.dumps({
                'type': 'pending_commands',
                'data': commands
            }))

    async def handle_heartbeat(self, data):
        """Processar heartbeat do robô"""
        await self.update_robot_last_seen()
        await self.send(text_data=json.dumps({
            'type': 'heartbeat_ack',
            'timestamp': timezone.now().isoformat()
        }))

    async def handle_command_response(self, data):
        """Processar resposta de comando do robô"""
        command_id = data.get('command_id')
        status = data.get('status', 'EXECUTED')
        response = data.get('response', '')

        success = await self.update_command_status(command_id, status, response)

        await self.send(text_data=json.dumps({
            'type': 'command_ack',
            'command_id': command_id,
            'success': success
        }))

    async def handle_status_update(self, data):
        """Processar atualização de status do robô"""
        # Reenviar para o grupo de monitoramento
        await self.channel_layer.group_send(
            'monitoring',
            {
                'type': 'send_status',
                'status': data
            }
        )

    async def handle_log(self, data):
        """Processar log do robô"""
        # Reenviar para o grupo de monitoramento
        await self.channel_layer.group_send(
            'monitoring',
            {
                'type': 'send_log',
                'log': data
            }
        )

    # Handler para comandos enviados pelo sistema
    async def send_command(self, event):
        """Enviar comando para o robô"""
        await self.send(text_data=json.dumps({
            'type': 'command',
            'data': event['command']
        }))
