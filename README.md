# Sistema RPA - Monitoramento e Orquestração com Observabilidade Completa

Sistema web completo para monitoramento e orquestração de robôs RPA (Robotic Process Automation), desenvolvido com Django REST Framework no backend, React no frontend, PostgreSQL como banco de dados e stack completa de observabilidade com Grafana, Prometheus e Loki.

## Visão Geral

Este sistema permite o cadastro, monitoramento e controle de robôs RPA através de uma interface web moderna e intuitiva, complementado por uma stack completa de observabilidade para monitoramento em tempo real, análise de métricas e logs estruturados.

### Principais Funcionalidades

- **Cadastro de Robôs**: Gerenciamento completo de robôs com informações de host, token de agente e status
- **Cadastro de Jobs**: Criação e gerenciamento de jobs com comandos, timeouts e parâmetros personalizáveis
- **Controle de Execuções**: Monitoramento em tempo real com controles para iniciar, pausar, parar e retomar execuções
- **Autenticação JWT**: Sistema seguro de autenticação com tokens JWT
- **Interface Responsiva**: Frontend React moderno e responsivo
- **API REST Completa**: Backend com endpoints RESTful para todas as operações
- **Observabilidade Completa**: Stack com Grafana, Prometheus e Loki para monitoramento e análise
- **Dashboards Provisionados**: Dashboards pré-configurados para métricas e logs
- **Agente RPA**: Agente Python que executa jobs e envia métricas/logs

## Arquitetura

O sistema é composto por múltiplos componentes integrados:

### Core do Sistema
1. **Backend (Django REST Framework)**: API REST com autenticação JWT, modelos de dados e lógica de negócio
2. **Frontend (React + Vite)**: Interface web responsiva com roteamento e integração com a API
3. **Banco de Dados (PostgreSQL)**: Armazenamento persistente de dados
4. **Redis**: Cache e message broker para comunicação com agentes

### Stack de Observabilidade
5. **Grafana**: Visualização de métricas e logs com dashboards interativos
6. **Prometheus**: Coleta e armazenamento de métricas de time series
7. **Loki**: Agregação e consulta de logs estruturados
8. **Promtail**: Coleta e envio de logs para o Loki
9. **Node Exporter**: Métricas do sistema operacional

### Agentes RPA
10. **Agente Python**: Executa jobs, coleta métricas e envia logs estruturados

## Requisitos Mínimos

### Sistema Operacional
- Linux (Ubuntu 20.04+ recomendado)
- Windows 10/11 com WSL2
- macOS 10.15+

### Software Necessário
- Docker 20.10+
- Docker Compose 2.0+
- Git (para clonagem do repositório)

### Hardware Mínimo
- 4 GB RAM (recomendado 8 GB para stack completa)
- 20 GB espaço em disco
- Processador quad-core

## Instalação

### 1. Preparação do Ambiente

Clone o repositório:
```bash
git clone <url-do-repositorio>
cd rpa-monitoramento
```

### 2. Configuração de Variáveis de Ambiente

Copie o arquivo de exemplo e ajuste as configurações:
```bash
cp .env.example .env
```

Edite o arquivo `.env` conforme necessário:
```env
DEBUG=False
SECRET_KEY=sua-chave-secreta-aqui
DB_NAME=rpa_db
DB_USER=postgres
DB_PASSWORD=sua-senha-segura
DB_HOST=postgres
DB_PORT=5432
DJANGO_SUPERUSER_USERNAME=admin
DJANGO_SUPERUSER_PASSWORD=sua-senha-admin
DJANGO_SUPERUSER_EMAIL=admin@example.com
```

### 3. Inicialização do Sistema

Execute o comando para subir todos os serviços:
```bash
docker-compose up -d --build
```

Este comando irá:
- Construir as imagens Docker do backend, frontend e agente
- Inicializar o banco de dados PostgreSQL e Redis
- Executar as migrações do Django
- Criar o superusuário automaticamente
- Iniciar Prometheus, Loki, Promtail e Grafana
- Provisionar dashboards automaticamente
- Iniciar todos os serviços com healthchecks

### 4. Verificação da Instalação

Aguarde alguns minutos para que todos os serviços sejam inicializados. Você pode verificar o status com:
```bash
docker-compose ps
```

Todos os serviços devem estar com status "Up" e "healthy".

## Portas e Firewall

O sistema utiliza as seguintes portas:

