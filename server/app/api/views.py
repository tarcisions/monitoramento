from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from core.models import Robo, Job, ExecucaoRobo
from .serializers import RoboSerializer, JobSerializer, ExecucaoRoboSerializer

class RoboViewSet(viewsets.ModelViewSet):
    queryset = Robo.objects.all()
    serializer_class = RoboSerializer
    permission_classes = [IsAuthenticated]

class JobViewSet(viewsets.ModelViewSet):
    queryset = Job.objects.all()
    serializer_class = JobSerializer
    permission_classes = [IsAuthenticated]

class ExecucaoRoboViewSet(viewsets.ModelViewSet):
    queryset = ExecucaoRobo.objects.all()
    serializer_class = ExecucaoRoboSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=['post'])
    def iniciar(self, request, pk=None):
        execucao = self.get_object()
        if execucao.status == 'queued':
            execucao.status = 'running'
            execucao.iniciado_em = timezone.now()
            execucao.save()
            return Response({'status': 'Execução iniciada'})
        return Response({'erro': 'Execução não pode ser iniciada'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def pausar(self, request, pk=None):
        execucao = self.get_object()
        if execucao.status == 'running':
            execucao.status = 'paused'
            execucao.save()
            return Response({'status': 'Execução pausada'})
        return Response({'erro': 'Execução não pode ser pausada'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def parar(self, request, pk=None):
        execucao = self.get_object()
        if execucao.status in ['running', 'paused']:
            execucao.status = 'stopped'
            execucao.finalizado_em = timezone.now()
            execucao.save()
            return Response({'status': 'Execução parada'})
        return Response({'erro': 'Execução não pode ser parada'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def retomar(self, request, pk=None):
        execucao = self.get_object()
        if execucao.status == 'paused':
            execucao.status = 'running'
            execucao.save()
            return Response({'status': 'Execução retomada'})
        return Response({'erro': 'Execução não pode ser retomada'}, status=status.HTTP_400_BAD_REQUEST)

