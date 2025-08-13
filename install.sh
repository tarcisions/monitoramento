#!/bin/bash

# Script de Instalação do Sistema de Monitoramento de Robôs (usuário opc)
# Autor: Sistema de Monitoramento de Robôs
# Data: 2025-08-13

set -e

PROJECT_DIR="/var/www/monitoramento"
USER_OPC="opc"
LOG_FILE="$PROJECT_DIR/robot_monitor.log"
ENV_FILE="$PROJECT_DIR/.env"

echo "🤖 Sistema de Monitoramento de Robôs - Instalação Automática"
echo "============================================================"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCESSO]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[AVISO]${NC} $1"; }
print_error() { echo -e "${RED}[ERRO]${NC} $1"; }

# Detectar sistema
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="linux"
    if command -v apt-get &> /dev/null; then DISTRO="debian"
    elif command -v yum &> /dev/null; then DISTRO="redhat"
    else print_error "Distribuição Linux não suportada"; exit 1; fi
elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macos"
else
    print_error "Sistema operacional não suportado: $OSTYPE"; exit 1
fi

print_status "Sistema detectado: $OS ($DISTRO)"

# Verificar Python
if ! command -v python3 &> /dev/null; then
    print_error "Python 3 não encontrado. Instale Python 3.8+"
    exit 1
fi
PYTHON_VERSION=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
print_success "Python $PYTHON_VERSION encontrado"

# Verificar pip
if ! command -v pip3 &> /dev/null; then
    print_warning "pip3 não encontrado. Instalando..."
    if [[ $DISTRO == "debian" ]]; then
        sudo apt-get update
        sudo apt-get install -y python3-pip
    elif [[ $DISTRO == "redhat" ]]; then
        sudo yum install -y python3-pip
    fi
fi

# Instalar Redis
if ! command -v redis-server &> /dev/null; then
    print_warning "Redis não encontrado. Instalando..."
    if [[ $DISTRO == "debian" ]]; then
        sudo apt-get update
        sudo apt-get install -y redis-server
        sudo systemctl enable redis-server
        sudo systemctl start redis-server
    elif [[ $DISTRO == "redhat" ]]; then
        sudo yum install -y redis
        sudo systemctl enable redis
        sudo systemctl start redis
    fi
else
    print_success "Redis já instalado"
    if ! redis-cli ping &> /dev/null; then
        sudo systemctl start redis-server || sudo systemctl start redis
    fi
fi

if redis-cli ping &> /dev/null; then
    print_success "Redis funcionando corretamente"
else
    print_error "Falha ao conectar com Redis"; exit 1
fi

# Garantir permissões do projeto para opc
sudo chown -R $USER_OPC:$USER_OPC $PROJECT_DIR

# Criar log e .env
sudo -u $USER_OPC touch $LOG_FILE
print_success "Arquivo de log criado: $LOG_FILE"

# Perguntar dados do Telegram
read -p "Deseja configurar Telegram Bot? [y/N]: " setup_telegram
if [[ $setup_telegram =~ ^[Yy]$ ]]; then
    read -p "Token do Bot: " TELEGRAM_BOT_TOKEN
    read -p "Chat ID: " TELEGRAM_CHAT_ID
else
    TELEGRAM_BOT_TOKEN=""
    TELEGRAM_CHAT_ID=""
fi

# Criar .env
sudo -u $USER_OPC bash -c "cat > $ENV_FILE <<EOF
# Variáveis de ambiente do Sistema de Monitoramento
DEBUG=True
LOG_FILE=$LOG_FILE
TELEGRAM_BOT_TOKEN=$TELEGRAM_BOT_TOKEN
TELEGRAM_CHAT_ID=$TELEGRAM_CHAT_ID
EOF"
print_success "Arquivo .env criado e configurado: $ENV_FILE"

# Criar ambiente virtual
read -p "Deseja criar ambiente virtual Python? (recomendado) [y/N]: " create_venv
if [[ $create_venv =~ ^[Yy]$ ]]; then
    print_status "Criando ambiente virtual..."
    sudo -u $USER_OPC python3 -m venv $PROJECT_DIR/.venv
    print_success "Ambiente virtual criado"
fi

# Instalar dependências Python
print_status "Instalando dependências Python..."
sudo -u $USER_OPC bash -c "source $PROJECT_DIR/.venv/bin/activate && pip install -r $PROJECT_DIR/requirements.txt"
print_success "Dependências instaladas"

# Migrar banco de dados
print_status "Configurando banco de dados..."
sudo -u $USER_OPC bash -c "source $PROJECT_DIR/.venv/bin/activate && python $PROJECT_DIR/manage.py makemigrations && python $PROJECT_DIR/manage.py migrate"
print_success "Banco de dados configurado"

# Script de inicialização
cat > $PROJECT_DIR/start.sh << 'EOF'
#!/bin/bash
PROJECT_DIR="/var/www/monitoramento"
USER_OPC="opc"

echo "🤖 Iniciando Sistema de Monitoramento de Robôs..."

if [[ -d "$PROJECT_DIR/.venv" ]]; then
    source $PROJECT_DIR/.venv/bin/activate
    echo "✅ Ambiente virtual ativado"
fi

if ! redis-cli ping &> /dev/null; then
    echo "⚠️ Redis não está rodando. Tentando iniciar..."
    sudo systemctl start redis-server || sudo systemctl start redis
fi

python $PROJECT_DIR/manage.py migrate --run-syncdb
echo "🚀 Servidor Django rodando em http://localhost:8000"
python $PROJECT_DIR/manage.py runserver 0.0.0.0:8000
EOF
chmod +x $PROJECT_DIR/start.sh
print_success "Script start.sh criado"

# Script robôs de exemplo
cat > $PROJECT_DIR/start_robots.sh << 'EOF'
#!/bin/bash
PROJECT_DIR="/var/www/monitoramento"
USER_OPC="opc"

echo "🤖 Iniciando robôs de exemplo..."
if [[ -d "$PROJECT_DIR/.venv" ]]; then
    source $PROJECT_DIR/.venv/bin/activate
fi
COUNT=${1:-3}
python $PROJECT_DIR/run_multiple_robots.py --count $COUNT --prefix robot_exemplo
echo "✅ Robôs iniciados"
EOF
chmod +x $PROJECT_DIR/start_robots.sh
print_success "Script start_robots.sh criado"

echo
echo "🎉 Instalação concluída!"
echo "📋 Execute: $PROJECT_DIR/start.sh"
echo "📋 Para testar robôs: $PROJECT_DIR/start_robots.sh"
