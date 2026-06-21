FROM python:3.11-slim

WORKDIR /app

# Copy requirements first for better Docker cache
COPY requirements.txt .
RUN pip install --no-cache-dir --prefer-binary \
    --default-timeout=300 \
    -i https://mirrors.aliyun.com/pypi/simple/ \
    -r requirements.txt

# Copy application code
COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