| Serviço | Porta | Descrição |
|---------|-------|-----------|
| Frontend (Nginx) | 80 | Interface web principal |
| Backend (Django) | 8000 | API REST |
| Grafana | 3000 | Dashboards e visualizações |
| Prometheus | 9090 | Métricas e consultas PromQL |
| Loki | 3100 | Logs e consultas LogQL |
| PostgreSQL | 5432 | Banco de dados |
| Redis | 6379 | Cache e message broker |
| Agente RPA | 9100 | Métricas do agente |
| Node Exporter | 9101 | Métricas do sistema |

### Configuração de Firewall

Para acesso externo, certifique-se de que as seguintes portas estejam liberadas:
- **Porta 80**: Acesso à interface web
- **Porta 3000**: Acesso ao Grafana
- **Porta 9090**: Acesso ao Prometheus (opcional)
- **Porta 3100**: Acesso ao Loki (opcional)

## Acesso ao Sistema

### Interface Web Principal
- **URL**: http://129.148.32.147/
- **Usuário padrão**: admin
- **Senha padrão**: admin123

### Grafana (Observabilidade)
- **URL**: http://129.148.32.147:3000/
- **Usuário**: admin
- **Senha**: admin123
- **Dashboards**: Automaticamente provisionados

### Prometheus (Métricas)
- **URL**: http://129.148.32.147:9090/
- **Acesso**: Direto (sem autenticação)

### Loki (Logs)
- **URL**: http://129.148.32.147:3100/
- **Acesso**: Direto (sem autenticação)

### Django Admin
- **URL**: http://129.148.32.147/admin/
- **Usuário**: admin
- **Senha**: admin123

### API REST
- **Base URL**: http://129.148.32.147/api/
- **Métricas**: http://129.148.32.147/metrics/

## Dashboards do Grafana

O sistema inclui dashboards pré-configurados:

### 1. RPA Overview
- **URL**: http://129.148.32.147:3000/d/rpa-overview/rpa-overview
- **Conteúdo**:
  - Estado atual dos robôs (idle, running, paused)
  - Taxa de execuções por minuto
  - Distribuição de status das execuções (success, failed, etc.)
  - Duração das execuções (percentil 95)
  - Gráficos de tendência temporal

### 2. RPA Logs
- **URL**: http://129.148.32.147:3000/d/rpa-logs/rpa-logs
- **Conteúdo**:
  - Logs em tempo real dos agentes RPA
  - Filtros por nível de log (INFO, ERROR, WARNING)
  - Contagem de logs por nível
  - Análise de erros nos últimos 5 minutos
  - Busca e filtros avançados

## Métricas Coletadas

O sistema coleta automaticamente as seguintes métricas:

### Métricas do Agente RPA
| Métrica | Tipo | Descrição |
|---------|------|-----------|
| `rpa_estado_robo` | Gauge | Estado do robô (0=idle, 1=running, 2=paused) |
| `rpa_execucao_duracao_segundos` | Histogram | Duração das execuções em segundos |
| `rpa_jobs_executados_total` | Counter | Total de jobs executados por status |
| `rpa_execucoes_falhas_total` | Counter | Total de execuções com falha |

### Métricas do Django
- Requisições HTTP por endpoint
- Tempo de resposta das APIs
- Conexões de banco de dados
- Uso de memória e CPU

### Métricas do Sistema
- CPU, memória, disco e rede (via Node Exporter)
- Métricas de containers Docker
- Saúde dos serviços

## Logs Estruturados

Todos os logs são estruturados em formato JSON:

```json
{
  "timestamp": "2024-08-19 10:30:45,123",
  "level": "INFO",
  "message": "Execução 123 concluída com sucesso",
  "component": "agent",
  "robo_nome": "robo-agent-01",
  "execucao_id": 123,
  "duracao": 45.67
}
```

### Campos Padrão
- `timestamp`: Data e hora do evento
- `level`: Nível do log (INFO, WARNING, ERROR)
- `message`: Mensagem descritiva
- `component`: Componente que gerou o log
- `robo_nome`: Nome do robô (quando aplicável)
- `execucao_id`: ID da execução (quando aplicável)

## Endpoints da API

### Autenticação
```
POST /api/auth/login/
POST /api/auth/refresh/
```

### Robôs
```
GET    /api/robos/          # Listar robôs
POST   /api/robos/          # Criar robô
GET    /api/robos/{id}/     # Detalhes do robô
PUT    /api/robos/{id}/     # Atualizar robô
DELETE /api/robos/{id}/     # Excluir robô
```

### Jobs
```
GET    /api/jobs/           # Listar jobs
POST   /api/jobs/           # Criar job
GET    /api/jobs/{id}/      # Detalhes do job
PUT    /api/jobs/{id}/      # Atualizar job
DELETE /api/jobs/{id}/      # Excluir job
```

