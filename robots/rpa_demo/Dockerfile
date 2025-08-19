FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY rpa_demo.py .

# Create non-root user
RUN useradd -m -u 1000 robotuser && chown -R robotuser:robotuser /app
USER robotuser

# Expose metrics port
EXPOSE 9101

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:9101/metrics || exit 1

# Run robot
CMD ["python", "rpa_demo.py"]
