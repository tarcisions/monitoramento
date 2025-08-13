# Sistema de Monitoramento de Robôs

Um sistema completo de monitoramento de robôs desenvolvido com Django, que oferece monitoramento em tempo real, controle remoto e notificações via Telegram.

## 🚀 Características

### Backend
- **Django REST Framework** para APIs RESTful
- **Django Channels** para WebSockets em tempo real
- **SQLite** para armazenamento de dados
- **Redis** para cache e mensageria
- **Integração com Telegram Bot** para notificações

### Frontend
- **HTML/CSS/JS puro** com design responsivo
- **WebSockets** para atualizações em tempo real
- **Chart.js** para gráficos e visualizações
- **Interface intuitiva** para controle de robôs

### Funcionalidades
- 📊 **Dashboard em tempo real** com estatísticas e gráficos
- 🤖 **Gerenciamento de robôs** (adicionar, controlar, monitorar)
- 📝 **Sistema de logs** com filtros por nível e robô
- 🎮 **Controle remoto** (iniciar, parar, reiniciar, pausar)
- 📱 **Notificações Telegram** para erros e conclusões
- 📈 **Histórico de execuções** com métricas de performance
- 🔄 **Atualizações em tempo real** via WebSocket

## 📋 Pré-requisitos

- Python 3.8+
- Redis Server
- Git

## 🛠️ Instalação

### 1. Clone o repositório
```bash
git clone <url-do-repositorio>
cd robot_monitoring_system
```

### 2. Instale as dependências
```bash
pip install -r requirements.txt
```

### 3. Configure o Redis
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Verificar se está funcionando
redis-cli ping
# Deve retornar: PONG
```

### 4. Configure o banco de dados
```bash
python manage.py makemigrations
python manage.py migrate
```

### 5. (Opcional) Configure o Telegram Bot
```bash
# Defina as variáveis de ambiente
export TELEGRAM_BOT_TOKEN="seu_token_do_bot"
export TELEGRAM_CHAT_ID="seu_chat_id"

# Ou adicione no arquivo .env
echo "TELEGRAM_BOT_TOKEN=seu_token_do_bot" >> .env
echo "TELEGRAM_CHAT_ID=seu_chat_id" >> .env
```

## 🚀 Execução

### 1. Inicie o servidor Django
```bash
python manage.py runserver 0.0.0.0:8000
```

### 2. Acesse o dashboard
Abra seu navegador e vá para: `http://localhost:8000`

### 3. Execute robôs de exemplo
```bash
# Executar um robô
python example_robot.py --name meu_robo

# Executar múltiplos robôs
python run_multiple_robots.py --count 3

# Ver opções disponíveis
python example_robot.py --help
python run_multiple_robots.py --help
```

## 📖 Uso

### Dashboard Principal
- **Estatísticas em tempo real**: Total de robôs, robôs ativos, execuções
- **Lista de robôs**: Visualize todos os robôs cadastrados
- **Logs em tempo real**: Monitore logs com filtros por nível e robô
- **Gráficos**: Distribuição de status e logs por nível

### Controle de Robôs
1. Clique em "Controlar" em qualquer robô
2. Use os botões para enviar comandos:
   - **Iniciar**: Inicia o robô
   - **Parar**: Para o robô
   - **Reiniciar**: Reinicia o robô
   - **Pausar**: Pausa a execução

### Adicionando Robôs
1. Clique em "Adicionar Robô"
2. Preencha as informações:
   - Nome (obrigatório)
   - Descrição (opcional)
   - Endereço IP (opcional)

### Filtros de Logs
- **Por nível**: DEBUG, INFO, WARNING, ERROR, CRITICAL
- **Por robô**: Selecione um robô específico
- **Limpar**: Remove todos os logs da visualização

## 🔧 API REST

### Endpoints Principais

#### Robôs
- `GET /api/robots/` - Listar robôs
- `POST /api/robots/` - Criar robô
- `GET /api/robots/{id}/` - Detalhes do robô
- `GET /api/robots/{id}/logs/` - Logs do robô

#### Logs
- `POST /api/logs/` - Criar log
- `GET /api/logs/list/` - Listar logs com filtros

#### Status
- `POST /api/status/` - Atualizar status do robô

#### Controle
- `POST /api/control/` - Enviar comando para robô

