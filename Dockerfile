FROM python:3.11-slim

ENV DEBIAN_FRONTEND=noninteractive

# Instala dependências do sistema + netcat
RUN apt-get update && apt-get install -y \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libpoppler-cpp-dev \
    libgl1 \
    tesseract-ocr \
    ghostscript \
    curl \
    build-essential \
    netcat \
    && apt-get clean

# Cria usuário
RUN useradd -m user

WORKDIR /app

# Instala Python dependencies
COPY requirements.txt .
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install python-telegram-bot

# Copia o código
COPY . .

EXPOSE 8000

# Copia entrypoint
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Executa entrypoint
CMD ["/entrypoint.sh"]
