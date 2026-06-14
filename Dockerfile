# FitFood — образ бэкенда (FastAPI + ML-классификатор).
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

# libgomp1 нужен xgboost в рантайме.
RUN apt-get update && apt-get install -y --no-install-recommends \
        libgomp1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Сначала зависимости — слой кешируется, пока requirements.txt не изменится.
COPY requirements.txt .
RUN pip install -r requirements.txt

# Затем код приложения (модели, данные, фронтенд).
COPY . .

EXPOSE 8000

# 0.0.0.0 обязателен, чтобы порт был виден снаружи контейнера.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
