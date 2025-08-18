from django.db import models
from django.contrib.auth.models import User
import json

class Robo(models.Model):
    nome = models.CharField(max_length=100, unique=True)
    host = models.CharField(max_length=255)
    token_agente = models.CharField(max_length=255)
    ativo = models.BooleanField(default=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Robô'
        verbose_name_plural = 'Robôs'
        ordering = ['nome']

    def __str__(self):
        return self.nome

class Job(models.Model):
    nome = models.CharField(max_length=100, unique=True)
    comando = models.TextField()
    timeout_s = models.IntegerField(default=300)
    parametros_padrao = models.JSONField(default=dict, blank=True)
    ativo = models.BooleanField(default=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

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
    iniciado_em = models.DateTimeField(null=True, blank=True)
    finalizado_em = models.DateTimeField(null=True, blank=True)
    mensagem = models.TextField(blank=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Execução de Robô'
        verbose_name_plural = 'Execuções de Robôs'
        ordering = ['-criado_em']

    def __str__(self):
        return f'{self.robo.nome} - {self.job.nome} ({self.status})'

