from venv import logger
from rest_framework import generics, status, viewsets
from rest_framework.decorators import api_view, action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import render
from django.db.models import Count, Avg, Q
from django.utils import timezone
from datetime import timedelta
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import json
from typing import Dict, Any

from .models import Robot, Log, RobotStatus, Execution, Command
from .serializers import (
    RobotSerializer, LogSerializer, RobotStatusSerializer,
    ExecutionSerializer, CommandSerializer, RobotCreateLogSerializer,
    RobotCreateStatusSerializer, RobotControlSerializer
)


class RobotViewSet(viewsets.ModelViewSet):
    """ViewSet para gerenciar robôs"""
    
    queryset = Robot.objects.all()
    serializer_class = RobotSerializer
    
    @action(detail=True, methods=['get'])
    def logs(self, request, pk=None):
        """Obter logs de um robô específico"""
        robot = self.get_object()
        logs = Log.objects.filter(robot=robot)
        
        # Filtros opcionais
        level = request.query_params.get('level')
        if level:
            logs = logs.filter(level=level)
        
        limit = request.query_params.get('limit', 100)
        logs = logs[:int(limit)]
        
        serializer = LogSerializer(logs, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def status_history(self, request, pk=None):
        """Obter histórico de status de um robô"""
        robot = self.get_object()
        status_history = RobotStatus.objects.filter(robot=robot)[:50]
        serializer = RobotStatusSerializer(status_history, many=True)
        return Response(serializer.data)


class LogCreateAPIView(APIView):
    """API para criação de logs pelos robôs"""
    
    def post(self, request):
        serializer = RobotCreateLogSerializer(data=request.data)
        if serializer.is_valid():
            log = serializer.save()
            
            # Enviar log via WebSocket
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                'monitoring',
                {
                    'type': 'send_log',
                    'log': LogSerializer(log).data
                }
            )
            
            return Response(LogSerializer(log).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class StatusCreateAPIView(APIView):
    """API para criação de status pelos robôs"""
    
    def post(self, request):
        serializer = RobotCreateStatusSerializer(data=request.data)
        if serializer.is_valid():
            robot_status = serializer.save()
            
            # Enviar status via WebSocket
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                'monitoring',
                {
                    'type': 'send_status',
                    'status': RobotStatusSerializer(robot_status).data
                }
            )
            
            return Response(RobotStatusSerializer(robot_status).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ControlAPIView(APIView):
    """API para controle de robôs"""
    
    def post(self, request):
        serializer = RobotControlSerializer(data=request.data)
        if serializer.is_valid():
            command = serializer.save()
            
            # Enviar comando via WebSocket
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                f'robot_{command.robot.name}',
                {
                    'type': 'send_command',
                    'command': CommandSerializer(command).data
                }
            )
            
            return Response(CommandSerializer(command).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LogListAPIView(generics.ListAPIView):
    """API para listar logs com filtros"""
    
    serializer_class = LogSerializer
    
    def get_queryset(self):
        queryset = Log.objects.all()
        
        # Filtros
        robot_name = self.request.query_params.get('robot')
        if robot_name:
            queryset = queryset.filter(robot__name=robot_name)
        
        level = self.request.query_params.get('level')
        if level:
            queryset = queryset.filter(level=level)
        
        # Filtro por data
        hours = self.request.query_params.get('hours')
        if hours:
            since = timezone.now() - timedelta(hours=int(hours))
            queryset = queryset.filter(timestamp__gte=since)
        
        return queryset[:200]  # Limitar a 200 registros


class ExecutionViewSet(viewsets.ModelViewSet):
    """ViewSet para gerenciar execuções"""
    
    queryset = Execution.objects.all()
    serializer_class = ExecutionSerializer
    
    def perform_create(self, serializer):
        execution = serializer.save()
        
        # Enviar notificação via WebSocket
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            'monitoring',
            {
                'type': 'send_execution',
                'execution': ExecutionSerializer(execution).data
            }
        )


