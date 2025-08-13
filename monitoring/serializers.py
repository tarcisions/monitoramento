from rest_framework import serializers
from .models import Robot, Log, RobotStatus, Execution, Command


class RobotSerializer(serializers.ModelSerializer):
    """Serializer para o modelo Robot"""
    
    class Meta:
        model = Robot
        fields = '__all__'
        read_only_fields = ('created_at', 'last_seen')


class RobotStatusSerializer(serializers.ModelSerializer):
    """Serializer para o modelo RobotStatus"""
    
    robot_name = serializers.CharField(source='robot.name', read_only=True)
    
    class Meta:
        model = RobotStatus
        fields = '__all__'
        read_only_fields = ('timestamp',)


class LogSerializer(serializers.ModelSerializer):
    """Serializer para o modelo Log"""
    
    robot_name = serializers.CharField(source='robot.name', read_only=True)
    execution_task = serializers.CharField(source='execution.task_name', read_only=True)
    
    class Meta:
        model = Log
        fields = '__all__'
        read_only_fields = ('timestamp',)


class ExecutionSerializer(serializers.ModelSerializer):
    """Serializer para o modelo Execution"""
    
    robot_name = serializers.CharField(source='robot.name', read_only=True)
    
    class Meta:
        model = Execution
        fields = '__all__'
        read_only_fields = ('started_at', 'duration')


class CommandSerializer(serializers.ModelSerializer):
    """Serializer para o modelo Command"""
    
    robot_name = serializers.CharField(source='robot.name', read_only=True)
    
    class Meta:
        model = Command
        fields = '__all__'
        read_only_fields = ('created_at', 'sent_at', 'executed_at')


class RobotCreateLogSerializer(serializers.Serializer):
    """Serializer para criação de logs via API"""
    
    robot_name = serializers.CharField(max_length=100)
    level = serializers.ChoiceField(choices=Log.LEVEL_CHOICES, default='INFO')
    message = serializers.CharField()
    source = serializers.CharField(max_length=100, required=False, allow_blank=True)
    execution_id = serializers.IntegerField(required=False, allow_null=True)
    
    def create(self, validated_data):
        robot_name = validated_data.pop('robot_name')
        execution_id = validated_data.pop('execution_id', None)
        
        try:
            robot = Robot.objects.get(name=robot_name)
        except Robot.DoesNotExist:
            # Criar robô automaticamente se não existir
            robot = Robot.objects.create(name=robot_name)
        
        execution = None
        if execution_id:
            try:
                execution = Execution.objects.get(id=execution_id, robot=robot)
            except Execution.DoesNotExist:
                pass
        
        return Log.objects.create(
            robot=robot,
            execution=execution,
            **validated_data
        )


class RobotCreateStatusSerializer(serializers.Serializer):
    """Serializer para criação de status via API"""
    
    robot_name = serializers.CharField(max_length=100)
    status = serializers.ChoiceField(choices=Robot.STATUS_CHOICES, required=False)
    cpu_usage = serializers.FloatField(required=False, allow_null=True)
    memory_usage = serializers.FloatField(required=False, allow_null=True)
    disk_usage = serializers.FloatField(required=False, allow_null=True)
    network_status = serializers.BooleanField(required=False)
    custom_data = serializers.JSONField(required=False)
    
    def create(self, validated_data):
        robot_name = validated_data.pop('robot_name')
        robot_status = validated_data.pop('status', None)
        
        try:
            robot = Robot.objects.get(name=robot_name)
        except Robot.DoesNotExist:
            # Criar robô automaticamente se não existir
            robot = Robot.objects.create(name=robot_name)
        
        # Atualizar status do robô se fornecido
        if robot_status:
            robot.status = robot_status
            robot.save()
        
        return RobotStatus.objects.create(
            robot=robot,
            **validated_data
        )


class RobotControlSerializer(serializers.Serializer):
    """Serializer para controle de robôs"""
    
    robot_name = serializers.CharField(max_length=100)
    command = serializers.ChoiceField(choices=Command.COMMAND_CHOICES)
    command_data = serializers.JSONField(required=False, default=dict)
    
    def create(self, validated_data):
        robot_name = validated_data.pop('robot_name')
        
        try:
            robot = Robot.objects.get(name=robot_name)
        except Robot.DoesNotExist:
            raise serializers.ValidationError(f"Robô '{robot_name}' não encontrado")
        
        return Command.objects.create(
            robot=robot,
            command_type=validated_data['command'],
            command_data=validated_data.get('command_data', {})
        )

