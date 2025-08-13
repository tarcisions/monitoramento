#!/bin/bash

# Script de Instalação do Sistema de Monitoramento de Robôs
# Autor: Sistema de Monitoramento de Robôs
# Data: 2025-08-13

set -e

echo "🤖 Sistema de Monitoramento de Robôs - Instalação Automática"
echo "============================================================"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para imprimir mensagens coloridas
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCESSO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[AVISO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERRO]${NC} $1"
}

# Verificar se está rodando como root
if [[ $EUID -eq 0 ]]; then
   print_error "Este script não deve ser executado como root"
   exit 1
fi

# Detectar sistema operacional
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="linux"
    if command -v apt-get &> /dev/null; then
        DISTRO="debian"
    elif command -v yum &> /dev/null; then
        DISTRO="redhat"
    else
        print_error "Distribuição Linux não suportada"
        exit 1
    fi
elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macos"
else
    print_error "Sistema operacional não suportado: $OSTYPE"
    exit 1
fi

print_status "Sistema detectado: $OS ($DISTRO)"

# Verificar Python
print_status "Verificando Python..."
if ! command -v python3 &> /dev/null; then
    print_error "Python 3 não encontrado. Por favor, instale Python 3.8+"
    exit 1
fi

PYTHON_VERSION=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
print_success "Python $PYTHON_VERSION encontrado"

# Verificar pip
if ! command -v pip3 &> /dev/null; then
    print_warning "pip3 não encontrado. Instalando..."
    if [[ $OS == "linux" && $DISTRO == "debian" ]]; then
        sudo apt-get update
        sudo apt-get install -y python3-pip
    elif [[ $OS == "linux" && $DISTRO == "redhat" ]]; then
        sudo yum install -y python3-pip
    elif [[ $OS == "macos" ]]; then
        if command -v brew &> /dev/null; then
            brew install python3
        else
            print_error "Homebrew não encontrado. Instale manualmente o pip3"
            exit 1
        fi
    fi
fi

# Instalar Redis
print_status "Verificando Redis..."
if ! command -v redis-server &> /dev/null; then
    print_warning "Redis não encontrado. Instalando..."
    if [[ $OS == "linux" && $DISTRO == "debian" ]]; then
        sudo apt-get update
        sudo apt-get install -y redis-server
        sudo systemctl enable redis-server
        sudo systemctl start redis-server
    elif [[ $OS == "linux" && $DISTRO == "redhat" ]]; then
        sudo yum install -y redis
        sudo systemctl enable redis
        sudo systemctl start redis
    elif [[ $OS == "macos" ]]; then
        if command -v brew &> /dev/null; then
            brew install redis
            brew services start redis
        else
            print_error "Homebrew não encontrado. Instale Redis manualmente"
            exit 1
        fi
    fi
else
    print_success "Redis já instalado"
    # Verificar se está rodando
    if ! redis-cli ping &> /dev/null; then
        print_status "Iniciando Redis..."
        if [[ $OS == "linux" ]]; then
            sudo systemctl start redis-server || sudo systemctl start redis
        elif [[ $OS == "macos" ]]; then
            brew services start redis
        fi
    fi
fi

# Testar Redis
print_status "Testando conexão com Redis..."
if redis-cli ping &> /dev/null; then
    print_success "Redis funcionando corretamente"
else
    print_error "Falha ao conectar com Redis"
    exit 1
fi

# Criar ambiente virtual (opcional)
read -p "Deseja criar um ambiente virtual Python? (recomendado) [y/N]: " create_venv
if [[ $create_venv =~ ^[Yy]$ ]]; then
    print_status "Criando ambiente virtual..."
    python3 -m venv venv
    source venv/bin/activate
    print_success "Ambiente virtual criado e ativado"
    echo "Para ativar o ambiente virtual no futuro, execute: source venv/bin/activate"
fi

# Instalar dependências Python
print_status "Instalando dependências Python..."
pip3 install -r requirements.txt
print_success "Dependências instaladas"

# Configurar banco de dados
print_status "Configurando banco de dados..."
python3 manage.py makemigrations
python3 manage.py migrate
print_success "Banco de dados configurado"

