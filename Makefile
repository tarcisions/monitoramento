.PHONY: build up down logs clean restart migrate createsuperuser shell test

build:
	docker-compose build

up:
	docker-compose up -d --build

down:
	docker-compose down

logs:
	docker-compose logs -f

clean:
	docker-compose down -v
	docker system prune -f

restart:
	docker-compose restart

migrate:
	docker-compose exec backend python manage.py migrate

createsuperuser:
	docker-compose exec backend python manage.py createsuperuser

shell:
	docker-compose exec backend python manage.py shell

test:
	docker-compose exec backend python manage.py test

backup-db:
	docker-compose exec postgres pg_dump -U rpa_user rpa_monitoramento > backup_$(shell date +%Y%m%d_%H%M%S).sql

restore-db:
	@read -p "Digite o caminho do arquivo de backup: " backup_file; \
	docker-compose exec -T postgres psql -U rpa_user -d rpa_monitoramento < $$backup_file

status:
	docker-compose ps

logs-backend:
	docker-compose logs -f backend

logs-agent:
	docker-compose logs -f agent

logs-celery:
	docker-compose logs -f celery_worker celery_beat

scale-agents:
	@read -p "Numero de agentes: " count; \
	docker-compose up -d --scale agent=$$count

health:
	@echo "Verificando saude dos servicos..."
	@curl -s http://localhost/health/ || echo "Backend: FALHA"
	@curl -s http://localhost:3000/api/health || echo "Grafana: FALHA"
	@curl -s http://localhost:9090/-/healthy || echo "Prometheus: FALHA"
	@curl -s http://localhost:3100/ready || echo "Loki: FALHA"
