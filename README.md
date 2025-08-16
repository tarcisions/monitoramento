# Sistema de Monitoramento e Orquestração RPA

Sistema completo para monitoramento e orquestração de robôs RPA com interface web, métricas em tempo real e observabilidade completa.

## 🔧 Requisitos Mínimos

### Sistema Operacional
- Linux (Ubuntu 20.04+ recomendado) ou Windows 10+ com WSL2
- 4GB RAM mínimo (8GB+ recomendado)
- 20GB espaço em disco disponível
- Conectividade de internet para download das imagens Docker

### Software
- Docker 20.10+
- Docker Compose 2.0+
- Git
- Make (opcional, para comandos facilitados)

## 🚀 Instalação Passo a Passo

### 1. Clone o Repositório
```bash
git clone <url-do-repositorio>
cd rpa-monitoramento
```

### 2. Configure as Variáveis de Ambiente
```bash
cp server/.env.example server/.env
```

Edite o arquivo `server/.env` com suas configurações:
```bash
nano server/.env
```

### 3. Construa e Execute os Serviços
```bash
docker-compose up -d --build
```

### 4. Verifique se os Serviços Estão Rodando
```bash
docker-compose ps
```

### 5. Acesse a Interface Web
- Interface Principal: http://localhost
- Grafana: http://localhost/grafana
- Prometheus: http://localhost/prometheus
- API: http://localhost/api

### 6. Faça Login no Sistema
Usuário padrão:
- **Usuário**: admin
- **Senha**: admin123

## 📋 Arquitetura do Sistema

### Componentes Principais

#### Backend (Django REST Framework)
- **Porta**: 8000 (interna)
- **Tecnologias**: Python 3.11, Django 4.2, PostgreSQL, Redis, Celery
- **Função**: API REST, autenticação JWT, processamento assíncrono

#### Frontend (React + Vite)
- **Porta**: 80 (via nginx)
- **Tecnologias**: React 18, Vite, Bootstrap 5, Axios
- **Função**: Interface web para gerenciamento de robôs e jobs

#### Agente RPA
- **Porta**: 9091 (métricas Prometheus)
- **Tecnologias**: Python 3.11, Redis pub/sub, psutil
- **Função**: Execução de comandos nos robôs, coleta de métricas

#### Observabilidade
- **Grafana**: 3000 (interna), /grafana (externa)
- **Prometheus**: 9090 (interna), /prometheus (externa) 
- **Loki**: 3100 (interna)

#### Proxy Reverso
- **Nginx**: 80 (externa)
- **Função**: Roteamento de requisições, balanceamento

## 🌐 Portas e Endpoints

### Portas Externas (Acessíveis via Browser)
| Serviço | Porta | URL | Descrição |
|---------|-------|-----|----------|
| Interface Web | 80 | http://localhost | Interface principal do sistema |
| API REST | 80 | http://localhost/api | Endpoints da API |
| Django Admin | 80 | http://localhost/admin | Painel administrativo |
| Grafana | 80 | http://localhost/grafana | Dashboards de monitoramento |
| Prometheus | 80 | http://localhost/prometheus | Interface do Prometheus |

### Portas Internas (Comunicação entre Serviços)
| Serviço | Porta | Função |
|---------|-------|---------|
| PostgreSQL | 5432 | Banco de dados principal |
| Redis | 6379 | Message broker e cache |
| Django Backend | 8000 | API REST interna |
| Grafana | 3000 | Interface interna |
| Prometheus | 9090 | Coleta de métricas |
| Loki | 3100 | Agregação de logs |
| Agente RPA | 9091 | Métricas do agente |

## ⚙️ Variáveis de Ambiente

### Configurações do Banco de Dados
```bash
# PostgreSQL
POSTGRES_DB=rpa_monitoramento          # Nome do banco
POSTGRES_USER=rpa_user                 # Usuário do banco
POSTGRES_PASSWORD=rpa_password         # Senha do banco
POSTGRES_HOST=postgres                 # Host do banco
POSTGRES_PORT=5432                     # Porta do banco
```

