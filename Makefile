# RPA Monitor - Makefile para desenvolvimento e produção

.PHONY: help dev build up down logs clean test lint format migrate seed

# Configurações padrão
COMPOSE_FILE = infra/docker/docker-compose.yml
ENV_FILE = .env

# Cores para output
RED=\033[0;31m
GREEN=\033[0;32m
YELLOW=\033[1;33m
BLUE=\033[0;34m
NC=\033[0m # No Color

help: ## Mostra esta mensagem de ajuda
	@echo "$(BLUE)RPA Monitor - Sistema de Monitoramento$(NC)"
	@echo ""
	@echo "$(YELLOW)Comandos disponíveis:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-15s$(NC) %s\n", $$1, $$2}'

# =============================================================================
# DESENVOLVIMENTO
# =============================================================================

dev: ## Inicia o ambiente de desenvolvimento
	@echo "$(BLUE)Iniciando ambiente de desenvolvimento...$(NC)"
	@if [ ! -f $(ENV_FILE) ]; then \
		echo "$(YELLOW)Criando arquivo .env a partir do .env.example...$(NC)"; \
		cp .env.example $(ENV_FILE); \
	fi
	@cd backend && python -m venv .venv || true
	@cd backend && .venv/bin/pip install -r requirements.txt || .venv/Scripts/pip install -r requirements.txt
	@echo "$(GREEN)Backend Python configurado$(NC)"
	@npm install
	@echo "$(GREEN)Frontend Node.js configurado$(NC)"
	@echo "$(YELLOW)Para iniciar o desenvolvimento:$(NC)"
	@echo "  1. Terminal 1: cd backend && .venv/bin/python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
	@echo "  2. Terminal 2: npm run dev"
	@echo "  3. Acesse: http://localhost:5000"

install-deps: ## Instala dependências do projeto
	@echo "$(BLUE)Instalando dependências...$(NC)"
	@cd backend && pip install -r requirements.txt
	@npm install
	@echo "$(GREEN)Dependências instaladas$(NC)"

# =============================================================================
# DOCKER
# =============================================================================

build: ## Constrói as imagens Docker
	@echo "$(BLUE)Construindo imagens Docker...$(NC)"
	@docker compose -f $(COMPOSE_FILE) build
	@echo "$(GREEN)Imagens construídas com sucesso$(NC)"

up: ## Sobe todos os serviços
	@echo "$(BLUE)Subindo serviços...$(NC)"
	@if [ ! -f $(ENV_FILE) ]; then \
		echo "$(YELLOW)Criando arquivo .env a partir do .env.example...$(NC)"; \
		cp .env.example $(ENV_FILE); \
	fi
	@docker compose -f $(COMPOSE_FILE) up -d --build
	@echo "$(GREEN)Serviços iniciados$(NC)"
	@echo "$(YELLOW)Serviços disponíveis:$(NC)"
	@echo "  Frontend: http://localhost"
	@echo "  API: http://localhost/api"
	@echo "  Grafana: http://localhost:3000 (admin/admin123)"
	@echo "  Prometheus: http://localhost:9090"

down: ## Para todos os serviços
	@echo "$(BLUE)Parando serviços...$(NC)"
	@docker compose -f $(COMPOSE_FILE) down
	@echo "$(GREEN)Serviços parados$(NC)"

restart: ## Reinicia todos os serviços
	@echo "$(BLUE)Reiniciando serviços...$(NC)"
	@docker compose -f $(COMPOSE_FILE) restart
	@echo "$(GREEN)Serviços reiniciados$(NC)"

logs: ## Mostra logs dos serviços
	@docker compose -f $(COMPOSE_FILE) logs -f

logs-backend: ## Mostra logs apenas do backend
	@docker compose -f $(COMPOSE_FILE) logs -f backend

logs-frontend: ## Mostra logs apenas do frontend
	@docker compose -f $(COMPOSE_FILE) logs -f frontend

logs-db: ## Mostra logs do banco de dados
	@docker compose -f $(COMPOSE_FILE) logs -f db

logs-robot: ## Mostra logs do robô demo
	@docker compose -f $(COMPOSE_FILE) logs -f rpa-demo

# =============================================================================
# BANCO DE DADOS
# =============================================================================

migrate: ## Executa migrações do banco de dados
	@echo "$(BLUE)Executando migrações...$(NC)"
	@docker compose -f $(COMPOSE_FILE) exec backend alembic upgrade head
	@echo "$(GREEN)Migrações executadas$(NC)"

migrate-create: ## Cria uma nova migração (use: make migrate-create MSG="descrição")
	@echo "$(BLUE)Criando nova migração...$(NC)"
	@if [ -z "$(MSG)" ]; then \
		echo "$(RED)Erro: Use make migrate-create MSG='descrição da migração'$(NC)"; \
		exit 1; \
	fi
	@docker compose -f $(COMPOSE_FILE) exec backend alembic revision --autogenerate -m "$(MSG)"
	@echo "$(GREEN)Migração criada$(NC)"

seed: ## Executa seed inicial dos dados
	@echo "$(BLUE)Executando seed inicial...$(NC)"
	@docker compose -f $(COMPOSE_FILE) exec backend python -c "from app.main import *; print('Seed executado via startup')"
	@echo "$(GREEN)Seed executado$(NC)"

db-reset: ## Reset completo do banco (CUIDADO!)
	@echo "$(RED)ATENÇÃO: Isso irá apagar TODOS os dados!$(NC)"
	@read -p "Tem certeza? (y/N): " confirm && [ "$$confirm" = "y" ]
	@docker compose -f $(COMPOSE_FILE) down -v
	@docker volume rm $$(docker volume ls -q | grep rpa-monitor) || true
	@docker compose -f $(COMPOSE_FILE) up -d db redis
	@sleep 10
	@docker compose -f $(COMPOSE_FILE) up -d backend
	@echo "$(GREEN)Banco resetado$(NC)"

# =============================================================================
# MONITORAMENTO
# =============================================================================

status: ## Mostra status dos serviços
	@echo "$(BLUE)Status dos serviços:$(NC)"
	@docker compose -f $(COMPOSE_FILE) ps

health: ## Verifica saúde dos serviços
	@echo "$(BLUE)Verificando saúde dos serviços...$(NC)"
	@curl -f http://localhost/api/health && echo "$(GREEN) ✓ Backend OK$(NC)" || echo "$(RED) ✗ Backend ERRO$(NC)"
	@curl -f http://localhost/health && echo "$(GREEN) ✓ Nginx OK$(NC)" || echo "$(RED) ✗ Nginx ERRO$(NC)"
	@curl -f http://localhost:9090/-/healthy && echo "$(GREEN) ✓ Prometheus OK$(NC)" || echo "$(RED) ✗ Prometheus ERRO$(NC)"
	@curl -f http://localhost:3000/api/health && echo "$(GREEN) ✓ Grafana OK$(NC)" || echo "$(RED) ✗ Grafana ERRO$(NC)"

metrics: ## Mostra métricas dos robôs
	@echo "$(BLUE)Métricas dos robôs:$(NC)"
	@curl -s http://localhost/metrics | grep "rpa_" | head -20

# =============================================================================
# DESENVOLVIMENTO E TESTES
# =============================================================================

test: ## Executa testes
	@echo "$(BLUE)Executando testes...$(NC)"
	@cd backend && python -m pytest tests/ -v
	@echo "$(GREEN)Testes executados$(NC)"

lint: ## Executa linting do código
	@echo "$(BLUE)Executando linting...$(NC)"
	@cd backend && python -m flake8 app/
	@cd backend && python -m mypy app/
	@npm run lint || true
	@echo "$(GREEN)Linting executado$(NC)"

format: ## Formata o código
	@echo "$(BLUE)Formatando código...$(NC)"
	@cd backend && python -m black app/
	@cd backend && python -m isort app/
	@npm run format || true
	@echo "$(GREEN)Código formatado$(NC)"

# =============================================================================
# UTILITÁRIOS
# =============================================================================

clean: ## Remove containers, volumes e imagens não utilizados
	@echo "$(BLUE)Limpando recursos Docker...$(NC)"
	@docker compose -f $(COMPOSE_FILE) down -v
	@docker system prune -f
	@docker volume prune -f
	@echo "$(GREEN)Limpeza concluída$(NC)"

backup: ## Cria backup do banco de dados
	@echo "$(BLUE)Criando backup do banco...$(NC)"
	@mkdir -p backups
	@docker compose -f $(COMPOSE_FILE) exec -T db pg_dump -U rpa_user rpa_monitor > backups/backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "$(GREEN)Backup criado em backups/$(NC)"

restore: ## Restaura backup do banco (use: make restore FILE=backup.sql)
	@echo "$(BLUE)Restaurando backup...$(NC)"
	@if [ -z "$(FILE)" ]; then \
		echo "$(RED)Erro: Use make restore FILE=backup.sql$(NC)"; \
		exit 1; \
	fi
	@if [ ! -f "backups/$(FILE)" ]; then \
		echo "$(RED)Erro: Arquivo backups/$(FILE) não encontrado$(NC)"; \
		exit 1; \
	fi
	@docker compose -f $(COMPOSE_FILE) exec -T db psql -U rpa_user -d rpa_monitor < backups/$(FILE)
	@echo "$(GREEN)Backup restaurado$(NC)"

shell-backend: ## Acessa shell do container backend
	@docker compose -f $(COMPOSE_FILE) exec backend bash

shell-db: ## Acessa shell do PostgreSQL
	@docker compose -f $(COMPOSE_FILE) exec db psql -U rpa_user -d rpa_monitor

shell-redis: ## Acessa shell do Redis
	@docker compose -f $(COMPOSE_FILE) exec redis redis-cli

# =============================================================================
# PRODUÇÃO
# =============================================================================

deploy: ## Deploy para produção
	@echo "$(BLUE)Fazendo deploy para produção...$(NC)"
	@echo "$(YELLOW)Verificando configurações...$(NC)"
	@if grep -q "admin123\|rpa_password\|redis_password" $(ENV_FILE); then \
		echo "$(RED)ERRO: Ainda existem senhas padrão no .env!$(NC)"; \
		echo "$(YELLOW)Altere as senhas antes do deploy em produção$(NC)"; \
		exit 1; \
	fi
	@docker compose -f $(COMPOSE_FILE) up -d --build
	@echo "$(GREEN)Deploy realizado$(NC)"

ssl-setup: ## Configura certificados SSL (Let's Encrypt)
	@echo "$(BLUE)Configurando SSL...$(NC)"
	@mkdir -p infra/docker/ssl
	@echo "$(YELLOW)Para configurar SSL:$(NC)"
	@echo "1. Obtenha certificados do Let's Encrypt ou seu provedor"
	@echo "2. Copie cert.pem e key.pem para infra/docker/ssl/"
	@echo "3. Descomente a seção HTTPS no nginx.conf"
	@echo "4. Execute: make restart"

production-check: ## Verifica se está pronto para produção
	@echo "$(BLUE)Verificando configuração de produção...$(NC)"
	@echo "$(YELLOW)Checklist de produção:$(NC)"
	@if grep -q "troque-esta-chave\|admin123\|rpa_password" $(ENV_FILE); then \
		echo "$(RED)✗ Senhas padrão encontradas no .env$(NC)"; \
	else \
		echo "$(GREEN)✓ Senhas alteradas$(NC)"; \
	fi
	@if grep -q "ENV=production" $(ENV_FILE); then \
		echo "$(GREEN)✓ Ambiente configurado para produção$(NC)"; \
	else \
		echo "$(YELLOW)⚠ Ambiente não configurado para produção$(NC)"; \
	fi
	@if [ -f "infra/docker/ssl/cert.pem" ]; then \
		echo "$(GREEN)✓ Certificados SSL encontrados$(NC)"; \
	else \
		echo "$(YELLOW)⚠ Certificados SSL não configurados$(NC)"; \
	fi

# =============================================================================
# INFORMAÇÕES
# =============================================================================

info: ## Mostra informações do sistema
	@echo "$(BLUE)RPA Monitor - Informações do Sistema$(NC)"
	@echo ""
	@echo "$(YELLOW)Arquitetura:$(NC)"
	@echo "  Backend: Python FastAPI + PostgreSQL + Redis"
	@echo "  Frontend: React + TypeScript + Tailwind CSS"
	@echo "  Monitoramento: Prometheus + Grafana + Loki"
	@echo "  Proxy: Nginx"
	@echo ""
	@echo "$(YELLOW)Portas padrão:$(NC)"
	@echo "  80: Nginx (Frontend + API)"
	@echo "  3000: Grafana"
	@echo "  9090: Prometheus"
	@echo "  8000: Backend API (interno)"
	@echo "  5432: PostgreSQL (interno)"
	@echo "  6379: Redis (interno)"
	@echo ""
	@echo "$(YELLOW)Credenciais padrão:$(NC)"
	@echo "  App: admin@rpamonitor.com / admin123"
	@echo "  Grafana: admin / admin123"
	@echo ""
	@echo "$(GREEN)Para começar: make dev$(NC)"

ports: ## Mostra portas utilizadas
	@echo "$(BLUE)Portas utilizadas:$(NC)"
	@netstat -tlnp 2>/dev/null | grep -E ':(80|3000|8000|9090|5432|6379|3100|9100|8080|9101)' || true

# Default target
.DEFAULT_GOAL := help
