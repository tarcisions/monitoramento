import os
import json
import redis
from typing import Optional, Dict, Any
import structlog

logger = structlog.get_logger()

class RedisService:
    def __init__(self):
        redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
        self.redis = redis.from_url(redis_url, decode_responses=True)
        
    def publish_command(self, robot_id: str, command: Dict[str, Any]):
        """Publica um comando para o robô via Redis Pub/Sub"""
        try:
            channel = f"commands:{robot_id}"
            message = json.dumps(command)
            self.redis.publish(channel, message)
            logger.info("Comando enviado via Redis", robot_id=robot_id, command=command)
        except Exception as e:
            logger.error("Erro ao enviar comando via Redis", robot_id=robot_id, error=str(e))
            
    def set_robot_command(self, robot_id: str, command: Dict[str, Any], ttl: int = 300):
        """Define um comando para o robô com TTL (para polling)"""
        try:
            key = f"robot_command:{robot_id}"
            value = json.dumps(command)
            self.redis.setex(key, ttl, value)
            logger.info("Comando definido para polling", robot_id=robot_id, command=command)
        except Exception as e:
            logger.error("Erro ao definir comando", robot_id=robot_id, error=str(e))
            
    def get_robot_command(self, robot_id: str) -> Optional[Dict[str, Any]]:
        """Obtém o próximo comando para o robô"""
        try:
            key = f"robot_command:{robot_id}"
            value = self.redis.get(key)
            if value:
                self.redis.delete(key)  # Remove após ler
                return json.loads(value)
            return None
        except Exception as e:
            logger.error("Erro ao obter comando", robot_id=robot_id, error=str(e))
            return None
            
    def set_robot_status(self, robot_id: str, status: Dict[str, Any], ttl: int = 60):
        """Define o status atual do robô"""
        try:
            key = f"robot_status:{robot_id}"
            value = json.dumps(status)
            self.redis.setex(key, ttl, value)
        except Exception as e:
            logger.error("Erro ao definir status do robô", robot_id=robot_id, error=str(e))
            
    def get_robot_status(self, robot_id: str) -> Optional[Dict[str, Any]]:
        """Obtém o status atual do robô"""
        try:
            key = f"robot_status:{robot_id}"
            value = self.redis.get(key)
            return json.loads(value) if value else None
        except Exception as e:
            logger.error("Erro ao obter status do robô", robot_id=robot_id, error=str(e))
            return None

# Instância global
redis_service = RedisService()
