#!/bin/bash
set -e

# Função para aguardar serviço
wait_for_service() {
  local host=$1
  local port=$2
  echo "Aguardando $host:$port..."
  while ! nc -z "$host" "$port"; do
    sleep 1
  done
  echo "$host:$port pronto!"
}

# Espera pelos serviços
wait_for_service "$POSTGRES_HOST" 5432
wait_for_service "$REDIS_HOST" 6379

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
