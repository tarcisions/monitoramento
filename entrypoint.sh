#!/bin/bash
set -e

echo "Aplicando migrações..."
python manage.py migrate --noinput

echo "Coletando arquivos estáticos..."
python manage.py collectstatic --noinput

# Inicia Daphne em background
echo "Iniciando Daphne (WebSockets)..."
daphne -b 0.0.0.0 -p 8001 robot_monitor.asgi:application &

# Inicia Gunicorn para HTTP
echo "Iniciando Gunicorn (HTTP)..."
exec gunicorn robot_monitor.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers 3 \
    --log-level info
