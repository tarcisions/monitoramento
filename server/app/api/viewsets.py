from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.db.models import Q, Count, Avg
from datetime import timedelta
import logging

from core.models import Robo, Job, ExecucaoRobo, LogExecucao, StatusRobo
from core.serializers import (
    RoboSerializer, RoboDetalhadoSerializer, JobSerializer, 
    ExecucaoRoboSerializer, LogExecucaoSerializer, StatusRoboSerializer
)
from core.permissions import IsAdminOrReadOnly, IsOperadorOrAdmin, CanControlExecution, TokenAgentAuthentication
from .tasks import executar_job_task, pausar_execucao_task, parar_execucao_task, retomar_execucao_task

logger = logging.getLogger(__name__)

class RoboViewSet(viewsets.ModelViewSet):
    queryset = Robo.objects.all()
    serializer_class = RoboSerializer
    permission_classes = [IsAuthenticated, IsAdminOrReadOnly]
    search_fields = ['nome', 'host']
    ordering_fields = ['nome', 'host', 'criado_em', 'ultimo_ping']
    ordering = ['nome']
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return RoboDetalhadoSerializer
        return RoboSerializer
    
    @action(detail=True, methods=['post'])
    def ping(self, request, pk=None):
        robo = self.get_object()
        robo.ultimo_ping = timezone.now()
        robo.save()
        
        logger.info(f"Ping recebido do robô {robo.nome}")
        
        return Response({
            'status': 'sucesso',
            'mensagem': f'Ping registrado para {robo.nome}',
            'timestamp': robo.ultimo_ping
        })
    
    @action(detail=False, methods=['get'])
    def estatisticas(self, request):
        total_robos = Robo.objects.count()
        robos_ativos = Robo.objects.filter(ativo=True).count()
        robos_conectados = Robo.objects.filter(
            ultimo_ping__gte=timezone.now() - timedelta(minutes=5)
        ).count()
        
        return Response({
            'total_robos': total_robos,
            'robos_ativos': robos_ativos,
            'robos_conectados': robos_conectados,
            'robos_desconectados': robos_ativos - robos_conectados
        })

class JobViewSet(viewsets.ModelViewSet):
    queryset = Job.objects.all()
    serializer_class = JobSerializer
    permission_classes = [IsAuthenticated, IsAdminOrReadOnly]
    search_fields = ['nome', 'comando']
    ordering_fields = ['nome', 'criado_em', 'timeout_s']
    ordering = ['nome']
    
    def perform_create(self, serializer):
        serializer.save(criado_por=self.request.user)
    
    @action(detail=False, methods=['get'])
    def estatisticas(self, request):
        total_jobs = Job.objects.count()
        jobs_ativos = Job.objects.filter(ativo=True).count()
        
        execucoes_por_job = ExecucaoRobo.objects.values('job__nome').annotate(
            total=Count('id'),
            sucessos=Count('id', filter=Q(status='success')),
            falhas=Count('id', filter=Q(status='failed'))
        ).order_by('-total')[:10]
        
        return Response({
            'total_jobs': total_jobs,
            'jobs_ativos': jobs_ativos,
            'execucoes_por_job': list(execucoes_por_job)
        })

