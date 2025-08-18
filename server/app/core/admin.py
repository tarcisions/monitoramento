from django.contrib import admin
from .models import Robo, Job, ExecucaoRobo

@admin.register(Robo)
class RoboAdmin(admin.ModelAdmin):
    list_display = ['nome', 'host', 'ativo', 'criado_em']
    list_filter = ['ativo', 'criado_em']
    search_fields = ['nome', 'host']
    readonly_fields = ['criado_em', 'atualizado_em']

@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display = ['nome', 'timeout_s', 'ativo', 'criado_em']
    list_filter = ['ativo', 'criado_em']
    search_fields = ['nome', 'comando']
    readonly_fields = ['criado_em', 'atualizado_em']

@admin.register(ExecucaoRobo)
class ExecucaoRoboAdmin(admin.ModelAdmin):
    list_display = ['robo', 'job', 'status', 'iniciado_em', 'finalizado_em']
    list_filter = ['status', 'criado_em', 'robo', 'job']
    search_fields = ['robo__nome', 'job__nome']
    readonly_fields = ['criado_em', 'atualizado_em']

