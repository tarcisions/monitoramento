
@echo off
echo 🚀 Iniciando RPA Monitor...

REM Verificar se Docker está instalado
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker não encontrado. Por favor, instale o Docker primeiro.
    pause
    exit /b 1
)

docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Compose não encontrado. Por favor, instale o Docker Compose primeiro.
    pause
    exit /b 1
)

REM Criar arquivo .env se não existir
if not exist .env (
    echo 📝 Criando arquivo .env...
    copy .env.example .env
    echo ✅ Arquivo .env criado. Edite as configurações se necessário.
)

REM Criar diretórios necessários
echo 📁 Criando diretórios...
if not exist "infra\docker\logs\nginx" mkdir "infra\docker\logs\nginx"
if not exist "infra\docker\ssl" mkdir "infra\docker\ssl"

REM Navegar para o diretório do Docker
cd infra\docker

echo 🐳 Iniciando containers Docker...
docker-compose up -d

echo.
echo 🎉 RPA Monitor iniciado com sucesso!
echo.
echo 📊 Acesse as aplicações:
echo    • Frontend: http://localhost
echo    • API: http://localhost/api
echo    • Grafana: http://localhost:3000 (admin/admin123)
echo    • Prometheus: http://localhost:9090
echo.
echo 📝 Para parar o sistema: docker-compose down
echo 📝 Para ver logs: docker-compose logs -f
pause
