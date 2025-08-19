
@echo off
echo 🛑 Parando RPA Monitor...

cd infra\docker
docker-compose down

echo ✅ Sistema parado com sucesso!
echo 📝 Para remover volumes (CUIDADO - apaga dados): docker-compose down -v
pause
