import json
import httpx
from loguru import logger
from fastapi import HTTPException
from config import DEEPSEEK_API_KEY, DEEPSEEK_BASE_URL, DEEPSEEK_MODEL, LLM_PROVIDER, LLM_TIMEOUT_SECONDS

# Global HTTP client for DeepSeek connection reuse
deepseek_client = None

def init_deepseek_client():
    global deepseek_client
    if deepseek_client is None:
        deepseek_client = httpx.AsyncClient(timeout=LLM_TIMEOUT_SECONDS)
        logger.info("DeepSeek HTTP AsyncClient initialized in llm_client.")
    return deepseek_client

async def close_deepseek_client():
    global deepseek_client
    if deepseek_client is not None:
        await deepseek_client.aclose()
        deepseek_client = None
        logger.info("DeepSeek HTTP AsyncClient closed in llm_client.")

async def call_deepseek(system_prompt: str, user_prompt: str, temperature: float = 0.2, max_tokens: int = 1200) -> str:
    """Helper function to perform direct async completions with DeepSeek API."""
    if not DEEPSEEK_API_KEY and LLM_PROVIDER != "ollama":
        logger.error("DEEPSEEK_API_KEY is not configured.")
        raise HTTPException(status_code=500, detail="DeepSeek API key is not configured.")

    is_ollama = LLM_PROVIDER == "ollama"
    url = f"{DEEPSEEK_BASE_URL.removesuffix('/v1')}/api/chat" if is_ollama else f"{DEEPSEEK_BASE_URL}/chat/completions"
    headers = {"Content-Type": "application/json"}
    if DEEPSEEK_API_KEY:
        headers["Authorization"] = f"Bearer {DEEPSEEK_API_KEY}"
    payload = {
        "model": DEEPSEEK_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
    }
    if is_ollama:
        payload.update({"stream": False, "format": "json", "think": False, "options": {"temperature": temperature, "num_predict": max_tokens}})
    else:
        payload.update({"temperature": temperature, "max_tokens": max_tokens})

    try:
        client = deepseek_client if deepseek_client else init_deepseek_client()
        response = await client.post(url, headers=headers, json=payload)
        response.raise_for_status()
        res_json = response.json()
        content = res_json["message"]["content"] if is_ollama else res_json["choices"][0]["message"]["content"]
        return content or ""
    except Exception as e:
        logger.error(f"Error calling DeepSeek API: {e}")
        raise HTTPException(status_code=500, detail=f"DeepSeek call failed: {str(e)}")

async def call_deepseek_stream(system_prompt: str, user_prompt: str, temperature: float = 0.2):
    """Stream text chunks from DeepSeek's OpenAI-compatible chat completions API."""
    if not DEEPSEEK_API_KEY and LLM_PROVIDER != "ollama":
        logger.error("DEEPSEEK_API_KEY is not configured.")
        raise HTTPException(status_code=500, detail="DeepSeek API key is not configured.")

    url = f"{DEEPSEEK_BASE_URL}/chat/completions"
    headers = {"Content-Type": "application/json"}
    if DEEPSEEK_API_KEY:
        headers["Authorization"] = f"Bearer {DEEPSEEK_API_KEY}"
    payload = {
        "model": DEEPSEEK_MODEL,
        "temperature": temperature,
        "stream": True,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
    }

    try:
        client = deepseek_client if deepseek_client else init_deepseek_client()
        async with client.stream("POST", url, headers=headers, json=payload) as response:
            response.raise_for_status()
            async for line in response.aiter_lines():
                if not line or not line.startswith("data:"):
                    continue

                data = line.removeprefix("data:").strip()
                if data == "[DONE]":
                    break

                try:
                    chunk = json.loads(data)
                    token = chunk["choices"][0].get("delta", {}).get("content") or ""
                    if token:
                        yield token
                except Exception:
                    logger.warning(f"Could not parse DeepSeek stream line: {data[:120]}")
    except Exception as e:
        logger.error(f"Error streaming DeepSeek API: {e}")
        raise HTTPException(status_code=500, detail=f"DeepSeek stream failed: {str(e)}")