class ExecucaoRoboViewSet(viewsets.ModelViewSet):
    queryset = ExecucaoRobo.objects.select_related('robo', 'job', 'criado_por').all()
    serializer_class = ExecucaoRoboSerializer
    permission_classes = [IsAuthenticated, CanControlExecution]
    search_fields = ['robo__nome', 'job__nome', 'mensagem']
    ordering_fields = ['iniciado_em', 'finalizado_em', 'status']
    ordering = ['-iniciado_em']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        robo_filter = self.request.query_params.get('robo')
        if robo_filter:
            queryset = queryset.filter(robo_id=robo_filter)
        
        job_filter = self.request.query_params.get('job')
        if job_filter:
            queryset = queryset.filter(job_id=job_filter)
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(criado_por=self.request.user)
    
    @action(detail=True, methods=['post'])
    def iniciar(self, request, pk=None):
        execucao = self.get_object()
        
        if not execucao.pode_iniciar():
            return Response(
                {'erro': 'Esta execução não pode ser iniciada no estado atual'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        task = executar_job_task.delay(execucao.id)
        execucao.task_id = task.id
        execucao.status = 'queued'
        execucao.save()
        
        logger.info(f"Execução {execucao.id} iniciada pelo usuário {request.user.username}")
        
        return Response({
            'status': 'sucesso',
            'mensagem': 'Execução iniciada com sucesso',
            'task_id': task.id
        })
    
    @action(detail=True, methods=['post'])
    def pausar(self, request, pk=None):
        execucao = self.get_object()
        
        if not execucao.pode_pausar():
            return Response(
                {'erro': 'Esta execução não pode ser pausada no estado atual'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        pausar_execucao_task.delay(execucao.id)
        
        logger.info(f"Execução {execucao.id} pausada pelo usuário {request.user.username}")
        
        return Response({
            'status': 'sucesso',
            'mensagem': 'Comando de pausa enviado'
        })
    
    @action(detail=True, methods=['post'])
    def parar(self, request, pk=None):
        execucao = self.get_object()
        
        if not execucao.pode_parar():
            return Response(
                {'erro': 'Esta execução não pode ser parada no estado atual'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        parar_execucao_task.delay(execucao.id)
        
        logger.info(f"Execução {execucao.id} parada pelo usuário {request.user.username}")
        
        return Response({
            'status': 'sucesso',
            'mensagem': 'Comando de parada enviado'
        })
    
    @action(detail=True, methods=['post'])
    def retomar(self, request, pk=None):
        execucao = self.get_object()
        
        if not execucao.pode_retomar():
            return Response(
                {'erro': 'Esta execução não pode ser retomada no estado atual'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        retomar_execucao_task.delay(execucao.id)
        
        logger.info(f"Execução {execucao.id} retomada pelo usuário {request.user.username}")
        
        return Response({
            'status': 'sucesso',
            'mensagem': 'Comando de retomada enviado'
        })
    
    @action(detail=True, methods=['get'])
    def logs(self, request, pk=None):
        execucao = self.get_object()
        logs = execucao.logs.all()
        
        nivel_filter = request.query_params.get('nivel')
        if nivel_filter:
            logs = logs.filter(nivel=nivel_filter)
        
        serializer = LogExecucaoSerializer(logs, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def estatisticas(self, request):
        agora = timezone.now()
        inicio_dia = agora.replace(hour=0, minute=0, second=0, microsecond=0)
        
        execucoes_hoje = ExecucaoRobo.objects.filter(iniciado_em__gte=inicio_dia)
        
        estatisticas = {
            'total_execucoes_hoje': execucoes_hoje.count(),
            'execucoes_por_status': {},
            'tempo_medio_execucao': 0,
            'taxa_sucesso': 0
        }
        
        for status_choice in ExecucaoRobo.STATUS_CHOICES:
            status_key = status_choice[0]
            count = execucoes_hoje.filter(status=status_key).count()
            estatisticas['execucoes_por_status'][status_key] = count
        
        execucoes_finalizadas = execucoes_hoje.filter(
            status__in=['success', 'failed'], 
            finalizado_em__isnull=False
        )
        
        if execucoes_finalizadas.exists():
            tempo_medio = execucoes_finalizadas.aggregate(
                tempo_medio=Avg('duracao_segundos')
            )['tempo_medio']
            estatisticas['tempo_medio_execucao'] = round(tempo_medio or 0, 2)
            
            total_finalizadas = execucoes_finalizadas.count()
            sucessos = execucoes_finalizadas.filter(status='success').count()
            estatisticas['taxa_sucesso'] = round((sucessos / total_finalizadas) * 100, 2)
        
        return Response(estatisticas)

class LogExecucaoViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = LogExecucao.objects.select_related('execucao__robo', 'execucao__job').all()
    serializer_class = LogExecucaoSerializer
    permission_classes = [IsAuthenticated]
    search_fields = ['mensagem', 'execucao__robo__nome', 'execucao__job__nome']
    ordering_fields = ['timestamp', 'nivel']
    ordering = ['-timestamp']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        nivel_filter = self.request.query_params.get('nivel')
        if nivel_filter:
            queryset = queryset.filter(nivel=nivel_filter)
        
        execucao_filter = self.request.query_params.get('execucao')
        if execucao_filter:
            queryset = queryset.filter(execucao_id=execucao_filter)
        
        robo_filter = self.request.query_params.get('robo')
        if robo_filter:
            queryset = queryset.filter(execucao__robo_id=robo_filter)
        
        return queryset

class StatusRoboViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = StatusRobo.objects.select_related('robo', 'execucao_atual').all()
    serializer_class = StatusRoboSerializer
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['post'], permission_classes=[TokenAgentAuthentication])
    def atualizar_status(self, request):
        robo = request.robo_agente
        
        dados = request.data
        estado_atual = dados.get('estado_atual', 'idle')
        cpu_percent = dados.get('cpu_percent', 0.0)
        memoria_percent = dados.get('memoria_percent', 0.0)
        execucao_id = dados.get('execucao_id')
        
        status_robo, created = StatusRobo.objects.get_or_create(robo=robo)
        status_robo.estado_atual = estado_atual
        status_robo.cpu_percent = cpu_percent
        status_robo.memoria_percent = memoria_percent
        
        if execucao_id:
            try:
                execucao = ExecucaoRobo.objects.get(id=execucao_id)
                status_robo.execucao_atual = execucao
            except ExecucaoRobo.DoesNotExist:
                pass
        else:
            status_robo.execucao_atual = None
        
        status_robo.save()
        
        robo.ultimo_ping = timezone.now()
        robo.save()
        
        logger.info(f"Status atualizado para robô {robo.nome}: {estado_atual}")
        
        return Response({
            'status': 'sucesso',
            'mensagem': 'Status atualizado com sucesso'
        })
