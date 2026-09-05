# syntax=docker/dockerfile:1
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies if any
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for Docker cache
COPY requirements.txt .
RUN pip install --no-cache-dir --prefer-binary \
    --default-timeout=300 \
    -r requirements.txt

# Copy application code
COPY . .

# Install grpcio-tools separately (--no-deps avoids protobuf conflict)
RUN pip install --no-cache-dir grpcio-tools --no-deps

# Generate Python gRPC stubs from proto
RUN python -m grpc_tools.protoc \
    -I=app/protos \
    --python_out=app/pb \
    --pyi_out=app/pb \
    --grpc_python_out=app/pb \
    app/protos/ai_service.proto

# Fix generated import: change absolute `import ai_service_pb2` to relative
RUN sed -i 's/^import ai_service_pb2 /from . import ai_service_pb2 /' app/pb/ai_service_pb2_grpc.py

EXPOSE 8000
EXPOSE 50051

# Default command runs FastAPI HTTP. Can be overridden to run gRPC server in compose.
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
