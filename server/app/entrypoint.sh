#!/bin/bash

echo "Aguardando PostgreSQL..."
while ! pg_isready -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_USER; do
    sleep 2
done

echo "Aplicando migrações..."
python manage.py migrate

echo "Coletando arquivos estáticos..."
python manage.py collectstatic --noinput

echo "Criando superusuário..."
python manage.py shell << EOF
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='$DJANGO_SUPERUSER_USERNAME').exists():
    User.objects.create_superuser(
        username='$DJANGO_SUPERUSER_USERNAME',
        email='$DJANGO_SUPERUSER_EMAIL',
        password='$DJANGO_SUPERUSER_PASSWORD'
    )
    print('Superusuário criado com sucesso')
else:
    print('Superusuário já existe')
EOF

echo "Criando grupos de permissão..."
python manage.py shell << EOF
from django.contrib.auth.models import Group, Permission

grupos = ['admin', 'operador', 'leitor']
for grupo_nome in grupos:
    grupo, criado = Group.objects.get_or_create(name=grupo_nome)
    if criado:
        print(f'Grupo {grupo_nome} criado')
    else:
        print(f'Grupo {grupo_nome} já existe')
EOF

echo "Iniciando servidor..."
exec gunicorn app.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers 4 \
    --worker-class gevent \
    --worker-connections 1000 \
    --timeout 120 \
    --keepalive 2 \
    --max-requests 1000 \
    --max-requests-jitter 100 \
    --access-logfile - \
    --error-logfile -