### Configurações do Redis
```bash
# Redis URLs
REDIS_URL=redis://redis:6379/0         # URL principal do Redis
CELERY_BROKER_URL=redis://redis:6379/0 # Broker do Celery
CELERY_RESULT_BACKEND=redis://redis:6379/0 # Backend de resultados
```

### Configurações do Django
```bash
# Django
SECRET_KEY=sua-chave-secreta-muito-segura-aqui  # Chave secreta (ALTERE!)
DEBUG=False                                      # Modo debug (produção: False)
ALLOWED_HOSTS=*                                  # Hosts permitidos
```

### Configurações de Usuários Padrão
```bash
# Superusuário Django
DJANGO_SUPERUSER_USERNAME=admin        # Nome do admin
DJANGO_SUPERUSER_EMAIL=admin@rpa.local # Email do admin
DJANGO_SUPERUSER_PASSWORD=admin123     # Senha do admin (ALTERE!)

# Grafana
GF_SECURITY_ADMIN_USER=admin           # Usuário admin Grafana
GF_SECURITY_ADMIN_PASSWORD=admin       # Senha admin Grafana (ALTERE!)
```

### Configurações do Agente
```bash
# Agente RPA
AGENT_TOKEN=token-agente-padrao        # Token de autenticação do agente
AGENT_NAME=agente-01                   # Nome identificador do agente
```

## 📊 Como Usar o Sistema

### 1. Gerenciamento de Robôs

#### Cadastrar um Novo Robô
1. Acesse http://localhost
2. Faça login com admin/admin123
3. Vá para "Robôs" → "Novo Robô"
4. Preencha os dados:
   - **Nome**: Nome identificador do robô
   - **Host**: IP ou hostname da máquina
   - **Token do Agente**: Token para autenticação
   - **Ativo**: Marque se o robô está disponível

#### Instalar o Agente no Robô
1. Copie a pasta `agent/` para a máquina do robô
2. Configure as variáveis de ambiente:
   ```bash
   export AGENT_TOKEN="seu-token-aqui"
   export AGENT_NAME="nome-do-agente"
   export REDIS_URL="redis://ip-do-servidor:6379/0"
   ```
3. Execute o agente:
   ```bash
   cd agent/
   python main.py
   ```

### 2. Gerenciamento de Jobs

#### Criar um Novo Job
1. Vá para "Jobs" → "Novo Job"
2. Configure:
   - **Nome**: Nome descritivo do job
   - **Comando**: Comando a ser executado no robô
   - **Timeout**: Tempo limite em segundos
   - **Parâmetros Padrão**: JSON com parâmetros (opcional)
   - **Ativo**: Se o job pode ser executado

Exemplo de Job:
```json
{
  "nome": "Processamento de Notas Fiscais",
  "comando": "python /opt/scripts/processar_nf.py",
  "timeout_s": 1800,
  "parametros_padrao": {
    "diretorio": "/data/nf_pendentes",
    "formato": "xml",
    "validar": true
  }
}
```

### 3. Execução de Jobs

#### Executar Job Manualmente
1. Vá para "Execuções" → "Nova Execução"
2. Selecione:
   - **Robô**: Robô que executará o job
   - **Job**: Job a ser executado
   - **Parâmetros**: Parâmetros específicos (JSON)
3. Clique em "Executar"

#### Acompanhar Execuções
1. Acesse "Execuções" para ver status em tempo real
2. Clique em uma execução para ver detalhes:
   - Logs de execução
   - Tempo decorrido
   - Status atual
   - Métricas de performance

### 4. Monitoramento

#### Dashboards Grafana
1. Acesse http://localhost/grafana
2. Login: admin/admin
3. Dashboards disponíveis:
   - **RPA Overview**: Visão geral do sistema
   - **RPA Logs**: Análise de logs

#### Métricas Prometheus
- Taxa de sucesso de jobs
- Tempo médio de execução
- Status dos robôs
- Uso de recursos do sistema

## 🔧 Comandos Úteis

### Docker Compose
```bash
# Iniciar todos os serviços
docker-compose up -d

# Parar todos os serviços
docker-compose down

# Ver logs de um serviço específico
docker-compose logs -f backend

# Reiniciar um serviço
docker-compose restart backend

# Reconstruir e reiniciar
docker-compose up -d --build

# Ver status dos serviços
docker-compose ps
```

