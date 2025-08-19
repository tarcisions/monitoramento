FROM python:3.11-slim

WORKDIR /app

RUN mkdir -p /logs

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY main.py .

EXPOSE 9100

CMD ["python", "main.py"]

