#!/bin/bash
set -e

# Migrações
echo "Aplicando migrações..."
python manage.py migrate --noinput

# Coleta static files
echo "Coletando arquivos estáticos..."
python manage.py collectstatic --noinput

# Inicia Gunicorn
echo "Iniciando Gunicorn..."
exec gunicorn robot_monitor.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers 3 \
    --log-level info