### Makefile (Comandos Facilitados)
```bash
# Configuração inicial
make setup

# Iniciar sistema
make start

# Parar sistema
make stop

# Ver logs
make logs

# Backup do banco
make backup

# Restaurar backup
make restore

# Limpar dados
make clean
```

### Gerenciamento do Django
```bash
# Acessar shell do Django
docker-compose exec backend python manage.py shell

# Criar superusuário
docker-compose exec backend python manage.py createsuperuser

# Aplicar migrações
docker-compose exec backend python manage.py migrate

# Coletar arquivos estáticos
docker-compose exec backend python manage.py collectstatic
```

## 🛠️ Manutenção do Sistema

### Backup Regular

#### Backup do Banco de Dados
```bash
# Criar backup
docker-compose exec postgres pg_dump -U rpa_user rpa_monitoramento > backup_$(date +%Y%m%d_%H%M%S).sql

# Restaurar backup
docker-compose exec -i postgres psql -U rpa_user rpa_monitoramento < backup_20240101_120000.sql
```

#### Backup de Configurações
```bash
# Backup das configurações
tar -czf config_backup_$(date +%Y%m%d).tar.gz \
  server/.env \
  observabilidade/ \
  nginx/nginx.conf \
  docker-compose.yml
```

### Limpeza de Dados

#### Limpar Logs Antigos
```bash
# Manter apenas logs dos últimos 30 dias
docker-compose exec backend python manage.py shell -c "
from app.core.models import LogExecucao
from datetime import datetime, timedelta
LogExecucao.objects.filter(
    data_hora__lt=datetime.now() - timedelta(days=30)
).delete()
"
```

#### Limpar Execuções Antigas
```bash
# Manter apenas execuções dos últimos 90 dias
docker-compose exec backend python manage.py shell -c "
from app.core.models import ExecucaoRobo
from datetime import datetime, timedelta
ExecucaoRobo.objects.filter(
    data_inicio__lt=datetime.now() - timedelta(days=90)
).delete()
"
```

### Monitoramento de Performance

#### Verificar Uso de Recursos
```bash
# Uso de CPU e Memória
docker stats

# Espaço em disco
docker system df

# Logs de sistema
docker-compose logs --tail=100
```

#### Métricas Importantes
- Taxa de sucesso dos jobs (>95%)
- Tempo médio de execução (<timeout configurado)
- Uso de memória (<80%)
- Espaço em disco (<85%)

### Atualizações

#### Atualizar o Sistema
```bash
# 1. Fazer backup
make backup

# 2. Baixar atualizações
git pull origin main

# 3. Reconstruir containers
docker-compose build --no-cache

# 4. Aplicar migrações
docker-compose run backend python manage.py migrate

# 5. Reiniciar sistema
docker-compose up -d
```

## 🔍 Troubleshooting

### Problemas Comuns

#### 1. Containers não Iniciam

**Sintoma**: `docker-compose up` falha

**Possíveis Causas e Soluções**:
```bash
# Verificar logs
docker-compose logs

# Verificar portas ocupadas
netstat -tulpn | grep :80
netstat -tulpn | grep :5432

# Limpar containers antigos
docker-compose down -v
docker system prune -f

# Reconstruir do zero
docker-compose build --no-cache
docker-compose up -d
```

#### 2. Erro de Conexão com Banco

**Sintoma**: Django não consegue conectar ao PostgreSQL

**Soluções**:
```bash
# Verificar se PostgreSQL está rodando
docker-compose ps postgres

# Verificar logs do PostgreSQL
docker-compose logs postgres

# Testar conexão manual
docker-compose exec postgres psql -U rpa_user -d rpa_monitoramento

# Recriar volume do banco
docker-compose down -v
docker volume rm rpa-monitoramento_postgres_data
docker-compose up -d
```

#### 3. Redis não Disponível

**Sintoma**: Celery workers não conseguem conectar

**Soluções**:
```bash
# Verificar status do Redis
docker-compose ps redis

# Testar conexão Redis
docker-compose exec redis redis-cli ping

# Reiniciar Redis
docker-compose restart redis

# Verificar configuração
echo $REDIS_URL
```

