# RPA Monitor - Sistema de Monitoramento de Máquinas e RPA

![RPA Monitor](https://img.shields.io/badge/RPA-Monitor-blue) ![Python](https://img.shields.io/badge/Python-3.11+-green) ![React](https://img.shields.io/badge/React-18+-blue) ![Docker](https://img.shields.io/badge/Docker-Ready-blue)

Sistema completo de monitoramento e controle de robôs RPA com dashboard em tempo real, logs centralizados e observabilidade completa.

## 🚀 Instalação Rápida

### Pré-requisitos
- Docker 20.10+
- Docker Compose 2.0+

### Como usar
1. **Extraia o ZIP** em uma pasta de sua escolha
2. **Execute o script de inicialização:**
   
   **Linux/Mac:**
   ```bash
   chmod +x start.sh
   ./start.sh
   ```
   
   **Windows:**
   ```cmd
   start.bat
   ```

3. **Acesse o sistema:**
   - Frontend: http://localhost
   - API: http://localhost/api
   - Grafana: http://localhost:3000 (admin/admin123)
   - Prometheus: http://localhost:9090

### Primeiros passos
1. Faça login com: `admin@rpamonitor.com` / `admin123`
2. Configure seus robôs RPA na aba "Robôs"
3. Configure alertas do Telegram em "Configurações"

## 🎯 Características Principais

- **Dashboard em Tempo Real**: Interface React com WebSocket para atualizações ao vivo
- **Controle de Robôs**: Iniciar, pausar, continuar e parar execuções
- **Logs Centralizados**: Coleta e visualização via Loki/Promtail
- **Métricas Avançadas**: Prometheus + Grafana com dashboards pré-configurados
- **Notificações Telegram**: Alertas automáticos para eventos importantes
- **Pronto para Produção**: Docker Compose com Nginx, SSL e monitoramento

## 🏗️ Arquitetura

