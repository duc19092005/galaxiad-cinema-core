"""
Tests for Cinema AI Service gRPC endpoints.
Requires: grpcio-testing, pytest, pytest-asyncio

Usage:
    pytest tests/test_grpc.py -v
"""

import sys
from pathlib import Path

# Ensure app/ is on path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "app"))
