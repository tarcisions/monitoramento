
#!/bin/bash

# RPA Monitor - Script de Inicialização
echo "🚀 Iniciando RPA Monitor..."

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não encontrado. Por favor, instale o Docker primeiro."
    echo "Para instalar o Docker, execute:"
    echo "curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh"
    exit 1
fi

# Verificar se Docker Compose está instalado
if ! command -v docker-compose &> /dev/null; then
    echo "⚠️ Docker Compose não encontrado. Instalando automaticamente..."
    chmod +x install-docker-compose.sh
    ./install-docker-compose.sh
    
    # Verificar novamente após instalação
    if ! command -v docker-compose &> /dev/null; then
        echo "❌ Falha na instalação automática do Docker Compose."
        echo "Instale manualmente com:"
        echo "sudo curl -L \"https://github.com/docker/compose/releases/download/v2.24.5/docker-compose-\$(uname -s)-\$(uname -m)\" -o /usr/local/bin/docker-compose"
        echo "sudo chmod +x /usr/local/bin/docker-compose"
        exit 1
    fi
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

# Criar diretório de logs se não existir
mkdir -p logs

echo "🐳 Iniciando containers com Docker Compose..."
docker-compose up -d

echo "⏳ Aguardando serviços iniciarem..."
sleep 10

# Verificar se os serviços estão rodando
if docker-compose ps | grep -q "Up"; then
    echo "✅ Sistema iniciado com sucesso!"
    echo ""
    echo "🌐 Acessos disponíveis:"
    echo "   Frontend: http://localhost"
    echo "   API: http://localhost/api"
    echo "   Grafana: http://localhost:3000 (admin/admin123)"
    echo "   Prometheus: http://localhost:9090"
    echo ""
    echo "📋 Para verificar logs: docker-compose logs -f [service_name]"
    echo "📋 Para parar: docker-compose down"
else
    echo "❌ Erro ao iniciar alguns serviços"
    docker-compose ps
    echo "Verifique os logs com: docker-compose logs"
fi containers Docker..."
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
