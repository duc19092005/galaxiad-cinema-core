import os
from dotenv import load_dotenv

load_dotenv()

ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")

# Embedding config
EMBEDDING_BACKEND = os.getenv("EMBEDDING_BACKEND", "local")  # "local" | "cloud"
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "BAAI/bge-m3")
EMBEDDING_DIM = int(os.getenv("EMBEDDING_DIM", "1024"))

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