### Execuções
```
GET    /api/execucoes/              # Listar execuções
POST   /api/execucoes/              # Criar execução
GET    /api/execucoes/{id}/         # Detalhes da execução
POST   /api/execucoes/{id}/iniciar/ # Iniciar execução
POST   /api/execucoes/{id}/pausar/  # Pausar execução
POST   /api/execucoes/{id}/parar/   # Parar execução
POST   /api/execucoes/{id}/retomar/ # Retomar execução
```

### Métricas
```
GET    /metrics/            # Métricas Prometheus do Django
```

## Uso do Sistema

### 1. Primeiro Acesso

1. Acesse http://129.148.32.147/
2. Faça login com as credenciais padrão (admin/admin123)
3. Altere a senha padrão no Django Admin
4. Configure o Grafana acessando http://129.148.32.147:3000/

### 2. Cadastro de Robôs

1. Navegue para a seção "Robôs"
2. Clique em "Novo Robô"
3. Preencha os campos:
   - **Nome**: Identificação única do robô
   - **Host**: Endereço IP ou hostname onde o robô está executando
   - **Token do Agente**: Token de autenticação do agente
   - **Ativo**: Marque para habilitar o robô

### 3. Cadastro de Jobs

1. Navegue para a seção "Jobs"
2. Clique em "Novo Job"
3. Preencha os campos:
   - **Nome**: Identificação única do job
   - **Comando**: Comando que será executado pelo robô
   - **Timeout**: Tempo limite em segundos
   - **Parâmetros Padrão**: JSON com parâmetros padrão
   - **Ativo**: Marque para habilitar o job

### 4. Controle de Execuções

1. Navegue para a seção "Execuções"
2. Clique em "Nova Execução"
3. Selecione o robô e job desejados
4. Configure parâmetros específicos (opcional)
5. Use os botões de controle para gerenciar a execução

### 5. Monitoramento com Grafana

1. Navegue para a seção "Monitoramento"
2. Clique nos botões para abrir os dashboards:
   - **Dashboard Overview**: Métricas gerais e status
   - **Dashboard de Logs**: Análise de logs estruturados
3. Use os filtros e controles do Grafana para análise detalhada

## Consultas Úteis

### Prometheus (PromQL)

```promql
# Taxa de execuções por minuto
rate(rpa_jobs_executados_total[5m])

# Robôs atualmente executando
sum(rpa_estado_robo == 1)

# Percentil 95 de duração das execuções
histogram_quantile(0.95, rate(rpa_execucao_duracao_segundos_bucket[5m]))

# Taxa de falhas por robô
rate(rpa_execucoes_falhas_total[5m])
```

### Loki (LogQL)

```logql
# Logs de erro dos últimos 30 minutos
{job="agent-logs"} |= "ERROR" [30m]

# Logs de um robô específico
{job="agent-logs"} | json | robo_nome="robo-agent-01"

# Contagem de logs por nível
sum by (level) (count_over_time({job="agent-logs"} [1h]))

# Logs de execuções específicas
{job="agent-logs"} | json | execucao_id="123"
```

## Exemplos de Uso via API

### Login
```bash
curl -X POST http://129.148.32.147/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

### Criar Robô
```bash
curl -X POST http://129.148.32.147/api/robos/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_JWT" \
  -d '{
    "nome": "Robo-01",
    "host": "192.168.1.100",
    "token_agente": "token-secreto-123",
    "ativo": true
  }'
```

### Criar Job
```bash
curl -X POST http://129.148.32.147/api/jobs/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_JWT" \
  -d '{
    "nome": "ProcessarPlanilha",
    "comando": "python processar_planilha.py",
    "timeout_s": 600,
    "parametros_padrao": {"arquivo": "dados.xlsx"},
    "ativo": true
  }'
```

### Consultar Métricas
```bash
curl http://129.148.32.147/metrics/
```

## Manutenção

### Backup do Banco de Dados
```bash
docker-compose exec postgres pg_dump -U postgres rpa_db > backup.sql
```

### Backup dos Dados do Grafana
```bash
docker-compose exec grafana tar czf - /var/lib/grafana > grafana_backup.tar.gz
```

### Restauração do Banco
```bash
docker-compose exec -T postgres psql -U postgres rpa_db < backup.sql
```

### Logs do Sistema
```bash
# Logs de todos os serviços
docker-compose logs

# Logs específicos
docker-compose logs backend
docker-compose logs grafana
docker-compose logs prometheus
docker-compose logs agent
```

### Atualização do Sistema
```bash
# Parar os serviços
docker-compose down

