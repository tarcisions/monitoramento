from django.db import models
from django.utils import timezone


class Robot(models.Model):
    """Modelo para representar um robô no sistema"""
    
    STATUS_CHOICES = [
        ('IDLE', 'Inativo'),
        ('RUNNING', 'Executando'),
        ('STOPPED', 'Parado'),
        ('ERROR', 'Erro'),
        ('MAINTENANCE', 'Manutenção'),
    ]
    
    name = models.CharField(max_length=100, unique=True, verbose_name='Nome')
    description = models.TextField(blank=True, verbose_name='Descrição')
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='IDLE',
        verbose_name='Status'
    )
    ip_address = models.GenericIPAddressField(null=True, blank=True, verbose_name='Endereço IP')
    last_seen = models.DateTimeField(auto_now=True, verbose_name='Última atividade')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Criado em')
    is_active = models.BooleanField(default=True, verbose_name='Ativo')
    
    class Meta:
        verbose_name = 'Robô'
        verbose_name_plural = 'Robôs'
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} ({self.get_status_display()})"


class Execution(models.Model):
    """Modelo para representar uma execução de tarefa"""
    
    STATUS_CHOICES = [
        ('PENDING', 'Pendente'),
        ('RUNNING', 'Executando'),
        ('COMPLETED', 'Concluída'),
        ('FAILED', 'Falhou'),
        ('CANCELLED', 'Cancelada'),
    ]
    
    robot = models.ForeignKey(Robot, on_delete=models.CASCADE, verbose_name='Robô')
    task_name = models.CharField(max_length=200, verbose_name='Nome da tarefa')
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='PENDING',
        verbose_name='Status'
    )
    started_at = models.DateTimeField(default=timezone.now, verbose_name='Iniciado em')
    completed_at = models.DateTimeField(null=True, blank=True, verbose_name='Concluído em')
    duration = models.DurationField(null=True, blank=True, verbose_name='Duração')
    error_message = models.TextField(blank=True, verbose_name='Mensagem de erro')
    
    class Meta:
        verbose_name = 'Execução'
        verbose_name_plural = 'Execuções'
        ordering = ['-started_at']
    
    def __str__(self):
        return f"{self.robot.name} - {self.task_name} ({self.get_status_display()})"
    
    def save(self, *args, **kwargs):
        if self.status in ['COMPLETED', 'FAILED', 'CANCELLED'] and self.completed_at:
            self.duration = self.completed_at - self.started_at
        super().save(*args, **kwargs)


class Log(models.Model):
    """Modelo para representar logs do sistema"""
    
    LEVEL_CHOICES = [
        ('DEBUG', 'Debug'),
        ('INFO', 'Informação'),
        ('WARNING', 'Aviso'),
        ('ERROR', 'Erro'),
        ('CRITICAL', 'Crítico'),
    ]
    
    robot = models.ForeignKey(Robot, on_delete=models.CASCADE, verbose_name='Robô')
    execution = models.ForeignKey(
        Execution, 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True,
        verbose_name='Execução'
    )
    level = models.CharField(
        max_length=20, 
        choices=LEVEL_CHOICES, 
        default='INFO',
        verbose_name='Nível'
    )
    message = models.TextField(verbose_name='Mensagem')
    timestamp = models.DateTimeField(default=timezone.now, verbose_name='Timestamp')
    source = models.CharField(max_length=100, blank=True, verbose_name='Origem')
    
    class Meta:
        verbose_name = 'Log'
        verbose_name_plural = 'Logs'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['robot', '-timestamp']),
            models.Index(fields=['level', '-timestamp']),
        ]
    
    def __str__(self):
        return f"{self.robot.name} - {self.level} - {self.timestamp}"


class RobotStatus(models.Model):
    """Modelo para armazenar status detalhado dos robôs"""
    
    robot = models.ForeignKey(Robot, on_delete=models.CASCADE, verbose_name='Robô')
    cpu_usage = models.FloatField(null=True, blank=True, verbose_name='Uso de CPU (%)')
    memory_usage = models.FloatField(null=True, blank=True, verbose_name='Uso de memória (%)')
    disk_usage = models.FloatField(null=True, blank=True, verbose_name='Uso de disco (%)')
    network_status = models.BooleanField(default=True, verbose_name='Status da rede')
    custom_data = models.JSONField(default=dict, blank=True, verbose_name='Dados customizados')
    timestamp = models.DateTimeField(default=timezone.now, verbose_name='Timestamp')
    
    class Meta:
        verbose_name = 'Status do Robô'
        verbose_name_plural = 'Status dos Robôs'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['robot', '-timestamp']),
        ]
    
    def __str__(self):
        return f"{self.robot.name} - Status {self.timestamp}"


class Command(models.Model):
    """Modelo para comandos enviados aos robôs"""
    
    COMMAND_CHOICES = [
        ('START', 'Iniciar'),
        ('STOP', 'Parar'),
        ('RESTART', 'Reiniciar'),
        ('PAUSE', 'Pausar'),
        ('RESUME', 'Retomar'),
        ('CUSTOM', 'Personalizado'),
    ]
    
    STATUS_CHOICES = [
        ('PENDING', 'Pendente'),
        ('SENT', 'Enviado'),
        ('ACKNOWLEDGED', 'Confirmado'),
        ('EXECUTED', 'Executado'),
        ('FAILED', 'Falhou'),
    ]
    
    robot = models.ForeignKey(Robot, on_delete=models.CASCADE, verbose_name='Robô')
    command_type = models.CharField(
        max_length=20, 
        choices=COMMAND_CHOICES,
        verbose_name='Tipo de comando'
    )
    command_data = models.JSONField(default=dict, blank=True, verbose_name='Dados do comando')
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='PENDING',
        verbose_name='Status'
    )
    created_at = models.DateTimeField(default=timezone.now, verbose_name='Criado em')
    sent_at = models.DateTimeField(null=True, blank=True, verbose_name='Enviado em')
    executed_at = models.DateTimeField(null=True, blank=True, verbose_name='Executado em')
    response = models.TextField(blank=True, verbose_name='Resposta')
    
    class Meta:
        verbose_name = 'Comando'
        verbose_name_plural = 'Comandos'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.robot.name} - {self.get_command_type_display()} ({self.get_status_display()})"
