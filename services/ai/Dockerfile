FROM python:3.11-slim

WORKDIR /app

# Copy requirements first for better Docker cache
COPY requirements.txt .
RUN pip install --no-cache-dir --prefer-binary \
    --default-timeout=300 \
    -r requirements.txt


# Copy application code
COPY . .

# Install grpcio-tools separately (--no-deps avoids protobuf conflict with google-generativeai)
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

# Run both gRPC server and FastAPI side-by-side
CMD ["sh", "-c", "python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 & python app/grpc_server.py"]