class CommandViewSet(viewsets.ModelViewSet):
    """ViewSet para gerenciar comandos"""
    
    queryset = Command.objects.all()
    serializer_class = CommandSerializer
    
    @action(detail=False, methods=['get'])
    def pending(self, request):
        """Obter comandos pendentes para um robô"""
        robot_name = request.query_params.get('robot')
        if not robot_name:
            return Response({'error': 'Parâmetro robot é obrigatório'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        commands = Command.objects.filter(
            robot__name=robot_name,
            status='PENDING'
        )
        serializer = CommandSerializer(commands, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def acknowledge(self, request, pk=None):
        """Marcar comando como confirmado"""
        command = self.get_object()
        command.status = 'ACKNOWLEDGED'
        command.save()
        return Response(CommandSerializer(command).data)
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Marcar comando como executado"""
        command = self.get_object()
        command.status = 'EXECUTED'
        command.executed_at = timezone.now()
        command.response = request.data.get('response', '')
        command.save()
        return Response(CommandSerializer(command).data)


class DashboardAPIView(APIView):
    """API para dados do dashboard"""
    
    def get(self, request):
        # Estatísticas gerais
        total_robots = Robot.objects.count()
        active_robots = Robot.objects.filter(is_active=True).count()
        
        # Status dos robôs
        robot_status = Robot.objects.values('status').annotate(count=Count('id'))
        
        # Execuções nas últimas 24 horas
        last_24h = timezone.now() - timedelta(hours=24)
        executions_24h = Execution.objects.filter(started_at__gte=last_24h)
        
        executions_stats = {
            'total': executions_24h.count(),
            'completed': executions_24h.filter(status='COMPLETED').count(),
            'failed': executions_24h.filter(status='FAILED').count(),
            'running': executions_24h.filter(status='RUNNING').count(),
        }
        
        # Tempo médio de execução
        avg_duration = executions_24h.filter(
            status='COMPLETED',
            duration__isnull=False
        ).aggregate(avg_duration=Avg('duration'))
        
        # Logs por nível nas últimas 24 horas
        logs_24h = Log.objects.filter(timestamp__gte=last_24h)
        logs_by_level = logs_24h.values('level').annotate(count=Count('id'))
        
        # Robôs mais ativos
        most_active_robots = Robot.objects.annotate(
            log_count=Count('log', filter=Q(log__timestamp__gte=last_24h))
        ).order_by('-log_count')[:5]
        
        return Response({
            'robots': {
                'total': total_robots,
                'active': active_robots,
                'status_distribution': list(robot_status)
            },
            'executions': executions_stats,
            'avg_execution_time': avg_duration['avg_duration'],
            'logs_by_level': list(logs_by_level),
            'most_active_robots': RobotSerializer(most_active_robots, many=True).data
        })


def dashboard_view(request):
    """View para renderizar o dashboard"""
    return render(request, 'monitoring/dashboard.html')


@api_view(['GET'])
def health_check(request):
    """Endpoint de health check"""
    return Response({
        'status': 'healthy',
        'timestamp': timezone.now(),
        'version': '1.0.0'
    })


async def handle_command(self, command: Dict[str, Any]):
    command_type = command.get('command_type')
    command_id = command.get('id')

    logger.info(f"Recebido comando: {command_type} (ID: {command_id})")
    self.send_log("INFO", f"Executando comando: {command_type}")

    try:
        # Verificação de estado antes de executar
        if command_type == 'START' and self.status == "RUNNING":
            await self.send_command_response(command_id, 'FAILED', "Robô já está executando")
            return
        if command_type == 'STOP' and self.status == "STOPPED":
            await self.send_command_response(command_id, 'FAILED', "Robô já está parado")
            return
        if command_type == 'PAUSE' and self.status != "RUNNING":
            await self.send_command_response(command_id, 'FAILED', "Robô não está executando")
            return
        if command_type == 'RESUME' and self.status != "IDLE":
            await self.send_command_response(command_id, 'FAILED', "Robô não está pausado")
            return

        # Execução normal
        if command_type == 'START':
            await self.execute_start_command()
        elif command_type == 'STOP':
            await self.execute_stop_command()
        elif command_type == 'RESTART':
            await self.execute_restart_command()
        elif command_type == 'PAUSE':
            await self.execute_pause_command()
        elif command_type == 'RESUME':
            await self.execute_resume_command()
        else:
            logger.warning(f"Comando desconhecido: {command_type}")
            await self.send_command_response(command_id, 'FAILED', f"Comando desconhecido: {command_type}")
            return

        await self.send_command_response(command_id, 'EXECUTED', f"Comando {command_type} executado com sucesso")

    except Exception as e:
        logger.error(f"Erro ao executar comando {command_type}: {e}")
        await self.send_command_response(command_id, 'FAILED', str(e))
