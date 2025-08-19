
# 📋 Checklist de Instalação - RPA Monitor

## ✅ Pré-instalação
- [ ] Docker instalado (versão 20.10+)
- [ ] Docker Compose instalado (versão 2.0+)
- [ ] Portas liberadas: 80, 443, 3000, 5432, 6379, 8000, 9090

## ✅ Instalação
- [ ] ZIP extraído
- [ ] Script de inicialização executado (`./start.sh` ou `start.bat`)
- [ ] Todos os containers iniciados com sucesso

## ✅ Verificação do Sistema
- [ ] Frontend acessível em http://localhost
- [ ] API respondendo em http://localhost/api/health
- [ ] Grafana acessível em http://localhost:3000
- [ ] Login realizado com sucesso (admin@rpamonitor.com / admin123)

## ✅ Configuração Inicial
- [ ] Senha do administrador alterada
- [ ] Primeiro robô RPA cadastrado
- [ ] Bot do Telegram configurado (opcional)
- [ ] Alertas testados

## ✅ Monitoramento
- [ ] Dashboard principal funcionando
- [ ] Logs sendo coletados
- [ ] Métricas sendo exibidas no Grafana

## 🆘 Problemas Comuns

### Erro de porta ocupada
```bash
# Verificar portas em uso
netstat -tlnp | grep :80
# Parar outros serviços que usam a porta 80
```

### Containers não iniciam
```bash
# Verificar logs
cd infra/docker
docker-compose logs -f
```

### Banco de dados não conecta
```bash
# Verificar se PostgreSQL iniciou
docker-compose ps
docker-compose logs db
```

### Frontend não carrega
```bash
# Verificar build do frontend
docker-compose logs frontend
```

## 📞 Suporte
- Logs do sistema: `docker-compose logs -f`
- Parar sistema: `./stop.sh` ou `stop.bat`
- Reiniciar: `docker-compose restart`
