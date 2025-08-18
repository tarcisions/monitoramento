from rest_framework import serializers
from core.models import Robo, Job, ExecucaoRobo

class RoboSerializer(serializers.ModelSerializer):
    class Meta:
        model = Robo
        fields = ['id', 'nome', 'host', 'token_agente', 'ativo', 'criado_em', 'atualizado_em']
        read_only_fields = ['criado_em', 'atualizado_em']

class JobSerializer(serializers.ModelSerializer):
    class Meta:
        model = Job
        fields = ['id', 'nome', 'comando', 'timeout_s', 'parametros_padrao', 'ativo', 'criado_em', 'atualizado_em']
        read_only_fields = ['criado_em', 'atualizado_em']

class ExecucaoRoboSerializer(serializers.ModelSerializer):
    robo_nome = serializers.CharField(source='robo.nome', read_only=True)
    job_nome = serializers.CharField(source='job.nome', read_only=True)

    class Meta:
        model = ExecucaoRobo
        fields = ['id', 'robo', 'job', 'robo_nome', 'job_nome', 'status', 'pid', 'parametros', 
                 'iniciado_em', 'finalizado_em', 'mensagem', 'criado_em', 'atualizado_em']
        read_only_fields = ['criado_em', 'atualizado_em']

