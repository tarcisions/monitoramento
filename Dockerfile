FROM python:3.11-slim

ENV DEBIAN_FRONTEND=noninteractive

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
    && apt-get clean

RUN useradd -m user

WORKDIR /app

COPY requirements.txt .
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install python-telegram-bot

COPY . .

RUN python manage.py collectstatic --noinput

EXPOSE 8000

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

CMD ["/entrypoint.sh"]