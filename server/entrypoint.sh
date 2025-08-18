#!/bin/bash

echo "Aguardando banco de dados..."

python << END
import time
import socket

host = "postgres"
port = 5432

while True:
    try:
        with socket.create_connection((host, port), timeout=1):
            break
    except OSError:
        time.sleep(0.1)
END

echo "Executando migrations..."
python manage.py migrate

echo "Coletando arquivos estáticos..."
python manage.py collectstatic --noinput

if [ "$DJANGO_SUPERUSER_USERNAME" ] && [ "$DJANGO_SUPERUSER_PASSWORD" ] && [ "$DJANGO_SUPERUSER_EMAIL" ]; then
    echo "Criando superusuário..."
    python manage.py shell -c "
from django.contrib.auth.models import User
import os
username = os.environ.get('DJANGO_SUPERUSER_USERNAME')
password = os.environ.get('DJANGO_SUPERUSER_PASSWORD')
email = os.environ.get('DJANGO_SUPERUSER_EMAIL')
if not User.objects.filter(username=username).exists():
    User.objects.create_superuser(username, email, password)
    print('Superusuário criado com sucesso')
else:
    print('Superusuário já existe')
"
fi

echo "Iniciando servidor..."
exec gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 3
