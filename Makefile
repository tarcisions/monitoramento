.PHONY: help build up down restart logs clean backup restore

help:
	@echo "Comandos disponíveis:"
	@echo "  build     - Construir as imagens Docker"
	@echo "  up        - Iniciar todos os serviços"
	@echo "  down      - Parar todos os serviços"
	@echo "  restart   - Reiniciar todos os serviços"
	@echo "  logs      - Visualizar logs de todos os serviços"
	@echo "  clean     - Limpar containers e volumes (CUIDADO: apaga dados)"
	@echo "  backup    - Fazer backup do banco de dados"
	@echo "  restore   - Restaurar backup do banco de dados"

build:
	docker-compose build

up:
	docker-compose up -d --build

down:
	docker-compose down

restart:
	docker-compose restart

logs:
	docker-compose logs -f

clean:
	docker-compose down -v
	docker system prune -f

backup:
	docker-compose exec postgres pg_dump -U postgres rpa_db > backup_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "Backup criado: backup_$(shell date +%Y%m%d_%H%M%S).sql"

restore:
	@read -p "Digite o nome do arquivo de backup: " backup_file; \
	docker-compose exec -T postgres psql -U postgres rpa_db < $$backup_file