# Atualizar o código
git pull

# Reconstruir e iniciar
docker-compose up -d --build
```

### Limpeza de Dados
```bash
# Remover containers e volumes (CUIDADO: apaga todos os dados)
docker-compose down -v

# Remover apenas containers
docker-compose down
```

## Escalabilidade

### Adicionando Mais Agentes
Para adicionar mais agentes RPA, duplique a seção do agente no docker-compose.yml:

```yaml
agent-02:
  build: ./agent
  environment:
    - REDIS_URL=redis://redis:6379
    - AGENT_TOKEN=token-agent-02
    - ROBO_NOME=robo-agent-02
  ports:
    - "9102:9100"
```

### Balanceamento de Carga
Para ambientes de produção, considere usar um load balancer como Nginx ou HAProxy na frente dos containers do backend.

### Alta Disponibilidade
- Configure PostgreSQL em cluster
- Use Redis Cluster para alta disponibilidade
- Implemente múltiplas instâncias do Grafana
- Configure Prometheus em federação

## Alertas e Notificações

### Configuração de Alertas no Grafana

1. Acesse Grafana > Alerting > Alert Rules
2. Crie regras baseadas nas métricas:
   - Taxa de falhas > 10%
   - Robô inativo por mais de 5 minutos
   - Uso de CPU > 80%
   - Erros nos logs > 5 por minuto

### Canais de Notificação
Configure notificações via:
- Email
- Slack
- Microsoft Teams
- Webhook personalizado

## Troubleshooting

### Problemas Comuns

**1. Grafana não carrega dashboards**
```bash
# Verificar se os volumes estão montados corretamente
docker-compose logs grafana

# Verificar permissões dos arquivos
ls -la observabilidade/grafana/
```

**2. Prometheus não coleta métricas**
```bash
# Verificar configuração
docker-compose logs prometheus

# Testar conectividade
curl http://localhost:9090/targets
```

**3. Loki não recebe logs**
```bash
# Verificar Promtail
docker-compose logs promtail

# Testar Loki
curl http://localhost:3100/ready
```

**4. Agente não envia métricas**
```bash
# Verificar logs do agente
docker-compose logs agent

# Testar endpoint de métricas
curl http://localhost:9100/metrics
```

### Comandos Úteis

```bash
# Reiniciar serviços de observabilidade
docker-compose restart grafana prometheus loki

# Verificar saúde dos serviços
docker-compose ps

# Limpar dados do Prometheus (reinicia métricas)
docker-compose stop prometheus
docker volume rm rpa-monitoramento_prometheus_data
docker-compose up -d prometheus

# Recarregar configuração do Prometheus
curl -X POST http://localhost:9090/-/reload
```

## Segurança

### Recomendações de Produção

1. **Alterar Senhas Padrão**: Sempre altere as senhas padrão antes de colocar em produção
2. **HTTPS**: Configure certificados SSL/TLS para conexões seguras
3. **Firewall**: Restrinja o acesso às portas apenas para IPs necessários
4. **Autenticação**: Configure autenticação externa no Grafana (LDAP, OAuth)
5. **Backup Regular**: Implemente rotinas de backup automatizadas
6. **Monitoramento**: Configure alertas para falhas e tentativas de acesso não autorizadas

### Configurações de Segurança

```env
# Exemplo de configurações mais seguras
DEBUG=False
SECRET_KEY=chave-muito-complexa-e-unica
ALLOWED_HOSTS=129.148.32.147,localhost
GF_SECURITY_ADMIN_PASSWORD=senha-muito-segura
```

## Performance

### Otimizações Recomendadas

1. **Prometheus**: Configure retenção adequada de dados
2. **Loki**: Ajuste configurações de compactação
3. **PostgreSQL**: Configure índices apropriados
4. **Redis**: Configure persistência conforme necessário
5. **Grafana**: Use cache de consultas

### Monitoramento de Performance

Use as métricas coletadas para monitorar:
- Tempo de resposta das APIs
- Uso de recursos (CPU, memória, disco)
- Taxa de throughput das execuções
- Latência das consultas ao banco

## Licença

Este projeto está licenciado sob a Licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## Suporte

Para suporte técnico ou dúvidas sobre o sistema:

1. Verifique a seção de Troubleshooting
2. Consulte os logs do sistema
3. Verifique a documentação da API
4. Analise os dashboards do Grafana
5. Entre em contato com a equipe de desenvolvimento

---

**Desenvolvido com ❤️ usando Django REST Framework, React, Grafana, Prometheus e Loki**

