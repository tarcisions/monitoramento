
#!/bin/bash

# RPA Monitor - Script de Inicialização
echo "🚀 Iniciando RPA Monitor..."

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não encontrado. Por favor, instale o Docker primeiro."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose não encontrado. Por favor, instale o Docker Compose primeiro."
    exit 1
fi

# Criar arquivo .env se não existir
if [ ! -f .env ]; then
    echo "📝 Criando arquivo .env..."
    cp .env.example .env
    echo "✅ Arquivo .env criado. Edite as configurações se necessário."
fi

# Criar diretórios necessários
echo "📁 Criando diretórios..."
mkdir -p infra/docker/logs/nginx
mkdir -p infra/docker/ssl

# Navegar para o diretório do Docker
cd infra/docker

echo "🐳 Iniciando containers Docker..."
docker-compose up -d

echo ""
echo "🎉 RPA Monitor iniciado com sucesso!"
echo ""
echo "📊 Acesse as aplicações:"
echo "   • Frontend: http://localhost"
echo "   • API: http://localhost/api"
echo "   • Grafana: http://localhost:3000 (admin/admin123)"
echo "   • Prometheus: http://localhost:9090"
echo ""
echo "📝 Para parar o sistema: docker-compose down"
echo "📝 Para ver logs: docker-compose logs -f"
