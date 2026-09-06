"""Real Docker integration checks. No model, OCR, storage, or HTTP client is mocked here."""
import io
import os
import uuid

import httpx
import pytest
from PIL import Image, ImageDraw, ImageFont
from minio import Minio


AI_BASE_URL = os.getenv("AI_BASE_URL")
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL")
MINIO_ENDPOINT = os.getenv("MINIO_ENDPOINT", "minio:9000")
MODEL = os.getenv("OLLAMA_MODEL", "qwen3.5:4b")

pytestmark = pytest.mark.skipif(not AI_BASE_URL, reason="Run inside compose.test.yml test-runner")


def _contract_image() -> bytes:
    image = Image.new("RGB", (1800, 1200), "white")
    draw = ImageDraw.Draw(image)
    font = ImageFont.load_default(size=30)
    lines = [
        "GALAXIAD CINEMA FILM EXHIBITION CONTRACT HD-TEST-001",
        "MOVIE: TEST FILM ALPHA",
        "DURATION: 118 MINUTES",
        "LICENSE: 2026-09-01 TO 2026-10-31",
        "SCOPE: ALL CINEMAS, FORMAT 2D",
        "CINEMA SHARE: 45 PERCENT",
        "DISTRIBUTOR SHARE: 55 PERCENT",
        "SETTLEMENT: MONTHLY",
    ]
    for index, line in enumerate(lines):
        draw.text((90, 90 + index * 90), line, fill="black", font=font)
    output = io.BytesIO()
    image.save(output, format="PNG")
    return output.getvalue()


def test_minio_real_round_trip():
    client = Minio(MINIO_ENDPOINT, access_key="cinema-test", secret_key="cinema-test-secret", secure=False)
    bucket = "cinema-test-contracts"
    if not client.bucket_exists(bucket):
        client.make_bucket(bucket)
    key = f"docker-smoke/{uuid.uuid4()}.txt"
    payload = b"contract-storage-real-round-trip"
    client.put_object(bucket, key, io.BytesIO(payload), len(payload), content_type="text/plain")
    response = client.get_object(bucket, key)
    try:
        assert response.read() == payload
    finally:
        response.close()
        response.release_conn()


def test_ollama_has_requested_local_model():
    response = httpx.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=30)
    response.raise_for_status()
    names = {item["name"] for item in response.json()["models"]}
    assert MODEL in names or f"{MODEL}:latest" in names


def test_contract_ocr_and_model_are_real():
    response = httpx.post(
        f"{AI_BASE_URL}/api/contracts/extract",
        files=[("files", ("contract.png", _contract_image(), "image/png"))],
        timeout=300,
    )
    response.raise_for_status()
    body = response.json()
    assert "GALAXIAD" in body["text"].upper()
    assert body["pages"][0]["method"] == "ocr"
    assert body["modelProvider"] == "ollama"
    assert body["modelUsed"] == MODEL
    assert body["modelAnalysisSucceeded"] is True, body["analysis"]
    assert not any("không khả dụng" in warning for warning in body["warnings"])


def test_contract_api_requires_authentication():
    api_base = os.getenv("API_BASE_URL", "http://api:8080")
    response = httpx.get(f"{api_base}/api/contracts", timeout=30)
    assert response.status_code == 401
