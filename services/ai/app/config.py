import os
from dotenv import load_dotenv

load_dotenv()

ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")

# Embedding config
EMBEDDING_BACKEND = os.getenv("EMBEDDING_BACKEND", "local")  # "local" | "cloud"
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "BAAI/bge-m3")
EMBEDDING_DIM = int(os.getenv("EMBEDDING_DIM", "768"))

# Cloud embedding config (Jina AI)
JINA_API_KEY = os.getenv("JINA_API_KEY", "")

HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))
QDRANT_URL = os.getenv("QDRANT_URL", "http://localhost:6333")
QDRANT_COLLECTION = os.getenv("QDRANT_COLLECTION", "cinema_movies")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY", "")

DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "")
DEEPSEEK_BASE_URL = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com").rstrip("/")
DEEPSEEK_MODEL = os.getenv("DEEPSEEK_MODEL", "deepseek-chat")

# Redis config for chatbot session memory
# Parse from REDIS_CONNECTION (same as C# backend) or fallback to separate vars
_REDIS_CONNECTION = os.getenv("REDIS_CONNECTION", "")
if _REDIS_CONNECTION:
    _redis_parts = _REDIS_CONNECTION.split(",")
    _host_port = _redis_parts[0].strip()
    REDIS_HOST = _host_port.split(":")[0] if ":" in _host_port else _host_port
    REDIS_PORT = int(_host_port.split(":")[1]) if ":" in _host_port else 6379
    REDIS_PASSWORD = ""
    for part in _redis_parts[1:]:
        if part.strip().startswith("password="):
            REDIS_PASSWORD = part.strip().split("=", 1)[1]
            break
else:
    REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
    REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))
    REDIS_PASSWORD = os.getenv("REDIS_PASSWORD", "")

# Backend C# API base URL for agent tool retrieval
BACKEND_API_URL = os.getenv("BACKEND_API_URL", "http://localhost:8080/api/v1")

