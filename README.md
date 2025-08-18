# Sistema RPA - Monitoramento e Orquestração

Sistema web completo para monitoramento e orquestração de robôs RPA (Robotic Process Automation), desenvolvido com Django REST Framework no backend, React no frontend e PostgreSQL como banco de dados.

## Visão Geral

Este sistema permite o cadastro, monitoramento e controle de robôs RPA através de uma interface web moderna e intuitiva. O sistema oferece funcionalidades completas de CRUD para robôs e jobs, além de controle de execuções com estados como iniciar, pausar, parar e retomar.

### Principais Funcionalidades

- **Cadastro de Robôs**: Gerenciamento completo de robôs com informações de host, token de agente e status
- **Cadastro de Jobs**: Criação e gerenciamento de jobs com comandos, timeouts e parâmetros personalizáveis
- **Controle de Execuções**: Monitoramento em tempo real com controles para iniciar, pausar, parar e retomar execuções
- **Autenticação JWT**: Sistema seguro de autenticação com tokens JWT
- **Interface Responsiva**: Frontend React moderno e responsivo
- **API REST Completa**: Backend com endpoints RESTful para todas as operações

## Arquitetura

O sistema é composto por três componentes principais:

1. **Backend (Django REST Framework)**: API REST com autenticação JWT, modelos de dados e lógica de negócio
2. **Frontend (React + Vite)**: Interface web responsiva com roteamento e integração com a API
3. **Banco de Dados (PostgreSQL)**: Armazenamento persistente de dados

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
- 2 GB RAM
- 10 GB espaço em disco
- Processador dual-core

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
- Construir as imagens Docker do backend e frontend
- Inicializar o banco de dados PostgreSQL
- Executar as migrações do Django
- Criar o superusuário automaticamente
- Iniciar todos os serviços

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
| PostgreSQL | 5432 | Banco de dados |

### Configuração de Firewall

Para acesso externo, certifique-se de que as seguintes portas estejam liberadas:
- **Porta 80**: Acesso à interface web
- **Porta 8000**: Acesso direto à API (opcional)
- **Porta 5432**: Acesso ao banco (apenas se necessário)

## Acesso ao Sistema

### Interface Web
- **URL**: http://129.148.32.147/
- **Usuário padrão**: admin
- **Senha padrão**: admin123

### Django Admin
- **URL**: http://129.148.32.147/admin/
- **Usuário**: admin
- **Senha**: admin123

### API REST
- **Base URL**: http://129.148.32.147/api/
- **Documentação**: Endpoints disponíveis listados abaixo

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

## Uso do Sistema

### 1. Primeiro Acesso

1. Acesse http://129.148.32.147/
2. Faça login com as credenciais padrão (admin/admin123)
3. Altere a senha padrão no Django Admin

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
5. Use os botões de controle para gerenciar a execução:
   - **Iniciar**: Inicia uma execução na fila
   - **Pausar**: Pausa uma execução em andamento
   - **Retomar**: Retoma uma execução pausada
   - **Parar**: Para definitivamente uma execução

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

### Criar Execução
```bash
curl -X POST http://129.148.32.147/api/execucoes/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_JWT" \
  -d '{
    "robo": 1,
    "job": 1,
    "parametros": {"arquivo": "dados_especiais.xlsx"}
  }'
```

## Manutenção

### Backup do Banco de Dados
```bash
docker-compose exec postgres pg_dump -U postgres rpa_db > backup.sql
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
docker-compose logs frontend
docker-compose logs postgres
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

### Adicionando Mais Workers
Para aumentar a capacidade de processamento, você pode escalar o backend:
```bash
docker-compose up -d --scale backend=3
```

### Balanceamento de Carga
Para ambientes de produção, considere usar um load balancer como Nginx ou HAProxy na frente dos containers do backend.

### Monitoramento
Implemente soluções de monitoramento como:
- Prometheus + Grafana para métricas
- ELK Stack para logs centralizados
- Health checks personalizados

## Troubleshooting

### Problemas Comuns

**1. Erro de conexão com o banco de dados**
```bash
# Verificar se o PostgreSQL está rodando
docker-compose ps postgres

# Verificar logs do banco
docker-compose logs postgres
```

**2. Frontend não carrega**
```bash
# Verificar se o Nginx está rodando
docker-compose ps frontend

# Verificar logs do frontend
docker-compose logs frontend
```

**3. API retorna erro 500**
```bash
# Verificar logs do backend
docker-compose logs backend

# Verificar se as migrações foram aplicadas
docker-compose exec backend python manage.py showmigrations
```

**4. Problemas de permissão**
```bash
# Ajustar permissões dos arquivos
sudo chown -R $USER:$USER .
```

### Comandos Úteis

```bash
# Reiniciar um serviço específico
docker-compose restart backend

# Executar comandos Django
docker-compose exec backend python manage.py shell

# Criar novas migrações
docker-compose exec backend python manage.py makemigrations

# Aplicar migrações
docker-compose exec backend python manage.py migrate

# Criar superusuário manualmente
docker-compose exec backend python manage.py createsuperuser
```

## Segurança

### Recomendações de Produção

1. **Alterar Senhas Padrão**: Sempre altere as senhas padrão antes de colocar em produção
2. **HTTPS**: Configure certificados SSL/TLS para conexões seguras
3. **Firewall**: Restrinja o acesso às portas apenas para IPs necessários
4. **Backup Regular**: Implemente rotinas de backup automatizadas
5. **Monitoramento**: Configure alertas para falhas e tentativas de acesso não autorizadas

### Configurações de Segurança

```env
# Exemplo de configurações mais seguras
DEBUG=False
SECRET_KEY=chave-muito-complexa-e-unica
ALLOWED_HOSTS=129.148.32.147,localhost
```

## Licença

Este projeto está licenciado sob a Licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## Suporte

Para suporte técnico ou dúvidas sobre o sistema:

1. Verifique a seção de Troubleshooting
2. Consulte os logs do sistema
3. Verifique a documentação da API
4. Entre em contato com a equipe de desenvolvimento

---

**Desenvolvido com ❤️ usando Django REST Framework e React**

