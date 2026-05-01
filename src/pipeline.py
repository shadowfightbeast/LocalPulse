"""End-to-end: parse -> retrieve (hybrid) -> rank -> generate."""
from typing import Dict, List
from src.vector_store import FaissStore
from src.retriever import HybridRetriever
from src.ranker import rank, confidence
from src.parser import parse_log_line, to_query_text
from src.llm import generate


_store: FaissStore | None = None
_retriever: HybridRetriever | None = None


def _bootstrap() -> HybridRetriever:
    global _store, _retriever
    if _retriever is None:
        _store = FaissStore()
        _store.load()
        _retriever = HybridRetriever(_store)
    return _retriever


def answer(query: str, top_k: int = 3) -> Dict:
    retriever = _bootstrap()

    parsed = parse_log_line(query)
    search_text = to_query_text(parsed)

    raw_hits = retriever.retrieve(search_text, top_k=max(top_k * 2, 5))

    query_tags: List[str] = []
    if "service" in parsed:
        query_tags.append(parsed["service"].lower())
    if "error_type" in parsed:
        query_tags.append(parsed["error_type"].lower())

    ranked = rank(raw_hits, query_tags=query_tags)[:top_k]
    incidents = [m for m, _ in ranked]

    response = generate(query, incidents)
    top_score = ranked[0][1] if ranked else 0.0

    return {
        "query": query,
        "parsed": parsed,
        "retrieved": ranked,
        "answer": response,
        "confidence": confidence(top_score),
    }