#### Dashboard
- `GET /api/dashboard/` - Dados do dashboard

#### Health Check
- `GET /api/health/` - Verificar saúde da API

### Exemplo de Uso da API

```python
import requests

# Criar um log
response = requests.post('http://localhost:8000/api/logs/', json={
    'robot_name': 'meu_robo',
    'level': 'INFO',
    'message': 'Robô iniciado com sucesso'
})

# Enviar comando
response = requests.post('http://localhost:8000/api/control/', json={
    'robot_name': 'meu_robo',
    'command': 'START'
})

# Atualizar status
response = requests.post('http://localhost:8000/api/status/', json={
    'robot_name': 'meu_robo',
    'status': 'RUNNING',
    'cpu_usage': 45.2,
    'memory_usage': 67.8
})
```

## 🔌 WebSockets

### Conexões
- **Dashboard**: `ws://localhost:8000/ws/monitoring/`
- **Robô específico**: `ws://localhost:8000/ws/robot/{nome_do_robo}/`

### Mensagens Suportadas

#### Para o Dashboard
```javascript
// Conectar
const socket = new WebSocket('ws://localhost:8000/ws/monitoring/');

// Receber atualizações
socket.onmessage = function(event) {
    const data = JSON.parse(event.data);
    console.log('Tipo:', data.type);
    console.log('Dados:', data.data);
};
```

#### Para Robôs
```python
import asyncio
import websockets
import json

async def robot_client():
    uri = "ws://localhost:8000/ws/robot/meu_robo/"
    async with websockets.connect(uri) as websocket:
        # Enviar heartbeat
        await websocket.send(json.dumps({
            'type': 'heartbeat',
            'robot_name': 'meu_robo'
        }))
        
        # Escutar comandos
        async for message in websocket:
            data = json.loads(message)
            print(f"Comando recebido: {data}")
```

## 📱 Integração com Telegram

### Configuração do Bot

1. **Crie um bot no Telegram**:
   - Fale com @BotFather no Telegram
   - Use `/newbot` e siga as instruções
   - Anote o token do bot

2. **Obtenha o Chat ID**:
   - Adicione o bot ao seu chat/grupo
   - Envie uma mensagem para o bot
   - Acesse: `https://api.telegram.org/bot{TOKEN}/getUpdates`
   - Encontre o `chat.id` na resposta

3. **Configure as variáveis**:
```bash
export TELEGRAM_BOT_TOKEN="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
export TELEGRAM_CHAT_ID="-123456789"
```

### Teste a Integração
```bash
python manage.py test_telegram --message "Teste do sistema de monitoramento"
```

### Notificações Automáticas
O sistema envia notificações automaticamente para:
- ❌ **Erros de robôs**
- ✅ **Conclusão de execuções**
- 🚨 **Logs críticos**
- 📴 **Robôs offline**

## 🤖 Desenvolvendo Robôs

### Estrutura Básica
```python
import requests
import websockets
import asyncio
import json

class MeuRobo:
    def __init__(self, nome):
        self.nome = nome
        self.api_base = "http://localhost:8000/api"
        self.ws_url = f"ws://localhost:8000/ws/robot/{nome}/"
    
    def enviar_log(self, nivel, mensagem):
        requests.post(f"{self.api_base}/logs/", json={
            'robot_name': self.nome,
            'level': nivel,
            'message': mensagem
        })
    
    def atualizar_status(self, status, **kwargs):
        data = {
            'robot_name': self.nome,
            'status': status,
            **kwargs
        }
        requests.post(f"{self.api_base}/status/", json=data)
    
    async def conectar_websocket(self):
        async with websockets.connect(self.ws_url) as ws:
            # Escutar comandos
            async for message in ws:
                comando = json.loads(message)
                await self.processar_comando(comando)
    
    async def processar_comando(self, comando):
        tipo = comando.get('type')
        if tipo == 'command':
            # Processar comando recebido
            pass
```

### Comandos Suportados
- `START` - Iniciar robô
- `STOP` - Parar robô  
- `RESTART` - Reiniciar robô
- `PAUSE` - Pausar execução
- `RESUME` - Retomar execução
- `CUSTOM` - Comando personalizado

### Níveis de Log
- `DEBUG` - Informações de depuração
- `INFO` - Informações gerais
- `WARNING` - Avisos
- `ERROR` - Erros
- `CRITICAL` - Erros críticos (geram notificação)

