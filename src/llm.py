"""Phase 1: LLM answer generation. Provider-agnostic wrapper."""
from typing import List, Dict
from config import LLM_PROVIDER, LLM_MODEL, OPENAI_API_KEY, ANTHROPIC_API_KEY, OLLAMA_HOST


PROMPT_TEMPLATE = """You are an incident debugging assistant. Use the past incidents below to suggest the likely root cause and fix for the user's error.

Past incidents:
{context}

User error:
{query}

Respond in this format:
Likely Cause: <one sentence>
Suggested Fix: <bullet list>
"""


def _format_context(retrieved: List[Dict]) -> str:
    blocks = []
    for i, inc in enumerate(retrieved, 1):
        blocks.append(
            f"[{i}] {inc['id']} ({inc.get('service','?')})\n"
            f"    Error: {inc['error']}\n"
            f"    Root Cause: {inc['root_cause']}\n"
            f"    Fix: {inc['fix']}"
        )
    return "\n\n".join(blocks)


def generate(query: str, retrieved: List[Dict]) -> str:
    prompt = PROMPT_TEMPLATE.format(context=_format_context(retrieved), query=query)

    if LLM_PROVIDER == "openai":
        from openai import OpenAI
        client = OpenAI(api_key=OPENAI_API_KEY)
        resp = client.chat.completions.create(
            model=LLM_MODEL,
            messages=[{"role": "user", "content": prompt}],
        )
        return resp.choices[0].message.content

    if LLM_PROVIDER == "anthropic":
        from anthropic import Anthropic
        client = Anthropic(api_key=ANTHROPIC_API_KEY)
        resp = client.messages.create(
            model=LLM_MODEL,
            max_tokens=1024,
            messages=[{"role": "user", "content": prompt}],
        )
        return resp.content[0].text

    if LLM_PROVIDER == "ollama":
        # Call Ollama's native REST API directly — avoids openai-sdk proxy bug.
        import httpx, json
        payload = {
            "model": LLM_MODEL,
            "messages": [{"role": "user", "content": prompt}],
            "stream": False,
        }
        resp = httpx.post(
            f"{OLLAMA_HOST}/api/chat",
            json=payload,
            timeout=120.0,
        )
        if not resp.is_success:
            raise RuntimeError(f"Ollama error {resp.status_code}: {resp.text}")
        return resp.json()["message"]["content"]

    raise NotImplementedError(f"Provider {LLM_PROVIDER} not supported")
