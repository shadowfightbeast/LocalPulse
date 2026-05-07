from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from src.pipeline import answer, _bootstrap
from src.embedder import embed
from src.loader import load_incidents, incident_to_text
from src.source_loader import _load_runbook, _load_error_log
from config import INCIDENTS_PATH, API_PORT, ROOT_DIR
from pathlib import Path
import json, datetime, httpx, re
import uvicorn

app = FastAPI(title="Incident Debugging Assistant API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class DiagnoseRequest(BaseModel):
    query: str
    top_k: Optional[int] = 3

class SaveIncidentRequest(BaseModel):
    error: str
    root_cause: str
    fix: str
    tags: Optional[List[str]] = []
    service: Optional[str] = ""
    severity: Optional[str] = "ERROR"

class DiagnoseResponse(BaseModel):
    answer: str
    confidence: float
    parsed: dict
    retrieved: List[dict]


# ---------- validation helpers ----------

VALIDATION_PROMPT = """You are a strict quality reviewer for an incident knowledge base.

Evaluate this incident fix entry and decide if it is specific and accurate enough to save.

Error: {error}
Root Cause: {root_cause}
Fix: {fix}

Rules — reject if ANY of these are true:
- The fix is vague (e.g. "check the logs", "restart the service" with no specifics)
- The root cause doesn't explain WHY the error happened
- The fix doesn't match the root cause
- Either field is fewer than 10 words

Respond with EXACTLY one of:
APPROVED: <one sentence why it's good>
REJECTED: <one sentence why it's not good enough>"""


def _validate_with_llm(error: str, root_cause: str, fix: str) -> tuple[bool, str]:
    from config import OLLAMA_HOST, LLM_MODEL
    prompt = VALIDATION_PROMPT.format(error=error, root_cause=root_cause, fix=fix)
    try:
        resp = httpx.post(
            f"{OLLAMA_HOST}/api/chat",
            json={"model": LLM_MODEL, "messages": [{"role": "user", "content": prompt}], "stream": False},
            timeout=60.0,
        )
        resp.raise_for_status()
        text = resp.json()["message"]["content"].strip()
        approved = text.upper().startswith("APPROVED")
        reason = re.sub(r"^(APPROVED|REJECTED):\s*", "", text, flags=re.IGNORECASE)
        return approved, reason
    except Exception as e:
        return False, f"Validation call failed: {e}"


def _basic_quality_check(root_cause: str, fix: str) -> tuple[bool, str]:
    """Fast rule-based check before even calling the LLM."""
    if len(root_cause.split()) < 8:
        return False, "Root cause is too short — explain WHY the error happened."
    if len(fix.split()) < 8:
        return False, "Fix is too short — describe the specific steps to resolve it."
    vague = ["check logs", "restart", "try again", "look into", "investigate", "unknown"]
    for phrase in vague:
        if phrase in fix.lower() and len(fix.split()) < 15:
            return False, f"Fix is vague ('{phrase}' without specifics). Add concrete steps."
    return True, "ok"


def _next_incident_id() -> str:
    incidents = load_incidents()
    ids = [i.get("id", "INC-000") for i in incidents]
    nums = []
    for id_ in ids:
        m = re.search(r"\d+", id_)
        if m:
            nums.append(int(m.group()))
    return f"INC-{(max(nums) + 1):03d}" if nums else "INC-001"


# ---------- routes ----------

@app.post("/api/diagnose", response_model=DiagnoseResponse)
async def diagnose(request: DiagnoseRequest):
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")
    try:
        result = answer(request.query, top_k=request.top_k)
        retrieved_list = []
        for inc, score in result["retrieved"]:
            inc_copy = inc.copy()
            inc_copy["score"] = float(score)
            retrieved_list.append(inc_copy)
        return {
            "answer": result["answer"],
            "confidence": float(result["confidence"]),
            "parsed": result["parsed"],
            "retrieved": retrieved_list,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/save-incident")
async def save_incident(request: SaveIncidentRequest):
    """Validate then save a confirmed fix to incidents.json and re-embed into FAISS."""

    # 1. Fast rule-based check
    ok, reason = _basic_quality_check(request.root_cause, request.fix)
    if not ok:
        raise HTTPException(status_code=422, detail=f"Quality check failed: {reason}")

    # 2. LLM validation
    approved, reason = _validate_with_llm(request.error, request.root_cause, request.fix)
    if not approved:
        raise HTTPException(status_code=422, detail=f"LLM validation rejected: {reason}")

    # 3. Build incident record
    new_incident = {
        "id": _next_incident_id(),
        "error": request.error.strip(),
        "root_cause": request.root_cause.strip(),
        "fix": request.fix.strip(),
        "tags": [t.lower().strip() for t in request.tags] if request.tags else [],
        "service": request.service.strip() if request.service else "",
        "severity": request.severity or "ERROR",
        "timestamp": datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
        "source": "user-confirmed",
    }

    # 4. Persist to incidents.json
    incidents = load_incidents()
    incidents.append(new_incident)
    with open(INCIDENTS_PATH, "w", encoding="utf-8") as f:
        json.dump(incidents, f, ensure_ascii=False, indent=2)

    # 5. Live re-embed into the running FAISS index (no restart needed)
    retriever = _bootstrap()
    text = incident_to_text(new_incident)
    vec = embed([text])
    retriever.store.add_incident(vec, new_incident)

    # 6. Rebuild BM25 corpus on the retriever so keyword search includes new entry
    from src.retriever import HybridRetriever
    retriever.tokenized_corpus.append(
        [w for w in re.findall(r"[A-Za-z0-9_]+", text.lower())]
    )
    from rank_bm25 import BM25Okapi
    retriever.bm25 = BM25Okapi(retriever.tokenized_corpus)

    return {"status": "saved", "id": new_incident["id"], "validation": reason}


@app.post("/api/upload-file")
async def upload_file(file: UploadFile = File(...)):
    """Drop a .md runbook or .log/.txt error file — indexed live, no restart needed."""
    name = file.filename or ""
    ext = Path(name).suffix.lower()

    if ext not in (".md", ".log", ".txt"):
        raise HTTPException(status_code=400, detail="Only .md, .log, or .txt files are supported.")

    # Save to the right sources folder
    if ext == ".md":
        dest_dir = ROOT_DIR / "data" / "sources" / "runbooks"
    else:
        dest_dir = ROOT_DIR / "data" / "sources" / "error_logs"

    dest_dir.mkdir(parents=True, exist_ok=True)
    dest_path = dest_dir / name
    dest_path.write_bytes(await file.read())

    # Parse into chunks
    if ext == ".md":
        chunks = _load_runbook(dest_path)
    else:
        chunks = _load_error_log(dest_path)

    if not chunks:
        raise HTTPException(status_code=422, detail="File parsed to 0 chunks — check content.")

    # Live-embed into running FAISS + BM25 (no restart)
    retriever = _bootstrap()
    texts = [c["text"] for c in chunks]
    vectors = embed(texts)

    import numpy as np
    for chunk, vec in zip(chunks, vectors):
        doc = dict(chunk)
        doc.setdefault("error", chunk["title"])
        doc.setdefault("root_cause", "")
        doc.setdefault("fix", "")
        doc.setdefault("tags", [])
        retriever.store.add_incident(np.array([vec]), doc)
        retriever.tokenized_corpus.append(
            re.findall(r"[A-Za-z0-9_]+", chunk["text"].lower())
        )

    from rank_bm25 import BM25Okapi
    retriever.bm25 = BM25Okapi(retriever.tokenized_corpus)

    return {
        "status": "indexed",
        "file": name,
        "chunks": len(chunks),
        "source_type": "runbook" if ext == ".md" else "error_log",
    }


@app.get("/api/sources")
async def list_sources():
    """List all indexed source files."""
    sources_dir = ROOT_DIR / "data" / "sources"
    files = []
    for f in sorted(sources_dir.rglob("*")):
        if f.suffix.lower() in (".md", ".log", ".txt") and f.is_file():
            files.append({
                "name": f.name,
                "type": "runbook" if f.suffix == ".md" else "error_log",
                "folder": f.parent.name,
                "size_kb": round(f.stat().st_size / 1024, 1),
            })
    return {"sources": files}


@app.get("/api/health")
async def health():
    return {"status": "healthy"}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=API_PORT, reload=False)
