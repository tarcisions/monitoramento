
#!/bin/bash

# Script para instalar Docker Compose
echo "🐳 Instalando Docker Compose..."

# Detectar arquitetura
ARCH=$(uname -m)
case $ARCH in
    x86_64) ARCH="x86_64" ;;
    aarch64) ARCH="aarch64" ;;
    armv7l) ARCH="armv7" ;;
    *) echo "❌ Arquitetura não suportada: $ARCH"; exit 1 ;;
esac

# Baixar Docker Compose
DOCKER_COMPOSE_VERSION="v2.24.5"
DOCKER_COMPOSE_URL="https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-linux-${ARCH}"

echo "📥 Baixando Docker Compose ${DOCKER_COMPOSE_VERSION} para ${ARCH}..."
curl -L "$DOCKER_COMPOSE_URL" -o /usr/local/bin/docker-compose

# Dar permissão de execução
chmod +x /usr/local/bin/docker-compose

# Verificar instalação
if docker-compose --version &> /dev/null; then
    echo "✅ Docker Compose instalado com sucesso!"
    docker-compose --version
else
    echo "❌ Erro na instalação do Docker Compose"
    exit 1
fi
