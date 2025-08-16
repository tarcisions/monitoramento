from django.db import models
from django.contrib.auth.models import User
import json

class Robo(models.Model):
    nome = models.CharField(max_length=200, unique=True)
    host = models.CharField(max_length=255)
    token_agente = models.CharField(max_length=255, unique=True)
    ativo = models.BooleanField(default=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)
    ultimo_ping = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        verbose_name = 'Robô'
        verbose_name_plural = 'Robôs'
        ordering = ['nome']
    
    def __str__(self):
        return f"{self.nome} ({self.host})"
    
    @property
    def status_conexao(self):
        if not self.ultimo_ping:
            return 'nunca_conectado'
        
        from django.utils import timezone
        from datetime import timedelta
        
        if timezone.now() - self.ultimo_ping > timedelta(minutes=5):
            return 'desconectado'
        return 'conectado'

class Job(models.Model):
    nome = models.CharField(max_length=200, unique=True)
    comando = models.TextField()
    timeout_s = models.IntegerField(default=300)
    parametros_padrao = models.JSONField(default=dict, blank=True)
    ativo = models.BooleanField(default=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)
    criado_por = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    
    class Meta:
        verbose_name = 'Job'
        verbose_name_plural = 'Jobs'
        ordering = ['nome']
    
    def __str__(self):
        return self.nome

class ExecucaoRobo(models.Model):
    STATUS_CHOICES = [
        ('queued', 'Na Fila'),
        ('running', 'Executando'),
        ('paused', 'Pausado'),
        ('stopped', 'Parado'),
        ('failed', 'Falhou'),
        ('success', 'Sucesso'),
    ]
    
    robo = models.ForeignKey(Robo, on_delete=models.CASCADE, related_name='execucoes')
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='execucoes')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='queued')
    pid = models.IntegerField(null=True, blank=True)
    parametros = models.JSONField(default=dict, blank=True)
    iniciado_em = models.DateTimeField(auto_now_add=True)
    finalizado_em = models.DateTimeField(null=True, blank=True)
    mensagem = models.TextField(blank=True)
    criado_por = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    task_id = models.CharField(max_length=255, null=True, blank=True)
    
    class Meta:
        verbose_name = 'Execução de Robô'
        verbose_name_plural = 'Execuções de Robôs'
        ordering = ['-iniciado_em']
    
    def __str__(self):
        return f"{self.robo.nome} - {self.job.nome} ({self.status})"
    
    @property
    def duracao_segundos(self):
        if not self.finalizado_em:
            from django.utils import timezone
            return (timezone.now() - self.iniciado_em).total_seconds()
        return (self.finalizado_em - self.iniciado_em).total_seconds()
    
    def pode_pausar(self):
        return self.status == 'running'
    
    def pode_parar(self):
        return self.status in ['running', 'paused', 'queued']
    
    def pode_retomar(self):
        return self.status == 'paused'
    
    def pode_iniciar(self):
        return self.status == 'queued'

class LogExecucao(models.Model):
    NIVEL_CHOICES = [
        ('DEBUG', 'Debug'),
        ('INFO', 'Info'),
        ('WARNING', 'Warning'),
        ('ERROR', 'Error'),
        ('CRITICAL', 'Critical'),
    ]
    
    execucao = models.ForeignKey(ExecucaoRobo, on_delete=models.CASCADE, related_name='logs')
    nivel = models.CharField(max_length=10, choices=NIVEL_CHOICES)
    mensagem = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    dados_extras = models.JSONField(default=dict, blank=True)
    
    class Meta:
        verbose_name = 'Log de Execução'
        verbose_name_plural = 'Logs de Execução'
        ordering = ['-timestamp']
    
    def __str__(self):
        return f"{self.execucao} - {self.nivel} - {self.timestamp}"

class StatusRobo(models.Model):
    robo = models.OneToOneField(Robo, on_delete=models.CASCADE, related_name='status')
    estado_atual = models.CharField(max_length=50, default='idle')
    execucao_atual = models.ForeignKey(ExecucaoRobo, on_delete=models.SET_NULL, null=True, blank=True)
    ultima_atualizacao = models.DateTimeField(auto_now=True)
    cpu_percent = models.FloatField(default=0.0)
    memoria_percent = models.FloatField(default=0.0)
    
    class Meta:
        verbose_name = 'Status do Robô'
        verbose_name_plural = 'Status dos Robôs'
    
    def __str__(self):
        return f"Status {self.robo.nome} - {self.estado_atual}"