# Configurar variáveis de ambiente
if [[ ! -f .env ]]; then
    print_status "Criando arquivo de configuração..."
    cp .env.example .env
    print_warning "Arquivo .env criado. Edite-o para configurar Telegram e outras opções"
fi

# Configurar Telegram (opcional)
read -p "Deseja configurar o Telegram Bot agora? [y/N]: " setup_telegram
if [[ $setup_telegram =~ ^[Yy]$ ]]; then
    echo
    echo "Para configurar o Telegram Bot:"
    echo "1. Fale com @BotFather no Telegram"
    echo "2. Use /newbot e siga as instruções"
    echo "3. Anote o token do bot"
    echo "4. Adicione o bot ao seu chat/grupo"
    echo "5. Envie uma mensagem para o bot"
    echo "6. Acesse: https://api.telegram.org/bot{TOKEN}/getUpdates"
    echo "7. Encontre o chat.id na resposta"
    echo
    
    read -p "Token do Bot: " bot_token
    read -p "Chat ID: " chat_id
    
    if [[ -n "$bot_token" && -n "$chat_id" ]]; then
        sed -i "s/TELEGRAM_BOT_TOKEN=.*/TELEGRAM_BOT_TOKEN=$bot_token/" .env
        sed -i "s/TELEGRAM_CHAT_ID=.*/TELEGRAM_CHAT_ID=$chat_id/" .env
        print_success "Configuração do Telegram salva"
        
        # Testar Telegram
        print_status "Testando integração com Telegram..."
        if python3 manage.py test_telegram --message "🤖 Sistema de Monitoramento instalado com sucesso!" 2>/dev/null; then
            print_success "Telegram configurado corretamente"
        else
            print_warning "Falha no teste do Telegram. Verifique as configurações"
        fi
    fi
fi

# Criar script de inicialização
print_status "Criando script de inicialização..."
cat > start.sh << 'EOF'
#!/bin/bash

# Script para iniciar o Sistema de Monitoramento de Robôs

echo "🤖 Iniciando Sistema de Monitoramento de Robôs..."

# Ativar ambiente virtual se existir
if [[ -d "venv" ]]; then
    source venv/bin/activate
    echo "✅ Ambiente virtual ativado"
fi

# Verificar Redis
if ! redis-cli ping &> /dev/null; then
    echo "⚠️  Redis não está rodando. Tentando iniciar..."
    if command -v systemctl &> /dev/null; then
        sudo systemctl start redis-server || sudo systemctl start redis
    elif command -v brew &> /dev/null; then
        brew services start redis
    else
        echo "❌ Falha ao iniciar Redis. Inicie manualmente."
        exit 1
    fi
fi

# Aplicar migrações se necessário
python3 manage.py migrate --run-syncdb

# Iniciar servidor
echo "🚀 Iniciando servidor Django..."
echo "📱 Dashboard disponível em: http://localhost:8000"
echo "🛑 Pressione Ctrl+C para parar"
python3 manage.py runserver 0.0.0.0:8000
EOF

chmod +x start.sh
print_success "Script de inicialização criado (start.sh)"

# Criar script para robôs de exemplo
print_status "Criando script para robôs de exemplo..."
cat > start_robots.sh << 'EOF'
#!/bin/bash

# Script para iniciar robôs de exemplo

echo "🤖 Iniciando robôs de exemplo..."

# Ativar ambiente virtual se existir
if [[ -d "venv" ]]; then
    source venv/bin/activate
fi

# Número de robôs (padrão: 3)
COUNT=${1:-3}

echo "🚀 Iniciando $COUNT robôs..."
python3 run_multiple_robots.py --count $COUNT --prefix robot_exemplo

echo "✅ Robôs iniciados. Pressione Ctrl+C para parar todos."
EOF

chmod +x start_robots.sh
print_success "Script para robôs criado (start_robots.sh)"

# Finalização
echo
echo "🎉 Instalação concluída com sucesso!"
echo
echo "📋 Próximos passos:"
echo "1. Execute: ./start.sh"
echo "2. Acesse: http://localhost:8000"
echo "3. Para testar robôs: ./start_robots.sh"
echo
echo "📚 Documentação completa no README.md"
echo "🔧 Configurações em .env"
echo
print_success "Sistema pronto para uso!"

