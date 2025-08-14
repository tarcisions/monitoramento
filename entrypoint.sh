#!/bin/bash
set -e

# -----------------------------
# Definir variável de ambiente do Django
# -----------------------------
export DJANGO_SETTINGS_MODULE=robot_monitor.settings

# -----------------------------
# Aplicar migrações
# -----------------------------
echo "Aplicando migrações..."
python manage.py migrate --noinput

# -----------------------------
# Coletar arquivos estáticos
# -----------------------------
echo "Coletando arquivos estáticos..."
python manage.py collectstatic --noinput

# -----------------------------
# Função para iniciar Daphne
# -----------------------------
start_daphne() {
    echo "Iniciando Daphne (WebSockets) na porta 8001..."
    daphne -b 0.0.0.0 -p 8001 robot_monitor.asgi:application \
        > /app/logs/daphne.log 2>&1 &
    DAPHNE_PID=$!
    echo "Daphne iniciado com PID $DAPHNE_PID"
}

# Criar pasta de logs se não existir
mkdir -p /app/logs

# -----------------------------
# Loop de monitoramento do Daphne
# -----------------------------
start_daphne

(
while true; do
    if ! kill -0 $DAPHNE_PID 2>/dev/null; then
        echo "Daphne parou! Reiniciando..."
        start_daphne
    fi
    sleep 5
done
) &

# -----------------------------
# Iniciar Gunicorn (HTTP)
# -----------------------------
echo "Iniciando Gunicorn (HTTP) na porta 8000..."
exec gunicorn robot_monitor.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers 3 \
    --log-level info
