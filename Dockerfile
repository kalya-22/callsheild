FROM python:3.11-slim

# Install system audio dependencies required by librosa and soundfile
RUN apt-get update && apt-get install -y --no-install-recommends \
    libsndfile1 \
    ffmpeg \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy source code and ML models
COPY backend /app/backend
COPY ml /app/ml

# Set PYTHONPATH so 'ml' and 'backend' packages are discoverable
ENV PYTHONPATH="/app:/app/backend"
ENV PORT=10000

EXPOSE 10000

# Start FastAPI server on port dynamically assigned by Render or default 10000
CMD ["sh", "-c", "uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT:-10000}"]
