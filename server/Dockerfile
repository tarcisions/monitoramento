# Dockerfile para o backend
FROM python:3.11-slim

# Diretório de trabalho
WORKDIR /app

# Instalar dependências do sistema
RUN apt-get update && apt-get install -y \
    curl \
    gcc \
    libpq-dev \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements e instalar dependências Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar o código da aplicação
COPY app/ .

# Tornar o entrypoint executável
RUN chmod +x /app/entrypoint.sh

# Expor a porta do Django
EXPOSE 8000

# Executar entrypoint
ENTRYPOINT ["/app/entrypoint.sh"]
