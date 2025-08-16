from django.contrib import admin
from .models import Robo, Job, ExecucaoRobo, LogExecucao, StatusRobo

@admin.register(Robo)
class RoboAdmin(admin.ModelAdmin):
    list_display = ['nome', 'host', 'ativo', 'status_conexao', 'ultimo_ping', 'criado_em']
    list_filter = ['ativo', 'criado_em']
    search_fields = ['nome', 'host']
    readonly_fields = ['criado_em', 'atualizado_em', 'ultimo_ping', 'status_conexao']
    
    fieldsets = (
        ('Informações Básicas', {
            'fields': ('nome', 'host', 'ativo')
        }),
        ('Autenticação', {
            'fields': ('token_agente',)
        }),
        ('Status', {
            'fields': ('ultimo_ping', 'status_conexao'),
            'classes': ('collapse',)
        }),
        ('Auditoria', {
            'fields': ('criado_em', 'atualizado_em'),
            'classes': ('collapse',)
        }),
    )

@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display = ['nome', 'comando', 'timeout_s', 'ativo', 'criado_por', 'criado_em']
    list_filter = ['ativo', 'criado_em', 'criado_por']
    search_fields = ['nome', 'comando']
    readonly_fields = ['criado_em', 'atualizado_em']
    
    fieldsets = (
        ('Informações Básicas', {
            'fields': ('nome', 'comando', 'timeout_s', 'ativo')
        }),
        ('Parâmetros', {
            'fields': ('parametros_padrao',)
        }),
        ('Auditoria', {
            'fields': ('criado_por', 'criado_em', 'atualizado_em'),
            'classes': ('collapse',)
        }),
    )
    
    def save_model(self, request, obj, form, change):
        if not change:
            obj.criado_por = request.user
        super().save_model(request, obj, form, change)

@admin.register(ExecucaoRobo)
class ExecucaoRoboAdmin(admin.ModelAdmin):
    list_display = ['robo', 'job', 'status', 'iniciado_em', 'finalizado_em', 'duracao_segundos']
    list_filter = ['status', 'iniciado_em', 'robo', 'job']
    search_fields = ['robo__nome', 'job__nome', 'mensagem']
    readonly_fields = ['iniciado_em', 'finalizado_em', 'duracao_segundos', 'task_id']
    
    fieldsets = (
        ('Execução', {
            'fields': ('robo', 'job', 'status', 'pid')
        }),
        ('Parâmetros', {
            'fields': ('parametros',)
        }),
        ('Resultado', {
            'fields': ('mensagem',)
        }),
        ('Controle', {
            'fields': ('task_id',),
            'classes': ('collapse',)
        }),
        ('Auditoria', {
            'fields': ('criado_por', 'iniciado_em', 'finalizado_em', 'duracao_segundos'),
            'classes': ('collapse',)
        }),
    )

@admin.register(LogExecucao)
class LogExecucaoAdmin(admin.ModelAdmin):
    list_display = ['execucao', 'nivel', 'mensagem', 'timestamp']
    list_filter = ['nivel', 'timestamp', 'execucao__robo', 'execucao__job']
    search_fields = ['mensagem', 'execucao__robo__nome', 'execucao__job__nome']
    readonly_fields = ['timestamp']
    
    fieldsets = (
        ('Log', {
            'fields': ('execucao', 'nivel', 'mensagem')
        }),
        ('Dados Extras', {
            'fields': ('dados_extras',),
            'classes': ('collapse',)
        }),
        ('Auditoria', {
            'fields': ('timestamp',),
            'classes': ('collapse',)
        }),
    )

@admin.register(StatusRobo)
class StatusRoboAdmin(admin.ModelAdmin):
    list_display = ['robo', 'estado_atual', 'execucao_atual', 'cpu_percent', 'memoria_percent', 'ultima_atualizacao']
    list_filter = ['estado_atual', 'ultima_atualizacao']
    search_fields = ['robo__nome']
    readonly_fields = ['ultima_atualizacao']
    
    fieldsets = (
        ('Status Atual', {
            'fields': ('robo', 'estado_atual', 'execucao_atual')
        }),
        ('Recursos', {
            'fields': ('cpu_percent', 'memoria_percent')
        }),
        ('Auditoria', {
            'fields': ('ultima_atualizacao',),
            'classes': ('collapse',)
        }),
    )
