#!/bin/bash
set -e

# Espera pelo Postgres
echo "Aguardando Postgres..."
while ! nc -z $POSTGRES_HOST 5432; do
  sleep 1
done
echo "Postgres pronto!"

# Espera pelo Redis
echo "Aguardando Redis..."
while ! nc -z $REDIS_HOST 6379; do
  sleep 1
done
echo "Redis pronto!"

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