## 📊 Monitoramento e Métricas

### Métricas Coletadas
- **Status dos robôs** (IDLE, RUNNING, STOPPED, ERROR)
- **Uso de recursos** (CPU, memória, disco)
- **Logs por nível** e frequência
- **Tempo de execução** de tarefas
- **Histórico de comandos**

### Gráficos Disponíveis
- **Distribuição de status** dos robôs
- **Logs por nível** nas últimas 24h
- **Robôs mais ativos**
- **Tempo médio de execução**

## 🔧 Configuração Avançada

### Variáveis de Ambiente
```bash
# Django
DEBUG=True
SECRET_KEY=sua_chave_secreta

# Banco de dados
DATABASE_URL=sqlite:///db.sqlite3

# Redis
REDIS_URL=redis://localhost:6379/0

# Telegram
TELEGRAM_BOT_TOKEN=seu_token
TELEGRAM_CHAT_ID=seu_chat_id

# Logging
LOG_LEVEL=INFO
```

### Configurações do Django
Edite `robot_monitor/settings.py` para:
- Alterar configurações de banco de dados
- Configurar CORS para produção
- Ajustar configurações de cache
- Personalizar logging

### Configurações do Redis
Para produção, configure Redis com:
- Persistência de dados
- Autenticação
- Clustering (se necessário)

## 🚀 Deploy em Produção

### Usando Docker (Recomendado)
```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8000

CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  web:
    build: .
    ports:
      - "8000:8000"
    depends_on:
      - redis
    environment:
      - REDIS_URL=redis://redis:6379/0
  
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
```

### Deploy Manual
1. Configure um servidor web (Nginx/Apache)
2. Use um WSGI server (Gunicorn/uWSGI)
3. Configure SSL/HTTPS
4. Configure backup do banco de dados
5. Configure monitoramento do sistema

## 🧪 Testes

### Executar Testes
```bash
# Testes do Django
python manage.py test

# Teste do Telegram
python manage.py test_telegram

# Teste de robô
python example_robot.py --name teste_robo
```

### Testes de Carga
```bash
# Múltiplos robôs
python run_multiple_robots.py --count 10

# Teste de API
curl -X POST http://localhost:8000/api/logs/ \
  -H "Content-Type: application/json" \
  -d '{"robot_name":"teste","level":"INFO","message":"teste"}'
```

## 🐛 Solução de Problemas

### Problemas Comuns

#### Redis não conecta
```bash
# Verificar se Redis está rodando
redis-cli ping

# Iniciar Redis
sudo systemctl start redis-server
```

#### WebSocket não conecta
- Verifique se o servidor Django está rodando
- Confirme que não há firewall bloqueando
- Teste com `ws://` em desenvolvimento

#### Telegram não funciona
```bash
# Testar configuração
python manage.py test_telegram

# Verificar variáveis
echo $TELEGRAM_BOT_TOKEN
echo $TELEGRAM_CHAT_ID
```

#### Robô não aparece no dashboard
- Verifique se o robô está enviando dados
- Confirme a URL da API
- Verifique logs do servidor Django

### Logs de Debug
```bash
# Ativar debug no Django
export DEBUG=True

# Ver logs do servidor
python manage.py runserver --verbosity=2

# Logs do robô
python example_robot.py --verbose
```

## 📝 Changelog

### v1.0.0 (2025-08-13)
- ✨ Lançamento inicial
- 🚀 Sistema completo de monitoramento
- 📱 Integração com Telegram
- 🎨 Dashboard responsivo
- 🤖 Robô de exemplo
- 📊 Gráficos e métricas
- 🔄 WebSockets em tempo real

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 👥 Autores

- **Desenvolvedor Principal** - Sistema de Monitoramento de Robôs

## 🙏 Agradecimentos

- Django e Django REST Framework
- Django Channels para WebSockets
- Chart.js para gráficos
- Redis para cache e mensageria
- Telegram Bot API
- Comunidade open source

---

**📞 Suporte**: Para dúvidas ou problemas, abra uma issue no repositório.

**🔗 Links Úteis**:
- [Documentação do Django](https://docs.djangoproject.com/)
- [Django Channels](https://channels.readthedocs.io/)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Chart.js](https://www.chartjs.org/)

