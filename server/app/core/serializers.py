from rest_framework import serializers
from .models import Robo, Job, ExecucaoRobo, LogExecucao, StatusRobo

class RoboSerializer(serializers.ModelSerializer):
    status_conexao = serializers.ReadOnlyField()
    
    class Meta:
        model = Robo
        fields = ['id', 'nome', 'host', 'token_agente', 'ativo', 
                 'criado_em', 'atualizado_em', 'ultimo_ping', 'status_conexao']
        read_only_fields = ['criado_em', 'atualizado_em', 'ultimo_ping']

class JobSerializer(serializers.ModelSerializer):
    criado_por_nome = serializers.CharField(source='criado_por.username', read_only=True)
    
    class Meta:
        model = Job
        fields = ['id', 'nome', 'comando', 'timeout_s', 'parametros_padrao', 
                 'ativo', 'criado_em', 'atualizado_em', 'criado_por', 'criado_por_nome']
        read_only_fields = ['criado_em', 'atualizado_em']

class ExecucaoRoboSerializer(serializers.ModelSerializer):
    robo_nome = serializers.CharField(source='robo.nome', read_only=True)
    job_nome = serializers.CharField(source='job.nome', read_only=True)
    duracao_segundos = serializers.ReadOnlyField()
    pode_pausar = serializers.ReadOnlyField()
    pode_parar = serializers.ReadOnlyField()
    pode_retomar = serializers.ReadOnlyField()
    pode_iniciar = serializers.ReadOnlyField()
    criado_por_nome = serializers.CharField(source='criado_por.username', read_only=True)
    
    class Meta:
        model = ExecucaoRobo
        fields = ['id', 'robo', 'robo_nome', 'job', 'job_nome', 'status', 
                 'pid', 'parametros', 'iniciado_em', 'finalizado_em', 'mensagem',
                 'duracao_segundos', 'pode_pausar', 'pode_parar', 'pode_retomar',
                 'pode_iniciar', 'criado_por', 'criado_por_nome', 'task_id']
        read_only_fields = ['iniciado_em', 'finalizado_em', 'task_id']

class LogExecucaoSerializer(serializers.ModelSerializer):
    class Meta:
        model = LogExecucao
        fields = ['id', 'execucao', 'nivel', 'mensagem', 'timestamp', 'dados_extras']
        read_only_fields = ['timestamp']

class StatusRoboSerializer(serializers.ModelSerializer):
    robo_nome = serializers.CharField(source='robo.nome', read_only=True)
    execucao_atual_info = ExecucaoRoboSerializer(source='execucao_atual', read_only=True)
    
    class Meta:
        model = StatusRobo
        fields = ['id', 'robo', 'robo_nome', 'estado_atual', 'execucao_atual', 
                 'execucao_atual_info', 'ultima_atualizacao', 'cpu_percent', 'memoria_percent']
        read_only_fields = ['ultima_atualizacao']

class RoboDetalhadoSerializer(RoboSerializer):
    status = StatusRoboSerializer(read_only=True)
    execucoes_recentes = serializers.SerializerMethodField()
    
    class Meta(RoboSerializer.Meta):
        fields = RoboSerializer.Meta.fields + ['status', 'execucoes_recentes']
    
    def get_execucoes_recentes(self, obj):
        execucoes = obj.execucoes.all()[:5]
        return ExecucaoRoboSerializer(execucoes, many=True).data