#### 4. Interface Web não Carrega

**Sintoma**: Página em branco ou erro 502

**Soluções**:
```bash
# Verificar status do nginx
docker-compose ps nginx

# Verificar logs do nginx
docker-compose logs nginx

# Verificar se backend está rodando
docker-compose ps backend

# Testar endpoint diretamente
curl http://localhost/api/health/

# Reconstruir frontend
docker-compose build frontend
docker-compose up -d frontend
```

#### 5. Agente não Conecta

**Sintoma**: Robô aparece offline no painel

**Soluções**:
```bash
# Verificar logs do agente
python agent/main.py

# Verificar token de autenticação
echo $AGENT_TOKEN

# Testar conectividade Redis
telnet <ip-servidor> 6379

# Verificar firewall
sudo ufw status
sudo firewall-cmd --list-ports
```

#### 6. Jobs não Executam

**Sintoma**: Jobs ficam na fila sem executar

**Soluções**:
```bash
# Verificar workers Celery
docker-compose logs celery_worker

# Verificar fila do Celery
docker-compose exec backend python manage.py shell -c "
from celery import Celery
app = Celery('app')
i = app.control.inspect()
print('Active:', i.active())
print('Scheduled:', i.scheduled())
"

# Reiniciar workers
docker-compose restart celery_worker celery_beat
```

#### 7. Grafana não Mostra Dados

**Sintoma**: Dashboards vazios ou "No data"

**Soluções**:
```bash
# Verificar se Prometheus está coletando
curl http://localhost/prometheus/api/v1/targets

# Verificar métricas disponíveis
curl http://localhost/api/metrics/

# Reiniciar Prometheus
docker-compose restart prometheus

# Verificar configuração do datasource
# Grafana → Configuration → Data Sources
```

### Logs Importantes

#### Locais dos Logs
```bash
# Logs do Django
docker-compose logs backend

# Logs do Celery
docker-compose logs celery_worker
docker-compose logs celery_beat

# Logs do Nginx
docker-compose logs nginx

# Logs do Agente
# (no host do robô)
tail -f /var/log/rpa_agent.log
```

#### Níveis de Log
- **DEBUG**: Informações detalhadas de desenvolvimento
- **INFO**: Informações gerais de operação
- **WARNING**: Situações que merecem atenção
- **ERROR**: Erros que impedem operação normal
- **CRITICAL**: Erros críticos que afetam o sistema

### Monitoramento de Saúde

#### Endpoints de Health Check
```bash
# API Backend
curl http://localhost/api/health/

# Banco de dados
curl http://localhost/api/health/database/

# Redis
curl http://localhost/api/health/redis/

# Celery
curl http://localhost/api/health/celery/
```

#### Alertas Recomendados

Configure alertas para:
- Uso de CPU > 80%
- Uso de memória > 85%
- Uso de disco > 90%
- Taxa de erro > 5%
- Tempo de resposta > 5s
- Robôs offline > 10min

## 📞 Suporte

### Informações para Suporte

Ao reportar problemas, inclua:

1. **Versão do sistema**: `git describe --tags`
2. **Ambiente**: Desenvolvimento/Produção
3. **Sistema operacional**: `uname -a`
4. **Versão Docker**: `docker --version`
5. **Logs relevantes**: últimas 50 linhas
6. **Configuração**: arquivos .env (sem senhas)

### Coleta de Informações

```bash
# Script para coleta automática
#!/bin/bash
echo "=== INFORMAÇÕES DO SISTEMA ==="
date
uname -a
docker --version
docker-compose --version

echo -e "\n=== STATUS DOS SERVIÇOS ==="
docker-compose ps

echo -e "\n=== USO DE RECURSOS ==="
docker stats --no-stream

echo -e "\n=== LOGS RECENTES ==="
docker-compose logs --tail=20
```

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

## 🏗️ Contribuindo

1. Faça fork do repositório
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Crie um Pull Request

## 📚 Documentação Adicional

- **API Documentation**: `/docs/postman_collection.json`
- **Architecture Overview**: `/docs/architecture.md`
- **Development Guide**: `/docs/development.md`
- **Deployment Guide**: `/docs/deployment.md`
